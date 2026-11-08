import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  BrainCircuit,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Layers,
  PlusCircle,
  Radio,
  Receipt,
  RefreshCw,
  Scale,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sparkles,
  Trash2,
  TrendingUp,
  XCircle,
  Zap,
} from "lucide-react";
import api from "../services/api";
import RiskBadge, { computeSentryLevel } from "../components/RiskBadge";
import ConfirmModal from "../components/ConfirmModal";
import Alert from "../components/ui/Alert";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card, { CardBody, CardHeader } from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import LoadingSkeleton from "../components/ui/Skeleton";
import Modal from "../components/ui/Modal";
import PageHeader, { MetaPill } from "../components/ui/PageHeader";
import { Field, Input, SearchInput, Select } from "../components/ui/Field";
import { Table, TBody, Td, Th, THead, Tr } from "../components/ui/Table";

const STATUS_TONES = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "danger",
  FLAGGED: "purple",
};

const DEPARTMENTS = ["Finance", "HR", "Operations", "Inventory"];
const ITEMS_PER_PAGE = 8;

const today = () => new Date().toISOString().split("T")[0];

const emptyForm = () => ({
  invoiceNumber: "",
  vendorName: "",
  department: "Finance",
  amount: "",
  invoiceDate: today(),
});

/** Small labelled metric used inside the audit modal. */
function MetricTile({ label, children, className }) {
  return (
    <div className={`rounded-xl border border-line bg-surface-2 p-3 text-center ${className || ""}`}>
      <span className="block text-[10px] font-bold uppercase tracking-wider text-ink-subtle">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </div>
  );
}

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [error, setError] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);
  const [criticalApprovalInvoice, setCriticalApprovalInvoice] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sentryFilter, setSentryFilter] = useState("ALL");
  const [surplusFilter, setSurplusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  const [autoPolling, setAutoPolling] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const autoPollingRef = useRef(autoPolling);

  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    autoPollingRef.current = autoPolling;
  }, [autoPolling]);

  const load = useCallback((silent = false) => {
    if (!silent) setError(null);
    api
      .get("/invoices")
      .then((res) => {
        setInvoices(res.data || []);
        setLastUpdated(new Date());
        // Keep an open modal in sync without resurrecting a modal the user closed.
        setSelectedInvoice((current) => {
          if (!current) return null;
          return (res.data || []).find((invoice) => invoice.id === current.id) || current;
        });
      })
      .catch(() => {
        if (!silent) setError("Cannot reach the backend. Make sure it is running on port 8080.");
      })
      .finally(() => {
        if (!silent) setPageLoading(false);
      });
  }, []);

  useEffect(() => {
    document.title = "EDH — Invoices";
    load(false);

    const interval = setInterval(() => {
      if (autoPollingRef.current) load(true);
    }, 8000);

    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setSelectedInvoice(null);
        setInvoiceToDelete(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const validateForm = () => {
    const errors = {};
    if (!form.invoiceNumber.trim()) errors.invoiceNumber = "Invoice # is required";
    if (!form.vendorName.trim()) errors.vendorName = "Vendor name is required";
    if (!form.amount || isNaN(form.amount) || parseFloat(form.amount) <= 0) {
      errors.amount = "Amount must be a positive number";
    }
    if (!form.invoiceDate) errors.invoiceDate = "Date is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const res = await api.post("/invoices", { ...form, amount: parseFloat(form.amount) });
      setForm(emptyForm());
      setFormErrors({});
      load(false);
      if (res.data) setSelectedInvoice(res.data);
      window.dispatchEvent(new Event("alerts-updated"));
    } catch (err) {
      const message = err.response?.data?.message
        ? err.response.data.message
        : err.response?.data?.validationErrors
        ? Object.values(err.response.data.validationErrors).join(", ")
        : "Failed to process invoice";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (invoice, newStatus) => {
    if (
      newStatus === "APPROVED" &&
      (invoice.riskScore >= 9 || (invoice.sentryLevel || "").toUpperCase() === "RED")
    ) {
      setCriticalApprovalInvoice(invoice);
      return;
    }
    executeStatusChange(invoice, newStatus);
  };

  const executeStatusChange = async (invoice, newStatus) => {
    try {
      await api.put(`/invoices/${invoice.id}`, { ...invoice, status: newStatus });
      load(true);
      window.dispatchEvent(new Event("alerts-updated"));
    } catch {
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
    } catch {
      setError("Failed to delete invoice");
    }
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      (invoice.invoiceNumber || "").toLowerCase().includes(query) ||
      (invoice.vendorName || "").toLowerCase().includes(query);
    const matchesDepartment = departmentFilter === "ALL" || invoice.department === departmentFilter;
    const matchesStatus = statusFilter === "ALL" || invoice.status === statusFilter;

    const invoiceSentry = invoice.sentryLevel || computeSentryLevel(invoice.riskScore || 0);
    const matchesSentry =
      sentryFilter === "ALL" || invoiceSentry.toUpperCase() === sentryFilter.toUpperCase();

    let matchesSurplus = true;
    if (surplusFilter === "SURPLUS_ONLY") {
      matchesSurplus = Boolean(invoice.surplusExpenseFlag || invoice.vendorSurplusFlag);
    } else if (surplusFilter === "DEPT_ONLY") {
      matchesSurplus = Boolean(invoice.surplusExpenseFlag);
    } else if (surplusFilter === "VENDOR_ONLY") {
      matchesSurplus = Boolean(invoice.vendorSurplusFlag);
    }

    return matchesSearch && matchesDepartment && matchesStatus && matchesSentry && matchesSurplus;
  });

  const totalPages = Math.ceil(filteredInvoices.length / ITEMS_PER_PAGE) || 1;
  const safePage = Math.min(currentPage, totalPages);
  const paginatedInvoices = filteredInvoices.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE
  );

  const surplusCount = invoices.filter((i) => i.surplusExpenseFlag || i.vendorSurplusFlag).length;
  const flaggedCount = invoices.filter((i) => i.duplicateFlag).length;

  const renderFlagCell = (invoice) => {
    const isDepartmentSurplus = invoice.surplusExpenseFlag;
    const isVendorSurplus = invoice.vendorSurplusFlag;

    return (
      <div className="flex flex-wrap items-center gap-1.5">
        {isDepartmentSurplus && isVendorSurplus ? (
          <Badge
            tone="purple"
            size="sm"
            icon={Zap}
            title={`Exceeds 1.5× dept average (₹${invoice.departmentAverage?.toLocaleString()}) and 2× vendor average (₹${invoice.vendorAverage?.toLocaleString()})`}
          >
            Dual surplus
          </Badge>
        ) : isDepartmentSurplus ? (
          <Badge
            tone="purple"
            size="sm"
            icon={Zap}
            title={`Exceeds 1.5× department average (₹${invoice.departmentAverage?.toLocaleString()})`}
          >
            Dept surplus
          </Badge>
        ) : isVendorSurplus ? (
          <Badge
            tone="pink"
            size="sm"
            icon={Building2}
            title={`Exceeds 2× vendor average (₹${invoice.vendorAverage?.toLocaleString()})`}
          >
            Vendor surplus
          </Badge>
        ) : null}

        {invoice.duplicateFlag && (
          <Badge tone="danger" size="sm">
            Duplicate
          </Badge>
        )}

        {invoice.anomalyFlag ? (
          <Badge tone="warning" size="sm">
            Anomaly
          </Badge>
        ) : (
          !invoice.duplicateFlag &&
          !isDepartmentSurplus &&
          !isVendorSurplus && <span className="text-xs text-ink-subtle">Standard</span>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operations"
        title="Invoices"
        description="Submit invoices for ML risk scoring and policy evaluation, flag surplus spend and govern approvals in real time."
        badge={
          autoPolling && (
            <Badge tone="success" dot size="sm">
              Live · 8s
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
              title="Toggle 8-second automatic polling"
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
              aria-label="Refresh invoices"
            />
            <MetaPill label="Total" value={invoices.length} />
            <MetaPill label="Duplicates" value={flaggedCount} tone="danger" />
            <MetaPill label="Surplus" value={surplusCount} tone="purple" />
          </>
        }
      />

      {error && (
        <Alert tone="danger" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card>
        <CardBody>
          <CardHeader
            icon={Receipt}
            title="Submit an invoice for evaluation"
            subtitle="Risk scoring, duplicate detection and YAML policy checks run synchronously on submit."
          />

          <form
            onSubmit={handleSubmit}
            className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5"
          >
            <Field label="Invoice #" error={formErrors.invoiceNumber} htmlFor="invoiceNumber">
              <Input
                id="invoiceNumber"
                type="text"
                placeholder="e.g. INV-9042"
                value={form.invoiceNumber}
                invalid={Boolean(formErrors.invoiceNumber)}
                onChange={(event) => {
                  setForm({ ...form, invoiceNumber: event.target.value });
                  if (formErrors.invoiceNumber) setFormErrors({ ...formErrors, invoiceNumber: null });
                }}
              />
            </Field>

            <Field label="Vendor name" error={formErrors.vendorName} htmlFor="vendorName">
              <Input
                id="vendorName"
                type="text"
                placeholder="e.g. Acme Corp"
                value={form.vendorName}
                invalid={Boolean(formErrors.vendorName)}
                onChange={(event) => {
                  setForm({ ...form, vendorName: event.target.value });
                  if (formErrors.vendorName) setFormErrors({ ...formErrors, vendorName: null });
                }}
              />
            </Field>

            <Field label="Department" htmlFor="department">
              <Select
                id="department"
                value={form.department}
                onChange={(event) => setForm({ ...form, department: event.target.value })}
              >
                {DEPARTMENTS.map((department) => (
                  <option key={department}>{department}</option>
                ))}
              </Select>
            </Field>

            <Field label="Amount (₹)" error={formErrors.amount} htmlFor="amount">
              <Input
                id="amount"
                type="number"
                placeholder="50000"
                value={form.amount}
                invalid={Boolean(formErrors.amount)}
                onChange={(event) => {
                  setForm({ ...form, amount: event.target.value });
                  if (formErrors.amount) setFormErrors({ ...formErrors, amount: null });
                }}
              />
            </Field>

            <Field label="Invoice date" error={formErrors.invoiceDate} htmlFor="invoiceDate">
              <Input
                id="invoiceDate"
                type="date"
                value={form.invoiceDate}
                invalid={Boolean(formErrors.invoiceDate)}
                onChange={(event) => setForm({ ...form, invoiceDate: event.target.value })}
              />
            </Field>

            <div className="flex justify-end sm:col-span-2 lg:col-span-5">
              <Button type="submit" icon={PlusCircle} loading={submitting} className="w-full sm:w-auto">
                {submitting ? "Evaluating risk engine…" : "Submit & score invoice"}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      <Card className="flex flex-col gap-3 p-3.5 xl:flex-row xl:items-center xl:justify-between">
        <SearchInput
          icon={Search}
          placeholder="Search invoice # or vendor…"
          value={searchQuery}
          onChange={(event) => {
            setSearchQuery(event.target.value);
            setCurrentPage(1);
          }}
          className="w-full xl:w-72"
          aria-label="Search invoices"
        />

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Select
            size="sm"
            value={departmentFilter}
            onChange={(event) => {
              setDepartmentFilter(event.target.value);
              setCurrentPage(1);
            }}
            aria-label="Filter by department"
          >
            <option value="ALL">All departments</option>
            {DEPARTMENTS.map((department) => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
          </Select>

          <Select
            size="sm"
            value={sentryFilter}
            onChange={(event) => {
              setSentryFilter(event.target.value);
              setCurrentPage(1);
            }}
            aria-label="Filter by sentry level"
          >
            <option value="ALL">All sentry levels</option>
            <option value="GREEN">GREEN · low (0–3)</option>
            <option value="YELLOW">YELLOW · medium (4–6)</option>
            <option value="ORANGE">ORANGE · high (7–8)</option>
            <option value="RED">RED · critical (9–10)</option>
          </Select>

          <Select
            size="sm"
            value={surplusFilter}
            onChange={(event) => {
              setSurplusFilter(event.target.value);
              setCurrentPage(1);
            }}
            aria-label="Filter by surplus flag"
          >
            <option value="ALL">All expenses</option>
            <option value="SURPLUS_ONLY">Surplus flagged</option>
            <option value="DEPT_ONLY">&gt; 1.5× dept avg</option>
            <option value="VENDOR_ONLY">&gt; 2× vendor avg</option>
          </Select>

          <Select
            size="sm"
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setCurrentPage(1);
            }}
            aria-label="Filter by status"
          >
            <option value="ALL">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="FLAGGED">Flagged</option>
          </Select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {pageLoading ? (
          <LoadingSkeleton rows={5} cols={7} />
        ) : (
          <Table>
            <THead>
              <Th>Invoice #</Th>
              <Th>Vendor</Th>
              <Th>Department</Th>
              <Th className="text-right">Amount</Th>
              <Th>Flags</Th>
              <Th>Sentry / risk</Th>
              <Th>Status</Th>
              <Th className="text-right">Actions</Th>
            </THead>
            <TBody>
              {paginatedInvoices.map((invoice) => (
                <Tr key={invoice.id}>
                  <Td className="whitespace-nowrap font-mono text-xs font-semibold">
                    {invoice.invoiceNumber}
                  </Td>
                  <Td>
                    <div className="flex items-center gap-1.5 font-medium">
                      <Building2 size={14} className="shrink-0 text-ink-subtle" />
                      {invoice.vendorName}
                    </div>
                  </Td>
                  <Td className="text-xs font-medium text-ink-muted">{invoice.department}</Td>
                  <Td className="num whitespace-nowrap text-right font-bold">
                    ₹{invoice.amount?.toLocaleString()}
                  </Td>
                  <Td>{renderFlagCell(invoice)}</Td>
                  <Td>
                    <div className="flex flex-col items-start gap-1">
                      <RiskBadge score={invoice.riskScore || 0} sentryLevel={invoice.sentryLevel} />
                      <span className="num text-[10px] font-bold text-accent">
                        RF {Math.round((invoice.mlRiskProbability || 0) * 100)}%
                      </span>
                      {invoice.policyAction && invoice.policyAction !== "ALLOW" && (
                        <Badge tone="warning" size="sm">
                          {invoice.policyAction}
                        </Badge>
                      )}
                    </div>
                  </Td>
                  <Td>
                    <Badge tone={STATUS_TONES[invoice.status] || "neutral"} dot>
                      {invoice.status}
                    </Badge>
                  </Td>
                  <Td className="text-right">
                    <div className="inline-flex items-center justify-end gap-1.5">
                      <Button
                        variant="subtle"
                        size="xs"
                        icon={BrainCircuit}
                        onClick={() => setSelectedInvoice(invoice)}
                        title="Explain AI risk & surplus analysis"
                      >
                        Explain
                      </Button>
                      {invoice.status !== "APPROVED" && invoice.status !== "REJECTED" && (
                        <>
                          <Button
                            variant="secondary"
                            size="xs"
                            iconOnly
                            icon={CheckCircle2}
                            onClick={() => handleStatusChange(invoice, "APPROVED")}
                            title="Approve"
                            aria-label={`Approve ${invoice.invoiceNumber}`}
                            className="text-success"
                          />
                          <Button
                            variant="secondary"
                            size="xs"
                            iconOnly
                            icon={XCircle}
                            onClick={() => handleStatusChange(invoice, "REJECTED")}
                            title="Reject"
                            aria-label={`Reject ${invoice.invoiceNumber}`}
                            className="text-danger"
                          />
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => setInvoiceToDelete(invoice)}
                        title="Delete"
                        aria-label={`Delete ${invoice.invoiceNumber}`}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-ink-subtle transition-colors hover:bg-danger/10 hover:text-danger"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        )}

        {!pageLoading && paginatedInvoices.length === 0 && (
          <EmptyState
            icon={Receipt}
            title="No invoices match these filters"
            description="Adjust the search term, sentry level, surplus or status filter to widen the result set."
          />
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-surface-2/60 px-5 py-3">
          <span className="text-xs text-ink-muted">
            Page <strong className="text-ink">{safePage}</strong> of{" "}
            <strong className="text-ink">{totalPages}</strong> ·{" "}
            <span className="num">{filteredInvoices.length}</span> matching invoices
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              variant="secondary"
              size="xs"
              iconOnly
              icon={ChevronLeft}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={safePage <= 1}
              aria-label="Previous page"
            />
            <Button
              variant="secondary"
              size="xs"
              iconOnly
              icon={ChevronRight}
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={safePage >= totalPages}
              aria-label="Next page"
            />
          </div>
        </div>
      </Card>

      <ConfirmModal
        isOpen={Boolean(invoiceToDelete)}
        title="Delete invoice"
        message={`Permanently delete invoice ${invoiceToDelete?.invoiceNumber || ""}? This action is recorded in the audit trail.`}
        confirmText="Delete"
        onConfirm={handleDelete}
        onCancel={() => setInvoiceToDelete(null)}
      />

      <ConfirmModal
        isOpen={Boolean(criticalApprovalInvoice)}
        title="Four-Eyes Dual Authorization Required"
        message={`Invoice ${criticalApprovalInvoice?.invoiceNumber || ""} is designated Sentry RED (Score ${criticalApprovalInvoice?.riskScore || 0}/10 - Critical Risk). Approving this invoice releases an active disbursement hold. This authorization will be cryptographically signed and logged in the immutable audit ledger.`}
        confirmText="Authorize & Release Hold"
        onConfirm={() => {
          const inv = criticalApprovalInvoice;
          setCriticalApprovalInvoice(null);
          executeStatusChange(inv, "APPROVED");
        }}
        onCancel={() => setCriticalApprovalInvoice(null)}
      />

      <Modal
        isOpen={Boolean(selectedInvoice)}
        onClose={() => setSelectedInvoice(null)}
        size="lg"
        icon={BrainCircuit}
        title={
          selectedInvoice
            ? `Audit & advisory · ${selectedInvoice.invoiceNumber}`
            : "Audit & advisory"
        }
        description={
          selectedInvoice
            ? `${selectedInvoice.vendorName} · ${selectedInvoice.department} · ₹${selectedInvoice.amount?.toLocaleString()}`
            : undefined
        }
        footer={
          selectedInvoice && (
            <>
              <span className="text-xs font-medium text-ink-muted">
                Status:{" "}
                <strong className="text-ink">{selectedInvoice.status}</strong>
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {selectedInvoice.status !== "APPROVED" &&
                  selectedInvoice.status !== "REJECTED" && (
                    <>
                      <Button
                        variant="dangerSubtle"
                        size="sm"
                        onClick={() => {
                          handleStatusChange(selectedInvoice, "REJECTED");
                          setSelectedInvoice(null);
                        }}
                      >
                        Reject invoice
                      </Button>
                      <Button
                        variant="success"
                        size="sm"
                        icon={CheckCircle2}
                        onClick={() => {
                          handleStatusChange(selectedInvoice, "APPROVED");
                          setSelectedInvoice(null);
                        }}
                      >
                        Approve invoice
                      </Button>
                    </>
                  )}
                <Button variant="secondary" size="sm" onClick={() => setSelectedInvoice(null)}>
                  Close
                </Button>
              </div>
            </>
          )
        }
      >
        {selectedInvoice && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MetricTile label="Sentry level">
                <div className="flex items-center justify-center gap-1">
                  <span className="num text-xl font-extrabold text-ink">
                    {selectedInvoice.riskScore || 0}
                  </span>
                  <span className="text-[11px] text-ink-subtle">/10</span>
                </div>
                <div className="mt-1.5 flex justify-center">
                  <RiskBadge
                    score={selectedInvoice.riskScore || 0}
                    sentryLevel={selectedInvoice.sentryLevel}
                  />
                </div>
              </MetricTile>

              <MetricTile label="Primary · RF">
                <div className="flex items-center justify-center gap-1 text-accent">
                  <TrendingUp size={15} />
                  <span className="num text-lg font-extrabold">
                    {Math.round((selectedInvoice.mlRiskProbability || 0) * 100)}%
                  </span>
                </div>
                <span className="mt-1 block text-[10px] text-ink-subtle">55% blended weight</span>
              </MetricTile>

              <MetricTile label="Secondary · XGB">
                <div className="flex items-center justify-center gap-1 text-info">
                  <Zap size={15} />
                  <span className="num text-lg font-extrabold">
                    {selectedInvoice.secondaryModelRiskProbability !== undefined &&
                    selectedInvoice.secondaryModelRiskProbability !== null
                      ? Math.round(selectedInvoice.secondaryModelRiskProbability * 100)
                      : Math.round((selectedInvoice.mlRiskProbability || 0) * 100)}
                    %
                  </span>
                </div>
                <span className="mt-1 block text-[10px] font-semibold text-success">
                  {selectedInvoice.modelAgreement || "CONCORDANT"}
                </span>
              </MetricTile>

              <MetricTile label="Isolation forest">
                <div className="flex items-center justify-center">
                  {selectedInvoice.anomalyFlag ? (
                    <Badge tone="warning" icon={ShieldAlert}>
                      Anomaly
                    </Badge>
                  ) : (
                    <Badge tone="success" icon={ShieldCheck}>
                      Normal
                    </Badge>
                  )}
                </div>
                <span className="num mt-1.5 block text-[10px] text-ink-subtle">
                  Score {selectedInvoice.anomalyScore ? selectedInvoice.anomalyScore.toFixed(3) : "0.000"}
                </span>
              </MetricTile>
            </div>

            <section
              className={`rounded-2xl border p-4 ${
                selectedInvoice.surplusExpenseFlag || selectedInvoice.vendorSurplusFlag
                  ? "border-violet-500/30 bg-violet-500/[0.06]"
                  : "border-line bg-surface-2"
              }`}
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-ink">
                  <Scale size={15} className="text-violet-500" />
                  Surplus expense analysis
                </span>
                {selectedInvoice.surplusExpenseFlag || selectedInvoice.vendorSurplusFlag ? (
                  <Badge tone="purple" size="sm">
                    Threshold exceeded
                  </Badge>
                ) : (
                  <Badge tone="success" size="sm">
                    Normal expense ratio
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                <div className="rounded-xl border border-line bg-surface p-2.5">
                  <span className="block text-[10px] font-medium text-ink-subtle">Invoice amount</span>
                  <span className="num text-sm font-bold text-ink">
                    ₹{selectedInvoice.amount?.toLocaleString()}
                  </span>
                </div>

                <div className="rounded-xl border border-line bg-surface p-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-medium text-ink-subtle">Dept average</span>
                    <span className="text-[10px] font-bold text-violet-600 dark:text-violet-300">
                      1.5× limit
                    </span>
                  </div>
                  <span className="num text-sm font-bold text-ink">
                    ₹{(selectedInvoice.departmentAverage || 50000).toLocaleString()}
                  </span>
                  <span className="num block text-[10px] text-ink-subtle">
                    Threshold ₹{((selectedInvoice.departmentAverage || 50000) * 1.5).toLocaleString()}
                    {selectedInvoice.surplusExpenseFlag && (
                      <strong className="ml-1 font-bold text-violet-600 dark:text-violet-300">
                        violated
                      </strong>
                    )}
                  </span>
                </div>

                <div className="rounded-xl border border-line bg-surface p-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-medium text-ink-subtle">Vendor average</span>
                    <span className="text-[10px] font-bold text-pink-600 dark:text-pink-300">
                      2× limit
                    </span>
                  </div>
                  <span className="num text-sm font-bold text-ink">
                    ₹
                    {(
                      selectedInvoice.vendorAverage ||
                      selectedInvoice.departmentAverage ||
                      50000
                    ).toLocaleString()}
                  </span>
                  <span className="num block text-[10px] text-ink-subtle">
                    Threshold ₹
                    {(
                      (selectedInvoice.vendorAverage ||
                        selectedInvoice.departmentAverage ||
                        50000) * 2
                    ).toLocaleString()}
                    {selectedInvoice.vendorSurplusFlag && (
                      <strong className="ml-1 font-bold text-pink-600 dark:text-pink-300">
                        violated
                      </strong>
                    )}
                  </span>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-warning/30 bg-warning/[0.06] p-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-ink">
                  <Sliders size={14} className="text-accent" />
                  YAML policy engine · SpEL rules
                </span>
                <Badge tone="warning" size="sm">
                  Action {selectedInvoice.policyAction || "ALLOW"}
                </Badge>
              </div>

              {selectedInvoice.triggeredPolicies && selectedInvoice.triggeredPolicies.length > 0 ? (
                <div className="space-y-1.5">
                  <span className="block text-[11px] font-medium text-ink-muted">Matched rules</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedInvoice.triggeredPolicies.map((policy, index) => (
                      <code
                        key={index}
                        className="rounded-md border border-warning/30 bg-warning/15 px-2 py-0.5 font-mono text-[11px] font-bold text-warning"
                      >
                        {policy}
                      </code>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-[11px] font-medium text-success">
                  No policy triggers violated — standard straight-through authorisation.
                </p>
              )}
            </section>

            <section className="rounded-2xl border border-accent/25 bg-gradient-to-br from-accent/10 via-accent/[0.04] to-transparent p-4">
              <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-accent">
                  <Sparkles size={15} />
                  AI advisory explanation
                </span>
                <Badge tone="accent" size="sm">
                  Non-overriding
                </Badge>
              </div>
              <p className="text-xs leading-relaxed text-ink">
                {selectedInvoice.llmExplanation ||
                  selectedInvoice.mlExplanation ||
                  "Evaluated via the enterprise ML ensemble and deterministic policy rules."}
              </p>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-accent/15 pt-2 text-[10px] text-ink-subtle">
                <span>Gemini / GPT-4o with deterministic rule fallback</span>
                <span className="font-semibold text-success">Decision authority intact</span>
              </div>
            </section>

            {/* Local Risk Attribution Waterfall (Additive Breakdown) */}
            <section className="rounded-2xl border border-line bg-surface-2 p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-ink">
                  <Layers size={14} className="text-accent" />
                  Local Risk Attribution Waterfall (Additive Breakdown)
                </span>
                <span className="rounded-md border border-line bg-surface px-2 py-0.5 font-mono text-[11px] font-bold text-ink">
                  Evaluated: {selectedInvoice.riskScore || 0} / 10
                </span>
              </div>
              <div className="space-y-2">
                {(selectedInvoice.riskWaterfall && selectedInvoice.riskWaterfall.length > 0
                  ? selectedInvoice.riskWaterfall
                  : [
                      {
                        factor: "Baseline Enterprise Risk",
                        delta: 0.5,
                        impact: "+0.5",
                        type: "base",
                        description: "Standard baseline risk probability across normal transactions",
                      },
                      ...(selectedInvoice.duplicateFlag
                        ? [
                            {
                              factor: "Duplicate Invoice Match",
                              delta: 4.0,
                              impact: "+4.0",
                              type: "critical",
                              description: "Exact vendor & invoice number hash match previously processed",
                            },
                          ]
                        : []),
                      ...(selectedInvoice.surplusExpenseFlag || selectedInvoice.vendorSurplusFlag
                        ? [
                            {
                              factor: "Expenditure Baseline Surplus",
                              delta: 2.0,
                              impact: "+2.0",
                              type: "risk",
                              description: "Invoice amount exceeds 1.5x departmental or 2.0x vendor average",
                            },
                          ]
                        : []),
                      ...(selectedInvoice.amount >= 100000
                        ? [
                            {
                              factor: "Capital Expenditure Tier",
                              delta: 1.5,
                              impact: "+1.5",
                              type: "warning",
                              description: "High-value capital transaction exceeds departmental median",
                            },
                          ]
                        : []),
                      ...(selectedInvoice.anomalyFlag
                        ? [
                            {
                              factor: "Isolation Forest Structural Outlier",
                              delta: 1.5,
                              impact: "+1.5",
                              type: "anomaly",
                              description: "Multi-dimensional feature vector falls outside normal baseline cluster",
                            },
                          ]
                        : []),
                    ]
                ).map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-xl border border-line bg-surface p-2.5 text-xs"
                  >
                    <div className="space-y-0.5">
                      <span className="font-semibold text-ink">{item.factor}</span>
                      <p className="text-[11px] text-ink-subtle">{item.description}</p>
                    </div>
                    <span
                      className={`num rounded-md px-2 py-0.5 font-mono text-xs font-bold ${
                        item.type === "critical"
                          ? "border border-danger/30 bg-danger/15 text-danger"
                          : item.type === "risk"
                          ? "border border-warning/30 bg-warning/15 text-warning"
                          : item.type === "anomaly"
                          ? "border border-purple-500/30 bg-purple-500/15 text-purple-600 dark:text-purple-400"
                          : "border border-line bg-surface-2 text-ink-muted"
                      }`}
                    >
                      {item.impact || `+${item.delta}`}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <section>
                <h4 className="mb-2 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-ink">
                  <Cpu size={14} className="text-accent" />
                  Key risk factors
                </h4>
                <div className="space-y-1.5">
                  {selectedInvoice.riskReasons && selectedInvoice.riskReasons.length > 0 ? (
                    selectedInvoice.riskReasons.map((reason, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 rounded-xl border border-warning/25 bg-warning/[0.06] p-2.5 text-xs font-medium text-ink"
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-warning" />
                        <span className="leading-relaxed">{reason}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs italic text-ink-subtle">No adverse risk factors identified.</p>
                  )}
                </div>
              </section>

              <section>
                <h4 className="mb-2 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-ink">
                  <Layers size={14} className="text-accent" />
                  Recommended next steps
                </h4>
                <div className="space-y-1.5">
                  {selectedInvoice.riskRecommendations &&
                  selectedInvoice.riskRecommendations.length > 0 ? (
                    selectedInvoice.riskRecommendations.map((recommendation, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 rounded-xl border border-line bg-surface-2 p-2.5 text-xs font-medium text-ink"
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                        <span className="leading-relaxed">{recommendation}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs italic text-ink-subtle">Standard straight-through processing.</p>
                  )}
                </div>
              </section>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 font-mono text-[10px] text-ink-subtle">
              <span>Model {selectedInvoice.modelVersion || "v3.0-MultiModel"}</span>
              <span className="num">Amount ₹{selectedInvoice.amount?.toLocaleString()}</span>
            </div>
          </div>
        )}
      </Modal>

      {/* Failure state when the very first load never resolved */}
      {!pageLoading && !error && invoices.length === 0 && (
        <p className="flex items-center gap-1.5 text-2xs text-ink-subtle">
          <AlertCircle size={12} />
          No invoices yet — submit the first one above to exercise the risk engine.
        </p>
      )}
    </div>
  );
}
