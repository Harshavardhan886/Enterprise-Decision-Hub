import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Search,
  Check,
  RotateCcw,
  Sparkles,
  RefreshCw,
  Zap,
  Radio,
} from "lucide-react";
import api from "../services/api";
import RiskBadge from "../components/RiskBadge";
import LoadingSkeleton from "../components/LoadingSkeleton";

const STATUS_PILLS = {
  SENT: "bg-red-50 text-red-700 border-red-200",
  ACKNOWLEDGED: "bg-amber-50 text-amber-700 border-amber-200",
  RESOLVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ACTIVE"); // ACTIVE, ALL, RESOLVED
  const [searchQuery, setSearchQuery] = useState("");
  const [autoPolling, setAutoPolling] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [expandedSummaryId, setExpandedSummaryId] = useState(null);
  const autoPollingRef = useRef(autoPolling);

  useEffect(() => {
    autoPollingRef.current = autoPolling;
  }, [autoPolling]);

  const load = useCallback((silent = false) => {
    if (!silent) setError(null);
    api
      .get("/alerts")
      .then((res) => {
        setAlerts(res.data);
        setLastUpdated(new Date());
      })
      .catch(() => {
        if (!silent) setError("Cannot reach backend. Make sure it is running on port 8080.");
      })
      .finally(() => {
        if (!silent) setLoading(false);
      });
  }, []);

  useEffect(() => {
    document.title = "EDH — Security & Governance Alerts";
    load(false);

    // Real-Time Updates: 5s live polling for instant alert dispatch
    const interval = setInterval(() => {
      if (autoPollingRef.current) {
        load(true);
      }
    }, 5000);

    const handleExternalUpdate = () => load(true);
    window.addEventListener("alerts-updated", handleExternalUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener("alerts-updated", handleExternalUpdate);
    };
  }, [load]);

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/alerts/${id}/status`, { status });
      load(true);
      window.dispatchEvent(new Event("alerts-updated"));
    } catch {
      setError("Failed to update alert status.");
    }
  };

  const activeCount = alerts.filter((a) => a.status !== "RESOLVED").length;
  const resolvedCount = alerts.filter((a) => a.status === "RESOLVED").length;

  const filteredAlerts = alerts.filter((a) => {
    const matchesTab =
      activeTab === "ALL"
        ? true
        : activeTab === "ACTIVE"
        ? a.status !== "RESOLVED"
        : a.status === "RESOLVED";

    const matchesSearch =
      (a.message || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.department || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.type || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.sentryLevel || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.executiveSummary || "").toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#192837]/8">
        <div>
          <div className="flex items-center gap-2.5">
            <h1
              className="text-2xl sm:text-3xl font-extrabold text-[#192837] tracking-tight"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Security & Governance Alerts
            </h1>
            {autoPolling && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                Live Polling (5s)
              </span>
            )}
          </div>
          <p className="text-sm text-[#192837]/70 mt-1">
            Real-time policy breach warnings, duplicate anomalies, surplus flags, and LLM executive summaries.
          </p>
        </div>

        {/* Real-Time Controls & Counters */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoPolling(!autoPolling)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              autoPolling
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200"
            }`}
            title="Toggle 5-second automatic real-time polling"
          >
            <Radio size={14} className={autoPolling ? "text-emerald-600 animate-pulse" : "text-gray-400"} />
            <span>{autoPolling ? "Live Sync ON" : "Live Sync Paused"}</span>
          </button>

          <button
            onClick={() => load(false)}
            className="p-2 rounded-xl bg-white hover:bg-gray-50 border border-[#192837]/10 text-[#192837]/70 hover:text-[#7342E2] transition-colors cursor-pointer"
            title={`Last sync: ${lastUpdated.toLocaleTimeString()}`}
          >
            <RefreshCw size={15} />
          </button>

          <span className="text-xs font-semibold text-[#192837]/60 bg-white px-3 py-1.5 rounded-full border border-[#192837]/10 shadow-xs">
            Active Alerts: <span className="text-red-600 font-bold">{activeCount}</span>
          </span>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/95 p-3.5 rounded-2xl border border-[#192837]/8 shadow-xs">
        <div className="flex items-center gap-1.5 bg-[#F5F5F3] p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setActiveTab("ACTIVE")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "ACTIVE"
                ? "bg-white text-[#7342E2] shadow-xs"
                : "text-[#192837]/60 hover:text-[#192837]"
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            onClick={() => setActiveTab("RESOLVED")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "RESOLVED"
                ? "bg-white text-emerald-700 shadow-xs"
                : "text-[#192837]/60 hover:text-[#192837]"
            }`}
          >
            Resolved ({resolvedCount})
          </button>
          <button
            onClick={() => setActiveTab("ALL")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "ALL"
                ? "bg-white text-[#192837] shadow-xs"
                : "text-[#192837]/60 hover:text-[#192837]"
            }`}
          >
            All Alerts ({alerts.length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#192837]/40" />
          <input
            type="text"
            placeholder="Search violation, dept, sentry level..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 bg-[#F5F5F3] rounded-xl text-xs text-[#192837] outline-none border border-transparent focus:border-[#7342E2] transition-all"
          />
        </div>
      </div>

      {/* Alerts Table */}
      <div className="bg-white/95 rounded-2xl border border-[#192837]/8 shadow-[0_4px_20px_-4px_rgba(25,40,55,0.05)] overflow-hidden">
        {loading ? (
          <LoadingSkeleton rows={5} cols={7} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F5F3]/80 border-b border-[#192837]/8 text-[#192837]/60 uppercase font-semibold text-[11px] tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Type & Classification</th>
                  <th className="px-5 py-3.5">Department</th>
                  <th className="px-5 py-3.5">Sentry Level & Risk</th>
                  <th className="px-5 py-3.5">Violation / Details</th>
                  <th className="px-5 py-3.5">AI Recommendation</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#192837]/5 text-[#192837]">
                {filteredAlerts.map((a) => {
                  const statusPill = STATUS_PILLS[a.status] || "bg-gray-50 text-gray-700 border-gray-200";
                  const isSurplus = a.type === "SURPLUS_EXPENSE";
                  const isExpanded = expandedSummaryId === a.id;

                  return (
                    <React.Fragment key={a.id}>
                      <tr className="hover:bg-[#7342E2]/[0.02] transition-colors">
                        <td className="px-5 py-4 font-bold text-[#192837]">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5">
                              {isSurplus ? (
                                <Zap size={15} className="text-purple-600 flex-shrink-0" />
                              ) : (
                                <ShieldAlert size={15} className="text-amber-500 flex-shrink-0" />
                              )}
                              <span>{a.type}</span>
                            </div>
                            {isSurplus && (
                              <span className="inline-block text-[10px] font-bold text-purple-700 bg-purple-100 border border-purple-200 px-1.5 py-0.5 rounded w-fit">
                                Surplus Variance
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 font-medium text-[#192837]/70">
                          {a.department}
                        </td>
                        <td className="px-5 py-4">
                          <RiskBadge score={a.riskScore} sentryLevel={a.sentryLevel} />
                        </td>
                        <td className="px-5 py-4 font-semibold text-[#192837] max-w-xs">
                          <div>
                            <p>{a.message}</p>
                            {a.executiveSummary && (
                              <button
                                onClick={() => setExpandedSummaryId(isExpanded ? null : a.id)}
                                className="mt-1 text-[11px] font-bold text-[#7342E2] hover:text-[#5c2ecc] flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <Sparkles size={11} />
                                <span>{isExpanded ? "Hide Executive Briefing" : "View LLM Executive Briefing"}</span>
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-[#192837]/80 max-w-xs font-medium">
                          {a.recommendation || "Verify transaction records"}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold border ${statusPill}`}>
                            {a.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          {a.status !== "RESOLVED" ? (
                            <div className="inline-flex items-center gap-2 justify-end">
                              <button
                                onClick={() => updateStatus(a.id, "RESOLVED")}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-semibold text-xs transition-colors cursor-pointer"
                                title="Mark Alert Resolved"
                              >
                                <Check size={14} />
                                <span>Resolve</span>
                              </button>
                              <select
                                value={a.status}
                                onChange={(e) => updateStatus(a.id, e.target.value)}
                                className="px-2 py-1 text-xs rounded-xl border border-[#192837]/10 bg-[#F5F5F3] focus:bg-white focus:border-[#7342E2] outline-none cursor-pointer"
                              >
                                <option value="SENT">Sent</option>
                                <option value="ACKNOWLEDGED">Ack</option>
                                <option value="RESOLVED">Resolved</option>
                              </select>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-2 justify-end">
                              <span className="text-emerald-600 font-semibold inline-flex items-center gap-1 text-[11px]">
                                <CheckCircle2 size={14} />
                                <span>Resolved</span>
                              </span>
                              <button
                                onClick={() => updateStatus(a.id, "SENT")}
                                className="p-1 rounded-lg hover:bg-amber-50 text-[#192837]/40 hover:text-amber-600 transition-colors cursor-pointer"
                                title="Re-open Alert"
                              >
                                <RotateCcw size={13} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>

                      {/* Expandable LLM Advisory Executive Briefing */}
                      {isExpanded && a.executiveSummary && (
                        <tr className="bg-[#7342E2]/[0.03] border-b border-[#7342E2]/15">
                          <td colSpan={7} className="px-6 py-3.5">
                            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-[#7342E2]/25 shadow-xs">
                              <div className="w-8 h-8 rounded-lg bg-[#7342E2]/10 text-[#7342E2] flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Sparkles size={16} />
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-[#7342E2] uppercase tracking-wider">
                                    LLM Advisory Executive Briefing
                                  </span>
                                  <span className="text-[10px] font-semibold text-[#192837]/50 bg-gray-100 px-2 py-0.5 rounded-full">
                                    Gemini / OpenAI Advisory Layer
                                  </span>
                                </div>
                                <p className="text-xs text-[#192837]/90 leading-relaxed font-medium">
                                  {a.executiveSummary}
                                </p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
                {filteredAlerts.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-[#192837]/50">
                      <Bell size={32} className="mx-auto mb-2 opacity-30" />
                      <p className="font-semibold text-sm text-[#192837]">No alerts in this view</p>
                      <p className="text-xs text-[#192837]/60 mt-1">
                        All monitored channels and policy triggers are operating within normal parameters.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
