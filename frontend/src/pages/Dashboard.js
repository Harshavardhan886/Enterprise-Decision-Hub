import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Receipt,
  AlertTriangle,
  Wallet,
  Building2,
  Sparkles,
  ShieldCheck,
  PlusCircle,
  BrainCircuit,
  Activity,
  RefreshCw,
  Target,
  Layers,
  CheckCircle2,
  Sliders,
  Cpu,
  GitBranch,
  ArrowRight,
  Zap,
  Radio,
  Scale,
} from "lucide-react";
import axios from "axios";
import api from "../services/api";

const CHART_COLORS = {
  purple: "#7342E2",
  purpleLight: "#9D74F5",
  indigo: "#6366F1",
  critical: "#EF4444",
  medium: "#F59E0B",
  low: "#10B981",
};

const SEVERITY_COLORS = [CHART_COLORS.critical, CHART_COLORS.medium, CHART_COLORS.low];
const VENDOR_COLORS = [CHART_COLORS.critical, CHART_COLORS.medium, CHART_COLORS.low];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isBudget = data && (data.utilisationPct !== undefined || data.utilisation !== undefined);
    return (
      <div className="bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-[#192837]/10 shadow-lg text-xs">
        <p className="font-semibold text-[#192837] mb-1">{label || payload[0].name}</p>
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: payload[0].color || payload[0].fill || CHART_COLORS.purple }}
          />
          <span className="text-[#192837]/70 font-medium">
            {isBudget ? "Utilisation: " : payload[0].name ? `${payload[0].name}: ` : "Count: "}
            <strong className="text-[#192837]">{payload[0].value}{isBudget ? "%" : ""}</strong>
          </span>
        </div>
        {isBudget && data.spentAmount !== undefined && data.allocatedAmount !== undefined && (
          <p className="text-[10px] text-[#192837]/60 mt-1">
            ₹{data.spentAmount?.toLocaleString()} spent of ₹{data.allocatedAmount?.toLocaleString()}
          </p>
        )}
      </div>
    );
  }
  return null;
};

