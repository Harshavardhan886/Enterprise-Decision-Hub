# Enterprise Decision Hub (EDH) — Enterprise AI Governance & Risk Hub

Enterprise Decision Hub is an enterprise-grade AI decision and risk assessment platform designed around a robust **4-Layer Architecture**, an **ensemble multi-model ML service**, and a configurable **YAML Decision Policy Engine**.

---

## 1. ARCHITECTURE — 4-LAYER DESIGN

EDH follows a strict, enterprise-ready 4-layer separation of concerns:

```
┌────────────────────────────────────────────────────────────────────────┐
│ 1. PRESENTATION LAYER (Frontend)                                       │
│    • React 19 SPA (React Router v6, Tailwind CSS, Lucide, Recharts)     │
│    • Live Multi-Model Analytics, Policy Studio & Simulation Playground │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / REST & JWT
┌───────────────────────────────────▼────────────────────────────────────┐
│ 2. API GATEWAY / BUSINESS LAYER (Backend)                              │
│    • Spring Boot 3.4.3 (Java 21/25, Spring Security, JWT Auth)         │
│    • YAML Policy Engine (Spring SpEL Parser with Zero-Downtime Reload) │
│    • Audit Logging, Alert Triggers, and Multi-Model Risk Orchestration │
└─────────────────┬───────────────────────────────────┬──────────────────┘
                  │ Internal HTTP / API-Key           │ Spring Data Cache
┌─────────────────▼──────────────────┐   ┌────────────▼──────────────────┐
│ 3. ML SERVICE LAYER (Python)       │   │ 4. DATA LAYER (Storage+Cache) │
│    • FastAPI Async Microservice    │   │    • PostgreSQL / MongoDB /   │
│    • Primary: Random Forest        │   │      In-Memory Database       │
│    • Secondary: XGBoost            │   │    • Spring Cache Manager     │
│    • Anomaly: Isolation Forest     │   │      (@Cacheable("policies")  │
│    • MLflow Experiment Tracking    │   │      @CacheEvict on reload)   │
│    • Joblib Model Serialization    │   │    • Audit Trail & Event Logs │
└────────────────────────────────────┘   └───────────────────────────────┘
```

- **Presentation Layer (Frontend)**: React 19 single-page application with responsive layouts, real-time dashboards, invoice risk governance, and interactive policy rule simulation.
- **API Gateway / Business Layer (Backend)**: Spring Boot 3 with JWT security, REST APIs, business services for Invoices, Budgets, Vendors, and Alerts, plus the SpEL-driven YAML Policy Engine.
- **ML Service Layer (Python)**: High-performance FastAPI service hosting trained Scikit-learn Random Forest, XGBoost, and Isolation Forest models with MLflow experiment tracking.
- **Data Layer (Database + Cache)**: Relational/document persistence with Spring ConcurrentMapCacheManager caching active policies, dashboard metrics, and model metadata.

---

## 2. EXPANDED ML MODELS & PIPELINE

The ML service (`ml-service/`) utilizes an ensemble of supervised and unsupervised machine learning algorithms:

| Model | Role | Algorithm / Framework | Outputs |
| :--- | :--- | :--- | :--- |
| **Primary Model** | Primary Risk Prediction (55% ensemble weight) | `RandomForestClassifier` (Scikit-learn) | Risk Probability (0-100%), Risk Score (0-10), Feature Importance |
| **Secondary Model** | Secondary Verification (45% ensemble weight) | `XGBClassifier` (XGBoost) | Risk Probability (0-100%), Risk Score (0-10), Feature Importance |
| **Anomaly Detector** | Structural Outlier & Zero-Day Detection | `IsolationForest` (Scikit-learn) | Anomaly Flag (True/False), Anomaly Score (-1.0 to +1.0) |
| **Tracking & Registry** | Metric, Parameter & Experiment Tracking | **MLflow** (`mlflow.db`) | Parameters, Metrics (Accuracy, Precision, Recall, F1, ROC-AUC), Run Tags |
| **Serialization** | High-performance binary model persistence | **Joblib** (`model/*.pkl`) | Fast model loading and zero-downtime hot-reloading |

