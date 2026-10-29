import React, { useState, useEffect } from "react";
import {
  FileCode,
  Play,
  RotateCcw,
  Save,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Zap,
  Sliders,
  Check,
  Copy,
} from "lucide-react";
import api from "../services/api";

const ACTION_COLORS = {
  FLAG_FOR_REVIEW: "bg-amber-50 text-amber-700 border-amber-200",
  SEND_ALERT: "bg-rose-50 text-rose-700 border-rose-200",
  ESCALATE: "bg-purple-50 text-purple-700 border-purple-200",
  ALLOW: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const ACTION_BADGES = {
  FLAG_FOR_REVIEW: "Review Required",
  SEND_ALERT: "Disbursement Alert",
  ESCALATE: "Executive Escalation",
  ALLOW: "Auto Approved",
};

export default function Policies() {
  const [policies, setPolicies] = useState([]);
  const [rawYaml, setRawYaml] = useState("");
  const [activeTab, setActiveTab] = useState("rules"); // "rules" | "editor" | "simulator"
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [copied, setCopied] = useState(false);

  // Simulator State
  const [simForm, setSimForm] = useState({
    confidence: 0.90,
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

  const fetchPolicies = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await api.get("/policies");
      setPolicies(res.data.policies || []);

      const yamlRes = await api.get("/policies/raw");
      setRawYaml(yamlRes.data.yaml || "");
    } catch (err) {
      setErrorMessage("Failed to load policy engine data. Ensure backend is running.");
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
      setStatusMessage("Policies updated successfully & reloaded into Spring Cache!");
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err) {
      setErrorMessage(err.response?.data?.error || "Invalid YAML format. Please correct syntax.");
    } finally {
      setSaving(false);
    }
  };

  const handleReload = async () => {
    try {
      const res = await api.post("/policies/reload");
      setPolicies(res.data.policies || []);
      setStatusMessage("Policies dynamically reloaded from disk cache!");
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
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
    } catch (err) {
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-10 h-10 border-3 border-[#7342E2]/20 border-t-[#7342E2] rounded-full animate-spin" />
        <p className="text-sm font-medium text-[#192837]/60">Loading YAML Decision Policies...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 4-Layer Architecture Context Bar */}
      <div className="bg-gradient-to-r from-[#192837] via-[#2A3F55] to-[#192837] text-white rounded-2xl p-4 sm:p-5 shadow-lg border border-white/10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#7342E2] text-white">
                4-Layer Architecture
              </span>
              <span className="text-xs text-white/70 font-mono">
                Layer 2: API Gateway &amp; Business Rules Engine
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black mt-1 tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
              YAML Decision Policy Engine
            </h1>
            <p className="text-xs text-white/75 mt-1 max-w-2xl leading-relaxed">
              Configurable Spring Expression Language (SpEL) policies loaded from{" "}
              <code className="bg-white/15 px-1.5 py-0.5 rounded font-mono text-[11px] text-violet-200">
                policies/decision-policies.yaml
              </code>
              . Cached via Spring <code className="bg-white/15 px-1.5 py-0.5 rounded font-mono text-[11px] text-violet-200">@Cacheable("policies")</code> with zero-downtime hot reloading.
            </p>
          </div>

          {/* Architecture Nodes Status */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
            <div className="bg-white/10 rounded-xl p-2.5 border border-white/10 text-center">
              <span className="text-white/60 block text-[9px] uppercase font-bold">Layer 1: UI</span>
              <span className="font-semibold text-emerald-300 flex items-center justify-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> React 19
              </span>
            </div>
            <div className="bg-white/15 rounded-xl p-2.5 border border-[#7342E2]/40 text-center shadow-inner">
              <span className="text-violet-200 block text-[9px] uppercase font-bold">Layer 2: Business</span>
              <span className="font-bold text-white flex items-center justify-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400"></span> Spring SpEL
              </span>
            </div>
            <div className="bg-white/10 rounded-xl p-2.5 border border-white/10 text-center">
              <span className="text-white/60 block text-[9px] uppercase font-bold">Layer 3: ML</span>
              <span className="font-semibold text-sky-300 flex items-center justify-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span> RF + XGBoost
              </span>
            </div>
            <div className="bg-white/10 rounded-xl p-2.5 border border-white/10 text-center">
              <span className="text-white/60 block text-[9px] uppercase font-bold">Layer 4: Data</span>
              <span className="font-semibold text-amber-300 flex items-center justify-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> DB + Cache
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Status Notifications */}
      {statusMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <AlertTriangle size={16} className="text-rose-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Tabs and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#192837]/10">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("rules")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "rules"
                ? "bg-[#7342E2] text-white shadow-sm"
                : "bg-white text-[#192837]/70 hover:bg-[#192837]/5 border border-[#192837]/10"
            }`}
          >
            <ShieldAlert size={14} />
            <span>Active Policies ({policies.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("simulator")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "simulator"
                ? "bg-[#7342E2] text-white shadow-sm"
                : "bg-white text-[#192837]/70 hover:bg-[#192837]/5 border border-[#192837]/10"
            }`}
          >
            <Sliders size={14} />
            <span>Policy Testbench / Simulator</span>
          </button>
          <button
            onClick={() => setActiveTab("editor")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "editor"
                ? "bg-[#7342E2] text-white shadow-sm"
                : "bg-white text-[#192837]/70 hover:bg-[#192837]/5 border border-[#192837]/10"
            }`}
          >
            <FileCode size={14} />
            <span>YAML Code Editor</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReload}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-[#192837]/10 text-[#192837]/80 hover:bg-[#192837]/5 transition-all flex items-center gap-1.5 cursor-pointer"
            title="Reload from disk file"
          >
            <RotateCcw size={13} />
            <span>Reload Disk File</span>
          </button>
        </div>
      </div>

      {/* TAB 1: ACTIVE POLICIES CARDS */}
      {activeTab === "rules" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {policies.map((pol, idx) => {
              const actionClass = ACTION_COLORS[pol.action] || "bg-gray-50 text-gray-700 border-gray-200";
              const actionLabel = ACTION_BADGES[pol.action] || pol.action;

              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-[#192837]/8 p-5 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#7342E2]/10 text-[#7342E2] flex items-center justify-center font-bold text-xs">
                        #{idx + 1}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-[#192837] font-mono">
                          {pol.name}
                        </h3>
                        <span className="text-[11px] text-[#192837]/50 font-medium">
                          SpEL Dynamic Expression
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${actionClass}`}>
                        {actionLabel}
                      </span>
                      <span className="px-2 py-1 rounded-lg text-xs font-black bg-[#192837]/5 text-[#192837] border border-[#192837]/10">
                        Risk: {pol.riskScore}/10
                      </span>
                    </div>
                  </div>

                  {/* Condition Code Snippet */}
                  <div className="mt-4 p-3 rounded-xl bg-[#192837]/3 border border-[#192837]/8 font-mono text-xs text-[#192837]">
                    <span className="text-[10px] text-[#7342E2] uppercase font-bold tracking-wider block mb-1">
                      Rule Condition (SpEL)
                    </span>
                    <code className="text-violet-900 font-bold">{pol.condition}</code>
                  </div>

                  {/* Recommendation */}
                  <div className="mt-3 text-xs text-[#192837]/80 flex items-start gap-2">
                    <Sparkles size={14} className="text-[#7342E2] flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-[#192837]">Enforced Recommendation:</strong>{" "}
                      <span>{pol.recommendation}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Engine Architecture Note */}
          <div className="p-4 rounded-2xl bg-[#F5F5F3] border border-[#192837]/8 text-xs text-[#192837]/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-[#7342E2]" />
              <span>
                All 4 policy rules are executed synchronously during invoice risk assessment inside{" "}
                <code className="font-mono text-[11px] text-[#7342E2]">InvoiceService.createInvoice()</code>.
              </span>
            </div>
            <button
              onClick={() => setActiveTab("simulator")}
              className="font-bold text-[#7342E2] hover:underline flex items-center gap-1 cursor-pointer"
            >
              Test Rules Now <ArrowRight size={13} />
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: POLICY SIMULATOR TESTBENCH */}
      {activeTab === "simulator" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Form */}
          <div className="lg:col-span-6 bg-white rounded-2xl border border-[#192837]/8 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="border-b border-[#192837]/8 pb-3">
              <h3 className="text-base font-bold text-[#192837]" style={{ fontFamily: "var(--font-heading)" }}>
                Policy Simulation Testbench
              </h3>
              <p className="text-xs text-[#192837]/60 mt-0.5">
                Adjust synthetic invoice signals to verify which YAML rules trigger and inspect recommended actions.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#192837]/70 block mb-1">
                  Confidence (0.00 – 1.00)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={simForm.confidence}
                  onChange={(e) => setSimForm({ ...simForm, confidence: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#192837]/15 focus:ring-2 focus:ring-[#7342E2]/30 outline-none"
                />
                <span className="text-[10px] text-[#192837]/50 mt-0.5 block">
                  Triggers duplicate policy when &gt; 0.85
                </span>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#192837]/70 block mb-1">
                  Vendor Risk Score (0 – 10)
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="10"
                  value={simForm.vendorRiskScore}
                  onChange={(e) => setSimForm({ ...simForm, vendorRiskScore: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#192837]/15 focus:ring-2 focus:ring-[#7342E2]/30 outline-none"
                />
                <span className="text-[10px] text-[#192837]/50 mt-0.5 block">
                  Triggers vendor risk policy when &gt; 7
                </span>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#192837]/70 block mb-1">
                  Predicted Spend (₹)
                </label>
                <input
                  type="number"
                  value={simForm.predictedSpend}
                  onChange={(e) => setSimForm({ ...simForm, predictedSpend: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#192837]/15 focus:ring-2 focus:ring-[#7342E2]/30 outline-none"
                />
                <span className="text-[10px] text-[#192837]/50 mt-0.5 block">
                  Compared against budget * 1.1
                </span>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#192837]/70 block mb-1">
                  Allocated Budget (₹)
                </label>
                <input
                  type="number"
                  value={simForm.budget}
                  onChange={(e) => setSimForm({ ...simForm, budget: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#192837]/15 focus:ring-2 focus:ring-[#7342E2]/30 outline-none"
                />
                <span className="text-[10px] text-[#192837]/50 mt-0.5 block">
                  Department baseline budget
                </span>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#192837]/70 block mb-1">
                  Invoice Expense (₹)
                </label>
                <input
                  type="number"
                  value={simForm.expense}
                  onChange={(e) => setSimForm({ ...simForm, expense: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#192837]/15 focus:ring-2 focus:ring-[#7342E2]/30 outline-none"
                />
                <span className="text-[10px] text-[#192837]/50 mt-0.5 block">
                  Triggers surplus policy when &gt; avg * 1.5
                </span>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#192837]/70 block mb-1">
                  Department Average (₹)
                </label>
                <input
                  type="number"
                  value={simForm.average}
                  onChange={(e) => setSimForm({ ...simForm, average: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#192837]/15 focus:ring-2 focus:ring-[#7342E2]/30 outline-none"
                />
                <span className="text-[10px] text-[#192837]/50 mt-0.5 block">
                  Historical average invoice
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-[#192837] cursor-pointer">
                <input
                  type="checkbox"
                  checked={simForm.isDuplicate}
                  onChange={(e) => setSimForm({ ...simForm, isDuplicate: e.target.checked })}
                  className="rounded text-[#7342E2] focus:ring-[#7342E2]"
                />
                <span>Simulate Duplicate Invoice Hash Match</span>
              </label>
            </div>

            <button
              onClick={handleSimulate}
              disabled={simulating}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-[#7342E2] text-white hover:bg-[#5E32C4] shadow-md shadow-[#7342E2]/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Play size={14} />
              <span>{simulating ? "Evaluating SpEL Expressions..." : "Run Policy Evaluation"}</span>
            </button>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-6 bg-white rounded-2xl border border-[#192837]/8 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="border-b border-[#192837]/8 pb-3 mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-[#192837]" style={{ fontFamily: "var(--font-heading)" }}>
                    Evaluation Outcome
                  </h3>
                  <p className="text-xs text-[#192837]/60 mt-0.5">
                    Live response from <code className="font-mono text-[#7342E2]">/api/policies/evaluate</code>
                  </p>
                </div>

                {simResult && (
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-black border ${
                      ACTION_COLORS[simResult.primaryAction] || "bg-gray-50 text-gray-700"
                    }`}
                  >
                    Action: {simResult.primaryAction}
                  </span>
                )}
              </div>

              {simResult ? (
                <div className="space-y-4">
                  {/* Score Highlights */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-[#F5F5F3] border border-[#192837]/8 text-center">
                      <span className="text-[10px] uppercase font-bold text-[#192837]/60 block">
                        Assigned Risk Score
                      </span>
                      <span className="text-2xl font-black text-[#192837]">
                        {simResult.highestRiskScore || 0}
                        <span className="text-xs font-normal text-[#192837]/50"> / 10</span>
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#F5F5F3] border border-[#192837]/8 text-center">
                      <span className="text-[10px] uppercase font-bold text-[#192837]/60 block">
                        Rules Triggered
                      </span>
                      <span className="text-2xl font-black text-[#7342E2]">
                        {simResult.triggeredPolicies?.length || 0}
                      </span>
                    </div>
                  </div>

                  {/* Triggered Policies List */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#192837] mb-2">
                      Matched Policy Rules
                    </h4>
                    {simResult.triggeredPolicies && simResult.triggeredPolicies.length > 0 ? (
                      <div className="space-y-2">
                        {simResult.triggeredPolicies.map((m, i) => (
                          <div
                            key={i}
                            className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/70 text-xs text-amber-950 flex flex-col gap-1"
                          >
                            <div className="flex items-center justify-between font-bold">
                              <span className="font-mono text-amber-900">{m.name}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-200/70 text-amber-900">
                                {m.action} • Risk {m.riskScore}
                              </span>
                            </div>
                            <span className="text-[11px] text-amber-900/80 font-mono">
                              Condition: {m.condition}
                            </span>
                            <span className="text-xs text-amber-950 font-medium mt-1">
                              ↳ {m.recommendation}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald-600" />
                        <span>No policy violations detected. Invoice cleared for standard processing.</span>
                      </div>
                    )}
                  </div>

                  {/* Recommendations */}
                  {simResult.recommendations && simResult.recommendations.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#192837] mb-2">
                        Synthesized Recommendations
                      </h4>
                      <ul className="space-y-1.5 text-xs text-[#192837]/80">
                        {simResult.recommendations.map((rec, idx) => (
                          <li key={idx} className="flex items-start gap-2 bg-[#F5F5F3] p-2.5 rounded-lg border border-[#192837]/5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#7342E2] mt-1.5 flex-shrink-0" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 rounded-2xl bg-[#F5F5F3] border border-dashed border-[#192837]/20 text-center text-xs text-[#192837]/50 flex flex-col items-center justify-center gap-2">
                  <Sliders size={24} className="text-[#192837]/30" />
                  <span>Configure simulation inputs on the left and click "Run Policy Evaluation"</span>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-[#192837]/8 mt-4 text-[11px] text-[#192837]/50 flex justify-between font-mono">
              <span>Evaluated in &lt; 2ms via Spring SpEL</span>
              <span>Stateless &amp; thread-safe</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: YAML CODE EDITOR */}
      {activeTab === "editor" && (
        <div className="bg-white rounded-2xl border border-[#192837]/8 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#192837]/8 pb-3">
            <div>
              <h3 className="text-base font-bold text-[#192837]" style={{ fontFamily: "var(--font-heading)" }}>
                Direct YAML Editor
              </h3>
              <p className="text-xs text-[#192837]/60 mt-0.5">
                Edit rules directly. Saving triggers syntax validation and flushes the Spring Cache.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyYaml}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#192837]/5 hover:bg-[#192837]/10 text-[#192837] transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                <span>{copied ? "Copied" : "Copy YAML"}</span>
              </button>
              <button
                onClick={handleSaveYaml}
                disabled={saving}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-[#7342E2] text-white hover:bg-[#5E32C4] shadow-md shadow-[#7342E2]/25 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Save size={13} />
                <span>{saving ? "Saving & Flushing Cache..." : "Save & Hot Reload"}</span>
              </button>
            </div>
          </div>

          <div className="relative">
            <textarea
              value={rawYaml}
              onChange={(e) => setRawYaml(e.target.value)}
              rows={16}
              spellCheck="false"
              className="w-full p-4 rounded-xl font-mono text-xs text-violet-950 bg-[#FBFBFA] border border-[#192837]/15 focus:ring-2 focus:ring-[#7342E2]/30 outline-none leading-relaxed"
            />
          </div>

          <div className="p-3.5 rounded-xl bg-violet-50/60 border border-violet-200/60 text-xs text-violet-950 flex items-start gap-2">
            <Sparkles size={16} className="text-[#7342E2] flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-violet-900">Supported SpEL Evaluation Variables:</p>
              <p className="font-mono text-[11px] text-violet-800">
                #confidence (0.0–1.0) • #predicted_spend • #budget • #risk_score (0–10) • #expense • #average • #is_duplicate (boolean) • #department
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
