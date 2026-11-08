import React, { useEffect, useState } from "react";
import { AlertCircle, ClipboardList, Filter, ShieldCheck, User } from "lucide-react";
import api from "../services/api";
import Alert from "../components/ui/Alert";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import PageHeader, { MetaPill } from "../components/ui/PageHeader";
import { FilterChips } from "../components/ui/Tabs";
import { Table, TBody, Td, Th, THead, Tr } from "../components/ui/Table";

const ERR = "Cannot reach the backend. Make sure it is running on port 8080.";
const ENTITY_TYPES = ["ALL", "Invoice", "Budget", "Alert", "Vendor"];

/** Maps an audit action string onto a semantic badge tone. */
function actionTone(action = "") {
  if (action.includes("CREATED")) return "success";
  if (action.includes("DELETED") || action.includes("REJECTED")) return "danger";
  if (action.includes("UPDATED") || action.includes("APPROVED")) return "info";
  return "neutral";
}

function formatTimestamp(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
}

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [error, setError] = useState(null);
  const [ledgerStatus, setLedgerStatus] = useState(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    document.title = "EDH — Audit Trail";
    checkLedgerIntegrity();
  }, []);

  const checkLedgerIntegrity = () => {
    setVerifying(true);
    api
      .get("/audit-logs/verify")
      .then((res) => setLedgerStatus(res.data))
      .catch(() => {})
      .finally(() => setVerifying(false));
  };

  useEffect(() => {
    let cancelled = false;
    setError(null);
    const url = filter === "ALL" ? "/audit-logs" : `/audit-logs/entity/${filter}`;

    api
      .get(url)
      .then((res) => {
        if (!cancelled) setLogs(res.data || []);
      })
      .catch(() => {
        if (!cancelled) setError(ERR);
      });

    return () => {
      cancelled = true;
    };
  }, [filter]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Governance"
        title="Immutable Audit Trail"
        description="A complete, append-only trace of governance events, invoice validations and administrative actions."
        actions={<MetaPill label="Events" value={logs.length} />}
      />

      {error && <Alert tone="danger">{error}</Alert>}

      {ledgerStatus && (
        <Card className="p-4 bg-gradient-to-r from-emerald-500/[0.08] via-transparent to-transparent border-emerald-500/25">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck size={18} />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-ink">
                    Cryptographic Ledger Integrity: {ledgerStatus.status === "VERIFIED" ? "VERIFIED (AUTHENTIC)" : "TAMPER DETECTED"}
                  </h4>
                  <Badge tone={ledgerStatus.status === "VERIFIED" ? "success" : "danger"} size="sm">
                    {ledgerStatus.status}
                  </Badge>
                </div>
                <p className="text-[11px] text-ink-subtle mt-0.5">
                  {ledgerStatus.algorithm} · {ledgerStatus.totalRecordsVerified} blocks cryptographically verified · {ledgerStatus.compliance}
                </p>
              </div>
            </div>
            <Button variant="secondary" size="xs" onClick={checkLedgerIntegrity} loading={verifying}>
              {verifying ? "Verifying…" : "Re-verify ledger chain"}
            </Button>
          </div>
        </Card>
      )}

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wider text-ink-subtle">
            <Filter size={13} />
            Entity
          </span>
          <FilterChips value={filter} onChange={setFilter} items={ENTITY_TYPES} />
        </div>
      </Card>

      <Card className="overflow-hidden">
        <Table>
          <THead>
            <Th>Timestamp</Th>
            <Th>Action</Th>
            <Th>Entity</Th>
            <Th>Reference</Th>
            <Th>Actor</Th>
            <Th>Block Hash</Th>
            <Th>Details</Th>
          </THead>
          <TBody>
            {logs.map((log) => (
              <Tr key={log.id}>
                <Td className="whitespace-nowrap font-mono text-xs text-ink-muted">
                  {formatTimestamp(log.timestamp)}
                </Td>
                <Td>
                  <Badge tone={actionTone(log.action)}>{log.action}</Badge>
                </Td>
                <Td className="font-semibold">{log.entityType}</Td>
                <Td>
                  {log.entityId ? (
                    <code
                      title={log.entityId}
                      className="rounded-md bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-ink-muted"
                    >
                      {String(log.entityId).slice(0, 10)}…
                    </code>
                  ) : (
                    <span className="text-ink-subtle">—</span>
                  )}
                </Td>
                <Td>
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                    <User size={13} className="text-accent" />
                    {log.performedBy || "System"}
                  </span>
                </Td>
                <Td>
                  {log.hash ? (
                    <code
                      title={`SHA-256 Hash: ${log.hash}\nPrevious Hash: ${log.previousHash || 'Genesis'}`}
                      className="rounded-md bg-accent/10 px-1.5 py-0.5 font-mono text-[10px] text-accent font-semibold"
                    >
                      {String(log.hash).slice(0, 10)}…
                    </code>
                  ) : (
                    <span className="text-ink-subtle text-xs">—</span>
                  )}
                </Td>
                <Td className="max-w-sm text-xs leading-relaxed text-ink-muted">{log.details}</Td>
              </Tr>
            ))}
          </TBody>
        </Table>

        {logs.length === 0 && !error && (
          <EmptyState
            icon={ClipboardList}
            title="No audit events recorded"
            description="Governance actions such as invoice submissions, status changes and alert resolutions are logged here automatically."
          />
        )}
      </Card>

      <p className="flex items-center gap-1.5 text-2xs text-ink-subtle">
        <AlertCircle size={12} />
        Audit records are append-only and cannot be edited or deleted from the console.
      </p>
    </div>
  );
}
