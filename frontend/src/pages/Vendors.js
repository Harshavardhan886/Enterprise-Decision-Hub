import React, { useEffect, useMemo, useState } from "react";
import { AlertCircle, Building2, Filter, ShieldAlert, TrendingUp } from "lucide-react";
import api from "../services/api";
import RiskBadge from "../components/RiskBadge";
import Alert from "../components/ui/Alert";
import Badge from "../components/ui/Badge";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import PageHeader, { MetaPill } from "../components/ui/PageHeader";
import StatCard from "../components/ui/StatCard";
import { FilterChips } from "../components/ui/Tabs";
import { Table, TBody, Td, Th, THead, Tr } from "../components/ui/Table";

const ERR = "Cannot reach the backend. Make sure it is running on port 8080.";

const RISK_TONES = { HIGH: "danger", MEDIUM: "warning", LOW: "success" };

export default function Vendors() {
  const [vendors, setVendors] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [error, setError] = useState(null);

  useEffect(() => {
    document.title = "EDH — Vendor Risk Intelligence";
  }, []);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    const url = filter === "ALL" ? "/vendors" : `/vendors/risk/${filter}`;

    api
      .get(url)
      .then((res) => {
        if (!cancelled) setVendors(res.data || []);
      })
      .catch(() => {
        if (!cancelled) setError(ERR);
      });

    return () => {
      cancelled = true;
    };
  }, [filter]);

  const summary = useMemo(() => {
    const high = vendors.filter((v) => v.riskLevel === "HIGH").length;
    const flagged = vendors.reduce((total, v) => total + (v.flaggedInvoices || 0), 0);
    const invoices = vendors.reduce((total, v) => total + (v.totalInvoices || 0), 0);
    const flagRate = invoices > 0 ? Math.round((flagged / invoices) * 100) : 0;
    return { high, flagged, invoices, flagRate };
  }, [vendors]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operations"
        title="Vendor Risk Intelligence"
        description="Continuous supplier risk profiling, duplicate invoice ratios and anomaly monitoring."
        actions={<MetaPill label="Suppliers" value={vendors.length} />}
      />

      {error && <Alert tone="danger">{error}</Alert>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Suppliers tracked" value={vendors.length} icon={Building2} />
        <StatCard label="High risk" value={summary.high} icon={ShieldAlert} tone="danger" />
        <StatCard label="Flagged invoices" value={summary.flagged} icon={AlertCircle} tone="warning" />
        <StatCard
          label="Portfolio flag rate"
          value={`${summary.flagRate}%`}
          sub={`${summary.invoices} invoices evaluated`}
          icon={TrendingUp}
          tone="purple"
        />
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wider text-ink-subtle">
            <Filter size={13} />
            Risk level
          </span>
          <FilterChips
            value={filter}
            onChange={setFilter}
            items={["ALL", "LOW", "MEDIUM", "HIGH"]}
          />
        </div>
      </Card>

      <Card className="overflow-hidden">
        <Table>
          <THead>
            <Th>Vendor</Th>
            <Th className="text-right">Invoices</Th>
            <Th className="text-right">Flagged</Th>
            <Th>Flag rate</Th>
            <Th>Risk level</Th>
            <Th className="text-right">Risk score</Th>
          </THead>
          <TBody>
            {vendors.map((vendor) => {
              const flagRate =
                vendor.totalInvoices > 0
                  ? Math.round((vendor.flaggedInvoices / vendor.totalInvoices) * 100)
                  : 0;

              return (
                <Tr key={vendor.id}>
                  <Td>
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                        <Building2 size={15} />
                      </span>
                      <span className="font-semibold text-ink">{vendor.vendorName}</span>
                    </div>
                  </Td>
                  <Td className="num text-right font-semibold">{vendor.totalInvoices}</Td>
                  <Td className="num text-right">
                    {vendor.flaggedInvoices > 0 ? (
                      <span className="font-bold text-danger">{vendor.flaggedInvoices}</span>
                    ) : (
                      <span className="text-ink-subtle">0</span>
                    )}
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-3">
                        <div
                          className={
                            flagRate > 20
                              ? "h-full rounded-full bg-danger"
                              : flagRate > 0
                              ? "h-full rounded-full bg-warning"
                              : "h-full rounded-full bg-success"
                          }
                          style={{ width: `${Math.min(flagRate, 100)}%` }}
                        />
                      </div>
                      <span
                        className={`num text-xs font-semibold ${
                          flagRate > 20 ? "text-danger" : "text-ink-muted"
                        }`}
                      >
                        {flagRate}%
                      </span>
                    </div>
                  </Td>
                  <Td>
                    <Badge tone={RISK_TONES[vendor.riskLevel] || "neutral"} dot>
                      {vendor.riskLevel || "UNKNOWN"}
                    </Badge>
                  </Td>
                  <Td className="text-right">
                    <div className="flex justify-end">
                      <RiskBadge score={vendor.riskScore} />
                    </div>
                  </Td>
                </Tr>
              );
            })}
          </TBody>
        </Table>

        {vendors.length === 0 && !error && (
          <EmptyState
            icon={Building2}
            title={filter === "ALL" ? "No vendors evaluated yet" : `No ${filter.toLowerCase()} risk vendors`}
            description={
              filter === "ALL"
                ? "Vendors appear here automatically once their first invoice is processed."
                : "Try a different risk level to see the rest of the supplier book."
            }
          />
        )}
      </Card>
    </div>
  );
}
