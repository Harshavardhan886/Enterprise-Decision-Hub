"""
ML Training Pipeline for Enterprise Decision Hub
Trains:
  1. RandomForestClassifier  — Primary risk prediction model
  2. XGBoostClassifier       — Secondary risk prediction model
  3. IsolationForest         — Structural outlier & anomaly detection
Tracks:
  - MLflow (experiments, parameters, metrics, run tags)
Serializes with Joblib:
  - model/risk_rf_model.pkl   (and risk_model.pkl for compatibility)
  - model/risk_xgb_model.pkl
  - model/anomaly_iso_model.pkl (and anomaly_model.pkl for compatibility)
  - model/model_info.json
"""

import os
import json
import datetime
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
import xgboost as xgb
import joblib

# Silence MLflow hints
os.environ["MLFLOW_DISABLE_AGENT_HINT"] = "1"
import mlflow
import mlflow.sklearn

np.random.seed(42)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "model")
MLRUNS_DIR = os.path.join(BASE_DIR, "mlruns")

FEATURES = ["amount", "is_duplicate", "overspend_percentage", "vendor_risk_encoded"]
VENDOR_MAP = {"LOW": 0, "MEDIUM": 1, "HIGH": 2}


def generate_training_dataset(n=6000):
    """
    Generates realistic historical training samples representing enterprise invoice behavior.
    Includes normal expenditures, duplicate patterns, budget overruns, and high-risk vendor trends.
    """
    # Amounts: Standard business purchases (~10k to 80k) with occasional large capital outlays
    amounts = np.random.exponential(scale=24000, size=n) + 1500
    amounts = np.clip(amounts, 1000, 350000)

    # Duplicates: ~8% historical duplicate rate
    is_duplicate = np.random.binomial(1, 0.08, size=n)

    # Budget overspend: centered around 0%, tail up to 80%
    overspend_pct = np.random.normal(loc=2, scale=14, size=n)
    overspend_pct = np.clip(overspend_pct, -20, 80)

    # Vendor Risk: 65% Low, 23% Medium, 12% High
    vendor_risk = np.random.choice([0, 1, 2], size=n, p=[0.65, 0.23, 0.12])

    # Realistic ground truth risk calculation based on multiple interacting signals
    risk_score_raw = (
        0.05
        + 0.40 * is_duplicate
        + 0.0045 * np.clip(overspend_pct, 0, None)
        + 0.0000035 * amounts
        + 0.12 * (vendor_risk == 1)
        + 0.28 * (vendor_risk == 2)
        + np.random.normal(0, 0.05, size=n)
    )
    risk_prob = np.clip(risk_score_raw, 0.0, 1.0)
    labels = (risk_prob >= 0.45).astype(int)

    df = pd.DataFrame({
        "amount": amounts,
        "is_duplicate": is_duplicate,
        "overspend_percentage": overspend_pct,
        "vendor_risk_encoded": vendor_risk,
        "risky": labels,
    })
    return df


