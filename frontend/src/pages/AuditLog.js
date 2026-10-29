import React, { useEffect, useState } from "react";
import {
  ClipboardList,
  Filter,
  AlertCircle,
  User,
} from "lucide-react";
import api from "../services/api";

const ERR = "Cannot reach backend. Make sure it is running on port 8080.";

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [error, setError] = useState(null);

  const entityTypes = ["ALL", "Invoice", "Budget", "Alert", "Vendor"];

  const load = (type) => {
    setError(null);
    const url = type === "ALL" ? "/audit-logs" : `/audit-logs/entity/${type}`;
    api
      .get(url)
      .then((res) => setLogs(res.data))
      .catch(() => setError(ERR));
  };

  useEffect(() => {
    load(filter);
  }, [filter]);

  const actionBadge = (action) => {
    if (action?.includes("CREATED")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (action?.includes("DELETED") || action?.includes("REJECTED"))
      return "bg-red-50 text-red-700 border-red-200";
    if (action?.includes("UPDATED") || action?.includes("APPROVED"))
      return "bg-indigo-50 text-indigo-700 border-indigo-200";
    return "bg-gray-50 text-gray-700 border-gray-200";
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
            Immutable Audit Trail
          </h1>
          <p className="text-sm text-[#192837]/70 mt-1">
            Complete trace of governance events, invoice validations, and administrative actions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#192837]/60 bg-white px-3 py-1.5 rounded-full border border-[#192837]/10 shadow-xs">
            Events: <span className="text-[#192837] font-bold">{logs.length}</span>
          </span>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="bg-white/95 rounded-2xl border border-[#192837]/8 p-4 shadow-[0_4px_20px_-4px_rgba(25,40,55,0.05)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter size={15} className="text-[#192837]/50 ml-1" />
          <span className="text-xs font-semibold text-[#192837]/60 uppercase tracking-wider mr-2">
            Filter Entity:
          </span>
          <div className="flex items-center gap-1.5">
            {entityTypes.map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer select-none ${
                  filter === type
                    ? "bg-[#7342E2] text-white shadow-sm shadow-[#7342E2]/25"
                    : "bg-[#F5F5F3] text-[#192837]/70 hover:bg-[#192837]/10"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white/95 rounded-2xl border border-[#192837]/8 shadow-[0_4px_20px_-4px_rgba(25,40,55,0.05)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5F5F3]/80 border-b border-[#192837]/8 text-[#192837]/60 uppercase font-semibold text-[11px] tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-5 py-3.5">Action</th>
                <th className="px-5 py-3.5">Entity Type</th>
                <th className="px-5 py-3.5">Entity Reference</th>
                <th className="px-5 py-3.5">Actor</th>
                <th className="px-5 py-3.5">Event Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#192837]/5 text-[#192837]">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-[#7342E2]/[0.02] transition-colors">
                  <td className="px-5 py-4 text-[#192837]/60 font-mono whitespace-nowrap">
                    {log.timestamp ? new Date(log.timestamp).toLocaleString() : ""}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold border ${actionBadge(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-semibold text-[#192837]">
                    {log.entityType}
                  </td>
                  <td className="px-5 py-4 font-mono text-[11px] text-[#192837]/60">
                    {log.entityId ? `${log.entityId.slice(0, 10)}...` : "—"}
                  </td>
                  <td className="px-5 py-4 font-medium flex items-center gap-1.5">
                    <User size={13} className="text-[#7342E2]" />
                    <span>{log.performedBy || "System"}</span>
                  </td>
                  <td className="px-5 py-4 text-[#192837]/80 max-w-sm">
                    {log.details}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && !error && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-[#192837]/50">
                    <ClipboardList size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="font-medium">No audit logs recorded yet</p>
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
