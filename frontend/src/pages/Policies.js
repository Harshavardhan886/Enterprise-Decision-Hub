import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  FileCode,
  Play,
  RotateCcw,
  Save,
  ShieldAlert,
  Sliders,
  Sparkles,
  Zap,
} from "lucide-react";
import api from "../services/api";
import Alert from "../components/ui/Alert";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card, { CardBody, CardHeader } from "../components/ui/Card";
import { Checkbox, Field, Input, Textarea } from "../components/ui/Field";
import { SegmentedControl } from "../components/ui/Tabs";

const ACTION_TONES = {
  FLAG_FOR_REVIEW: "warning",
  SEND_ALERT: "danger",
  ESCALATE: "purple",
  ALLOW: "success",
};

const ACTION_LABELS = {
  FLAG_FOR_REVIEW: "Review required",
  SEND_ALERT: "Disbursement alert",
  ESCALATE: "Executive escalation",
  ALLOW: "Auto approved",
};

const SIM_FIELDS = [
  {
    key: "confidence",
    label: "Confidence (0.00 – 1.00)",
    hint: "Triggers duplicate policy above 0.85",
    step: "0.01",
    min: "0",
    max: "1",
  },
  {
    key: "vendorRiskScore",
    label: "Vendor risk score (0 – 10)",
    hint: "Triggers vendor risk policy above 7",
    step: "1",
    min: "0",
    max: "10",
  },
  {
    key: "predictedSpend",
    label: "Predicted spend (₹)",
    hint: "Compared against budget × 1.1",
  },
  { key: "budget", label: "Allocated budget (₹)", hint: "Department baseline budget" },
  {
    key: "expense",
    label: "Invoice expense (₹)",
    hint: "Triggers surplus policy above average × 1.5",
  },
  { key: "average", label: "Department average (₹)", hint: "Historical average invoice" },
];

