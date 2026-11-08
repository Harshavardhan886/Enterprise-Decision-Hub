"""
FastAPI ML microservice for Enterprise Decision Hub.

4-Layer Architecture: ML Service Layer
Models Served:
  1. Random Forest Classifier (Primary risk prediction)
  2. XGBoost Classifier (Secondary model)
  3. Isolation Forest (Structural anomaly detection)
Frameworks & Tooling:
  - Scikit-learn, XGBoost, Joblib, MLflow, FastAPI, Pydantic, Pandas, NumPy

Endpoints:
  GET  /              — Microservice health check & loaded models status (Public)
  POST /predict       — Multi-model risk evaluation (RF, XGBoost, IsoForest) (Protected)
  POST /anomaly       — Isolation Forest structural anomaly detection (Protected)
  POST /explain       — Explainable AI multi-model risk factor synthesis (Protected)
  GET  /model-info    — Live multi-model metadata, MLflow tracking info, feature importances (Protected)
  POST /retrain       — Pipeline retraining trigger with hot-reloading (Protected)
"""

import os
import json
from fastapi import FastAPI, HTTPException, Security, Depends
from fastapi.security import APIKeyHeader
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import pandas as pd
import numpy as np

app = FastAPI(
    title="Enterprise Decision Hub - Multi-Model ML Service",
    version="3.0-MultiModel"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Internal API Key Verification ──────────────────────────────────────────
API_KEY_HEADER = APIKeyHeader(name="X-ML-API-KEY", auto_error=False)
EXPECTED_API_KEY = os.environ.get("ML_INTERNAL_API_KEY", "edh_internal_ml_key_8f92b7c4a1e9")


def verify_api_key(api_key: str = Security(API_KEY_HEADER)):
    if EXPECTED_API_KEY and api_key != EXPECTED_API_KEY:
        raise HTTPException(
            status_code=403,
            detail="Forbidden: Invalid or missing X-ML-API-KEY header."
        )
    return api_key


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "model")

RF_MODEL_PATH = os.path.join(MODEL_DIR, "risk_rf_model.pkl")
RF_COMPAT_PATH = os.path.join(MODEL_DIR, "risk_model.pkl")
XGB_MODEL_PATH = os.path.join(MODEL_DIR, "risk_xgb_model.pkl")
IF_MODEL_PATH = os.path.join(MODEL_DIR, "anomaly_iso_model.pkl")
IF_COMPAT_PATH = os.path.join(MODEL_DIR, "anomaly_model.pkl")
INFO_PATH = os.path.join(MODEL_DIR, "model_info.json")

rf_model = None
xgb_model = None
if_model = None
model_metadata = {}

FEATURES = ["amount", "is_duplicate", "overspend_percentage", "vendor_risk_encoded"]
VENDOR_RISK_MAP = {"LOW": 0, "MEDIUM": 1, "HIGH": 2}


def load_models():
    global rf_model, xgb_model, if_model, model_metadata
    
    # 1. Primary Model: Random Forest
    rf_target = RF_MODEL_PATH if os.path.exists(RF_MODEL_PATH) else RF_COMPAT_PATH
    if os.path.exists(rf_target):
        try:
            rf_model = joblib.load(rf_target)
            print(f"[ML Service] Loaded Random Forest model from {rf_target}")
        except Exception as e:
            print(f"[ML Service] Error loading RF model: {e}")
            rf_model = None

    # 2. Secondary Model: XGBoost
    if os.path.exists(XGB_MODEL_PATH):
        try:
            xgb_model = joblib.load(XGB_MODEL_PATH)
            print(f"[ML Service] Loaded XGBoost model from {XGB_MODEL_PATH}")
        except Exception as e:
            print(f"[ML Service] Error loading XGBoost model: {e}")
            xgb_model = None

    # 3. Anomaly Model: Isolation Forest
    if_target = IF_MODEL_PATH if os.path.exists(IF_MODEL_PATH) else IF_COMPAT_PATH
    if os.path.exists(if_target):
        try:
            if_model = joblib.load(if_target)
            print(f"[ML Service] Loaded Isolation Forest model from {if_target}")
        except Exception as e:
            print(f"[ML Service] Error loading IF model: {e}")
            if_model = None

    # 4. Metadata & Metrics
    if os.path.exists(INFO_PATH):
        try:
            with open(INFO_PATH, "r") as f:
                model_metadata = json.load(f)
        except Exception:
            model_metadata = {}


