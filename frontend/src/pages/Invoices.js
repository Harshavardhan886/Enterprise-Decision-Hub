import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  Receipt,
  PlusCircle,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  Building2,
  BrainCircuit,
  X,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Cpu,
  Layers,
  Search,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Zap,
  Sliders,
  Radio,
  RefreshCw,
  Scale,
} from "lucide-react";
import api from "../services/api";
import RiskBadge, { computeSentryLevel } from "../components/RiskBadge";
import ConfirmModal from "../components/ConfirmModal";
import LoadingSkeleton from "../components/LoadingSkeleton";

const STATUS_BADGES = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  REJECTED: "bg-red-50 text-red-700 border-red-200",
  FLAGGED: "bg-purple-50 text-[#7342E2] border-[#7342E2]/20",
};

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [error, setError] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sentryFilter, setSentryFilter] = useState("ALL");
  const [surplusFilter, setSurplusFilter] = useState("ALL"); // ALL, SURPLUS_ONLY, DEPT_ONLY, VENDOR_ONLY
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Real-Time Polling State
  const [autoPolling, setAutoPolling] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const autoPollingRef = useRef(autoPolling);

  useEffect(() => {
    autoPollingRef.current = autoPolling;
  }, [autoPolling]);

  // Form State & Validation
  const [form, setForm] = useState({
    invoiceNumber: "",
    vendorName: "",
    department: "Finance",
    amount: "",
    invoiceDate: new Date().toISOString().split("T")[0],
  });
  const [formErrors, setFormErrors] = useState({});

  const load = useCallback((silent = false) => {
    if (!silent) setError(null);
    api
      .get("/invoices")
      .then((res) => {
        setInvoices(res.data);
        setLastUpdated(new Date());
        // Use functional state updater so closing the modal is never reverted by in-flight responses
        setSelectedInvoice((current) => {
          if (!current) return null;
          const updated = res.data.find((inv) => inv.id === current.id);
          return updated || current;
        });
      })
      .catch(() => {
        if (!silent) setError("Cannot reach backend. Make sure it is running on port 8080.");
      })
      .finally(() => {
        if (!silent) setPageLoading(false);
      });
  }, []);

  useEffect(() => {
    document.title = "EDH — Invoices Management";
    load(false);

    // Real-Time Polling: 8s live update loop
    const interval = setInterval(() => {
      if (autoPollingRef.current) {
        load(true);
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [load]);

  // Global ESC key listener to dismiss modal dialogs
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setSelectedInvoice(null);
        setInvoiceToDelete(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const validateForm = () => {
    const errs = {};
    if (!form.invoiceNumber.trim()) errs.invoiceNumber = "Invoice # is required";
    if (!form.vendorName.trim()) errs.vendorName = "Vendor name is required";
    if (!form.amount || isNaN(form.amount) || parseFloat(form.amount) <= 0) {
      errs.amount = "Amount must be a positive number";
    }
    if (!form.invoiceDate) errs.invoiceDate = "Date is required";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const res = await api.post("/invoices", { ...form, amount: parseFloat(form.amount) });
      setForm({
        invoiceNumber: "",
        vendorName: "",
        department: "Finance",
        amount: "",
        invoiceDate: new Date().toISOString().split("T")[0],
      });
      setFormErrors({});
      load(false);
      if (res.data) {
        setSelectedInvoice(res.data);
      }
      window.dispatchEvent(new Event("alerts-updated"));
    } catch (err) {
      const msg = err.response?.data?.message
        ? err.response.data.message
        : err.response?.data?.validationErrors
        ? Object.values(err.response.data.validationErrors).join(", ")
        : "Failed to process invoice";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (inv, newStatus) => {
    try {
      await api.put(`/invoices/${inv.id}`, { ...inv, status: newStatus });
      load(true);
      window.dispatchEvent(new Event("alerts-updated"));
    } catch (err) {
      setError("Failed to update status");
    }
  };

  const handleDelete = async () => {
    if (!invoiceToDelete) return;
    try {
      await api.delete(`/invoices/${invoiceToDelete.id}`);
      setInvoiceToDelete(null);
      load(false);
      window.dispatchEvent(new Event("alerts-updated"));
    } catch (err) {
      setError("Failed to delete invoice");
    }
  };

  // Client-Side Search & Filter Logic with Sentry & Surplus Filter
  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      (inv.invoiceNumber || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.vendorName || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = departmentFilter === "ALL" || inv.department === departmentFilter;
    const matchesStatus = statusFilter === "ALL" || inv.status === statusFilter;

    // Sentry Level matching
    const invSentry = inv.sentryLevel || computeSentryLevel(inv.riskScore || 0);
    const matchesSentry = sentryFilter === "ALL" || invSentry.toUpperCase() === sentryFilter.toUpperCase();

    // Surplus Filter matching (>1.5x dept avg or >2x vendor avg)
    let matchesSurplus = true;
    if (surplusFilter === "SURPLUS_ONLY") {
      matchesSurplus = Boolean(inv.surplusExpenseFlag || inv.vendorSurplusFlag);
    } else if (surplusFilter === "DEPT_ONLY") {
      matchesSurplus = Boolean(inv.surplusExpenseFlag);
    } else if (surplusFilter === "VENDOR_ONLY") {
      matchesSurplus = Boolean(inv.vendorSurplusFlag);
    }

    return matchesSearch && matchesDept && matchesStatus && matchesSentry && matchesSurplus;
  });

  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage) || 1;
  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const surplusCount = invoices.filter((i) => i.surplusExpenseFlag || i.vendorSurplusFlag).length;

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
              Invoices Management
            </h1>
            {autoPolling && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                Live Sync (8s)
              </span>
            )}
          </div>
          <p className="text-sm text-[#192837]/70 mt-1">
            Submit, risk-score with ML & YAML policies, flag surplus expenditures, and govern approvals in real-time.
          </p>
        </div>

        {/* Real-time sync controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoPolling(!autoPolling)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              autoPolling
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200"
            }`}
            title="Toggle 8-second automatic real-time polling"
          >
            <Radio size={13} className={autoPolling ? "text-emerald-600 animate-pulse" : "text-gray-400"} />
            <span>{autoPolling ? "Live Sync ON" : "Live Sync Paused"}</span>
          </button>

          <button
            onClick={() => load(false)}
            className="p-2 rounded-xl bg-white hover:bg-gray-50 border border-[#192837]/10 text-[#192837]/70 hover:text-[#7342E2] transition-colors cursor-pointer"
            title={`Last sync: ${lastUpdated.toLocaleTimeString()}`}
          >
            <RefreshCw size={14} />
          </button>

          <span className="text-xs font-semibold text-[#192837]/60 bg-white px-3 py-1.5 rounded-full border border-[#192837]/10 shadow-xs">
            Total: <span className="text-[#192837] font-bold">{invoices.length}</span>
          </span>
          {surplusCount > 0 && (
            <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-3 py-1.5 rounded-full border border-purple-200 shadow-xs">
              Surplus: <span className="font-bold">{surplusCount}</span>
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-700 hover:text-red-900 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Add Invoice Form */}
      <div className="bg-white/95 rounded-2xl border border-[#192837]/8 p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(25,40,55,0.05)]">
        <div className="flex items-center gap-2 font-bold text-base text-[#192837] mb-4 pb-2 border-b border-[#192837]/5">
          <Receipt size={18} className="text-[#7342E2]" />
          <span>Submit Invoice for Real-Time Governance Evaluation</span>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#192837] uppercase tracking-wider mb-1">
              Invoice #
            </label>
            <input
              type="text"
              placeholder="e.g. INV-9042"
              value={form.invoiceNumber}
              onChange={(e) => {
                setForm({ ...form, invoiceNumber: e.target.value });
                if (formErrors.invoiceNumber) setFormErrors({ ...formErrors, invoiceNumber: null });
              }}
              className={`w-full px-3.5 py-2.5 bg-[#F5F5F3]/80 hover:bg-[#F5F5F3] focus:bg-white rounded-xl border text-[#192837] text-xs outline-none transition-all ${
                formErrors.invoiceNumber ? "border-red-400 focus:border-red-500 ring-2 ring-red-100" : "border-[#192837]/10 focus:border-[#7342E2] focus:ring-4 focus:ring-[#7342E2]/15"
              }`}
            />
            {formErrors.invoiceNumber && (
              <p className="text-[10px] text-red-600 font-medium mt-1">{formErrors.invoiceNumber}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#192837] uppercase tracking-wider mb-1">
              Vendor Name
            </label>
            <input
              type="text"
              placeholder="e.g. Acme Corp"
              value={form.vendorName}
              onChange={(e) => {
                setForm({ ...form, vendorName: e.target.value });
                if (formErrors.vendorName) setFormErrors({ ...formErrors, vendorName: null });
              }}
              className={`w-full px-3.5 py-2.5 bg-[#F5F5F3]/80 hover:bg-[#F5F5F3] focus:bg-white rounded-xl border text-[#192837] text-xs outline-none transition-all ${
                formErrors.vendorName ? "border-red-400 focus:border-red-500 ring-2 ring-red-100" : "border-[#192837]/10 focus:border-[#7342E2] focus:ring-4 focus:ring-[#7342E2]/15"
              }`}
            />
            {formErrors.vendorName && (
              <p className="text-[10px] text-red-600 font-medium mt-1">{formErrors.vendorName}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#192837] uppercase tracking-wider mb-1">
              Department
            </label>
            <select
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-[#F5F5F3]/80 hover:bg-[#F5F5F3] focus:bg-white rounded-xl border border-[#192837]/10 focus:border-[#7342E2] focus:ring-4 focus:ring-[#7342E2]/15 text-[#192837] text-xs outline-none transition-all cursor-pointer"
            >
              <option>Finance</option>
              <option>HR</option>
              <option>Operations</option>
              <option>Inventory</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#192837] uppercase tracking-wider mb-1">
              Amount (₹)
            </label>
            <input
              type="number"
              placeholder="50000"
              value={form.amount}
              onChange={(e) => {
                setForm({ ...form, amount: e.target.value });
                if (formErrors.amount) setFormErrors({ ...formErrors, amount: null });
              }}
              className={`w-full px-3.5 py-2.5 bg-[#F5F5F3]/80 hover:bg-[#F5F5F3] focus:bg-white rounded-xl border text-[#192837] text-xs outline-none transition-all ${
                formErrors.amount ? "border-red-400 focus:border-red-500 ring-2 ring-red-100" : "border-[#192837]/10 focus:border-[#7342E2] focus:ring-4 focus:ring-[#7342E2]/15"
              }`}
            />
            {formErrors.amount && (
              <p className="text-[10px] text-red-600 font-medium mt-1">{formErrors.amount}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#192837] uppercase tracking-wider mb-1">
              Date
            </label>
            <input
              type="date"
              value={form.invoiceDate}
              onChange={(e) => setForm({ ...form, invoiceDate: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-[#F5F5F3]/80 hover:bg-[#F5F5F3] focus:bg-white rounded-xl border border-[#192837]/10 focus:border-[#7342E2] focus:ring-4 focus:ring-[#7342E2]/15 text-[#192837] text-xs outline-none transition-all"
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-5 flex justify-end mt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-[#7342E2] hover:bg-[#5c2ecc] shadow-lg shadow-[#7342E2]/25 hover:shadow-xl hover:shadow-[#7342E2]/35 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <PlusCircle size={15} />
              <span>{submitting ? "Evaluating Risk Engine..." : "Submit & Score Invoice"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-3 bg-white/95 p-3.5 rounded-2xl border border-[#192837]/8 shadow-xs">
        <div className="relative w-full lg:w-64">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#192837]/40" />
          <input
            type="text"
            placeholder="Search invoice # or vendor..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3.5 py-2 bg-[#F5F5F3] rounded-xl text-xs text-[#192837] outline-none border border-transparent focus:border-[#7342E2] transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
          {/* Department Filter */}
          <select
            value={departmentFilter}
            onChange={(e) => {
              setDepartmentFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-[#F5F5F3] rounded-xl text-xs font-medium text-[#192837] outline-none border border-transparent focus:border-[#7342E2] transition-all cursor-pointer"
          >
            <option value="ALL">All Departments</option>
            <option value="Finance">Finance</option>
            <option value="HR">HR</option>
            <option value="Operations">Operations</option>
            <option value="Inventory">Inventory</option>
          </select>

          {/* Sentry Level Filter */}
          <select
            value={sentryFilter}
            onChange={(e) => {
              setSentryFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-[#F5F5F3] rounded-xl text-xs font-bold text-[#192837] outline-none border border-transparent focus:border-[#7342E2] transition-all cursor-pointer"
          >
            <option value="ALL">All Sentry Levels</option>
            <option value="GREEN">Sentry GREEN (0–3 Low)</option>
            <option value="YELLOW">Sentry YELLOW (4–6 Med)</option>
            <option value="ORANGE">Sentry ORANGE (7–8 High)</option>
            <option value="RED">Sentry RED (9–10 Critical)</option>
          </select>

          {/* Surplus Expense Filter */}
          <select
            value={surplusFilter}
            onChange={(e) => {
              setSurplusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-[#F5F5F3] rounded-xl text-xs font-bold text-purple-800 outline-none border border-transparent focus:border-purple-600 transition-all cursor-pointer"
          >
            <option value="ALL">All Expenses</option>
            <option value="SURPLUS_ONLY">Surplus Flagged (&gt;1.5x Dept / &gt;2x Vendor)</option>
            <option value="DEPT_ONLY">&gt;1.5x Dept Average Only</option>
            <option value="VENDOR_ONLY">&gt;2.0x Vendor Average Only</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-[#F5F5F3] rounded-xl text-xs font-medium text-[#192837] outline-none border border-transparent focus:border-[#7342E2] transition-all cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="FLAGGED">Flagged</option>
          </select>
        </div>
      </div>

      {/* Invoices Table Card */}
      <div className="bg-white/95 rounded-2xl border border-[#192837]/8 shadow-[0_4px_20px_-4px_rgba(25,40,55,0.05)] overflow-hidden">
        {pageLoading ? (
          <LoadingSkeleton rows={5} cols={8} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F5F3]/80 border-b border-[#192837]/8 text-[#192837]/60 uppercase font-semibold text-[11px] tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Invoice #</th>
                  <th className="px-5 py-3.5">Vendor</th>
                  <th className="px-5 py-3.5">Department</th>
                  <th className="px-5 py-3.5">Amount</th>
                  <th className="px-5 py-3.5">Flags & Surplus</th>
                  <th className="px-5 py-3.5">Sentry Level & Risk</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#192837]/5 text-[#192837]">
                {paginatedInvoices.map((inv) => {
                  const statusBadgeClass = STATUS_BADGES[inv.status] || "bg-gray-100 text-gray-700 border-gray-200";
                  const isDeptSurplus = inv.surplusExpenseFlag;
                  const isVendorSurplus = inv.vendorSurplusFlag;

                  return (
                    <tr key={inv.id} className="hover:bg-[#7342E2]/[0.02] transition-colors">
                      <td className="px-5 py-4 font-mono font-semibold text-[#192837]">
                        {inv.invoiceNumber}
                      </td>
                      <td className="px-5 py-4 font-medium flex items-center gap-1.5">
                        <Building2 size={14} className="text-[#192837]/40 flex-shrink-0" />
                        <span>{inv.vendorName}</span>
                      </td>
                      <td className="px-5 py-4 text-[#192837]/70 font-medium">
                        {inv.department}
                      </td>
                      <td className="px-5 py-4 font-bold text-[#192837]">
                        ₹{inv.amount?.toLocaleString()}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {/* Surplus Expense Flags */}
                          {isDeptSurplus && isVendorSurplus ? (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-300"
                              title={`Exceeds 1.5x Dept Avg (₹${inv.departmentAverage?.toLocaleString()}) & 2x Vendor Avg (₹${inv.vendorAverage?.toLocaleString()})`}
                            >
                              <Zap size={11} className="text-purple-600" />
                              Dual Surplus
                            </span>
                          ) : isDeptSurplus ? (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200"
                              title={`Exceeds 1.5x Department Avg (₹${inv.departmentAverage?.toLocaleString()})`}
                            >
                              <Zap size={11} className="text-purple-600" />
                              Dept Surplus (&gt;1.5x)
                            </span>
                          ) : isVendorSurplus ? (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-100 text-pink-800 border border-pink-200"
                              title={`Exceeds 2.0x Vendor Avg (₹${inv.vendorAverage?.toLocaleString()})`}
                            >
                              <Building2 size={11} className="text-pink-600" />
                              Vendor Surplus (&gt;2x)
                            </span>
                          ) : null}

                          {inv.duplicateFlag && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
                              Duplicate
                            </span>
                          )}
                          {inv.anomalyFlag ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              Anomaly
                            </span>
                          ) : (
                            !inv.duplicateFlag && !isDeptSurplus && !isVendorSurplus && (
                              <span className="text-[11px] text-[#192837]/50 font-medium">Standard</span>
                            )
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <RiskBadge score={inv.riskScore || 0} sentryLevel={inv.sentryLevel} />
                            <span className="text-[10px] font-mono font-bold text-[#7342E2]">
                              RF: {Math.round((inv.mlRiskProbability || 0) * 100)}%
                            </span>
                          </div>
                          {inv.policyAction && inv.policyAction !== "ALLOW" && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded w-fit">
                              Policy: {inv.policyAction}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold border ${statusBadgeClass}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <button
                            onClick={() => setSelectedInvoice(inv)}
                            className="px-2.5 py-1.5 rounded-lg bg-[#7342E2]/10 text-[#7342E2] hover:bg-[#7342E2]/20 font-semibold text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                            title="Explain AI/LLM Risk & Surplus Analysis"
                          >
                            <BrainCircuit size={13} />
                            <span>Explain</span>
                          </button>
                          {inv.status !== "APPROVED" && inv.status !== "REJECTED" ? (
                            <>
                              <button
                                onClick={() => handleStatusChange(inv, "APPROVED")}
                                className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                                title="Approve"
                              >
                                <CheckCircle2 size={15} />
                              </button>
                              <button
                                onClick={() => handleStatusChange(inv, "REJECTED")}
                                className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-colors cursor-pointer"
                                title="Reject"
                              >
                                <XCircle size={15} />
                              </button>
                            </>
                          ) : null}
                          <button
                            onClick={() => setInvoiceToDelete(inv)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-[#192837]/40 hover:text-red-600 transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {paginatedInvoices.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-10 text-center text-[#192837]/50">
                      No invoices match the specified search or filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        <div className="px-5 py-3 bg-[#F5F5F3]/50 border-t border-[#192837]/8 flex items-center justify-between">
          <span className="text-xs text-[#192837]/60">
            Showing Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({filteredInvoices.length} total)
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-[#192837]/10 bg-white text-[#192837] hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-lg border border-[#192837]/10 bg-white text-[#192837] hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(invoiceToDelete)}
        title="Delete Invoice"
        message={`Are you sure you want to permanently delete invoice ${invoiceToDelete?.invoiceNumber}? This action will be audited.`}
        confirmText="Delete"
        onConfirm={handleDelete}
        onCancel={() => setInvoiceToDelete(null)}
      />

      {/* Comprehensive Explain Modal: Multi-Model + YAML Policies + Surplus + LLM Advisory */}
      {selectedInvoice && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="audit-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#192837]/50 backdrop-blur-sm animate-fade-in cursor-pointer"
          onClick={() => setSelectedInvoice(null)}
        >
          <div
            className="bg-white rounded-3xl border border-[#192837]/10 shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto cursor-default flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white/95 backdrop-blur px-6 py-4 border-b border-[#192837]/8 flex items-center justify-between z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#7342E2]/10 text-[#7342E2] flex items-center justify-center">
                  <BrainCircuit size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3
                      id="audit-modal-title"
                      className="font-extrabold text-base text-[#192837]"
                      style={{ fontFamily: "var(--font-heading)" }}
                    >
                      Audit & Advisory Intelligence: {selectedInvoice.invoiceNumber}
                    </h3>
                    <RiskBadge
                      score={selectedInvoice.riskScore || 0}
                      sentryLevel={selectedInvoice.sentryLevel}
                    />
                  </div>
                  <p className="text-xs text-[#192837]/60">
                    Vendor: <strong className="text-[#192837]">{selectedInvoice.vendorName}</strong> •
                    Department: <strong className="text-[#192837]">{selectedInvoice.department}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                aria-label="Close dialog"
                className="w-8 h-8 rounded-xl bg-[#192837]/5 hover:bg-[#192837]/10 text-[#192837]/70 hover:text-[#192837] flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* 4 Multi-Model Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                {/* 1. Final Risk Score & Sentry Level */}
                <div className="p-3.5 rounded-2xl bg-[#F5F5F3] border border-[#192837]/8 text-center">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#192837]/60 block mb-1">
                    Sentry Level
                  </span>
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-2xl font-black text-[#192837]">
                      {selectedInvoice.riskScore || 0}
                    </span>
                    <span className="text-xs font-semibold text-[#192837]/40">/ 10</span>
                  </div>
                  <div className="mt-1.5 flex justify-center">
                    <RiskBadge
                      score={selectedInvoice.riskScore || 0}
                      sentryLevel={selectedInvoice.sentryLevel}
                    />
                  </div>
                </div>

                {/* 2. Primary: Random Forest */}
                <div className="p-3.5 rounded-2xl bg-[#F5F5F3] border border-[#192837]/8 text-center">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#192837]/60 block mb-1">
                    Primary: Random Forest
                  </span>
                  <div className="flex items-center justify-center gap-1 text-[#7342E2]">
                    <TrendingUp size={16} />
                    <span className="text-xl font-black">
                      {Math.round((selectedInvoice.mlRiskProbability || 0) * 100)}%
                    </span>
                  </div>
                  <span className="text-[10px] text-[#192837]/50 mt-1 block">
                    Weight: 55% Blended
                  </span>
                </div>

                {/* 3. Secondary: XGBoost */}
                <div className="p-3.5 rounded-2xl bg-[#F5F5F3] border border-[#192837]/8 text-center">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#192837]/60 block mb-1">
                    Secondary: XGBoost
                  </span>
                  <div className="flex items-center justify-center gap-1 text-indigo-600">
                    <Zap size={16} />
                    <span className="text-xl font-black">
                      {selectedInvoice.secondaryModelRiskProbability !== undefined && selectedInvoice.secondaryModelRiskProbability !== null
                        ? Math.round(selectedInvoice.secondaryModelRiskProbability * 100)
                        : Math.round((selectedInvoice.mlRiskProbability || 0) * 100)}%
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-700 mt-1 block">
                    {selectedInvoice.modelAgreement || "CONCORDANT"}
                  </span>
                </div>

                {/* 4. Anomaly: Isolation Forest */}
                <div className="p-3.5 rounded-2xl bg-[#F5F5F3] border border-[#192837]/8 text-center">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#192837]/60 block mb-1">
                    Isolation Forest
                  </span>
                  <div className="flex items-center justify-center gap-1 mt-0.5">
                    {selectedInvoice.anomalyFlag ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                        <ShieldAlert size={12} /> Anomaly
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        <ShieldCheck size={12} /> Normal
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-[#192837]/50 mt-1.5 block">
                    Score: {selectedInvoice.anomalyScore ? selectedInvoice.anomalyScore.toFixed(3) : "0.000"}
                  </span>
                </div>
              </div>

              {/* SURPLUS EXPENSE FLAGGING ANALYSIS CARD */}
              <div className={`p-4 rounded-2xl border text-xs ${
                selectedInvoice.surplusExpenseFlag || selectedInvoice.vendorSurplusFlag
                  ? "bg-purple-50/70 border-purple-200/80 text-purple-950"
                  : "bg-gray-50/70 border-gray-200/80 text-gray-800"
              }`}>
                <div className="flex items-center justify-between font-bold mb-2">
                  <div className="flex items-center gap-1.5 text-purple-900">
                    <Scale size={15} className="text-purple-600" />
                    <span>Surplus Expense Flagging Analysis</span>
                  </div>
                  {selectedInvoice.surplusExpenseFlag || selectedInvoice.vendorSurplusFlag ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-200 text-purple-900 border border-purple-300">
                      Surplus Threshold Exceeded
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-emerald-100 text-emerald-800">
                      Normal Expense Ratio
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="p-2.5 rounded-xl bg-white border border-[#192837]/5">
                    <span className="text-[10px] text-[#192837]/60 block font-medium">Invoice Amount</span>
                    <span className="text-sm font-bold text-[#192837]">
                      ₹{selectedInvoice.amount?.toLocaleString()}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white border border-[#192837]/5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[#192837]/60 font-medium">Dept Average</span>
                      <span className="text-[10px] font-bold text-purple-700">1.5x Limit</span>
                    </div>
                    <span className="text-sm font-bold text-[#192837]">
                      ₹{(selectedInvoice.departmentAverage || 50000).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-[#192837]/50 block mt-0.5">
                      Threshold: ₹{((selectedInvoice.departmentAverage || 50000) * 1.5).toLocaleString()}
                      {selectedInvoice.surplusExpenseFlag && (
                        <strong className="text-purple-700 ml-1 font-bold">(&gt; 1.5x VIOLATION)</strong>
                      )}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white border border-[#192837]/5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[#192837]/60 font-medium">Vendor Average</span>
                      <span className="text-[10px] font-bold text-pink-700">2.0x Limit</span>
                    </div>
                    <span className="text-sm font-bold text-[#192837]">
                      ₹{(selectedInvoice.vendorAverage || selectedInvoice.departmentAverage || 50000).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-[#192837]/50 block mt-0.5">
                      Threshold: ₹{(((selectedInvoice.vendorAverage || selectedInvoice.departmentAverage || 50000)) * 2.0).toLocaleString()}
                      {selectedInvoice.vendorSurplusFlag && (
                        <strong className="text-pink-700 ml-1 font-bold">(&gt; 2.0x VIOLATION)</strong>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* YAML Policy Engine Evaluation Banner */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs">
                <div className="flex items-center justify-between font-bold mb-1.5">
                  <div className="flex items-center gap-1.5 text-amber-900">
                    <Sliders size={14} className="text-[#7342E2]" />
                    <span>YAML Policy Engine Evaluation (SpEL Rules)</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-200/80 text-amber-950">
                    Action: {selectedInvoice.policyAction || "ALLOW"}
                  </span>
                </div>
                {selectedInvoice.triggeredPolicies && selectedInvoice.triggeredPolicies.length > 0 ? (
                  <div className="space-y-1">
                    <span className="text-[11px] text-amber-900/80 block font-medium">
                      Matched Rules:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedInvoice.triggeredPolicies.map((p, idx) => (
                        <span
                          key={idx}
                          className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-200 text-amber-900 border border-amber-300"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <span className="text-emerald-800 font-medium">
                    No policy triggers violated. Standard straight-through authorization.
                  </span>
                )}
              </div>

              {/* LLM Advisory Service Briefing */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#7342E2]/10 via-[#7342E2]/5 to-transparent border border-[#7342E2]/25 text-[#192837] text-xs shadow-xs">
                <div className="flex items-center justify-between font-bold text-[#7342E2] mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Sparkles size={15} />
                    <span className="tracking-wide uppercase text-[11px]">
                      LLM Advisory Service — Natural Language Explanation
                    </span>
                  </div>
                  <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded-full bg-white text-[#7342E2] border border-[#7342E2]/20">
                    Advisory Layer (Non-Overriding)
                  </span>
                </div>
                <p className="text-[#192837]/90 leading-relaxed font-medium text-xs pt-1">
                  {selectedInvoice.llmExplanation ||
                    selectedInvoice.mlExplanation ||
                    "Evaluated via enterprise ML ensemble and deterministic policy rules."}
                </p>
                <div className="mt-2 pt-2 border-t border-[#7342E2]/15 flex items-center justify-between text-[10px] text-[#192837]/50">
                  <span>Provider: Gemini 1.5 Flash / OpenAI GPT-4o with deterministic rule fallback</span>
                  <span className="font-semibold text-emerald-700">Governance Policy Invariant: Decision Authority Intact</span>
                </div>
              </div>

              {/* Risk Factors Identified */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#192837] mb-2 flex items-center gap-1.5">
                  <Cpu size={14} className="text-[#7342E2]" />
                  <span>Key Risk Factors</span>
                </h4>
                <div className="space-y-1.5">
                  {selectedInvoice.riskReasons && selectedInvoice.riskReasons.length > 0 ? (
                    selectedInvoice.riskReasons.map((reason, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/60 text-xs text-amber-950 font-medium flex items-start gap-2"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                        <span>{reason}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-[#192837]/50 italic">
                      No adverse risk factors identified.
                    </p>
                  )}
                </div>
              </div>

              {/* Actionable Recommendations */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#192837] mb-2 flex items-center gap-1.5">
                  <Layers size={14} className="text-[#7342E2]" />
                  <span>Recommended Next Steps</span>
                </h4>
                <div className="space-y-1.5">
                  {selectedInvoice.riskRecommendations && selectedInvoice.riskRecommendations.length > 0 ? (
                    selectedInvoice.riskRecommendations.map((rec, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-[#F5F5F3] border border-[#192837]/8 text-xs text-[#192837] font-medium flex items-start gap-2"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#7342E2] mt-1.5 flex-shrink-0" />
                        <span>{rec}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-[#192837]/50 italic">
                      Standard straight-through processing.
                    </p>
                  )}
                </div>
              </div>

              {/* Model Tag */}
              <div className="pt-2 border-t border-[#192837]/8 flex items-center justify-between text-[11px] text-[#192837]/50 font-mono">
                <span>Active Model: {selectedInvoice.modelVersion || "v3.0-MultiModel"}</span>
                <span>Amount: ₹{selectedInvoice.amount?.toLocaleString()}</span>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="sticky bottom-0 bg-[#F5F5F3]/95 backdrop-blur px-6 py-4 border-t border-[#192837]/8 flex items-center justify-between z-10">
              <span className="text-xs font-medium text-[#192837]/60">
                Status: <strong className="text-[#192837]">{selectedInvoice.status}</strong>
              </span>

              <div className="flex items-center gap-2">
                {selectedInvoice.status !== "APPROVED" && selectedInvoice.status !== "REJECTED" && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        handleStatusChange(selectedInvoice, "REJECTED");
                        setSelectedInvoice(null);
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-colors cursor-pointer"
                    >
                      Reject Invoice
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleStatusChange(selectedInvoice, "APPROVED");
                        setSelectedInvoice(null);
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-colors cursor-pointer"
                    >
                      Approve Invoice
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-[#192837]/10 text-[#192837] hover:bg-[#192837]/5 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