### Model Outputs
Every evaluation returns:
- **Risk Probability (0–100%)**: Blended ensemble confidence score.
- **Risk Score (0–10)**: Normalized enterprise risk rating.
- **Anomaly Flag (True/False)**: Isolation Forest multi-dimensional outlier alert.
- **Feature Importance**: Relative weight of `is_duplicate`, `vendor_risk_encoded`, `amount`, and `overspend_percentage`.
- **Model Agreement**: `CONCORDANT` vs `DIVERGENT` validation between Random Forest and XGBoost.

---

## 3. CONFIGURABLE YAML DECISION POLICY ENGINE

The platform features a configurable YAML policy engine loaded from `policies/decision-policies.yaml`:

```yaml
policies:
  - name: duplicate_invoice
    condition: confidence > 0.85
    action: FLAG_FOR_REVIEW
    risk_score: 7
    recommendation: "Review both invoices and verify with vendor"
    
  - name: budget_overspend
    condition: predicted_spend > budget * 1.1
    action: SEND_ALERT
    risk_score: 8
    recommendation: "Hold non-essential purchases and review with finance team"
    
  - name: vendor_risk
    condition: risk_score > 7
    action: ESCALATE
    risk_score: 6
    recommendation: "Review vendor contract and consider alternate suppliers"
    
  - name: surplus_expense
    condition: expense > average * 1.5
    action: FLAG_FOR_REVIEW
    risk_score: 5
    recommendation: "Review expense reports and identify cost-saving opportunities"
```

### Features:
- **Spring Expression Language (SpEL)**: Dynamic evaluation of contextual variables (`#confidence`, `#predicted_spend`, `#budget`, `#risk_score`, `#expense`, `#average`, `#is_duplicate`, `#department`).
- **Zero-Downtime Hot Reloading**: Update policies via REST (`PUT /api/policies/raw`) or disk file; Spring Cache is automatically evicted and repopulated.
- **Interactive Simulation Testbench**: Test any hypothetical scenario and inspect triggered policies via `POST /api/policies/evaluate` or the UI at `/policies`.

---

## 4. LLM ADVISORY SERVICE (Optional Layer)

EDH includes an optional **LLM Advisory Service Layer** (`LlmAdvisoryService.java`) that generates natural language explanations using Gemini 1.5 Flash or OpenAI GPT-4o:
- **Natural Language Explanations**: Translates multi-model ML risk probabilities, anomaly flags, and SpEL policy rules into human-readable narratives for auditors and executives.
- **Executive Summaries for Alerts**: Automatically synthesizes alerts into high-level briefings with actionable next steps.
- **Strict Invariant**: **NEVER overrides deterministic policy decisions or ML risk scores.** The advisory layer is read-only.
- **Graceful Fallback**: If external LLM APIs are offline or unconfigured, the system automatically falls back to an expert deterministic narrative generator.

### Example Output:
> *"We detected a high risk (8/10, Sentry Level ORANGE) of budget overspend in the Marketing department. Marketing expenses have increased by 15% compared to last month and are projected to exceed the quarterly budget. We recommend holding non-essential purchases and scheduling a review with the finance team."*

---

## 5. SENTRY LEVEL CLASSIFICATION & RISK BADGES

All invoice risk scores (0–10) are mapped to explicit enterprise **Sentry Levels**:

| Score | Sentry Level | Color | Operational Action |
| :--- | :--- | :--- | :--- |
| **0–3** | **GREEN** | Low risk (Emerald) | Straight-Through Authorization |
| **4–6** | **YELLOW** | Medium risk (Amber) | Standard Peer Review |
| **7–8** | **ORANGE** | High risk (Orange) | Departmental Escalation Required |
| **9–10** | **RED** | Critical risk (Red) | Immediate Disbursement Hold & Executive Review |