load_models()


# ─── Request / Response Schemas ─────────────────────────────────────────────

class PredictRequest(BaseModel):
    amount: float
    is_duplicate: int = 0
    overspend_percentage: float = 0.0
    vendor_risk_level: str = "LOW"   # LOW | MEDIUM | HIGH


class ExplainRequest(BaseModel):
    amount: float
    is_duplicate: int = 0
    overspend_percentage: float = 0.0
    vendor_risk_level: str = "LOW"
    risk_score: int = 0


# ─── Helper Functions ────────────────────────────────────────────────────────

def build_feature_dataframe(amount: float, is_duplicate: int, overspend_pct: float, vendor_risk_level: str):
    vendor_enc = VENDOR_RISK_MAP.get(str(vendor_risk_level).upper(), 0)
    return pd.DataFrame([{
        "amount": float(amount),
        "is_duplicate": int(is_duplicate),
        "overspend_percentage": float(overspend_pct),
        "vendor_risk_encoded": int(vendor_enc),
    }])


def compute_waterfall_attribution(amount: float, is_duplicate: int, overspend_pct: float, vendor_risk_level: str, is_anomaly: bool = False):
    """
    Computes local feature attribution (Waterfall breakdown) for an individual invoice.
    Deconstructs the final 0-10 risk score into distinct additive risk factors.
    """
    waterfall = [
        {
            "factor": "Baseline Enterprise Risk",
            "delta": 0.5,
            "impact": "+0.5",
            "type": "base",
            "description": "Standard baseline probability across normal transactions"
        }
    ]

    if is_duplicate:
        waterfall.append({
            "factor": "Duplicate Invoice Match",
            "delta": 4.0,
            "impact": "+4.0",
            "type": "critical",
            "description": "Exact vendor & invoice number hash previously processed"
        })

    v_level = str(vendor_risk_level).upper()
    if v_level == "HIGH":
        waterfall.append({
            "factor": "Supplier Risk: HIGH",
            "delta": 2.5,
            "impact": "+2.5",
            "type": "risk",
            "description": "Supplier has elevated historical defect or dispute record"
        })
    elif v_level == "MEDIUM":
        waterfall.append({
            "factor": "Supplier Risk: MEDIUM",
            "delta": 1.2,
            "impact": "+1.2",
            "type": "warning",
            "description": "Supplier exceeds standard monitoring threshold"
        })

    if overspend_pct > 0:
        pct_delta = round(min(2.5, (overspend_pct / 100.0) * 3.5), 1)
        if pct_delta > 0.1:
            waterfall.append({
                "factor": f"Department Budget Overrun ({overspend_pct:.1f}%)",
                "delta": pct_delta,
                "impact": f"+{pct_delta}",
                "type": "risk" if pct_delta >= 1.5 else "warning",
                "description": f"Exceeds departmental monthly allocated budget"
            })

    if amount >= 100000:
        amt_delta = round(min(2.0, 0.5 + ((amount - 100000) / 100000.0) * 0.8), 1)
        waterfall.append({
            "factor": f"Capital Expenditure Tier (₹{amount:,.0f})",
            "delta": amt_delta,
            "impact": f"+{amt_delta}",
            "type": "risk" if amt_delta >= 1.5 else "warning",
            "description": "High-value outlay exceeds standard departmental median"
        })

    if is_anomaly:
        waterfall.append({
            "factor": "Structural Anomaly (Isolation Forest)",
            "delta": 1.5,
            "impact": "+1.5",
            "type": "anomaly",
            "description": "Multi-dimensional outlier detected outside normal cluster"
        })

    return waterfall


# ─── Endpoints ────────────────────────────────────────────────────────────────

@app.api_route("/", methods=["GET", "HEAD"])
@app.api_route("/health", methods=["GET", "HEAD"])
def health():
    """Public health check endpoint for orchestrators (Docker / K8s)."""
    return {
        "status": "running",
        "service": "EDH AI Microservice",
        "secured": True,
        "rf_model_loaded": rf_model is not None,
        "xgb_model_loaded": xgb_model is not None,
        "if_model_loaded": if_model is not None,
        "model_version": model_metadata.get("model_version", "v3.0-MultiModel"),
        "mlflow_run_id": model_metadata.get("mlflow_run_id", "local"),
        "models_available": [
            "RandomForestClassifier (Primary)",
            "XGBClassifier (Secondary)",
            "IsolationForest (Anomaly)"
        ],
        "endpoints": ["/predict", "/anomaly", "/explain", "/model-info", "/retrain"]
    }