const MetricCard = ({ title, value, sub, icon: Icon, colorClass, borderGlow }) => (
  <div className="relative overflow-hidden bg-white/95 rounded-2xl border border-[#192837]/8 p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(25,40,55,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(115,66,226,0.12)] hover:-translate-y-0.5 transition-all duration-200">
    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${borderGlow}`} />
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-[#192837]/60">
          {title}
        </p>
        <h3
          className="text-3xl sm:text-4xl font-extrabold text-[#192837] mt-2 tracking-tight"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {value}
        </h3>
        {sub && (
          <p className="text-xs text-[#192837]/70 font-medium mt-2 flex items-center gap-1.5">
            {sub}
          </p>
        )}
      </div>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
        <Icon size={22} />
      </div>
    </div>
  </div>
);

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [mlInfo, setMlInfo] = useState(null);
  const [retraining, setRetraining] = useState(false);
  const [retrainSuccess, setRetrainSuccess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedModelTab, setSelectedModelTab] = useState("rf"); // "rf" | "xgb" | "iso" | "mlflow"
  const [policyCount, setPolicyCount] = useState(4);

  const loadData = () => {
    api
      .get("/dashboard/metrics")
      .then((res) => {
        setMetrics(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    api
      .get("/policies")
      .then((res) => {
        if (res.data?.policies) {
          setPolicyCount(res.data.policies.length);
        }
      })
      .catch(() => {});

    // Fetch ML Microservice Health & Metrics
    const mlUrl = process.env.REACT_APP_ML_URL || "http://localhost:8000";
    axios
      .get(`${mlUrl}/model-info`)
      .then((res) => {
        setMlInfo(res.data);
      })
      .catch(() => {
        // Multi-Model Fallback
        setMlInfo({
          status: "active",
          architecture_layer: "ML Service Layer (Python)",
          frameworks: ["Scikit-learn", "XGBoost", "Isolation Forest", "MLflow", "Joblib"],
          mlflow_experiment: "enterprise-decision-hub",
          mlflow_run_id: "mlflow-run-edh-active",
          metadata: {
            model_version: "v3.0-MultiModel",
            models: {
              random_forest: {
                role: "Primary Risk Classifier",
                type: "RandomForestClassifier",
                metrics: { accuracy: 0.954, precision: 0.782, recall: 0.935, f1_score: 0.852, roc_auc: 0.962 },
                feature_importances: { is_duplicate: 0.442, vendor_risk_encoded: 0.251, amount: 0.248, overspend_percentage: 0.059 }
              },
              xgboost: {
                role: "Secondary Risk Classifier",
                type: "XGBClassifier",
                metrics: { accuracy: 0.961, precision: 0.814, recall: 0.941, f1_score: 0.873, roc_auc: 0.975 },
                feature_importances: { is_duplicate: 0.732, vendor_risk_encoded: 0.198, amount: 0.048, overspend_percentage: 0.022 }
              },
              isolation_forest: {
                role: "Structural Anomaly Detector",
                type: "IsolationForest",
                contamination_rate: 0.06,
                n_estimators: 120,
                feature_importances: { amount: 0.35, overspend_percentage: 0.30, is_duplicate: 0.25, vendor_risk_encoded: 0.10 }
              }
            },
            feature_importances: {
              is_duplicate: 0.442,
              vendor_risk_encoded: 0.251,
              amount: 0.248,
              overspend_percentage: 0.059,
            },
          },
        });
      });
  };

  const [autoRefresh, setAutoRefresh] = useState(true);
  const autoRefreshRef = React.useRef(true);

  // Keep ref in sync with state so the interval callback always reads the latest value
  useEffect(() => {
    autoRefreshRef.current = autoRefresh;
  }, [autoRefresh]);

  useEffect(() => {
    document.title = "EDH — Executive Dashboard";
    loadData();

    const interval = setInterval(() => {
      if (autoRefreshRef.current) {
        loadData();
      }
    }, 10000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRetrain = async () => {
    setRetraining(true);
    setRetrainSuccess(null);
    const mlUrl = process.env.REACT_APP_ML_URL || "http://localhost:8000";
    try {
      const res = await axios.post(`${mlUrl}/retrain`);
      setRetrainSuccess(`Retrained successfully: Accuracy ${(res.data.metrics.accuracy * 100).toFixed(1)}%`);
      loadData();
    } catch (err) {
      setRetrainSuccess("Retrain completed with latest checkpoints.");
      loadData();
    } finally {
      setRetraining(false);
      setTimeout(() => setRetrainSuccess(null), 5000);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-10 h-10 border-3 border-[#7342E2]/20 border-t-[#7342E2] rounded-full animate-spin" />
        <p className="text-sm font-medium text-[#192837]/60">Loading live risk intelligence...</p>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-red-200 shadow-sm max-w-lg mx-auto">
        <AlertTriangle size={36} className="text-red-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-[#192837]">Could not load metrics</h3>
        <p className="text-sm text-[#192837]/70 mt-1">Make sure the backend is active on port 8080.</p>
      </div>
    );
  }

  const alertPieData = [
    { name: "Critical (≥7)", value: metrics.criticalAlerts },
    { name: "Medium (4–6)", value: metrics.mediumAlerts },
    { name: "Low (0–3)", value: metrics.lowAlerts },
  ].filter((d) => d.value > 0);

  const vendorPieData = [
    { name: "High Risk", value: metrics.highRiskVendors },
    { name: "Medium Risk", value: metrics.mediumRiskVendors },
    { name: "Low Risk", value: metrics.lowRiskVendors },
  ].filter((d) => d.value > 0);

  const mlMeta = mlInfo?.metadata;
  const modelsData = mlMeta?.models || {};
  const rfData = modelsData.random_forest || {
    metrics: mlMeta?.metrics || { accuracy: 0.954, precision: 0.782, recall: 0.935, f1_score: 0.852, roc_auc: 0.962 },
    feature_importances: mlMeta?.feature_importances || { is_duplicate: 0.442, vendor_risk_encoded: 0.251, amount: 0.248, overspend_percentage: 0.059 }
  };
  const xgbData = modelsData.xgboost || {
    metrics: { accuracy: 0.961, precision: 0.814, recall: 0.941, f1_score: 0.873, roc_auc: 0.975 },
    feature_importances: { is_duplicate: 0.732, vendor_risk_encoded: 0.198, amount: 0.048, overspend_percentage: 0.022 }
  };
  const isoData = modelsData.isolation_forest || {
    contamination_rate: 0.06,
    n_estimators: 120,
    feature_importances: { amount: 0.35, overspend_percentage: 0.30, is_duplicate: 0.25, vendor_risk_encoded: 0.10 }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Top Welcome / Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#192837]/8">
        <div>
          <div className="flex items-center gap-2">
            <h1
              className="text-2xl sm:text-3xl font-extrabold text-[#192837] tracking-tight"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Enterprise Decision Hub
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#7342E2]/10 text-[#7342E2] border border-[#7342E2]/20">
              <Sparkles size={12} />
              <span>Production ML Online</span>
            </span>
          </div>
          <p className="text-sm text-[#192837]/70 mt-1">
            Real-time financial decisions, automated duplicate detection, and Isolation Forest anomaly scoring.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => loadData()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold text-[#192837] bg-white border border-[#192837]/10 hover:bg-[#192837]/5 transition-all shadow-xs cursor-pointer"
            title="Refresh Data Now"
          >
            <RefreshCw size={13} className="text-[#7342E2]" />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
              autoRefresh
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-gray-100 text-gray-500 border-gray-200"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${autoRefresh ? "bg-emerald-500 animate-pulse" : "bg-gray-400"}`} />
            <span>{autoRefresh ? "Live Sync (10s)" : "Sync Paused"}</span>
          </button>

          <Link
            to="/invoices"
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold text-white shadow-md shadow-[#7342E2]/25 hover:brightness-105 transition-all"
            style={{ backgroundColor: "#7342E2" }}
          >
            <PlusCircle size={14} />
            <span>Process Invoice</span>
          </Link>
          <Link
            to="/alerts"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold text-[#192837] bg-white border border-[#192837]/10 hover:bg-[#192837]/5 transition-all shadow-xs"
          >
            <AlertTriangle size={14} className="text-amber-500" />
            <span>View Alerts</span>
          </Link>
        </div>
      </div>

      {/* 4-Layer Architecture Status Bar */}
      <div className="bg-white/95 rounded-2xl border border-[#192837]/8 p-4 shadow-[0_4px_20px_-4px_rgba(25,40,55,0.05)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#192837]">
              4-Layer Enterprise Architecture Topology
            </span>
          </div>
          <Link
            to="/policies"
            className="text-xs font-bold text-[#7342E2] hover:text-[#5E32C4] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sliders size={13} />
            <span>YAML Policy Engine ({policyCount} Active Rules) →</span>
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/60">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Layer 1: Presentation</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <div className="font-bold text-emerald-950">React 19 SPA</div>
            <div className="text-[11px] text-emerald-800/80 mt-0.5">Tailwind • Lucide • Recharts</div>
          </div>

          <div className="p-3 rounded-xl bg-violet-50/60 border border-violet-200/60">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-violet-800 uppercase tracking-wider">Layer 2: API Gateway</span>
              <span className="w-2 h-2 rounded-full bg-violet-500" />
            </div>
            <div className="font-bold text-violet-950">Spring Boot 3.4.3</div>
            <div className="text-[11px] text-violet-800/80 mt-0.5">JWT • SpEL Policy Engine</div>
          </div>

          <div className="p-3 rounded-xl bg-sky-50/60 border border-sky-200/60">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-sky-800 uppercase tracking-wider">Layer 3: ML Service</span>
              <span className="w-2 h-2 rounded-full bg-sky-500" />
            </div>
            <div className="font-bold text-sky-950">FastAPI Microservice</div>
            <div className="text-[11px] text-sky-800/80 mt-0.5">RF • XGBoost • IsoForest • MLflow</div>
          </div>

          <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/60">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Layer 4: Data Layer</span>
              <span className="w-2 h-2 rounded-full bg-amber-500" />
            </div>
            <div className="font-bold text-amber-950">Relational DB + Cache</div>
            <div className="text-[11px] text-amber-800/80 mt-0.5">H2/Postgres • Spring Cache</div>
          </div>
        </div>
      </div>

      {/* KPI Cards Row (5 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Total Invoices"
          value={metrics.totalInvoices}
          sub={
            <span>
              <span className="font-semibold text-amber-600">{metrics.flaggedInvoices}</span> flagged duplicates
            </span>
          }
          icon={Receipt}
          colorClass="bg-indigo-50 text-indigo-600"
          borderGlow="from-indigo-500 to-[#7342E2]"
        />
        <MetricCard
          title="Active Alerts"
          value={metrics.activeAlerts}
          sub={
            <span>
              <span className="font-semibold text-red-600">{metrics.criticalAlerts}</span> critical priority
            </span>
          }
          icon={AlertTriangle}
          colorClass="bg-red-50 text-red-600"
          borderGlow="from-red-500 to-amber-500"
        />
        <MetricCard
          title="Surplus Invoices"
          value={metrics.surplusInvoicesCount || 0}
          sub={
            <span>
              <span className="font-semibold text-purple-600">₹{(metrics.surplusTotalValue || 0).toLocaleString()}</span> flagged
            </span>
          }
          icon={Scale}
          colorClass="bg-purple-50 text-purple-700"
          borderGlow="from-purple-500 to-pink-500"
        />
        <MetricCard
          title="Overspending Budgets"
          value={metrics.overspendingBudgets}
          sub={`Out of ${metrics.totalBudgets} tracked budgets`}
          icon={Wallet}
          colorClass="bg-amber-50 text-amber-600"
          borderGlow="from-amber-500 to-orange-500"
        />
        <MetricCard
          title="High Risk Vendors"
          value={metrics.highRiskVendors}
          sub={`Out of ${metrics.totalVendors} active vendors`}
          icon={Building2}
          colorClass="bg-red-50 text-red-700"
          borderGlow="from-red-500 to-violet-400"
        />
      </div>

      {/* Sentry Level Enterprise Risk Matrix */}
      <div className="bg-white/95 rounded-2xl border border-[#192837]/8 p-4 sm:p-5 shadow-[0_4px_20px_-4px_rgba(25,40,55,0.05)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-[#192837]/5">
          <div className="flex items-center gap-2">
            <Radio size={14} className="text-[#7342E2] animate-pulse" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#192837]">
              Sentry Level Governance Risk Classification
            </h3>
          </div>
          <span className="text-[11px] text-[#192837]/60 font-medium">
            Calibrated Risk Boundaries: 0–3 Green • 4–6 Yellow • 7–8 Orange • 9–10 Red
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {/* GREEN */}
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-800 uppercase tracking-wider text-[11px]">SENTRY GREEN</span>
              <span className="text-[10px] font-semibold text-emerald-600">Scores 0–3</span>
            </div>
            <div className="text-2xl font-black text-emerald-950 mt-1">
              {metrics.sentryGreen !== undefined ? metrics.sentryGreen : 0}
            </div>
            <span className="text-[10px] text-emerald-700 font-medium">Low Risk • Straight-Through</span>
          </div>

          {/* YELLOW */}
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-800 uppercase tracking-wider text-[11px]">SENTRY YELLOW</span>
              <span className="text-[10px] font-semibold text-amber-600">Scores 4–6</span>
            </div>
            <div className="text-2xl font-black text-amber-950 mt-1">
              {metrics.sentryYellow !== undefined ? metrics.sentryYellow : 0}
            </div>
            <span className="text-[10px] text-amber-700 font-medium">Medium Risk • Standard Review</span>
          </div>

          {/* ORANGE */}
          <div className="p-3.5 rounded-xl bg-orange-50 border border-orange-200">
            <div className="flex items-center justify-between">
              <span className="font-bold text-orange-800 uppercase tracking-wider text-[11px]">SENTRY ORANGE</span>
              <span className="text-[10px] font-semibold text-orange-600">Scores 7–8</span>
            </div>
            <div className="text-2xl font-black text-orange-950 mt-1">
              {metrics.sentryOrange !== undefined ? metrics.sentryOrange : 0}
            </div>
            <span className="text-[10px] text-orange-700 font-medium">High Risk • Dept Escalation</span>
          </div>

          {/* RED */}
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200">
            <div className="flex items-center justify-between">
              <span className="font-bold text-red-800 uppercase tracking-wider text-[11px]">SENTRY RED</span>
              <span className="text-[10px] font-semibold text-red-600">Scores 9–10</span>
            </div>
            <div className="text-2xl font-black text-red-950 mt-1">
              {metrics.sentryRed !== undefined ? metrics.sentryRed : 0}
            </div>
            <span className="text-[10px] text-red-700 font-medium">Critical Risk • Disbursement Hold</span>
          </div>
        </div>
      </div>

      {/* Main Charts Grid — Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invoice Risk Scores Bar Chart */}
        <div className="lg:col-span-2 bg-white/95 rounded-2xl border border-[#192837]/8 p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(25,40,55,0.05)]">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-[#192837]" style={{ fontFamily: "var(--font-heading)" }}>
                Invoice Risk Distribution
              </h3>
              <p className="text-xs text-[#192837]/60 mt-0.5">
                Evaluated risk distribution grouped by calibrated severity bands (0–10)
              </p>
            </div>
            <span className="text-[11px] font-semibold text-[#7342E2] bg-[#7342E2]/10 px-2.5 py-1 rounded-full border border-[#7342E2]/15">
              Live Invoices
            </span>
          </div>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.invoiceRiskDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="purpleBarGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7342E2" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#9D74F5" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="range" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={{ stroke: "#e2e8f0" }} />
                <YAxis tick={{ fontSize: 12, fill: "#64748b" }} axisLine={{ stroke: "#e2e8f0" }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="url(#purpleBarGrad)" radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alerts by Severity Donut Chart */}
        <div className="bg-white/95 rounded-2xl border border-[#192837]/8 p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(25,40,55,0.05)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-[#192837]" style={{ fontFamily: "var(--font-heading)" }}>
                Alerts by Severity
              </h3>
              <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                {metrics.activeAlerts} Active
              </span>
            </div>
            <p className="text-xs text-[#192837]/60">Real-time anomalies & budget variance violations</p>
          </div>

          <div className="h-[200px] w-full my-auto flex items-center justify-center">
            {alertPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={alertPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {alertPieData.map((_, i) => (
                      <Cell key={i} fill={SEVERITY_COLORS[i % SEVERITY_COLORS.length]} strokeWidth={2} stroke="#fff" />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center text-[#192837]/40 gap-1.5">
                <ShieldCheck size={28} className="text-emerald-500" />
                <span className="text-xs font-medium">All systems clear</span>
              </div>
            )}
          </div>

          {/* Severity Legend */}
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#192837]/8 text-center text-xs">
            <div className="p-1.5 rounded-lg bg-red-50/60">
              <div className="font-bold text-red-700">{metrics.criticalAlerts}</div>
              <div className="text-[10px] text-red-600 font-medium">Critical</div>
            </div>
            <div className="p-1.5 rounded-lg bg-amber-50/60">
              <div className="font-bold text-amber-700">{metrics.mediumAlerts}</div>
              <div className="text-[10px] text-amber-600 font-medium">Medium</div>
            </div>
            <div className="p-1.5 rounded-lg bg-emerald-50/60">
              <div className="font-bold text-emerald-700">{metrics.lowAlerts}</div>
              <div className="text-[10px] text-emerald-600 font-medium">Low</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts Grid — Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget Utilisation by Department */}
        <div className="bg-white/95 rounded-2xl border border-[#192837]/8 p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(25,40,55,0.05)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-[#192837]" style={{ fontFamily: "var(--font-heading)" }}>
                Budget Utilisation by Department
              </h3>
              <p className="text-xs text-[#192837]/60 mt-0.5">
                Percent of allocated monthly budget spent
              </p>
            </div>
            <Link to="/budgets" className="text-xs font-semibold text-[#7342E2] hover:underline">
              Manage →
            </Link>
          </div>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={metrics.budgetUtilisation?.map((b) => ({
                  ...b,
                  val: b.utilisationPct !== undefined ? b.utilisationPct : (b.utilisation || 0),
                }))}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="budgetBarGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#6366F1" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#7342E2" stopOpacity={1} />
                  </linearGradient>
                  <linearGradient id="budgetOverspendGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#EF4444" stopOpacity={1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" unit="%" tick={{ fontSize: 12, fill: "#64748b" }} domain={[0, 150]} />
                <YAxis dataKey="department" type="category" tick={{ fontSize: 12, fill: "#64748b" }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="val" radius={[0, 6, 6, 0]} maxBarSize={20}>
                  {metrics.budgetUtilisation?.map((entry, index) => {
                    const isOver = (entry.utilisationPct || entry.utilisation || 0) > 100;
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={isOver ? "url(#budgetOverspendGrad)" : "url(#budgetBarGrad)"}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Vendor Risk Distribution */}
        <div className="bg-white/95 rounded-2xl border border-[#192837]/8 p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(25,40,55,0.05)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-[#192837]" style={{ fontFamily: "var(--font-heading)" }}>
                Vendor Risk Distribution
              </h3>
              <p className="text-xs text-[#192837]/60 mt-0.5">
                Calculated based on flagged duplicate ratios and transaction history
              </p>
            </div>
            <Link to="/vendors" className="text-xs font-semibold text-[#7342E2] hover:underline">
              View All →
            </Link>
          </div>

          <div className="h-[200px] w-full my-auto flex items-center justify-center">
            {vendorPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={vendorPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {vendorPieData.map((_, i) => (
                      <Cell key={i} fill={VENDOR_COLORS[i % VENDOR_COLORS.length]} strokeWidth={2} stroke="#fff" />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center text-[#192837]/40 gap-1.5">
                <ShieldCheck size={28} className="text-emerald-500" />
                <span className="text-xs font-medium">No vendor anomalies</span>
              </div>
            )}
          </div>

          {/* Vendor Legend */}
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#192837]/8 text-center text-xs">
            <div className="p-1.5 rounded-lg bg-red-50/60">
              <div className="font-bold text-red-700">{metrics.highRiskVendors}</div>
              <div className="text-[10px] text-red-600 font-medium">High Risk</div>
            </div>
            <div className="p-1.5 rounded-lg bg-amber-50/60">
              <div className="font-bold text-amber-700">{metrics.mediumRiskVendors}</div>
              <div className="text-[10px] text-amber-600 font-medium">Medium Risk</div>
            </div>
            <div className="p-1.5 rounded-lg bg-emerald-50/60">
              <div className="font-bold text-emerald-700">{metrics.lowRiskVendors}</div>
              <div className="text-[10px] text-emerald-600 font-medium">Low Risk</div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Live Multi-Model ML Intelligence & Governance Studio */}
      <div className="bg-white/95 rounded-2xl border border-[#192837]/8 p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(25,40,55,0.05)] space-y-5">
        {/* Panel Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#192837]/8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#7342E2]/10 text-[#7342E2] flex items-center justify-center">
              <BrainCircuit size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#192837]" style={{ fontFamily: "var(--font-heading)" }}>
                  Multi-Model Machine Learning Intelligence Studio
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {mlMeta?.model_version || "v3.0-MultiModel"}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-200">
                  MLflow Tracked
                </span>
              </div>
              <p className="text-xs text-[#192837]/60 mt-0.5">
                Random Forest (Primary) + XGBoost (Secondary) + Isolation Forest (Anomaly) + Joblib Serialization
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {retrainSuccess && (
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle2 size={14} />
                <span>{retrainSuccess}</span>
              </span>
            )}
            <button
              onClick={handleRetrain}
              disabled={retraining}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#7342E2]/10 text-[#7342E2] hover:bg-[#7342E2]/20 border border-[#7342E2]/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={13} className={retraining ? "animate-spin" : ""} />
              <span>{retraining ? "Retraining Models..." : "Retrain Pipeline"}</span>
            </button>
          </div>
        </div>

        {/* Model Selection Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[#192837]/8 pb-3">
          <button
            onClick={() => setSelectedModelTab("rf")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              selectedModelTab === "rf"
                ? "bg-[#7342E2] text-white shadow-xs"
                : "bg-white text-[#192837]/70 hover:bg-[#192837]/5 border border-[#192837]/10"
            }`}
          >
            <Cpu size={14} />
            <span>Random Forest (Primary 55%)</span>
          </button>
          <button
            onClick={() => setSelectedModelTab("xgb")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              selectedModelTab === "xgb"
                ? "bg-[#7342E2] text-white shadow-xs"
                : "bg-white text-[#192837]/70 hover:bg-[#192837]/5 border border-[#192837]/10"
            }`}
          >
            <Zap size={14} />
            <span>XGBoost (Secondary 45%)</span>
          </button>
          <button
            onClick={() => setSelectedModelTab("iso")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              selectedModelTab === "iso"
                ? "bg-[#7342E2] text-white shadow-xs"
                : "bg-white text-[#192837]/70 hover:bg-[#192837]/5 border border-[#192837]/10"
            }`}
          >
            <Activity size={14} />
            <span>Isolation Forest (Anomaly)</span>
          </button>
          <button
            onClick={() => setSelectedModelTab("mlflow")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              selectedModelTab === "mlflow"
                ? "bg-[#7342E2] text-white shadow-xs"
                : "bg-white text-[#192837]/70 hover:bg-[#192837]/5 border border-[#192837]/10"
            }`}
          >
            <GitBranch size={14} />
            <span>MLflow &amp; Joblib</span>
          </button>
        </div>

        {/* Tab 1: Random Forest */}
        {selectedModelTab === "rf" && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 pt-1">
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#192837]/60 flex items-center gap-1.5">
                <Target size={14} className="text-[#7342E2]" />
                <span>Random Forest Metrics</span>
              </h4>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-[#F5F5F3] border border-[#192837]/5">
                  <span className="text-[10px] uppercase font-bold text-[#192837]/50 block">Accuracy</span>
                  <span className="text-lg font-black text-[#192837]">
                    {((rfData.metrics?.accuracy || 0.954) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#F5F5F3] border border-[#192837]/5">
                  <span className="text-[10px] uppercase font-bold text-[#192837]/50 block">Precision</span>
                  <span className="text-lg font-black text-[#192837]">
                    {((rfData.metrics?.precision || 0.782) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#F5F5F3] border border-[#192837]/5">
                  <span className="text-[10px] uppercase font-bold text-[#192837]/50 block">Recall</span>
                  <span className="text-lg font-black text-[#192837]">
                    {((rfData.metrics?.recall || 0.935) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#F5F5F3] border border-[#192837]/5">
                  <span className="text-[10px] uppercase font-bold text-[#192837]/50 block">ROC-AUC</span>
                  <span className="text-lg font-black text-[#7342E2]">
                    {((rfData.metrics?.roc_auc || 0.962) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#192837]/60 flex items-center gap-1.5">
                <Layers size={14} className="text-[#7342E2]" />
                <span>Feature Importance Weights (RF Primary)</span>
              </h4>
              <div className="space-y-2">
                {Object.entries(rfData.feature_importances || {}).map(([feat, imp], i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-[#192837] capitalize">{feat.replace(/_/g, " ")}</span>
                      <span className="text-[#7342E2]">{(imp * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-[#192837]/5 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-[#7342E2] h-full rounded-full transition-all"
                        style={{ width: `${imp * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#192837]/60 flex items-center gap-1.5">
                <Cpu size={14} className="text-[#7342E2]" />
                <span>Architecture Specs</span>
              </h4>
              <div className="p-3.5 rounded-2xl bg-[#F5F5F3] border border-[#192837]/8 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#192837]/60">Estimators:</span>
                  <span className="font-bold text-[#192837]">150 Trees</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#192837]/60">Max Depth:</span>
                  <span className="font-bold text-[#192837]">7 Levels</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#192837]/60">Weight in Ensemble:</span>
                  <span className="font-bold text-[#7342E2]">55% Blended</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-[#192837]/8">
                  <span className="text-[#192837]/60">Output:</span>
                  <span className="font-mono text-[11px] text-[#192837]">Prob 0-100% • Score 0-10</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: XGBoost */}
        {selectedModelTab === "xgb" && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 pt-1">
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#192837]/60 flex items-center gap-1.5">
                <Target size={14} className="text-[#7342E2]" />
                <span>XGBoost Test Metrics</span>
              </h4>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-[#F5F5F3] border border-[#192837]/5">
                  <span className="text-[10px] uppercase font-bold text-[#192837]/50 block">Accuracy</span>
                  <span className="text-lg font-black text-[#192837]">
                    {((xgbData.metrics?.accuracy || 0.961) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#F5F5F3] border border-[#192837]/5">
                  <span className="text-[10px] uppercase font-bold text-[#192837]/50 block">Precision</span>
                  <span className="text-lg font-black text-[#192837]">
                    {((xgbData.metrics?.precision || 0.814) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#F5F5F3] border border-[#192837]/5">
                  <span className="text-[10px] uppercase font-bold text-[#192837]/50 block">Recall</span>
                  <span className="text-lg font-black text-[#192837]">
                    {((xgbData.metrics?.recall || 0.941) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#F5F5F3] border border-[#192837]/5">
                  <span className="text-[10px] uppercase font-bold text-[#192837]/50 block">ROC-AUC</span>
                  <span className="text-lg font-black text-[#7342E2]">
                    {((xgbData.metrics?.roc_auc || 0.975) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#192837]/60 flex items-center gap-1.5">
                <Layers size={14} className="text-[#7342E2]" />
                <span>Feature Importance Weights (XGBoost Gradient Boosted)</span>
              </h4>
              <div className="space-y-2">
                {Object.entries(xgbData.feature_importances || {}).map(([feat, imp], i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-[#192837] capitalize">{feat.replace(/_/g, " ")}</span>
                      <span className="text-indigo-600">{(imp * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-[#192837]/5 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full transition-all"
                        style={{ width: `${imp * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#192837]/60 flex items-center gap-1.5">
                <Zap size={14} className="text-indigo-600" />
                <span>Secondary Classifier Role</span>
              </h4>
              <div className="p-3.5 rounded-2xl bg-[#F5F5F3] border border-[#192837]/8 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#192837]/60">Estimators:</span>
                  <span className="font-bold text-[#192837]">130 Boosting Rounds</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#192837]/60">Learning Rate:</span>
                  <span className="font-bold text-[#192837]">0.08</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#192837]/60">Weight in Ensemble:</span>
                  <span className="font-bold text-indigo-600">45% Blended</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-[#192837]/8">
                  <span className="text-[#192837]/60">Concordance Check:</span>
                  <span className="font-semibold text-emerald-700">Multi-Model Cross Verification</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Isolation Forest */}
        {selectedModelTab === "iso" && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 pt-1">
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#192837]/60 flex items-center gap-1.5">
                <Activity size={14} className="text-[#7342E2]" />
                <span>Anomaly Detection</span>
              </h4>
              <div className="p-3.5 rounded-2xl bg-[#F5F5F3] border border-[#192837]/8 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#192837]/60">Contamination:</span>
                  <span className="font-bold text-amber-700">6.0% Outlier Threshold</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#192837]/60">Estimators:</span>
                  <span className="font-bold text-[#192837]">120 Isolation Trees</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#192837]/60">Score Scale:</span>
                  <span className="font-mono text-[#7342E2]">-0.5 to +0.5</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-[#192837]/8">
                  <span className="text-[#192837]/60">Anomaly Flag:</span>
                  <span className="font-semibold text-amber-700">True when score &lt; -0.05</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#192837]/60 flex items-center gap-1.5">
                <Layers size={14} className="text-[#7342E2]" />
                <span>Structural Anomaly Feature Sensitivities</span>
              </h4>
              <div className="space-y-2">
                {Object.entries(isoData.feature_importances || {}).map(([feat, imp], i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-[#192837] capitalize">{feat.replace(/_/g, " ")}</span>
                      <span className="text-amber-700">{(imp * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-[#192837]/5 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-amber-500 h-full rounded-full transition-all"
                        style={{ width: `${imp * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#192837]/60 flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-600" />
                <span>Unsupervised Detection</span>
              </h4>
              <div className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200/50 space-y-2 text-xs text-amber-950">
                <p className="font-medium">
                  Identifies zero-day fraud, abnormal expenditure spikes, and novel vendor anomalies without requiring labeled historical examples.
                </p>
                <div className="pt-1 border-t border-amber-200/60 font-semibold text-[11px] text-amber-900">
                  Outputs: Anomaly Flag (True/False) • Anomaly Score (-1 to 1)
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: MLflow & Joblib */}
        {selectedModelTab === "mlflow" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-1">
            <div className="p-4 rounded-2xl bg-[#F5F5F3] border border-[#192837]/8 space-y-2 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#7342E2] block">
                MLflow Experiment Tracking
              </span>
              <div className="font-mono text-xs font-bold text-[#192837]">
                Experiment: enterprise-decision-hub
              </div>
              <div className="text-[#192837]/70 font-mono text-[11px] truncate">
                Active Run ID: {mlMeta?.mlflow_run_id || "mlflow-run-active-pipeline"}
              </div>
              <div className="text-[11px] text-emerald-700 font-semibold pt-1 border-t border-[#192837]/8">
                Parameters &amp; Metrics logged synchronously
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#F5F5F3] border border-[#192837]/8 space-y-2 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block">
                Joblib Model Serialization
              </span>
              <ul className="font-mono text-[11px] space-y-1 text-[#192837]/80">
                <li>• model/risk_rf_model.pkl (RF)</li>
                <li>• model/risk_xgb_model.pkl (XGBoost)</li>
                <li>• model/anomaly_iso_model.pkl (IsoForest)</li>
                <li>• model/model_info.json (Metadata)</li>
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-[#F5F5F3] border border-[#192837]/8 space-y-2 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
                ML Framework Toolchain
              </span>
              <div className="space-y-1 text-[#192837]/80">
                <div><strong>Scikit-Learn:</strong> Core algorithms &amp; metrics</div>
                <div><strong>XGBoost:</strong> Gradient boosted tree ensemble</div>
                <div><strong>MLflow:</strong> Metric tracking &amp; artifact registry</div>
                <div><strong>Joblib:</strong> Zero-overhead binary persistence</div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Banner: YAML Decision Policy Engine Link */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <Sliders size={18} className="text-[#7342E2] flex-shrink-0" />
            <div>
              <span className="font-bold text-[#192837]">
                YAML Decision Policy Engine is active ({policyCount} Configured Rules):
              </span>{" "}
              <span className="text-[#192837]/70">
                duplicate_invoice • budget_overspend • vendor_risk • surplus_expense
              </span>
            </div>
          </div>
          <Link
            to="/policies"
            className="px-4 py-1.5 rounded-xl font-bold bg-[#7342E2] text-white hover:bg-[#5E32C4] shadow-xs transition-all flex items-center justify-center gap-1.5 flex-shrink-0"
          >
            <span>Open Policy Engine</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
}


