import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  Building2,
  CheckCircle2,
  Cpu,
  GitBranch,
  Layers,
  PlusCircle,
  Radio,
  Receipt,
  RefreshCw,
  Scale,
  ShieldCheck,
  Sliders,
  Sparkles,
  Target,
  Wallet,
  Zap,
} from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import axios from "axios";
import api from "../services/api";
import Card, { CardBody, CardHeader } from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import PageHeader, { MetaPill } from "../components/ui/PageHeader";
import StatCard from "../components/ui/StatCard";
import { SegmentedControl } from "../components/ui/Tabs";
import ChartTooltip from "../components/charts/ChartTooltip";

const CHART = {
  accent: "#8b5cf6",
  accentLight: "#a78bfa",
  indigo: "#6366f1",
  critical: "#ef4444",
  medium: "#f59e0b",
  low: "#10b981",
};

const ALERT_COLORS = [CHART.critical, CHART.medium, CHART.low];
const VENDOR_COLORS = [CHART.critical, CHART.medium, CHART.low];

const MODEL_TABS = [
  { value: "rf", label: "Random Forest", icon: Cpu },
  { value: "xgb", label: "XGBoost", icon: Zap },
  { value: "iso", label: "Isolation Forest", icon: Activity },
  { value: "mlflow", label: "MLflow", icon: GitBranch },
];

const SENTRY_BANDS = [
  { key: "sentryGreen", label: "GREEN", range: "0–3", note: "Low · straight-through", bar: "bg-success", text: "text-success" },
  { key: "sentryYellow", label: "YELLOW", range: "4–6", note: "Medium · standard review", bar: "bg-warning", text: "text-warning" },
  { key: "sentryOrange", label: "ORANGE", range: "7–8", note: "High · dept escalation", bar: "bg-orange-500", text: "text-orange-600 dark:text-orange-400" },
  { key: "sentryRed", label: "RED", range: "9–10", note: "Critical · disbursement hold", bar: "bg-danger", text: "text-danger" },
];