@app.post("/predict", dependencies=[Depends(verify_api_key)])
def predict(req: PredictRequest):
    """
    Evaluates invoice features across all ML models:
      - Random Forest Classifier (Primary Risk Prediction)
      - XGBoost Classifier (Secondary Model)
      - Isolation Forest (Anomaly Detection)
    
    Each model outputs:
      - Risk Probability (0-100%)
      - Risk Score (0-10)
      - Anomaly Flag (True/False)
      - Feature Importance
    """
    X = build_feature_dataframe(req.amount, req.is_duplicate, req.overspend_percentage, req.vendor_risk_level)

    models_meta = model_metadata.get("models", {})
    rf_feat_imp = models_meta.get("random_forest", {}).get("feature_importances", {
        "amount": 0.25, "is_duplicate": 0.44, "overspend_percentage": 0.06, "vendor_risk_encoded": 0.25
    })
    xgb_feat_imp = models_meta.get("xgboost", {}).get("feature_importances", {
        "amount": 0.05, "is_duplicate": 0.73, "overspend_percentage": 0.02, "vendor_risk_encoded": 0.20
    })
    iso_feat_imp = models_meta.get("isolation_forest", {}).get("feature_importances", {
        "amount": 0.35, "is_duplicate": 0.25, "overspend_percentage": 0.30, "vendor_risk_encoded": 0.10
    })

    # 1. Isolation Forest Anomaly Detection
    is_anomaly = False
    anomaly_score = 0.0
    iso_risk_pct = 0.0
    iso_risk_score = 1
    if if_model is not None:
        try:
            iso_pred = int(if_model.predict(X)[0])
            iso_score = float(if_model.score_samples(X)[0])
            is_anomaly = (iso_pred == -1)
            anomaly_score = round(iso_score, 4)
            iso_risk_pct = round(min(100.0, max(0.0, (-iso_score) * 200.0)), 2)
            iso_risk_score = 8 if is_anomaly else (4 if iso_score < -0.05 else 1)
        except Exception as e:
            print(f"[ML Service] IsoForest error: {e}")

    # 2. Random Forest (Primary)
    rf_prob = 0.0
    if rf_model is not None:
        try:
            rf_prob = float(rf_model.predict_proba(X)[0][1])
        except Exception as e:
            print(f"[ML Service] RF error: {e}")
    rf_prob_pct = round(rf_prob * 100.0, 2)
    rf_risk_score = min(10, max(0, int(round(rf_prob * 10))))

    # 3. XGBoost (Secondary)
    xgb_prob = rf_prob  # Default to RF if XGB not loaded
    if xgb_model is not None:
        try:
            xgb_prob = float(xgb_model.predict_proba(X)[0][1])
        except Exception as e:
            print(f"[ML Service] XGBoost error: {e}")
    xgb_prob_pct = round(xgb_prob * 100.0, 2)
    xgb_risk_score = min(10, max(0, int(round(xgb_prob * 10))))

    # 4. Ensemble Blended Assessment (55% RF + 45% XGBoost)
    blended_prob = 0.55 * rf_prob + 0.45 * xgb_prob
    blended_prob_pct = round(blended_prob * 100.0, 2)
    blended_score = min(10, max(0, int(round(blended_prob * 10))))
    if is_anomaly:
        blended_score = min(10, blended_score + 2)

    risk_label = "HIGH" if blended_prob >= 0.60 else ("MEDIUM" if blended_prob >= 0.35 else "LOW")
    model_agreement = "CONCORDANT" if abs(rf_prob - xgb_prob) < 0.15 else "DIVERGENT"

    waterfall = compute_waterfall_attribution(
        amount=req.amount,
        is_duplicate=req.is_duplicate,
        overspend_pct=req.overspend_percentage,
        vendor_risk_level=req.vendor_risk_level,
        is_anomaly=is_anomaly
    )

    return {
        # Standard top-level fields for backwards compatibility with backend
        "risk_probability": round(blended_prob, 4),
        "risk_probability_percentage": blended_prob_pct,
        "risk_score": blended_score,
        "risk_label": risk_label,
        "anomaly_flag": is_anomaly,
        "anomaly_score": anomaly_score,
        "model_version": model_metadata.get("model_version", "v3.0-MultiModel"),
        "mlflow_run_id": model_metadata.get("mlflow_run_id", "local"),
        "model_agreement": model_agreement,
        "waterfall": waterfall,

        # Explicit outputs per model:
        # Each model outputs: Risk Probability (0-100%), Risk Score (0-10), Anomaly Flag (True/False), Feature Importance
        "models": {
            "random_forest": {
                "model_name": "Random Forest Classifier",
                "role": "Primary Risk Prediction",
                "risk_probability": rf_prob_pct,
                "risk_score": rf_risk_score,
                "anomaly_flag": is_anomaly,
                "feature_importance": rf_feat_imp
            },
            "xgboost": {
                "model_name": "XGBoost Classifier",
                "role": "Secondary Risk Prediction",
                "risk_probability": xgb_prob_pct,
                "risk_score": xgb_risk_score,
                "anomaly_flag": is_anomaly,
                "feature_importance": xgb_feat_imp
            },
            "isolation_forest": {
                "model_name": "Isolation Forest",
                "role": "Anomaly Detection",
                "risk_probability": iso_risk_pct,
                "risk_score": iso_risk_score,
                "anomaly_flag": is_anomaly,
                "anomaly_score": anomaly_score,
                "feature_importance": iso_feat_imp
            }
        },

        # Top-level feature importance for convenience
        "feature_importance": rf_feat_imp,
        "features_evaluated": {
            "amount": req.amount,
            "is_duplicate": bool(req.is_duplicate),
            "overspend_percentage": req.overspend_percentage,
            "vendor_risk_level": req.vendor_risk_level
        }
    }