---

## 6. SURPLUS EXPENSE FLAGGING

The platform monitors and flags historical expenditure deviations:
- **Department Surplus**: `Invoice Amount > 1.5 × Department Average` → Flagged as Department Surplus.
- **Vendor Surplus**: `Invoice Amount > 2.0 × Vendor Average` → Flagged as Vendor Surplus.
- **Automated Alerts**: Generates a `SURPLUS_EXPENSE` alert with actionable recommendations: *"Review expense reports and identify cost-saving opportunities or negotiate volume tier"*.
- **UI Indicators**: Highlighted in the Invoices Table with `⚡ Dept Surplus (>1.5x)` / `🏢 Vendor Surplus (>2x)` badges, an interactive filter, and detailed baseline variance metrics in the Explain Intelligence dialog.

---

## 7. SUSTAINABLE DEVELOPMENT GOALS (SDG) MAPPING

Enterprise Decision Hub aligns directly with United Nations Sustainable Development Goals:

| SDG | How EDH Contributes |
| :--- | :--- |
| **SDG 8 – Decent Work & Economic Growth** | Prevents financial losses, mitigates procurement fraud, and promotes sustainable enterprise economic stability. |
| **SDG 9 – Industry, Innovation & Infrastructure** | Builds robust, open-architecture AI infrastructure and explainable ML toolchains for enterprise digital innovation. |
| **SDG 16 – Peace, Justice & Strong Institutions** | Promotes transparency, auditable decision trails, and institutional trust in automated governance and capital allocation. |

---

## 8. FEATURE COMPARISON: RESEARCH PAPERS VS. OUR SOLUTION

| Research Papers Do This | Our Solution Does This |
| :--- | :--- |
| Focus on prediction accuracy alone | Focus on actionable recommendations & automated policy enforcement |
| Black-box models with opaque weights | Explainable AI (Feature importance + SpEL rules + LLM narrative) |
| Static dashboards with delayed batch metrics | Real-time alerts with live polling & telemetry sync |
| Single department focus | Unified governance view across all enterprise departments |
| No vendor risk tracking | Real-time vendor risk assessment and historical profiling |
| Inconsistent outputs | Standardized Sentry Level format (GREEN, YELLOW, ORANGE, RED) |

---

## 9. END-TO-END DATA FLOW PIPELINE

```
External Systems ──► Data Ingestion ──► MongoDB / Ledger
       │
       ▼
MongoDB ──► ML Pipeline (RF + XGBoost + IsoForest) ──► Predictions
       │
       ▼
Predictions + Rules ──► YAML Policy Engine (SpEL) ──► Final Decision (Risk Score + Sentry Level)
       │
       ▼
Decision ──► Alert Engine ──► Dashboard / Real-Time Live Sync / Notifications
       │
       ▼
Decision + Data ──► LLM Advisory Service ──► Executive Explanation / Briefing
       │
       ▼
All Steps ──► Immutable Audit Service ──► Cryptographic / Tamper-Evident Audit Logs
```

---

## 10. QUICK START & RUNNING LOCALLY

### Prerequisites:
1. **Java 21 or 25** (`java -version`)
2. **Maven 3.9+** (`mvn -version`)
3. **Python 3.10+** (`python --version`)
4. **Node.js v18+** (`node -v`)

### Step 1: Train & Start the ML Service (Port 8000)
```powershell
cd ml-service
python -m pip install -r requirements.txt
python train_model.py
python app.py
```

### Step 2: Start the Backend (Port 8080)
```powershell
cd backend
mvn spring-boot:run
```

### Step 3: Start the Frontend (Port 3000)
```powershell
cd frontend
npm install
npm start
```

Navigate to `http://localhost:3000` to access the Enterprise Decision Hub.

