import React, { useEffect, useState } from "react";
import {
  Download,
  Receipt,
  Wallet,
  Bell,
  Building2,
  ClipboardList,
} from "lucide-react";
import api from "../services/api";

function downloadCSV(filename, rows, headers) {
  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      headers
        .map((h) => {
          const val = r[h] !== undefined && r[h] !== null ? String(r[h]) : "";
          return val.includes(",") ? `"${val}"` : val;
        })
        .join(",")
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
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
    api.get("/invoices").then((r) => setInvoices(r.data)).catch(() => setError("Could not load invoices"));
    api.get("/budgets").then((r) => setBudgets(r.data)).catch(() => setError("Could not load budgets"));
    api.get("/alerts").then((r) => setAlerts(r.data)).catch(() => setError("Could not load alerts"));
    api.get("/vendors").then((r) => setVendors(r.data)).catch(() => setError("Could not load vendors"));
    api.get("/audit-logs").then((r) => setAuditLogs(r.data)).catch(() => setError("Could not load audit logs"));
  }, []);

  const reports = [
    {
      title: "Invoice Ledger Report",
      description: `${invoices.length} invoices · ${invoices.filter((i) => i.duplicateFlag).length} duplicate flags · ${invoices.filter((i) => (i.riskScore || 0) >= 5).length} high risk`,
      icon: Receipt,
      borderGlow: "from-indigo-500 to-[#7342E2]",
      btnClass: "bg-[#7342E2] hover:bg-[#6028d9] shadow-[#7342E2]/25",
      action: () =>
        downloadCSV(
          "invoices.csv",
          invoices,
          ["invoiceNumber", "vendorName", "department", "amount", "status", "duplicateFlag", "riskScore", "invoiceDate"]
        ),
    },
    {
      title: "Budget Allocation Report",
      description: `${budgets.length} tracked departments · ${budgets.filter((b) => b.overspendFlag).length} overspending alerts`,
      icon: Wallet,
      borderGlow: "from-amber-500 to-orange-500",
      btnClass: "bg-amber-600 hover:bg-amber-700 shadow-amber-600/25",
      action: () =>
        downloadCSV(
          "budgets.csv",
          budgets,
          ["department", "month", "year", "allocatedAmount", "spentAmount", "overspendPercentage", "overspendFlag"]
        ),
    },
    {
      title: "Security & Policy Violations",
      description: `${alerts.length} total alerts · ${alerts.filter((a) => a.riskScore >= 7).length} critical · ${alerts.filter((a) => a.status !== "RESOLVED").length} open`,
      icon: Bell,
      borderGlow: "from-red-500 to-rose-500",
      btnClass: "bg-red-600 hover:bg-red-700 shadow-red-600/25",
      action: () =>
        downloadCSV(
          "alerts.csv",
          alerts,
          ["type", "department", "riskScore", "status", "message", "recommendation"]
        ),
    },
    {
      title: "Vendor Risk Assessment",
      description: `${vendors.length} evaluated vendors · ${vendors.filter((v) => v.riskLevel === "HIGH").length} high risk entities`,
      icon: Building2,
      borderGlow: "from-[#7342E2] to-violet-500",
      btnClass: "bg-violet-700 hover:bg-violet-800 shadow-violet-700/25",
      action: () =>
        downloadCSV(
          "vendors.csv",
          vendors,
          ["vendorName", "totalInvoices", "flaggedInvoices", "riskLevel", "riskScore"]
        ),
    },
    {
      title: "Compliance & Audit Trail",
      description: `${auditLogs.length} immutable transaction audit records logged`,
      icon: ClipboardList,
      borderGlow: "from-emerald-500 to-teal-500",
      btnClass: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25",
      action: () =>
        downloadCSV(
          "audit-log.csv",
          auditLogs,
          ["action", "entityType", "entityId", "performedBy", "details", "timestamp"]
        ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#192837]/8">
        <div>
          <h1
            className="text-2xl sm:text-3xl font-extrabold text-[#192837] tracking-tight"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Compliance & Analytical Exports
          </h1>
          <p className="text-sm text-[#192837]/70 mt-1">
            Generate, filter, and export clean CSV reports across governance modules.
          </p>
        </div>
      </div>

      {/* Reports Grid */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
          ⚠ {error} — CSV exports may be empty.
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {reports.map((r) => {
          const Icon = r.icon;
          return (
            <div
              key={r.title}
              className="relative overflow-hidden bg-white/95 rounded-2xl border border-[#192837]/8 p-6 shadow-[0_4px_20px_-4px_rgba(25,40,55,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(115,66,226,0.10)] transition-all flex flex-col justify-between"
            >
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${r.borderGlow}`} />
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#F5F5F3] flex items-center justify-center text-[#192837] mb-4">
                  <Icon size={20} />
                </div>
                <h3
                  className="text-base font-bold text-[#192837]"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {r.title}
                </h3>
                <p className="text-xs text-[#192837]/70 mt-1.5 leading-relaxed mb-6">
                  {r.description}
                </p>
              </div>

              <button
                onClick={r.action}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${r.btnClass}`}
              >
                <Download size={14} />
                <span>Export CSV</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