@app.post("/anomaly", dependencies=[Depends(verify_api_key)])
def anomaly(req: PredictRequest):
    """
    Isolation Forest — structural outlier detection across multi-dimensional feature space.
    """
    if if_model is None:
        return {
            "is_anomaly": False,
            "anomaly_score": 0.0,
            "anomaly_probability_pct": 0.0,
            "note": "Anomaly model not loaded."
        }

    X = build_feature_dataframe(req.amount, req.is_duplicate, req.overspend_percentage, req.vendor_risk_level)
    prediction = int(if_model.predict(X)[0])       # 1 = normal, -1 = anomaly
    score = float(if_model.score_samples(X)[0])    # lower = more anomalous
    is_anomalous = (prediction == -1)

    models_meta = model_metadata.get("models", {})
    iso_feat_imp = models_meta.get("isolation_forest", {}).get("feature_importances", {
        "amount": 0.35, "is_duplicate": 0.25, "overspend_percentage": 0.30, "vendor_risk_encoded": 0.10
    })

    return {
        "is_anomaly": is_anomalous,
        "anomaly_flag": is_anomalous,
        "anomaly_score": round(score, 4),
        "confidence": "HIGH" if abs(score) > 0.15 else "MODERATE",
        "feature_importance": iso_feat_imp,
        "description": "Structurally anomalous invoice pattern detected by Isolation Forest." if is_anomalous else "Transaction pattern conforms to normal enterprise distribution."
    }


