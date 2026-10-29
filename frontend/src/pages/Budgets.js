import React, { useEffect, useState } from "react";
import {
  Wallet,
  PlusCircle,
  Trash2,
  AlertCircle,
} from "lucide-react";
import api from "../services/api";
import ConfirmModal from "../components/ConfirmModal";

const ERR = "Cannot reach backend. Make sure it is running on port 8080.";

export default function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const currentYear = new Date().getFullYear();
  const [form, setForm] = useState({
    department: "Finance",
    month: new Date().toLocaleString("default", { month: "long" }),
    year: currentYear,
    allocatedAmount: "",
    spentAmount: "",
  });
  const [spendEdit, setSpendEdit] = useState({});

  const load = () => {
    setError(null);
    api
      .get("/budgets")
      .then((res) => setBudgets(res.data))
      .catch(() => setError(ERR));
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.allocatedAmount) return;
    setLoading(true);
    try {
      await api.post("/budgets", {
        ...form,
        allocatedAmount: parseFloat(form.allocatedAmount),
        spentAmount: parseFloat(form.spentAmount || 0),
        year: parseInt(form.year),
      });
      setForm({
        department: "Finance",
        month: new Date().toLocaleString("default", { month: "long" }),
        year: currentYear,
        allocatedAmount: "",
        spentAmount: "",
      });
      load();
    } catch {
      setError(ERR);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSpend = async (id) => {
    const val = spendEdit[id];
    if (val === undefined || val === "") return;
    try {
      await api.put(`/budgets/${id}/spend`, { spentAmount: parseFloat(val) });
      setSpendEdit((prev) => {
        const n = { ...prev };
        delete n[id];
        return n;
      });
      load();
    } catch {
      setError(ERR);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/budgets/${id}`);
      setDeleteTarget(null);
      load();
    } catch {
      setError(ERR);
    }
  };

  return (
    <div className="space-y-6">
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Budget"
        message={`Are you sure you want to delete the ${deleteTarget?.department} budget for ${deleteTarget?.month} ${deleteTarget?.year}? This cannot be undone.`}
        confirmText="Delete Budget"
        isDestructive={true}
        onConfirm={() => handleDelete(deleteTarget?.id)}
        onCancel={() => setDeleteTarget(null)}
      />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#192837]/8">
        <div>
          <h1
            className="text-2xl sm:text-3xl font-extrabold text-[#192837] tracking-tight"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Budget Governance
          </h1>
          <p className="text-sm text-[#192837]/70 mt-1">
            Track department allocations, monitor spend ratios, and prevent overspending.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#192837]/60 bg-white px-3 py-1.5 rounded-full border border-[#192837]/10 shadow-xs">
            Allocated Budgets: <span className="text-[#192837] font-bold">{budgets.length}</span>
          </span>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Add Budget Card */}
      <div className="bg-white/95 rounded-2xl border border-[#192837]/8 p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(25,40,55,0.05)]">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-[#7342E2]/10 text-[#7342E2] flex items-center justify-center">
            <PlusCircle size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#192837]">Allocate Department Budget</h2>
            <p className="text-xs text-[#192837]/60">Establish governance limits for automated spend tracking</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5 items-end">
          <div>
            <label className="block text-xs font-semibold text-[#192837] uppercase tracking-wider mb-1">
              Department
            </label>
            <select
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-[#F5F5F3]/80 hover:bg-[#F5F5F3] focus:bg-white rounded-xl border border-[#192837]/10 focus:border-[#7342E2] focus:ring-4 focus:ring-[#7342E2]/15 text-[#192837] text-xs outline-none transition-all"
            >
              <option>Finance</option>
              <option>HR</option>
              <option>Operations</option>
              <option>Inventory</option>
              <option>Engineering</option>
              <option>Marketing</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#192837] uppercase tracking-wider mb-1">
              Month
            </label>
            <select
              value={form.month}
              onChange={(e) => setForm({ ...form, month: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-[#F5F5F3]/80 hover:bg-[#F5F5F3] focus:bg-white rounded-xl border border-[#192837]/10 focus:border-[#7342E2] focus:ring-4 focus:ring-[#7342E2]/15 text-[#192837] text-xs outline-none transition-all"
            >
              {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#192837] uppercase tracking-wider mb-1">
              Year
            </label>
            <input
              type="number"
              value={form.year}
              onChange={(e) => setForm({ ...form, year: e.target.value })}
              required
              className="w-full px-3.5 py-2.5 bg-[#F5F5F3]/80 hover:bg-[#F5F5F3] focus:bg-white rounded-xl border border-[#192837]/10 focus:border-[#7342E2] focus:ring-4 focus:ring-[#7342E2]/15 text-[#192837] text-xs outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#192837] uppercase tracking-wider mb-1">
              Allocated (₹)
            </label>
            <input
              type="number"
              placeholder="100000"
              value={form.allocatedAmount}
              onChange={(e) => setForm({ ...form, allocatedAmount: e.target.value })}
              required
              className="w-full px-3.5 py-2.5 bg-[#F5F5F3]/80 hover:bg-[#F5F5F3] focus:bg-white rounded-xl border border-[#192837]/10 focus:border-[#7342E2] focus:ring-4 focus:ring-[#7342E2]/15 text-[#192837] text-xs outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#192837] uppercase tracking-wider mb-1">
              Initial Spent (₹)
            </label>
            <input
              type="number"
              placeholder="0"
              value={form.spentAmount}
              onChange={(e) => setForm({ ...form, spentAmount: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-[#F5F5F3]/80 hover:bg-[#F5F5F3] focus:bg-white rounded-xl border border-[#192837]/10 focus:border-[#7342E2] focus:ring-4 focus:ring-[#7342E2]/15 text-[#192837] text-xs outline-none transition-all"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-white shadow-md shadow-[#7342E2]/25 hover:brightness-105 transition-all cursor-pointer disabled:opacity-60 flex items-center justify-center gap-1.5"
              style={{ backgroundColor: "#7342E2" }}
            >
              <PlusCircle size={14} />
              <span>{loading ? "Allocating..." : "Save Budget"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Budgets Table */}
      <div className="bg-white/95 rounded-2xl border border-[#192837]/8 shadow-[0_4px_20px_-4px_rgba(25,40,55,0.05)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5F5F3]/80 border-b border-[#192837]/8 text-[#192837]/60 uppercase font-semibold text-[11px] tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Department</th>
                <th className="px-5 py-3.5">Period</th>
                <th className="px-5 py-3.5">Allocated</th>
                <th className="px-5 py-3.5">Spent</th>
                <th className="px-5 py-3.5">Remaining</th>
                <th className="px-5 py-3.5 w-48">Utilisation</th>
                <th className="px-5 py-3.5">Update Spend</th>
                <th className="px-5 py-3.5 text-right">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#192837]/5 text-[#192837]">
              {budgets.map((b) => {
                const percent = b.allocatedAmount > 0 ? Math.round((b.spentAmount / b.allocatedAmount) * 100) : 0;
                const isOver = percent > 100;
                const remaining = (b.allocatedAmount || 0) - (b.spentAmount || 0);

                return (
                  <tr key={b.id} className="hover:bg-[#7342E2]/[0.02] transition-colors">
                    <td className="px-5 py-4 font-bold text-[#192837]">{b.department}</td>
                    <td className="px-5 py-4 text-[#192837]/70 font-medium">{b.month} {b.year}</td>
                    <td className="px-5 py-4 font-semibold text-[#192837]">₹{b.allocatedAmount?.toLocaleString()}</td>
                    <td className="px-5 py-4 font-semibold text-[#192837]">₹{b.spentAmount?.toLocaleString()}</td>
                    <td className="px-5 py-4 font-semibold">
                      <span className={remaining < 0 ? "text-red-600" : "text-emerald-600"}>
                        ₹{remaining.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-[#F5F5F3] h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isOver ? "bg-red-500" : percent > 80 ? "bg-amber-500" : "bg-[#7342E2]"
                            }`}
                            style={{ width: `${Math.min(percent, 100)}%` }}
                          />
                        </div>
                        <span className={`text-[11px] font-bold ${isOver ? "text-red-600" : "text-[#192837]"}`}>
                          {percent}%
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          placeholder="New amount"
                          value={spendEdit[b.id] ?? ""}
                          onChange={(e) => setSpendEdit({ ...spendEdit, [b.id]: e.target.value })}
                          className="w-24 px-2 py-1 text-xs rounded-lg border border-[#192837]/10 bg-[#F5F5F3] focus:bg-white focus:border-[#7342E2] outline-none"
                        />
                        <button
                          onClick={() => handleUpdateSpend(b.id)}
                          className="px-2.5 py-1 bg-[#7342E2]/10 text-[#7342E2] hover:bg-[#7342E2] hover:text-white rounded-lg text-xs font-semibold transition-colors"
                        >
                          Set
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => setDeleteTarget(b)}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                        title="Delete budget"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {budgets.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-[#192837]/50">
                    <Wallet size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="font-medium">No budgets created yet</p>
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
