import React, { useEffect, useMemo, useState } from "react";
import { AlertCircle, PlusCircle, Trash2, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import api from "../services/api";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import Card, { CardBody, CardHeader } from "../components/ui/Card";
import ConfirmModal from "../components/ConfirmModal";
import EmptyState from "../components/ui/EmptyState";
import PageHeader, { MetaPill } from "../components/ui/PageHeader";
import StatCard from "../components/ui/StatCard";
import { Field, Input, Select } from "../components/ui/Field";
import { Table, TBody, Td, Th, THead, Tr } from "../components/ui/Table";

const ERR = "Cannot reach the backend. Make sure it is running on port 8080.";
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DEPARTMENTS = ["Finance", "HR", "Operations", "Inventory", "Engineering", "Marketing"];

export default function Budgets() {
  const currentYear = new Date().getFullYear();
  const emptyForm = {
    department: "Finance",
    month: new Date().toLocaleString("default", { month: "long" }),
    year: currentYear,
    allocatedAmount: "",
    spentAmount: "",
  };

  const [budgets, setBudgets] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [spendEdit, setSpendEdit] = useState({});

  useEffect(() => {
    document.title = "EDH — Budget Governance";
  }, []);

  const load = () => {
    setError(null);
    api
      .get("/budgets")
      .then((res) => setBudgets(res.data || []))
      .catch(() => setError(ERR));
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.allocatedAmount) return;

    setLoading(true);
    try {
      await api.post("/budgets", {
        ...form,
        allocatedAmount: parseFloat(form.allocatedAmount),
        spentAmount: parseFloat(form.spentAmount || 0),
        year: parseInt(form.year, 10),
      });
      setForm({ ...emptyForm });
      load();
    } catch {
      setError(ERR);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSpend = async (id) => {
    const value = spendEdit[id];
    if (value === undefined || value === "") return;

    try {
      await api.put(`/budgets/${id}/spend`, { spentAmount: parseFloat(value) });
      setSpendEdit((previous) => {
        const next = { ...previous };
        delete next[id];
        return next;
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

  const totals = useMemo(() => {
    const allocated = budgets.reduce((sum, b) => sum + (b.allocatedAmount || 0), 0);
    const spent = budgets.reduce((sum, b) => sum + (b.spentAmount || 0), 0);
    const overspending = budgets.filter((b) => b.allocatedAmount > 0 && b.spentAmount > b.allocatedAmount).length;
    return { allocated, spent, overspending, remaining: allocated - spent };
  }, [budgets]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operations"
        title="Budget Governance"
        description="Track department allocations, monitor spend ratios and stop overspending before it clears."
        actions={<MetaPill label="Budgets" value={budgets.length} />}
      />

      {error && <Alert tone="danger">{error}</Alert>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total allocated"
          value={`₹${totals.allocated.toLocaleString()}`}
          icon={Wallet}
        />
        <StatCard
          label="Total spent"
          value={`₹${totals.spent.toLocaleString()}`}
          icon={TrendingUp}
          tone="warning"
        />
        <StatCard
          label="Remaining headroom"
          value={`₹${totals.remaining.toLocaleString()}`}
          icon={TrendingDown}
          tone={totals.remaining < 0 ? "danger" : "success"}
        />
        <StatCard
          label="Overspending budgets"
          value={totals.overspending}
          sub={`${budgets.length} tracked`}
          icon={AlertCircle}
          tone="danger"
        />
      </div>

      <Card>
        <CardBody>
          <CardHeader
            icon={PlusCircle}
            title="Allocate department budget"
            subtitle="Establish the governance limit that automated spend tracking measures against."
          />

          <form onSubmit={handleSubmit} className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
            <Field label="Department" className="lg:col-span-1">
              <Select
                value={form.department}
                onChange={(event) => setForm({ ...form, department: event.target.value })}
              >
                {DEPARTMENTS.map((department) => (
                  <option key={department}>{department}</option>
                ))}
              </Select>
            </Field>

            <Field label="Month" className="lg:col-span-1">
              <Select
                value={form.month}
                onChange={(event) => setForm({ ...form, month: event.target.value })}
              >
                {MONTHS.map((month) => (
                  <option key={month}>{month}</option>
                ))}
              </Select>
            </Field>

            <Field label="Year" className="lg:col-span-1">
              <Input
                type="number"
                value={form.year}
                onChange={(event) => setForm({ ...form, year: event.target.value })}
                required
              />
            </Field>

            <Field label="Allocated (₹)" className="lg:col-span-1">
              <Input
                type="number"
                placeholder="100000"
                value={form.allocatedAmount}
                onChange={(event) => setForm({ ...form, allocatedAmount: event.target.value })}
                required
              />
            </Field>

            <Field label="Initial spent (₹)" className="lg:col-span-1">
              <Input
                type="number"
                placeholder="0"
                value={form.spentAmount}
                onChange={(event) => setForm({ ...form, spentAmount: event.target.value })}
              />
            </Field>

            <div className="flex items-end lg:col-span-1">
              <Button type="submit" icon={PlusCircle} loading={loading} fullWidth>
                {loading ? "Allocating…" : "Save budget"}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      <Card className="overflow-hidden">
        <Table>
          <THead>
            <Th>Department</Th>
            <Th>Period</Th>
            <Th className="text-right">Allocated</Th>
            <Th className="text-right">Spent</Th>
            <Th className="text-right">Remaining</Th>
            <Th className="w-56">Utilisation</Th>
            <Th>Update spend</Th>
            <Th className="text-right">Delete</Th>
          </THead>
          <TBody>
            {budgets.map((budget) => {
              const percent =
                budget.allocatedAmount > 0
                  ? Math.round((budget.spentAmount / budget.allocatedAmount) * 100)
                  : 0;
              const isOver = percent > 100;
              const isWarning = percent > 80 && !isOver;
              const remaining = (budget.allocatedAmount || 0) - (budget.spentAmount || 0);

              return (
                <Tr key={budget.id}>
                  <Td className="font-bold">{budget.department}</Td>
                  <Td className="whitespace-nowrap text-xs text-ink-muted">
                    {budget.month} {budget.year}
                  </Td>
                  <Td className="num text-right font-semibold">
                    ₹{budget.allocatedAmount?.toLocaleString()}
                  </Td>
                  <Td className="num text-right font-semibold">
                    ₹{budget.spentAmount?.toLocaleString()}
                  </Td>
                  <Td className={`num text-right font-semibold ${remaining < 0 ? "text-danger" : "text-success"}`}>
                    ₹{remaining.toLocaleString()}
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2.5">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isOver ? "bg-danger" : isWarning ? "bg-warning" : "bg-accent"
                          }`}
                          style={{ width: `${Math.min(percent, 100)}%` }}
                        />
                      </div>
                      <span
                        className={`num w-10 text-right text-xs font-bold ${
                          isOver ? "text-danger" : "text-ink"
                        }`}
                      >
                        {percent}%
                      </span>
                    </div>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-1.5">
                      <Input
                        type="number"
                        size="sm"
                        placeholder="New amount"
                        aria-label={`Update spend for ${budget.department}`}
                        value={spendEdit[budget.id] ?? ""}
                        onChange={(event) =>
                          setSpendEdit({ ...spendEdit, [budget.id]: event.target.value })
                        }
                        className="w-28"
                      />
                      <Button
                        variant="subtle"
                        size="sm"
                        onClick={() => handleUpdateSpend(budget.id)}
                      >
                        Set
                      </Button>
                    </div>
                  </Td>
                  <Td className="text-right">
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(budget)}
                      title="Delete budget"
                      aria-label={`Delete ${budget.department} budget`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-subtle transition-colors hover:bg-danger/10 hover:text-danger"
                    >
                      <Trash2 size={15} />
                    </button>
                  </Td>
                </Tr>
              );
            })}
          </TBody>
        </Table>

        {budgets.length === 0 && (
          <EmptyState
            icon={Wallet}
            title="No budgets created yet"
            description="Allocate a department budget above to start enforcing automated spend limits."
          />
        )}
      </Card>

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete budget"
        message={`Delete the ${deleteTarget?.department} budget for ${deleteTarget?.month} ${deleteTarget?.year}? This cannot be undone.`}
        confirmText="Delete budget"
        isDestructive
        onConfirm={() => handleDelete(deleteTarget?.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