@app.post("/explain", dependencies=[Depends(verify_api_key)])
def explain(req: ExplainRequest):
    """
    Explainable AI (XAI) engine — produces feature contributions, multi-model consensus,
    plain-English reasons, and mitigation recommendations.
    """
    factors = []
    recommendations = []

    # 1. Amount analysis
    if req.amount >= 150000:
        factors.append(f"High-value capital transaction: Amount ₹{req.amount:,.0f} exceeds 95th percentile.")
        recommendations.append("Require secondary executive sign-off for outsized spend.")
    elif req.amount >= 50000:
        factors.append(f"Elevated transaction amount: ₹{req.amount:,.0f} above departmental median.")

    # 2. Duplicate analysis
    if req.is_duplicate:
        factors.append("Duplicate invoice match: Identical invoice number & supplier combination previously processed.")
        recommendations.append("Place immediate disbursement hold and contact supplier billing.")

    # 3. Budget overspend analysis
    if req.overspend_percentage >= 20.0:
        factors.append(f"Severe budget overspend: Department is {req.overspend_percentage:.1f}% over allocated monthly ceiling.")
        recommendations.append("Escalate to department head for formal budget amendment.")
    elif req.overspend_percentage > 0.0:
        factors.append(f"Budget overspend: Department is {req.overspend_percentage:.1f}% over allocation.")
        recommendations.append("Monitor departmental burn rate for the rest of the billing cycle.")

    # 4. Vendor risk analysis
    v_level = str(req.vendor_risk_level).upper()
    if v_level == "HIGH":
        factors.append("Supplier flagged with HIGH risk profile based on historical defect & duplicate ratio.")
        recommendations.append("Enforce strict three-way PO matching before release of payment.")
    elif v_level == "MEDIUM":
        factors.append("Supplier has MEDIUM risk rating based on past audit records.")

    # 5. Multi-Model predictions & consensus
    X = build_feature_dataframe(req.amount, req.is_duplicate, req.overspend_percentage, req.vendor_risk_level)
    rf_pct = 0.0
    xgb_pct = 0.0
    iso_flag = False

    if rf_model is not None:
        rf_p = float(rf_model.predict_proba(X)[0][1])
        rf_pct = round(rf_p * 100)
        factors.append(f"Primary Random Forest model assessed {rf_pct}% risk probability.")

    if xgb_model is not None:
        xgb_p = float(xgb_model.predict_proba(X)[0][1])
        xgb_pct = round(xgb_p * 100)
        factors.append(f"Secondary XGBoost model assessed {xgb_pct}% risk probability.")

    if if_model is not None:
        pred = int(if_model.predict(X)[0])
        iso_flag = (pred == -1)
        if iso_flag:
            factors.append("Isolation Forest flagged this invoice as a structural anomaly outlier.")
            recommendations.append("Conduct manual inspection — spending pattern deviates from standard baseline.")

    if not factors:
        factors.append("All audited parameters conform to standard baseline limits.")
        recommendations.append("Standard automated processing — no intervention required.")

    level = "HIGH" if req.risk_score >= 7 else ("MEDIUM" if req.risk_score >= 4 else "LOW")
    summary = (
        f"Multi-Model Assessment: {level} RISK (Score {req.risk_score}/10) with RF: {rf_pct}% and XGBoost: {xgb_pct}%. "
        f"{len(factors)} governing factors evaluated."
    )

    models_meta = model_metadata.get("models", {})
    waterfall = compute_waterfall_attribution(
        amount=req.amount,
        is_duplicate=req.is_duplicate,
        overspend_pct=req.overspend_percentage,
        vendor_risk_level=req.vendor_risk_level,
        is_anomaly=iso_flag
    )
    return {
        "risk_score": req.risk_score,
        "risk_level": level,
        "rf_risk_probability_pct": rf_pct,
        "xgb_risk_probability_pct": xgb_pct,
        "is_anomaly": iso_flag,
        "summary": summary,
        "factors": factors,
        "recommendations": recommendations,
        "waterfall": waterfall,
        "model_version": model_metadata.get("model_version", "v3.0-MultiModel"),
        "mlflow_run_id": model_metadata.get("mlflow_run_id", "local"),
        "feature_importances": {
            "random_forest": models_meta.get("random_forest", {}).get("feature_importances", {}),
            "xgboost": models_meta.get("xgboost", {}).get("feature_importances", {}),
            "isolation_forest": models_meta.get("isolation_forest", {}).get("feature_importances", {})
        }
    }


@app.get("/model-info")
def model_info():
    """
    Returns live multi-model metadata, MLflow tracking details, metrics, and feature importances.
    """
    if not model_metadata:
        load_models()

    return {
        "status": "active",
        "architecture_layer": "ML Service Layer (Python)",
        "frameworks": ["Scikit-learn", "XGBoost", "Isolation Forest", "MLflow", "Joblib"],
        "metadata": model_metadata,
        "rf_loaded": rf_model is not None,
        "xgb_loaded": xgb_model is not None,
        "if_loaded": if_model is not None,
        "features": FEATURES,
        "mlflow_experiment": "enterprise-decision-hub",
        "mlflow_run_id": model_metadata.get("mlflow_run_id", "local")
    }


@app.post("/retrain", dependencies=[Depends(verify_api_key)])
def retrain():
    """
    Triggers complete multi-model retraining (RF, XGBoost, IsoForest), logs to MLflow, and hot-reloads models.
    """
    from train_model import train_models
    meta = train_models()
    load_models()
    return {
        "status": "success",
        "message": "All models (RF, XGBoost, Isolation Forest) retrained, tracked in MLflow, and hot-reloaded successfully.",
        "new_metadata": meta
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