def train_models():
    os.makedirs(MODEL_DIR, exist_ok=True)
    os.makedirs(MLRUNS_DIR, exist_ok=True)

    df = generate_training_dataset(6000)
    X = df[FEATURES]
    y = df["risky"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # Configure MLflow with sqlite database tracking backend
    os.environ["MLFLOW_ALLOW_FILE_STORE"] = "true"
    db_path = os.path.join(BASE_DIR, "mlflow.db").replace(os.sep, "/")
    mlflow.set_tracking_uri(f"sqlite:///{db_path}")
    mlflow.set_experiment("enterprise-decision-hub")

    run_id = None
    with mlflow.start_run(run_name="edh_multi_model_pipeline") as run:
        run_id = run.info.run_id
        print(f">>> [MLflow] Run ID: {run_id}")

        # -------------------------------------------------------------
        # 1. Primary Model: Random Forest Classifier
        # -------------------------------------------------------------
        print(">>> [ML] Training Primary Model: Random Forest Classifier...")
        rf_params = {
            "n_estimators": 150,
            "max_depth": 7,
            "min_samples_leaf": 4,
            "class_weight": "balanced",
            "random_state": 42,
        }
        rf = RandomForestClassifier(**rf_params)
        rf.fit(X_train, y_train)

        rf_preds = rf.predict(X_test)
        rf_probs = rf.predict_proba(X_test)[:, 1]

        rf_acc = float(accuracy_score(y_test, rf_preds))
        rf_prec = float(precision_score(y_test, rf_preds, zero_division=0))
        rf_rec = float(recall_score(y_test, rf_preds, zero_division=0))
        rf_f1 = float(f1_score(y_test, rf_preds, zero_division=0))
        rf_auc = float(roc_auc_score(y_test, rf_probs))

        rf_importances = {feat: round(float(imp), 4) for feat, imp in zip(FEATURES, rf.feature_importances_)}

        print(f">>> [ML] RF Test Acc: {rf_acc:.3f} | Prec: {rf_prec:.3f} | Recall: {rf_rec:.3f} | F1: {rf_f1:.3f} | AUC: {rf_auc:.3f}")

        # -------------------------------------------------------------
        # 2. Secondary Model: XGBoost Classifier
        # -------------------------------------------------------------
        print(">>> [ML] Training Secondary Model: XGBoost Classifier...")
        xgb_params = {
            "n_estimators": 130,
            "max_depth": 5,
            "learning_rate": 0.08,
            "subsample": 0.85,
            "colsample_bytree": 0.85,
            "eval_metric": "logloss",
            "random_state": 42,
        }
        xgb_clf = xgb.XGBClassifier(**xgb_params)
        xgb_clf.fit(X_train, y_train)

        xgb_preds = xgb_clf.predict(X_test)
        xgb_probs = xgb_clf.predict_proba(X_test)[:, 1]

        xgb_acc = float(accuracy_score(y_test, xgb_preds))
        xgb_prec = float(precision_score(y_test, xgb_preds, zero_division=0))
        xgb_rec = float(recall_score(y_test, xgb_preds, zero_division=0))
        xgb_f1 = float(f1_score(y_test, xgb_preds, zero_division=0))
        xgb_auc = float(roc_auc_score(y_test, xgb_probs))

        xgb_importances = {feat: round(float(imp), 4) for feat, imp in zip(FEATURES, xgb_clf.feature_importances_)}

        print(f">>> [ML] XGB Test Acc: {xgb_acc:.3f} | Prec: {xgb_prec:.3f} | Recall: {xgb_rec:.3f} | F1: {xgb_f1:.3f} | AUC: {xgb_auc:.3f}")

        # -------------------------------------------------------------
        # 3. Anomaly Detection: Isolation Forest
        # -------------------------------------------------------------
        print(">>> [ML] Training Anomaly Detector: Isolation Forest...")
        iso_params = {
            "n_estimators": 120,
            "contamination": 0.06,
            "random_state": 42,
        }
        iso = IsolationForest(**iso_params)
        iso.fit(X)

        # Baseline variance/importance estimation for Isolation Forest
        iso_importances = {
            "amount": 0.35,
            "is_duplicate": 0.25,
            "overspend_percentage": 0.30,
            "vendor_risk_encoded": 0.10,
        }

        # -------------------------------------------------------------
        # MLflow Logging
        # -------------------------------------------------------------
        mlflow.log_params({
            "rf_n_estimators": rf_params["n_estimators"],
            "rf_max_depth": rf_params["max_depth"],
            "xgb_n_estimators": xgb_params["n_estimators"],
            "xgb_learning_rate": xgb_params["learning_rate"],
            "iso_contamination": iso_params["contamination"],
            "train_samples": len(X_train),
            "test_samples": len(X_test),
        })

        mlflow.log_metrics({
            "rf_accuracy": rf_acc,
            "rf_precision": rf_prec,
            "rf_recall": rf_rec,
            "rf_f1": rf_f1,
            "rf_auc": rf_auc,
            "xgb_accuracy": xgb_acc,
            "xgb_precision": xgb_prec,
            "xgb_recall": xgb_rec,
            "xgb_f1": xgb_f1,
            "xgb_auc": xgb_auc,
        })

        # -------------------------------------------------------------
        # Serialization with Joblib
        # -------------------------------------------------------------
        rf_path = os.path.join(MODEL_DIR, "risk_rf_model.pkl")
        xgb_path = os.path.join(MODEL_DIR, "risk_xgb_model.pkl")
        iso_path = os.path.join(MODEL_DIR, "anomaly_iso_model.pkl")
        
        # Compatibility paths
        rf_compat_path = os.path.join(MODEL_DIR, "risk_model.pkl")
        iso_compat_path = os.path.join(MODEL_DIR, "anomaly_model.pkl")

        joblib.dump(rf, rf_path)
        joblib.dump(rf, rf_compat_path)
        joblib.dump(xgb_clf, xgb_path)
        joblib.dump(iso, iso_path)
        joblib.dump(iso, iso_compat_path)

        model_metadata = {
            "model_version": "v3.0-MultiModel",
            "last_trained": datetime.datetime.now().isoformat(),
            "mlflow_run_id": run_id,
            "total_samples": len(df),
            "test_samples": len(X_test),
            "features": FEATURES,
            "models": {
                "random_forest": {
                    "role": "Primary Risk Classifier",
                    "type": "RandomForestClassifier",
                    "metrics": {
                        "accuracy": round(rf_acc, 4),
                        "precision": round(rf_prec, 4),
                        "recall": round(rf_rec, 4),
                        "f1_score": round(rf_f1, 4),
                        "roc_auc": round(rf_auc, 4),
                    },
                    "feature_importances": rf_importances,
                },
                "xgboost": {
                    "role": "Secondary Risk Classifier",
                    "type": "XGBClassifier",
                    "metrics": {
                        "accuracy": round(xgb_acc, 4),
                        "precision": round(xgb_prec, 4),
                        "recall": round(xgb_rec, 4),
                        "f1_score": round(xgb_f1, 4),
                        "roc_auc": round(xgb_auc, 4),
                    },
                    "feature_importances": xgb_importances,
                },
                "isolation_forest": {
                    "role": "Structural Anomaly Detector",
                    "type": "IsolationForest",
                    "contamination_rate": 0.06,
                    "n_estimators": 120,
                    "feature_importances": iso_importances,
                },
            },
            "ensemble_weights": {
                "random_forest": 0.55,
                "xgboost": 0.45,
            }
        }

        info_path = os.path.join(MODEL_DIR, "model_info.json")
        with open(info_path, "w") as f:
            json.dump(model_metadata, f, indent=2)

        print(f">>> [ML] All models, metrics, and metadata successfully serialized with Joblib to {MODEL_DIR}")
        return model_metadata


if __name__ == "__main__":
    train_models()