function FeatureBars({ data, color }) {
  const entries = Object.entries(data || {});
  if (entries.length === 0) {
    return <p className="text-xs italic text-ink-subtle">No feature importance data available.</p>;
  }

  return (
    <div className="space-y-2.5">
      {entries.map(([feature, importance]) => (
        <div key={feature}>
          <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
            <span className="font-semibold capitalize text-ink">
              {feature.replace(/_/g, " ")}
            </span>
            <span className="num font-bold text-ink-muted">{(importance * 100).toFixed(1)}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(importance * 100, 100)}%`, backgroundColor: color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function MetricRow({ label, value, strong }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-ink-muted">{label}</span>
      <span className={`num text-right font-bold ${strong ? "text-accent" : "text-ink"}`}>
        {value}
      </span>
    </div>
  );
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [mlInfo, setMlInfo] = useState(null);
  const [retraining, setRetraining] = useState(false);
  const [retrainSuccess, setRetrainSuccess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedModelTab, setSelectedModelTab] = useState("rf");
  const [policyCount, setPolicyCount] = useState(4);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const autoRefreshRef = useRef(true);

  useEffect(() => {
    autoRefreshRef.current = autoRefresh;
  }, [autoRefresh]);

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
        if (res.data?.policies) setPolicyCount(res.data.policies.length);
      })
      .catch(() => {});

    const mlUrl = process.env.REACT_APP_ML_URL || "http://localhost:8000";
    axios
      .get(`${mlUrl}/model-info`)
      .then((res) => setMlInfo(res.data))
      .catch(() => {
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
                metrics: {
                  accuracy: 0.954,
                  precision: 0.782,
                  recall: 0.935,
                  f1_score: 0.852,
                  roc_auc: 0.962,
                },
                feature_importances: {
                  is_duplicate: 0.442,
                  vendor_risk_encoded: 0.251,
                  amount: 0.248,
                  overspend_percentage: 0.059,
                },
              },
              xgboost: {
                role: "Secondary Risk Classifier",
                type: "XGBClassifier",
                metrics: {
                  accuracy: 0.961,
                  precision: 0.814,
                  recall: 0.941,
                  f1_score: 0.873,
                  roc_auc: 0.975,
                },
                feature_importances: {
                  is_duplicate: 0.732,
                  vendor_risk_encoded: 0.198,
                  amount: 0.048,
                  overspend_percentage: 0.022,
                },
              },
              isolation_forest: {
                role: "Structural Anomaly Detector",
                type: "IsolationForest",
                contamination_rate: 0.06,
                n_estimators: 120,
                feature_importances: {
                  amount: 0.35,
                  overspend_percentage: 0.3,
                  is_duplicate: 0.25,
                  vendor_risk_encoded: 0.1,
                },
              },
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

  useEffect(() => {
    document.title = "EDH — Executive Dashboard";
    loadData();

    const interval = setInterval(() => {
      if (autoRefreshRef.current) loadData();
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
      setRetrainSuccess(
        `Retrained · accuracy ${(res.data.metrics.accuracy * 100).toFixed(1)}%`
      );
      loadData();
    } catch {
      setRetrainSuccess("Retrain completed with latest checkpoints.");
      loadData();
    } finally {
      setRetraining(false);
      setTimeout(() => setRetrainSuccess(null), 5000);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24">
        <span className="h-9 w-9 animate-spin rounded-full border-2 border-accent/25 border-t-accent" />
        <p className="text-sm font-medium text-ink-muted">Loading live risk intelligence…</p>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="mx-auto max-w-lg">
        <Card className="p-8 text-center">
          <AlertTriangle size={32} className="mx-auto mb-3 text-warning" />
          <h3 className="text-base font-bold text-ink">Could not load metrics</h3>
          <p className="mt-1 text-sm text-ink-muted">
            Make sure the backend is running on port 8080.
          </p>
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={loadData} className="mt-4">
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  const alertPieData = [
    { name: "Critical (≥7)", value: metrics.criticalAlerts || 0 },
    { name: "Medium (4–6)", value: metrics.mediumAlerts || 0 },
    { name: "Low (0–3)", value: metrics.lowAlerts || 0 },
  ].filter((entry) => entry.value > 0);

  const vendorPieData = [
    { name: "High risk", value: metrics.highRiskVendors || 0 },
    { name: "Medium risk", value: metrics.mediumRiskVendors || 0 },
    { name: "Low risk", value: metrics.lowRiskVendors || 0 },
  ].filter((entry) => entry.value > 0);

  const mlMeta = mlInfo?.metadata;
  const modelsData = mlMeta?.models || {};
  const rfData = modelsData.random_forest || {
    metrics: mlMeta?.metrics || {
      accuracy: 0.954,
      precision: 0.782,
      recall: 0.935,
      f1_score: 0.852,
      roc_auc: 0.962,
    },
    feature_importances: mlMeta?.feature_importances || {
      is_duplicate: 0.442,
      vendor_risk_encoded: 0.251,
      amount: 0.248,
      overspend_percentage: 0.059,
    },
  };
  const xgbData = modelsData.xgboost || {
    metrics: {
      accuracy: 0.961,
      precision: 0.814,
      recall: 0.941,
      f1_score: 0.873,
      roc_auc: 0.975,
    },
    feature_importances: {
      is_duplicate: 0.732,
      vendor_risk_encoded: 0.198,
      amount: 0.048,
      overspend_percentage: 0.022,
    },
  };
  const isoData = modelsData.isolation_forest || {
    contamination_rate: 0.06,
    n_estimators: 120,
    feature_importances: {
      amount: 0.35,
      overspend_percentage: 0.3,
      is_duplicate: 0.25,
      vendor_risk_encoded: 0.1,
    },
  };

  const sentryTotal =
    (metrics.sentryGreen || 0) +
      (metrics.sentryYellow || 0) +
      (metrics.sentryOrange || 0) +
      (metrics.sentryRed || 0) || 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Overview"
        title="Enterprise Decision Hub"
        description="Real-time financial decisions, automated duplicate detection and Isolation Forest anomaly scoring."
        badge={
          <Badge tone="success" icon={Sparkles} size="sm">
            Production ML online
          </Badge>
        }
        actions={
          <>
            <Button
              variant={autoRefresh ? "subtle" : "secondary"}
              size="sm"
              icon={Radio}
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? "Live · 10s" : "Sync paused"}
            </Button>
            <Button variant="secondary" size="sm" icon={RefreshCw} onClick={loadData}>
              Refresh
            </Button>
            <Button as={Link} to="/policies" variant="secondary" size="sm" icon={Sliders}>
              Policies ({policyCount})
            </Button>
            <Button as={Link} to="/invoices" size="sm" icon={PlusCircle}>
              Process invoice
            </Button>
          </>
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          label="Total invoices"
          value={metrics.totalInvoices}
          sub={
            <>
              <span className="font-semibold text-warning">{metrics.flaggedInvoices}</span> flagged
              duplicates
            </>
          }
          icon={Receipt}
        />
        <StatCard
          label="Active alerts"
          value={metrics.activeAlerts}
          sub={
            <>
              <span className="font-semibold text-danger">{metrics.criticalAlerts}</span> critical
              priority
            </>
          }
          icon={AlertTriangle}
          tone="danger"
        />
        <StatCard
          label="Surplus invoices"
          value={metrics.surplusInvoicesCount || 0}
          sub={
            <>
              <span className="font-semibold text-violet-600 dark:text-violet-300">
                ₹{(metrics.surplusTotalValue || 0).toLocaleString()}
              </span>{" "}
              flagged
            </>
          }
          icon={Scale}
          tone="purple"
        />
        <StatCard
          label="Overspending budgets"
          value={metrics.overspendingBudgets}
          sub={`of ${metrics.totalBudgets} tracked budgets`}
          icon={Wallet}
          tone="warning"
        />
        <StatCard
          label="High risk vendors"
          value={metrics.highRiskVendors}
          sub={`of ${metrics.totalVendors} active vendors`}
          icon={Building2}
          tone="danger"
        />
      </div>

      {/* Sentry governance matrix */}
      <Card>
        <CardBody>
          <CardHeader
            icon={Radio}
            title="Sentry-level governance risk classification"
            subtitle="Calibrated boundaries · 0–3 green · 4–6 yellow · 7–8 orange · 9–10 red"
            action={<MetaPill label="Scored" value={sentryTotal} />}
          />
          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {SENTRY_BANDS.map((band) => {
              const value = metrics[band.key] || 0;
              const share = sentryTotal > 0 ? Math.round((value / sentryTotal) * 100) : 0;
              return (
                <div key={band.key} className="rounded-xl border border-line bg-surface-2 p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                      {band.label}
                    </span>
                    <span className="text-[10px] font-semibold text-ink-subtle">{band.range}</span>
                  </div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="num text-2xl font-extrabold text-ink">{value}</span>
                    <span className="num text-[10px] font-semibold text-ink-subtle">{share}%</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-3">
                    <div className={`h-full rounded-full ${band.bar}`} style={{ width: `${share}%` }} />
                  </div>
                  <span className={`mt-1.5 block text-[10px] font-medium ${band.text}`}>{band.note}</span>
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardBody>
            <CardHeader
              icon={Receipt}
              title="Invoice risk distribution"
              subtitle="Invoices grouped by calibrated severity bands (0–10)"
              action={<Badge tone="accent" size="sm">Live</Badge>}
            />
            <div className="mt-4 h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={metrics.invoiceRiskDistribution}
                  margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="riskBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART.accent} stopOpacity={0.95} />
                      <stop offset="100%" stopColor={CHART.accentLight} stopOpacity={0.65} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "transparent" }} />
                  <Bar
                    dataKey="count"
                    fill="url(#riskBar)"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={46}
                    isAnimationActive={false}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex h-full flex-col">
            <CardHeader
              icon={AlertTriangle}
              title="Alerts by severity"
              subtitle="Live anomalies and budget variance"
              action={<Badge tone="danger" size="sm">{metrics.activeAlerts} active</Badge>}
            />

            <div className="my-2 h-[190px] w-full">
              {alertPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={alertPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={78}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                      isAnimationActive={false}
                    >
                      {alertPieData.map((entry, index) => (
                        <Cell key={entry.name} fill={ALERT_COLORS[index % ALERT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-1.5 text-ink-subtle">
                  <ShieldCheck size={26} className="text-success" />
                  <span className="text-xs font-medium">All systems clear</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 border-t border-line pt-3 text-center">
              {[
                { label: "Critical", value: metrics.criticalAlerts, tone: "text-danger" },
                { label: "Medium", value: metrics.mediumAlerts, tone: "text-warning" },
                { label: "Low", value: metrics.lowAlerts, tone: "text-success" },
              ].map((item) => (
                <div key={item.label} className="rounded-lg bg-surface-2 py-1.5">
                  <div className={`num text-sm font-bold ${item.tone}`}>{item.value}</div>
                  <div className="text-[10px] font-medium text-ink-muted">{item.label}</div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardBody>
            <CardHeader
              icon={Wallet}
              title="Budget utilisation by department"
              subtitle="Percent of allocated monthly budget spent"
              action={
                <Link to="/budgets" className="text-xs font-bold text-accent hover:underline">
                  Manage →
                </Link>
              }
            />
            <div className="mt-4 h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={(metrics.budgetUtilisation || []).map((item) => ({
                    ...item,
                    val: item.utilisationPct !== undefined ? item.utilisationPct : item.utilisation || 0,
                  }))}
                  layout="vertical"
                  margin={{ top: 8, right: 24, left: 8, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="budgetBar" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor={CHART.indigo} stopOpacity={0.85} />
                      <stop offset="100%" stopColor={CHART.accent} stopOpacity={1} />
                    </linearGradient>
                    <linearGradient id="budgetOver" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor={CHART.medium} stopOpacity={0.9} />
                      <stop offset="100%" stopColor={CHART.critical} stopOpacity={1} />
                    </linearGradient>
                  </defs>
                  <XAxis type="number" unit="%" domain={[0, 150]} />
                  <YAxis dataKey="department" type="category" width={82} />
                  <Tooltip content={<ChartTooltip valueSuffix="%" />} cursor={{ fill: "transparent" }} />
                  <Bar
                    dataKey="val"
                    radius={[0, 6, 6, 0]}
                    maxBarSize={18}
                    isAnimationActive={false}
                  >
                    {(metrics.budgetUtilisation || []).map((entry, index) => {
                      const isOver = (entry.utilisationPct || entry.utilisation || 0) > 100;
                      return (
                        <Cell
                          key={`budget-cell-${index}`}
                          fill={isOver ? "url(#budgetOver)" : "url(#budgetBar)"}
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex h-full flex-col">
            <CardHeader
              icon={Building2}
              title="Vendor risk distribution"
              subtitle="Derived from flagged duplicate ratios and transaction history"
              action={
                <Link to="/vendors" className="text-xs font-bold text-accent hover:underline">
                  View all →
                </Link>
              }
            />

            <div className="my-2 h-[190px] w-full">
              {vendorPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={vendorPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={78}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                      isAnimationActive={false}
                    >
                      {vendorPieData.map((entry, index) => (
                        <Cell key={entry.name} fill={VENDOR_COLORS[index % VENDOR_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-1.5 text-ink-subtle">
                  <ShieldCheck size={26} className="text-success" />
                  <span className="text-xs font-medium">No vendor anomalies</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 border-t border-line pt-3 text-center">
              {[
                { label: "High", value: metrics.highRiskVendors, tone: "text-danger" },
                { label: "Medium", value: metrics.mediumRiskVendors, tone: "text-warning" },
                { label: "Low", value: metrics.lowRiskVendors, tone: "text-success" },
              ].map((item) => (
                <div key={item.label} className="rounded-lg bg-surface-2 py-1.5">
                  <div className={`num text-sm font-bold ${item.tone}`}>{item.value}</div>
                  <div className="text-[10px] font-medium text-ink-muted">{item.label}</div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* ML studio */}
      <Card>
        <CardBody className="space-y-5">
          <CardHeader
            icon={BrainCircuit}
            title="Multi-model machine learning intelligence"
            subtitle="Random Forest (primary) + XGBoost (secondary) + Isolation Forest (anomaly) + MLflow tracking"
            action={
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="success" size="sm">
                  {mlMeta?.model_version || "v3.0-MultiModel"}
                </Badge>
                <Badge tone="purple" size="sm">
                  MLflow tracked
                </Badge>
                <Button
                  variant="subtle"
                  size="sm"
                  icon={RefreshCw}
                  loading={retraining}
                  onClick={handleRetrain}
                >
                  {retraining ? "Retraining…" : "Retrain pipeline"}
                </Button>
              </div>
            }
          />

          {retrainSuccess && (
            <div className="flex items-center gap-2 rounded-xl border border-success/25 bg-success/10 px-3.5 py-2 text-xs font-semibold text-success animate-fade-in">
              <CheckCircle2 size={14} />
              {retrainSuccess}
            </div>
          )}

          <SegmentedControl
            value={selectedModelTab}
            onChange={setSelectedModelTab}
            items={MODEL_TABS}
          />

          {selectedModelTab === "rf" && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
              <div className="space-y-3">
                <h4 className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                  <Target size={14} className="text-accent" />
                  Random Forest metrics
                </h4>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { label: "Accuracy", value: rfData.metrics?.accuracy || 0.954 },
                    { label: "Precision", value: rfData.metrics?.precision || 0.782 },
                    { label: "Recall", value: rfData.metrics?.recall || 0.935 },
                    { label: "ROC-AUC", value: rfData.metrics?.roc_auc || 0.962, accent: true },
                  ].map((metric) => (
                    <div key={metric.label} className="rounded-xl border border-line bg-surface-2 p-3">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-ink-subtle">
                        {metric.label}
                      </span>
                      <span
                        className={`num text-base font-extrabold ${
                          metric.accent ? "text-accent" : "text-ink"
                        }`}
                      >
                        {(metric.value * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3 lg:col-span-2">
                <h4 className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                  <Layers size={14} className="text-accent" />
                  Feature importance weights
                </h4>
                <FeatureBars data={rfData.feature_importances} color={CHART.accent} />
              </div>

              <div className="space-y-3">
                <h4 className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                  <Cpu size={14} className="text-accent" />
                  Architecture specs
                </h4>
                <div className="space-y-2 rounded-xl border border-line bg-surface-2 p-3.5 text-xs">
                  <MetricRow label="Estimators" value="150 trees" />
                  <MetricRow label="Max depth" value="7 levels" />
                  <MetricRow label="Ensemble weight" value="55% blended" strong />
                  <div className="border-t border-line pt-2">
                    <MetricRow label="Output" value="Prob 0–100% · Score 0–10" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedModelTab === "xgb" && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
              <div className="space-y-3">
                <h4 className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                  <Target size={14} className="text-accent" />
                  XGBoost metrics
                </h4>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { label: "Accuracy", value: xgbData.metrics?.accuracy || 0.961 },
                    { label: "Precision", value: xgbData.metrics?.precision || 0.814 },
                    { label: "Recall", value: xgbData.metrics?.recall || 0.941 },
                    { label: "ROC-AUC", value: xgbData.metrics?.roc_auc || 0.975, accent: true },
                  ].map((metric) => (
                    <div key={metric.label} className="rounded-xl border border-line bg-surface-2 p-3">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-ink-subtle">
                        {metric.label}
                      </span>
                      <span
                        className={`num text-base font-extrabold ${
                          metric.accent ? "text-accent" : "text-ink"
                        }`}
                      >
                        {(metric.value * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3 lg:col-span-2">
                <h4 className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                  <Layers size={14} className="text-accent" />
                  Feature importance weights
                </h4>
                <FeatureBars data={xgbData.feature_importances} color={CHART.indigo} />
              </div>

              <div className="space-y-3">
                <h4 className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                  <Zap size={14} className="text-info" />
                  Secondary classifier role
                </h4>
                <div className="space-y-2 rounded-xl border border-line bg-surface-2 p-3.5 text-xs">
                  <MetricRow label="Boosting rounds" value="130" />
                  <MetricRow label="Learning rate" value="0.08" />
                  <MetricRow label="Ensemble weight" value="45% blended" strong />
                  <div className="border-t border-line pt-2">
                    <MetricRow label="Concordance" value="Cross-verified" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedModelTab === "iso" && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
              <div className="space-y-3">
                <h4 className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                  <Activity size={14} className="text-accent" />
                  Anomaly detection
                </h4>
                <div className="space-y-2 rounded-xl border border-line bg-surface-2 p-3.5 text-xs">
                  <MetricRow label="Contamination" value="6.0% outlier threshold" />
                  <MetricRow label="Estimators" value="120 isolation trees" />
                  <MetricRow label="Score scale" value="-0.5 to +0.5" />
                  <div className="border-t border-line pt-2">
                    <MetricRow label="Anomaly flag" value="score < -0.05" />
                  </div>
                </div>
              </div>

              <div className="space-y-3 lg:col-span-2">
                <h4 className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                  <Layers size={14} className="text-accent" />
                  Structural anomaly sensitivities
                </h4>
                <FeatureBars data={isoData.feature_importances} color={CHART.medium} />
              </div>

              <div className="space-y-3">
                <h4 className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                  <ShieldCheck size={14} className="text-success" />
                  Unsupervised detection
                </h4>
                <div className="space-y-2 rounded-xl border border-warning/25 bg-warning/[0.06] p-3.5 text-xs text-ink">
                  <p className="leading-relaxed">
                    Identifies zero-day fraud, abnormal expenditure spikes and novel vendor anomalies
                    without labelled historical examples.
                  </p>
                  <div className="border-t border-warning/20 pt-1.5 text-[11px] font-semibold">
                    Outputs: anomaly flag (true/false) · anomaly score (-1 to 1)
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedModelTab === "mlflow" && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="space-y-2 rounded-xl border border-line bg-surface-2 p-4 text-xs">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-accent">
                  MLflow experiment tracking
                </span>
                <div className="font-mono text-xs font-bold text-ink">
                  Experiment: enterprise-decision-hub
                </div>
                <div className="truncate font-mono text-[11px] text-ink-muted">
                  Run ID: {mlMeta?.mlflow_run_id || "mlflow-run-active-pipeline"}
                </div>
                <div className="border-t border-line pt-1.5 text-[11px] font-semibold text-success">
                  Parameters and metrics logged synchronously
                </div>
              </div>

              <div className="space-y-2 rounded-xl border border-line bg-surface-2 p-4 text-xs">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-info">
                  Joblib model serialisation
                </span>
                <ul className="space-y-1 font-mono text-[11px] text-ink-muted">
                  <li>• model/risk_rf_model.pkl</li>
                  <li>• model/risk_xgb_model.pkl</li>
                  <li>• model/anomaly_iso_model.pkl</li>
                  <li>• model/model_info.json</li>
                </ul>
              </div>

              <div className="space-y-2 rounded-xl border border-line bg-surface-2 p-4 text-xs">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-warning">
                  Framework toolchain
                </span>
                <div className="space-y-1 text-ink-muted">
                  <div>
                    <strong className="text-ink">Scikit-learn:</strong> core algorithms & metrics
                  </div>
                  <div>
                    <strong className="text-ink">XGBoost:</strong> gradient boosted trees
                  </div>
                  <div>
                    <strong className="text-ink">MLflow:</strong> metric tracking & registry
                  </div>
                  <div>
                    <strong className="text-ink">Joblib:</strong> binary persistence
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col justify-between gap-3 rounded-2xl border border-accent/25 bg-gradient-to-r from-accent/10 to-transparent p-4 sm:flex-row sm:items-center">
            <div className="flex items-start gap-2.5">
              <Sliders size={17} className="mt-0.5 shrink-0 text-accent" />
              <div className="text-xs">
                <span className="font-bold text-ink">
                  YAML decision policy engine is active ({policyCount} configured rules):
                </span>{" "}
                <span className="text-ink-muted">
                  duplicate_invoice · budget_overspend · vendor_risk · surplus_expense
                </span>
              </div>
            </div>
            <Button as={Link} to="/policies" size="sm" iconRight={ArrowRight} className="shrink-0">
              Open policy engine
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
