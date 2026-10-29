import React, { useEffect, useState } from "react";
import {
  Building2,
  Filter,
  AlertCircle,
} from "lucide-react";
import api from "../services/api";
import RiskBadge from "../components/RiskBadge";

const ERR = "Cannot reach backend. Make sure it is running on port 8080.";

export default function Vendors() {
  const [vendors, setVendors] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [error, setError] = useState(null);

  const load = (level) => {
    setError(null);
    const url = level === "ALL" ? "/vendors" : `/vendors/risk/${level}`;
    api
      .get(url)
      .then((res) => setVendors(res.data))
      .catch(() => setError(ERR));
  };

  useEffect(() => {
    load(filter);
  }, [filter]);

  const riskBadgeStyle = (level) => {
    if (level === "HIGH") return "bg-red-50 text-red-700 border-red-200";
    if (level === "MEDIUM") return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#192837]/8">
        <div>
          <h1
            className="text-2xl sm:text-3xl font-extrabold text-[#192837] tracking-tight"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Vendor Risk Intelligence
          </h1>
          <p className="text-sm text-[#192837]/70 mt-1">
            Continuous supplier risk profiling, duplicate invoice ratios, and anomaly monitoring.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#192837]/60 bg-white px-3 py-1.5 rounded-full border border-[#192837]/10 shadow-xs">
            Suppliers: <span className="text-[#192837] font-bold">{vendors.length}</span>
          </span>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Tabs Card */}
      <div className="bg-white/95 rounded-2xl border border-[#192837]/8 p-4 shadow-[0_4px_20px_-4px_rgba(25,40,55,0.05)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter size={15} className="text-[#192837]/50 ml-1" />
          <span className="text-xs font-semibold text-[#192837]/60 uppercase tracking-wider mr-2">
            Filter Risk:
          </span>
          <div className="flex items-center gap-1.5">
            {["ALL", "LOW", "MEDIUM", "HIGH"].map((level) => (
              <button
                key={level}
                onClick={() => setFilter(level)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer select-none ${
                  filter === level
                    ? "bg-[#7342E2] text-white shadow-sm shadow-[#7342E2]/25"
                    : "bg-[#F5F5F3] text-[#192837]/70 hover:bg-[#192837]/10"
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Vendors Table */}
      <div className="bg-white/95 rounded-2xl border border-[#192837]/8 shadow-[0_4px_20px_-4px_rgba(25,40,55,0.05)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5F5F3]/80 border-b border-[#192837]/8 text-[#192837]/60 uppercase font-semibold text-[11px] tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Vendor Name</th>
                <th className="px-5 py-3.5">Total Invoices</th>
                <th className="px-5 py-3.5">Flagged Invoices</th>
                <th className="px-5 py-3.5">Flag Rate</th>
                <th className="px-5 py-3.5">Risk Level</th>
                <th className="px-5 py-3.5 text-right">Risk Assessment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#192837]/5 text-[#192837]">
              {vendors.map((v) => {
                const flagRate = v.totalInvoices > 0 ? Math.round((v.flaggedInvoices / v.totalInvoices) * 100) : 0;
                return (
                  <tr key={v.id} className="hover:bg-[#7342E2]/[0.02] transition-colors">
                    <td className="px-5 py-4 font-bold text-[#192837] flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#7342E2]/10 text-[#7342E2] flex items-center justify-center">
                        <Building2 size={14} />
                      </div>
                      <span>{v.vendorName}</span>
                    </td>
                    <td className="px-5 py-4 font-semibold">{v.totalInvoices}</td>
                    <td className="px-5 py-4">
                      {v.flaggedInvoices > 0 ? (
                        <span className="font-bold text-red-600">{v.flaggedInvoices}</span>
                      ) : (
                        <span className="text-[#192837]/50">0</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`font-semibold ${flagRate > 20 ? "text-red-600" : "text-[#192837]"}`}>
                        {flagRate}%
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold border ${riskBadgeStyle(v.riskLevel)}`}>
                        {v.riskLevel}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <RiskBadge score={v.riskScore} />
                    </td>
                  </tr>
                );
              })}
              {vendors.length === 0 && !error && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-[#192837]/50">
                    <Building2 size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="font-medium">No vendors evaluated yet — they appear automatically when invoices are processed</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
