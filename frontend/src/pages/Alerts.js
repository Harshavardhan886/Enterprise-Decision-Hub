import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Bell,
  Check,
  CheckCircle2,
  RotateCcw,
  Radio,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  Zap,
} from "lucide-react";
import api from "../services/api";
import RiskBadge from "../components/RiskBadge";
import Alert from "../components/ui/Alert";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import LoadingSkeleton from "../components/ui/Skeleton";
import PageHeader, { MetaPill } from "../components/ui/PageHeader";
import { SearchInput } from "../components/ui/Field";
import { SegmentedControl } from "../components/ui/Tabs";
import { Table, TBody, Td, Th, THead, Tr } from "../components/ui/Table";

const STATUS_TONES = {
  SENT: "danger",
  ACKNOWLEDGED: "warning",
  RESOLVED: "success",
};

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ACTIVE");
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
        setAlerts(res.data || []);
        setLastUpdated(new Date());
      })
      .catch(() => {
        if (!silent) setError("Cannot reach the backend. Make sure it is running on port 8080.");
      })
      .finally(() => {
        if (!silent) setLoading(false);
      });
  }, []);

  useEffect(() => {
    document.title = "EDH — Security & Governance Alerts";
    load(false);

    const interval = setInterval(() => {
      if (autoPollingRef.current) load(true);
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
  const criticalCount = alerts.filter((a) => (a.riskScore || 0) >= 7 && a.status !== "RESOLVED").length;

  const filteredAlerts = alerts.filter((alert) => {
    const matchesTab =
      activeTab === "ALL"
        ? true
        : activeTab === "ACTIVE"
        ? alert.status !== "RESOLVED"
        : alert.status === "RESOLVED";

    const query = searchQuery.toLowerCase();
    const matchesSearch =
      (alert.message || "").toLowerCase().includes(query) ||
      (alert.department || "").toLowerCase().includes(query) ||
      (alert.type || "").toLowerCase().includes(query) ||
      (alert.sentryLevel || "").toLowerCase().includes(query) ||
      (alert.executiveSummary || "").toLowerCase().includes(query);

    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Governance"
        title="Security & Governance Alerts"
        description="Real-time policy breaches, duplicate anomalies, surplus flags and AI executive briefings."
        badge={
          autoPolling && (
            <Badge tone="success" dot size="sm">
              Live · 5s
            </Badge>
          )
        }
        actions={
          <>
            <Button
              variant={autoPolling ? "subtle" : "secondary"}
              size="sm"
              icon={Radio}
              onClick={() => setAutoPolling(!autoPolling)}
              title="Toggle 5-second automatic polling"
            >
              {autoPolling ? "Live sync on" : "Live sync paused"}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              iconOnly
              icon={RefreshCw}
              onClick={() => load(false)}
              title={`Last sync: ${lastUpdated.toLocaleTimeString()}`}
              aria-label="Refresh alerts"
            />
            <MetaPill label="Active" value={activeCount} tone="danger" />
            <MetaPill label="Critical" value={criticalCount} tone="purple" />
          </>
        }
      />

      {error && <Alert tone="danger" onDismiss={() => setError(null)}>{error}</Alert>}

      <Card className="flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center sm:justify-between">
        <SegmentedControl
          value={activeTab}
          onChange={setActiveTab}
          items={[
            { value: "ACTIVE", label: "Active", count: activeCount },
            { value: "RESOLVED", label: "Resolved", count: resolvedCount },
            { value: "ALL", label: "All", count: alerts.length },
          ]}
        />
        <SearchInput
          icon={Search}
          placeholder="Search violation, department, sentry level…"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          className="w-full sm:w-80"
          aria-label="Search alerts"
        />
      </Card>

      <Card className="overflow-hidden">
        {loading ? (
          <LoadingSkeleton rows={5} cols={6} />
        ) : (
          <Table>
            <THead>
              <Th>Type</Th>
              <Th>Department</Th>
              <Th>Sentry / risk</Th>
              <Th>Violation detail</Th>
              <Th>AI recommendation</Th>
              <Th>Status</Th>
              <Th className="text-right">Actions</Th>
            </THead>
            <TBody>
              {filteredAlerts.map((alert) => {
                const isSurplus = alert.type === "SURPLUS_EXPENSE";
                const isExpanded = expandedSummaryId === alert.id;

                return (
                  <React.Fragment key={alert.id}>
                    <Tr>
                      <Td>
                        <div className="flex flex-col gap-1.5">
                          <span className="inline-flex items-center gap-1.5 font-bold">
                            {isSurplus ? (
                              <Zap size={15} className="shrink-0 text-violet-500" />
                            ) : (
                              <ShieldAlert size={15} className="shrink-0 text-warning" />
                            )}
                            {alert.type}
                          </span>
                          {isSurplus && (
                            <Badge tone="purple" size="sm" className="w-fit">
                              Surplus variance
                            </Badge>
                          )}
                        </div>
                      </Td>
                      <Td className="font-medium text-ink-muted">{alert.department}</Td>
                      <Td>
                        <RiskBadge score={alert.riskScore} sentryLevel={alert.sentryLevel} />
                      </Td>
                      <Td className="max-w-[210px]">
                        <p className="text-xs font-medium leading-relaxed text-ink">{alert.message}</p>
                        {alert.executiveSummary && (
                          <button
                            type="button"
                            onClick={() => setExpandedSummaryId(isExpanded ? null : alert.id)}
                            className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-accent transition-colors hover:text-accent-hover"
                          >
                            <Sparkles size={11} />
                            {isExpanded ? "Hide executive briefing" : "View AI executive briefing"}
                          </button>
                        )}
                      </Td>
                      <Td className="max-w-[210px] text-xs leading-relaxed text-ink-muted">
                        {alert.recommendation || "Verify transaction records"}
                      </Td>
                      <Td>
                        <Badge tone={STATUS_TONES[alert.status] || "neutral"} dot>
                          {alert.status}
                        </Badge>
                      </Td>
                      <Td className="text-right">
                        {alert.status !== "RESOLVED" ? (
                          <div className="inline-flex flex-col items-end gap-1.5">
                            <Button
                              variant="success"
                              size="xs"
                              icon={Check}
                              onClick={() => updateStatus(alert.id, "RESOLVED")}
                            >
                              Resolve
                            </Button>
                            <select
                              value={alert.status}
                              onChange={(event) => updateStatus(alert.id, event.target.value)}
                              aria-label="Change alert status"
                              className="field field-sm w-[104px] cursor-pointer py-1 pr-2 text-[11px]"
                            >
                              <option value="SENT">Sent</option>
                              <option value="ACKNOWLEDGED">Ack</option>
                              <option value="RESOLVED">Resolved</option>
                            </select>
                          </div>
                        ) : (
                          <div className="inline-flex items-center justify-end gap-2">
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-success">
                              <CheckCircle2 size={14} />
                              Resolved
                            </span>
                            <button
                              type="button"
                              onClick={() => updateStatus(alert.id, "SENT")}
                              title="Re-open alert"
                              aria-label="Re-open alert"
                              className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-ink-subtle transition-colors hover:bg-warning/10 hover:text-warning"
                            >
                              <RotateCcw size={13} />
                            </button>
                          </div>
                        )}
                      </Td>
                    </Tr>

                    {isExpanded && alert.executiveSummary && (
                      <tr className="border-t border-accent/15 bg-accent/[0.04]">
                        <Td colSpan={7} className="px-5 py-4">
                          <div className="flex items-start gap-3 rounded-xl border border-accent/25 bg-surface p-4">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                              <Sparkles size={16} />
                            </span>
                            <div className="min-w-0 space-y-1.5">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-accent">
                                  AI advisory executive briefing
                                </span>
                                <Badge tone="neutral" size="sm">
                                  Advisory layer
                                </Badge>
                              </div>
                              <p className="text-xs leading-relaxed text-ink">
                                {alert.executiveSummary}
                              </p>
                            </div>
                          </div>
                        </Td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </TBody>
          </Table>
        )}

        {!loading && filteredAlerts.length === 0 && (
          <EmptyState
            icon={Bell}
            title="No alerts in this view"
            description="All monitored channels and policy triggers are operating within normal parameters."
          />
        )}
      </Card>
    </div>
  );
}
