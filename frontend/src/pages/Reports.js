import React, { useEffect, useState } from "react";
import {
  Bell,
  Building2,
  ClipboardList,
  Download,
  FileSpreadsheet,
  Receipt,
  Wallet,
} from "lucide-react";
import api from "../services/api";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";

function downloadCSV(filename, rows, headers) {
  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((header) => {
          const value = row[header] !== undefined && row[header] !== null ? String(row[header]) : "";
          return value.includes(",") ? `"${value}"` : value;
        })
        .join(",")
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export default function Reports() {
  const [invoices, setInvoices] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.title = "EDH — Compliance Exports";
  }, []);

  useEffect(() => {
    api.get("/invoices").then((r) => setInvoices(r.data)).catch(() => setError("Could not load invoices"));
    api.get("/budgets").then((r) => setBudgets(r.data)).catch(() => setError("Could not load budgets"));
    api.get("/alerts").then((r) => setAlerts(r.data)).catch(() => setError("Could not load alerts"));
    api.get("/vendors").then((r) => setVendors(r.data)).catch(() => setError("Could not load vendors"));
    api.get("/audit-logs").then((r) => setAuditLogs(r.data)).catch(() => setError("Could not load audit logs"));
  }, []);

  const reports = [
    {
      title: "Invoice Ledger",
      description: "Full invoice register with duplicate flags, risk scores and approval status.",
      meta: [
        { label: "Rows", value: invoices.length },
        { label: "Duplicates", value: invoices.filter((i) => i.duplicateFlag).length },
        { label: "High risk", value: invoices.filter((i) => (i.riskScore || 0) >= 5).length },
      ],
      icon: Receipt,
      tone: "from-indigo-500 to-accent",
      action: () =>
        downloadCSV("invoices.csv", invoices, [
          "invoiceNumber",
          "vendorName",
          "department",
          "amount",
          "status",
          "duplicateFlag",
          "riskScore",
          "invoiceDate",
        ]),
    },
    {
      title: "Budget Allocation",
      description: "Departmental allocations, realised spend and overspend variance flags.",
      meta: [
        { label: "Budgets", value: budgets.length },
        { label: "Overspending", value: budgets.filter((b) => b.overspendFlag).length },
      ],
      icon: Wallet,
      tone: "from-amber-500 to-orange-500",
      action: () =>
        downloadCSV("budgets.csv", budgets, [
          "department",
          "month",
          "year",
          "allocatedAmount",
          "spentAmount",
          "overspendPercentage",
          "overspendFlag",
        ]),
    },
    {
      title: "Security & Policy Violations",
      description: "Every alert raised by the policy engine, ML ensemble and surplus detector.",
      meta: [
        { label: "Total", value: alerts.length },
        { label: "Critical", value: alerts.filter((a) => a.riskScore >= 7).length },
        { label: "Open", value: alerts.filter((a) => a.status !== "RESOLVED").length },
      ],
      icon: Bell,
      tone: "from-red-500 to-rose-500",
      action: () =>
        downloadCSV("alerts.csv", alerts, [
          "type",
          "department",
          "riskScore",
          "status",
          "message",
          "recommendation",
        ]),
    },
    {
      title: "Vendor Risk Assessment",
      description: "Supplier risk levels, invoice volumes and flagged-invoice exposure.",
      meta: [
        { label: "Vendors", value: vendors.length },
        { label: "High risk", value: vendors.filter((v) => v.riskLevel === "HIGH").length },
      ],
      icon: Building2,
      tone: "from-violet-500 to-fuchsia-500",
      action: () =>
        downloadCSV("vendors.csv", vendors, [
          "vendorName",
          "totalInvoices",
          "flaggedInvoices",
          "riskLevel",
          "riskScore",
        ]),
    },
    {
      title: "Compliance & Audit Trail",
      description: "Immutable record of every governance action performed in the platform.",
      meta: [
        { label: "Records", value: auditLogs.length },
        { label: "Retention", value: "Permanent" },
      ],
      icon: ClipboardList,
      tone: "from-emerald-500 to-teal-500",
      action: () =>
        downloadCSV("audit-log.csv", auditLogs, [
          "action",
          "entityType",
          "entityId",
          "performedBy",
          "details",
          "timestamp",
        ]),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Insights"
        title="Compliance & Analytical Exports"
        description="Generate clean, audit-ready CSV extracts across every governance module."
      />

      {error && (
        <Alert tone="warning" title="Some datasets could not be loaded">
          {error} — exported CSV files may be incomplete.
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <Card
              key={report.title}
              interactive
              className="flex flex-col overflow-hidden p-5"
            >
              <div className={`mb-4 h-1 w-12 rounded-full bg-gradient-to-r ${report.tone}`} />
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2 text-ink">
                <Icon size={19} />
              </span>
              <h3 className="mt-3 text-sm font-bold text-ink">{report.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-ink-muted">{report.description}</p>

              <dl className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-surface-2 p-2.5">
                {report.meta.map((item) => (
                  <div key={item.label} className="text-center">
                    <dt className="text-[10px] font-semibold uppercase tracking-wider text-ink-subtle">
                      {item.label}
                    </dt>
                    <dd className="num mt-0.5 text-sm font-bold text-ink">{item.value}</dd>
                  </div>
                ))}
              </dl>

              <Button
                variant="secondary"
                size="sm"
                icon={Download}
                fullWidth
                onClick={report.action}
                className="mt-4"
              >
                Export CSV
              </Button>
            </Card>
          );
        })}
      </div>

      <p className="flex items-center gap-1.5 text-2xs text-ink-subtle">
        <FileSpreadsheet size={12} />
        Exports are generated in the browser from live data — no records leave your environment.
      </p>
    </div>
  );
}