export default function Policies() {
  const [policies, setPolicies] = useState([]);
  const [rawYaml, setRawYaml] = useState("");
  const [activeTab, setActiveTab] = useState("rules");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [copied, setCopied] = useState(false);

  const [simForm, setSimForm] = useState({
    confidence: 0.9,
    predictedSpend: 115000,
    budget: 100000,
    vendorRiskScore: 8,
    expense: 80000,
    average: 45000,
    isDuplicate: true,
    department: "Finance",
  });
  const [simResult, setSimResult] = useState(null);
  const [simulating, setSimulating] = useState(false);
  const [shadowResult, setShadowResult] = useState(null);
  const [shadowLoading, setShadowLoading] = useState(false);

  const fetchPolicies = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await api.get("/policies");
      setPolicies(res.data.policies || []);
      const yamlRes = await api.get("/policies/raw");
      setRawYaml(yamlRes.data.yaml || "");
    } catch {
      setErrorMessage("Failed to load policy engine data. Ensure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "EDH — Decision Policies";
    fetchPolicies();
  }, []);

  const handleSaveYaml = async () => {
    setSaving(true);
    setStatusMessage(null);
    setErrorMessage(null);
    try {
      const res = await api.put("/policies/raw", { yaml: rawYaml });
      setPolicies(res.data.policies || []);
      setStatusMessage("Policies updated and reloaded into the Spring cache.");
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err) {
      setErrorMessage(err.response?.data?.error || "Invalid YAML format. Please correct the syntax.");
    } finally {
      setSaving(false);
    }
  };

  const handleReload = async () => {
    try {
      const res = await api.post("/policies/reload");
      setPolicies(res.data.policies || []);
      setStatusMessage("Policies dynamically reloaded from the disk file.");
      setTimeout(() => setStatusMessage(null), 3000);
    } catch {
      setErrorMessage("Failed to reload policies.");
    }
  };

  const handleSimulate = async () => {
    setSimulating(true);
    try {
      const res = await api.post("/policies/evaluate", {
        confidence: parseFloat(simForm.confidence),
        predictedSpend: parseFloat(simForm.predictedSpend),
        budget: parseFloat(simForm.budget),
        vendorRiskScore: parseInt(simForm.vendorRiskScore, 10),
        expense: parseFloat(simForm.expense),
        average: parseFloat(simForm.average),
        isDuplicate: Boolean(simForm.isDuplicate),
        department: simForm.department,
      });
      setSimResult(res.data);
    } catch {
      setErrorMessage("Simulation request failed.");
    } finally {
      setSimulating(false);
    }
  };

  const handleCopyYaml = () => {
    navigator.clipboard.writeText(rawYaml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShadowSimulation = async () => {
    setShadowLoading(true);
    setStatusMessage(null);
    setErrorMessage(null);
    try {
      const res = await api.post("/policies/shadow-simulation", { yaml: rawYaml });
      setShadowResult(res.data);
      setStatusMessage(`Shadow dry-run completed across ${res.data.totalEvaluated} live invoices.`);
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err) {
      setErrorMessage(err.response?.data?.error || "Shadow simulation failed. Check YAML syntax.");
    } finally {
      setShadowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24">
        <span className="h-9 w-9 animate-spin rounded-full border-2 border-accent/25 border-t-accent" />
        <p className="text-sm font-medium text-ink-muted">Loading YAML decision policies…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Executive Policy Studio Header */}
      <div className="overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-5 text-white shadow-pop sm:p-6">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                Deterministic Policy Studio
              </span>
              <span className="font-mono text-xs text-white/60">
                SpEL Engine · Zero-Downtime Hot Reloading
              </span>
            </div>
            <h1 className="mt-2 text-xl font-extrabold tracking-tight text-white sm:text-2xl">
              YAML Decision Policy Engine
            </h1>
            <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-white/70">
              Declarative enterprise business policies governing disbursement actions, approval thresholds,
              and duplicate invoice holds with zero-downtime cache invalidation.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
              <span className="block text-[9px] font-bold uppercase tracking-wider text-white/50">Active Rules</span>
              <span className="num mt-0.5 block text-sm font-bold text-emerald-300">{policies.length} Policies</span>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
              <span className="block text-[9px] font-bold uppercase tracking-wider text-white/50">Engine Latency</span>
              <span className="num mt-0.5 block text-sm font-bold text-sky-300">&lt; 2 ms</span>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center col-span-2 sm:col-span-1">
              <span className="block text-[9px] font-bold uppercase tracking-wider text-white/50">Simulation</span>
              <span className="mt-0.5 block text-sm font-bold text-violet-300">Shadow Mode</span>
            </div>
          </div>
        </div>
      </div>

      {statusMessage && (
        <Alert tone="success" onDismiss={() => setStatusMessage(null)}>
          {statusMessage}
        </Alert>
      )}
      {errorMessage && (
        <Alert tone="danger" onDismiss={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      )}

      <div className="flex flex-col gap-3 border-b border-line pb-4 sm:flex-row sm:items-center sm:justify-between">
        <SegmentedControl
          value={activeTab}
          onChange={setActiveTab}
          items={[
            { value: "rules", label: "Active policies", icon: ShieldAlert, count: policies.length },
            { value: "simulator", label: "Simulator", icon: Sliders },
            { value: "editor", label: "YAML editor", icon: FileCode },
          ]}
        />
        <Button variant="secondary" size="sm" icon={RotateCcw} onClick={handleReload}>
          Reload disk file
        </Button>
      </div>

      {/* Rules */}
      {activeTab === "rules" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {policies.map((policy, index) => (
              <Card key={index} interactive className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-xs font-bold text-accent">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate font-mono text-sm font-bold text-ink">{policy.name}</h3>
                      <span className="text-[11px] font-medium text-ink-subtle">
                        SpEL dynamic expression
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <Badge tone={ACTION_TONES[policy.action] || "neutral"}>
                      {ACTION_LABELS[policy.action] || policy.action}
                    </Badge>
                    <span className="rounded-md border border-line bg-surface-2 px-1.5 py-0.5 text-[10px] font-bold text-ink-muted">
                      Risk {policy.riskScore}/10
                    </span>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-line bg-surface-2 p-3">
                  <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-accent">
                    Rule condition
                  </span>
                  <code className="break-all font-mono text-[11px] font-semibold text-violet-700 dark:text-violet-300">
                    {policy.condition}
                  </code>
                </div>

                <div className="mt-3 flex items-start gap-2 text-xs text-ink-muted">
                  <Sparkles size={14} className="mt-0.5 shrink-0 text-accent" />
                  <span className="leading-relaxed">
                    <strong className="text-ink">Enforced recommendation:</strong>{" "}
                    {policy.recommendation}
                  </span>
                </div>
              </Card>
            ))}
          </div>

          <Card className="flex flex-col items-start justify-between gap-3 p-4 sm:flex-row sm:items-center">
            <div className="flex items-start gap-2 text-xs text-ink-muted">
              <Zap size={16} className="mt-0.5 shrink-0 text-accent" />
              <span>
                All rules execute synchronously during invoice risk assessment inside{" "}
                <code className="font-mono text-[11px] text-accent">
                  InvoiceService.createInvoice()
                </code>
                .
              </span>
            </div>
            <Button variant="ghost" size="sm" iconRight={ArrowRight} onClick={() => setActiveTab("simulator")}>
              Test rules now
            </Button>
          </Card>
        </div>
      )}

      {/* Simulator */}
      {activeTab === "simulator" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <Card className="lg:col-span-6">
            <CardBody className="space-y-4">
              <CardHeader
                icon={Sliders}
                title="Policy simulation testbench"
                subtitle="Adjust synthetic invoice signals to see which YAML rules trigger."
              />

              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                {SIM_FIELDS.map((field) => (
                  <Field key={field.key} label={field.label} hint={field.hint}>
                    <Input
                      type="number"
                      step={field.step}
                      min={field.min}
                      max={field.max}
                      value={simForm[field.key]}
                      onChange={(event) =>
                        setSimForm({ ...simForm, [field.key]: event.target.value })
                      }
                    />
                  </Field>
                ))}
              </div>

              <Checkbox
                id="simulateDuplicate"
                label="Simulate duplicate invoice hash match"
                checked={simForm.isDuplicate}
                onChange={(event) => setSimForm({ ...simForm, isDuplicate: event.target.checked })}
              />

              <Button
                icon={Play}
                loading={simulating}
                onClick={handleSimulate}
                fullWidth
              >
                {simulating ? "Evaluating SpEL expressions…" : "Run policy evaluation"}
              </Button>
            </CardBody>
          </Card>

          <Card className="flex flex-col lg:col-span-6">
            <CardBody className="flex flex-1 flex-col">
              <CardHeader
                icon={CheckCircle2}
                title="Evaluation outcome"
                subtitle="Live response from /api/policies/evaluate"
                action={
                  simResult && (
                    <Badge tone={ACTION_TONES[simResult.primaryAction] || "neutral"}>
                      {simResult.primaryAction}
                    </Badge>
                  )
                }
              />

              {simResult ? (
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-line bg-surface-2 p-3.5 text-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-ink-subtle">
                        Assigned risk score
                      </span>
                      <div className="num text-2xl font-extrabold text-ink">
                        {simResult.highestRiskScore || 0}
                        <span className="text-xs font-normal text-ink-subtle"> / 10</span>
                      </div>
                    </div>
                    <div className="rounded-xl border border-line bg-surface-2 p-3.5 text-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-ink-subtle">
                        Rules triggered
                      </span>
                      <div className="num text-2xl font-extrabold text-accent">
                        {simResult.triggeredPolicies?.length || 0}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-ink">
                      Matched policy rules
                    </h4>
                    {simResult.triggeredPolicies && simResult.triggeredPolicies.length > 0 ? (
                      <div className="space-y-2">
                        {simResult.triggeredPolicies.map((match, index) => (
                          <div
                            key={index}
                            className="rounded-xl border border-warning/25 bg-warning/[0.07] p-3 text-xs"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 font-bold">
                              <span className="font-mono text-ink">{match.name}</span>
                              <Badge tone="warning" size="sm">
                                {match.action} · risk {match.riskScore}
                              </Badge>
                            </div>
                            <code className="mt-1 block break-all font-mono text-[11px] text-ink-muted">
                              {match.condition}
                            </code>
                            <p className="mt-1.5 font-medium leading-relaxed text-ink">
                              ↳ {match.recommendation}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 rounded-xl border border-success/25 bg-success/10 p-3.5 text-xs font-semibold text-success">
                        <CheckCircle2 size={16} />
                        No policy violations detected — invoice cleared for standard processing.
                      </div>
                    )}
                  </div>

                  {simResult.recommendations && simResult.recommendations.length > 0 && (
                    <div>
                      <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-ink">
                        Synthesised recommendations
                      </h4>
                      <ul className="space-y-1.5">
                        {simResult.recommendations.map((recommendation, index) => (
                          <li
                            key={index}
                            className="flex items-start gap-2 rounded-lg border border-line bg-surface-2 p-2.5 text-xs text-ink"
                          >
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                            <span className="leading-relaxed">{recommendation}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-4 flex flex-1 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line-strong bg-surface-2 p-8 text-center text-xs text-ink-subtle">
                  <Sliders size={24} className="opacity-40" />
                  Configure the inputs and run an evaluation to inspect the result.
                </div>
              )}

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 font-mono text-[10px] text-ink-subtle">
                <span>Evaluated in &lt; 2 ms via Spring SpEL</span>
                <span>Stateless & thread-safe</span>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Editor */}
      {activeTab === "editor" && (
        <Card>
          <CardBody className="space-y-4">
            <CardHeader
              icon={FileCode}
              title="Direct YAML editor"
              subtitle="Saving validates the syntax and flushes the Spring cache."
              action={
                <>
                  <Button variant="secondary" size="sm" icon={copied ? Check : Copy} onClick={handleCopyYaml}>
                    {copied ? "Copied" : "Copy YAML"}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={Play}
                    loading={shadowLoading}
                    onClick={handleShadowSimulation}
                    title="Simulate proposed YAML rules against all live invoices without saving"
                  >
                    {shadowLoading ? "Simulating…" : "Run shadow dry-run"}
                  </Button>
                  <Button size="sm" icon={Save} loading={saving} onClick={handleSaveYaml}>
                    {saving ? "Saving…" : "Save & hot reload"}
                  </Button>
                </>
              }
            />

            <Textarea
              value={rawYaml}
              onChange={(event) => setRawYaml(event.target.value)}
              rows={16}
              spellCheck="false"
              aria-label="Decision policies YAML"
              className="font-mono text-xs leading-relaxed"
            />

            <div className="flex items-start gap-2 rounded-xl border border-violet-500/25 bg-violet-500/[0.07] p-3.5 text-xs">
              <Sparkles size={16} className="mt-0.5 shrink-0 text-accent" />
              <div className="space-y-1">
                <p className="font-semibold text-ink">Supported SpEL evaluation variables</p>
                <p className="break-words font-mono text-[11px] text-ink-muted">
                  #confidence (0.0–1.0) · #predicted_spend · #budget · #risk_score (0–10) · #expense ·
                  #average · #is_duplicate (boolean) · #department
                </p>
              </div>
            </div>

            {shadowResult && (
              <div className="rounded-2xl border border-line bg-surface-2 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/15 text-accent">
                      <Play size={14} />
                    </span>
                    <h4 className="text-sm font-bold text-ink">
                      Shadow Dry-Run Impact Analysis (Live Invoices)
                    </h4>
                  </div>
                  <Button variant="ghost" size="xs" onClick={() => setShadowResult(null)}>
                    Clear analysis
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-xl border border-line bg-surface p-3 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-ink-subtle">
                      Live Invoices Evaluated
                    </span>
                    <div className="num text-xl font-extrabold text-ink mt-0.5">
                      {shadowResult.totalEvaluated}
                    </div>
                  </div>
                  <div className="rounded-xl border border-line bg-surface p-3 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-ink-subtle">
                      Invoices Triggered
                    </span>
                    <div className="num text-xl font-extrabold text-accent mt-0.5">
                      {shadowResult.impactedCount}
                    </div>
                  </div>
                  <div className="rounded-xl border border-line bg-surface p-3 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-ink-subtle">
                      Review / Holds
                    </span>
                    <div className="num text-xl font-extrabold text-warning mt-0.5">
                      {shadowResult.flaggedCount + shadowResult.escalatedCount}
                    </div>
                  </div>
                  <div className="rounded-xl border border-line bg-surface p-3 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-ink-subtle">
                      Total Capital Held
                    </span>
                    <div className="num text-xl font-extrabold text-danger mt-0.5">
                      ₹{Number(shadowResult.totalHeldAmount || 0).toLocaleString()}
                    </div>
                  </div>
                </div>

                {shadowResult.impactedInvoices && shadowResult.impactedInvoices.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-ink">
                      Invoices that would be impacted by candidate rules:
                    </span>
                    <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                      {shadowResult.impactedInvoices.map((inv, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between rounded-xl border border-line bg-surface p-2.5 text-xs"
                        >
                          <div className="space-y-0.5">
                            <span className="font-mono font-bold text-ink">{inv.invoiceNumber}</span>
                            <span className="text-ink-subtle"> · {inv.vendorName} ({inv.department})</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {inv.matchedPolicies?.map((p, pIdx) => (
                                <span
                                  key={pIdx}
                                  className="rounded bg-accent/10 px-1.5 py-0.2 font-mono text-[10px] font-semibold text-accent"
                                >
                                  {p}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="text-right space-y-1">
                            <span className="num font-bold text-ink block">₹{inv.amount?.toLocaleString()}</span>
                            <Badge tone={ACTION_TONES[inv.primaryAction] || "neutral"} size="sm">
                              {inv.primaryAction}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      <p className="flex items-center gap-1.5 text-2xs text-ink-subtle">
        <AlertTriangle size={12} />
        Policy edits apply to every subsequent invoice evaluation — changes take effect immediately.
      </p>
    </div>
  );
}
