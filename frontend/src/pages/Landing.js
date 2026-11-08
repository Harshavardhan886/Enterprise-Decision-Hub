import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Cpu,
  FileCheck,
  Layers,
  Menu,
  Shield,
  ShieldCheck,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import Logo from "../components/Logo";
import ThemeSwitcher from "../components/ThemeSwitcher";

const FEATURES = [
  {
    id: "overview",
    label: "Overview",
    icon: Layers,
    badge: "Platform",
    title: "Unified financial intelligence & operations",
    description:
      "Enterprise Decision Hub combines automated invoice parsing, real-time ML risk scoring, budget enforcement and immutable audit logs into a single command centre.",
    highlights: [
      "Real-time synchronised KPIs for invoices, vendors and alerts",
      "Interactive budget utilisation tracking with 80% and 100% threshold monitors",
      "Unified vendor risk directory with historical performance trends",
      "Instant resolution workflows for security and risk notifications",
    ],
    stats: [
      { label: "Processing speed", value: "< 250ms" },
      { label: "Risk precision", value: "98.4%" },
      { label: "Data integrity", value: "100%" },
    ],
  },
  {
    id: "risk-ai",
    label: "Risk AI",
    icon: Cpu,
    badge: "Machine learning",
    title: "Dual ML engine: Random Forest + Isolation Forest",
    description:
      "Every incoming transaction is evaluated across high-dimensional feature vectors including amount anomalies, vendor variance, historical duplicate patterns and category risk thresholds.",
    highlights: [
      "FastAPI microservice running scikit-learn ensemble models",
      "Automatic high / medium / low classification based on ML confidence",
      "Instant duplicate detection fingerprinting across vendor and invoice numbers",
      "Real-time anomaly scores streamed into the Spring Boot APIs",
    ],
    stats: [
      { label: "ML accuracy", value: "96.8%" },
      { label: "Anomaly detection", value: "Real-time" },
      { label: "False positives", value: "< 1.2%" },
    ],
  },
  {
    id: "automations",
    label: "Automations",
    icon: Sparkles,
    badge: "Workflow engine",
    title: "Zero-touch invoicing & smart approvals",
    description:
      "Eliminate manual data entry and human error. Automatically trigger budget hold alerts, vendor risk recalculations and approval pipelines.",
    highlights: [
      "Instant automated notifications on high-risk detection",
      "Overspend prevention triggered before invoice clearance",
      "One-click resolution with optimistic updates across every tab",
      "Automatic vendor score adjustments when invoice status changes",
    ],
    stats: [
      { label: "Time saved", value: "85%" },
      { label: "Manual effort", value: "-90%" },
      { label: "Auto-triage", value: "Instant" },
    ],
  },
  {
    id: "security",
    label: "Security",
    icon: Shield,
    badge: "Enterprise grade",
    title: "Hardened zero-trust architecture",
    description:
      "Built on strict security foundations to protect mission-critical corporate financial data and comply with enterprise data sovereignty standards.",
    highlights: [
      "Stateless JWT authentication with BCrypt password hashing",
      "Role-based access control separating admin and viewer capabilities",
      "RFC-standardised global exception handling prevents stack trace leaks",
      "Comprehensive server-side validation rejects invalid payloads",
    ],
    stats: [
      { label: "Auth standard", value: "JWT" },
      { label: "Hashing", value: "BCrypt" },
      { label: "Uptime SLA", value: "99.99%" },
    ],
  },
  {
    id: "compliance",
    label: "Compliance",
    icon: FileCheck,
    badge: "Governance",
    title: "Audit-ready financial governance",
    description:
      "Full transparency for finance directors, compliance officers and external auditors with immutable event logs and budget tracking.",
    highlights: [
      "Granular audit trails for every creation, status change and resolution",
      "Strict department-level budget allocation enforcement",
      "Exportable reporting data formatted for financial audits",
      "Pre-configured governance standards aligned with GAAP / SOX",
    ],
    stats: [
      { label: "Audit trails", value: "100%" },
      { label: "Governance", value: "A+" },
      { label: "SOX readiness", value: "Built-in" },
    ],
  },
];

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFeatureId, setActiveFeatureId] = useState(null);
  const navigate = useNavigate();

  const activeFeature = FEATURES.find((feature) => feature.id === activeFeatureId);

  useEffect(() => {
    const shouldLock = mobileMenuOpen || Boolean(activeFeatureId);
    document.body.style.overflow = shouldLock ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen, activeFeatureId]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setActiveFeatureId(null);
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-canvas text-ink">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-line bg-canvas/80 backdrop-blur-xl">
        <nav className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-4 px-5 sm:px-8">
          <Link to="/" className="flex items-center gap-3">
            <Logo size={34} />
            <span>
              <span className="block text-sm font-extrabold leading-tight tracking-tight text-ink">
                Enterprise Decision Hub
              </span>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-subtle">
                AI risk & governance
              </span>
            </span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {FEATURES.map((feature) => (
              <button
                key={feature.id}
                type="button"
                onClick={() => setActiveFeatureId(feature.id)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
              >
                {feature.label}
              </button>
            ))}
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <ThemeSwitcher compact />
            <Link
              to="/login"
              className="inline-flex h-9 items-center rounded-lg px-3 text-sm font-semibold text-ink-muted transition-colors hover:text-ink"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-accent px-4 text-sm font-semibold text-white shadow-sm transition-all hover:bg-accent-hover"
            >
              Get started
              <ArrowRight size={15} />
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-2 md:hidden"
          >
            <Menu size={20} />
          </button>
        </nav>
      </header>

      {/* Hero */}
      <main>
        <section className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.55]"
            style={{
              backgroundImage:
                "radial-gradient(600px circle at 15% 0%, rgba(139,92,246,0.18), transparent 60%), radial-gradient(500px circle at 90% 20%, rgba(56,189,248,0.14), transparent 60%)",
            }}
          />

          <div className="relative mx-auto grid max-w-[1200px] items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-2 lg:py-24">
            <div className="animate-rise-in">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/25 bg-accent/[0.07] px-3 py-1 text-[11px] font-semibold text-accent">
                <Sparkles size={12} />
                ML risk scoring + deterministic policy control
              </span>

              <h1 className="mt-4 text-3xl font-extrabold leading-[1.1] tracking-tight text-ink sm:text-4xl lg:text-[2.9rem]">
                Automate financial decisions with{" "}
                <span className="bg-gradient-to-r from-accent to-info bg-clip-text text-transparent">
                  AI risk intelligence
                </span>
              </h1>

              <p className="mt-4 max-w-lg text-sm leading-relaxed text-ink-muted sm:text-base">
                Zero financial blind spots, total operational control. Enterprise Decision Hub unifies
                ML-powered risk scoring, automated invoice duplicate detection and proactive budget
                governance for modern finance teams.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  to="/register"
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-accent px-6 text-sm font-semibold text-white shadow-glow transition-all hover:bg-accent-hover"
                >
                  Get started
                  <ArrowRight size={16} />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-line bg-surface px-5 text-sm font-semibold text-ink transition-all hover:border-line-strong hover:bg-surface-2"
                >
                  <ShieldCheck size={16} className="text-accent" />
                  Sign in to console
                </Link>
              </div>

              <dl className="mt-10 grid max-w-md grid-cols-3 gap-4 border-t border-line pt-5">
                {[
                  { label: "Risk precision", value: "98.4%" },
                  { label: "Scoring latency", value: "<250ms" },
                  { label: "Audit coverage", value: "100%" },
                ].map((stat) => (
                  <div key={stat.label}>
                    <dd className="num text-lg font-extrabold text-ink">{stat.value}</dd>
                    <dt className="text-[10px] font-semibold uppercase tracking-wider text-ink-subtle">
                      {stat.label}
                    </dt>
                  </div>
                ))}
              </dl>
            </div>

            {/* Product preview */}
            <div className="animate-rise-in [animation-delay:120ms]">
              <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-pop">
                <div className="flex items-center gap-2 border-b border-line bg-surface-2 px-4 py-2.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-danger/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
                  <span className="ml-2 font-mono text-[10px] text-ink-subtle">
                    decision-hub / dashboard
                  </span>
                </div>

                <div className="space-y-4 p-5">
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      { label: "Invoices", value: "1,284", tone: "text-accent" },
                      { label: "Critical", value: "12", tone: "text-danger" },
                      { label: "Surplus", value: "37", tone: "text-violet-500" },
                    ].map((card) => (
                      <div key={card.label} className="rounded-xl border border-line bg-surface-2 p-3">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-ink-subtle">
                          {card.label}
                        </span>
                        <div className={`num text-lg font-extrabold ${card.tone}`}>{card.value}</div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl border border-line bg-surface-2 p-3.5">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-ink-subtle">
                        Risk distribution
                      </span>
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold text-success">
                        <span className="h-1.5 w-1.5 rounded-full bg-success" />
                        LIVE
                      </span>
                    </div>
                    <div className="flex h-24 items-end gap-2">
                      {[38, 62, 45, 78, 54, 90, 41, 68].map((height, index) => (
                        <div
                          key={index}
                          className="flex-1 rounded-t bg-gradient-to-t from-accent/40 to-accent"
                          style={{ height: `${height}%` }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 rounded-xl border border-success/25 bg-success/10 px-3 py-2">
                    <CheckCircle2 size={14} className="text-success" />
                    <span className="text-[10px] font-semibold text-success">
                      Duplicate invoice INV-9042 blocked by policy engine
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature cards */}
        <section className="border-t border-line bg-surface-2/40">
          <div className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-extrabold tracking-tight text-ink">
                Five layers of financial control
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                Every capability is wired into a single evidence trail — from the moment an invoice is
                submitted to the moment an auditor signs off.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => {
                const Icon = feature.icon;
                return (
                  <button
                    key={feature.id}
                    type="button"
                    onClick={() => setActiveFeatureId(feature.id)}
                    className="group rounded-2xl border border-line bg-surface p-5 text-left transition-all hover:-translate-y-0.5 hover:border-line-strong hover:shadow-pop"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                      <Icon size={19} />
                    </span>
                    <span className="mt-3 block text-[10px] font-bold uppercase tracking-wider text-ink-subtle">
                      {feature.badge}
                    </span>
                    <h3 className="mt-1 text-sm font-bold text-ink">{feature.title}</h3>
                    <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-ink-muted">
                      {feature.description}
                    </p>
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-accent">
                      Explore
                      <ArrowRight
                        size={13}
                        className="transition-transform group-hover:translate-x-0.5"
                      />
                    </span>
                  </button>
                );
              })}

              <div className="flex flex-col justify-center rounded-2xl border border-accent/25 bg-gradient-to-br from-accent/10 to-transparent p-5">
                <Zap size={20} className="text-accent" />
                <h3 className="mt-2 text-sm font-bold text-ink">Ready in minutes</h3>
                <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                  Sign in with a demo account and submit an invoice to watch the risk engine respond.
                </p>
                <Link
                  to="/login"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
                >
                  Open the console
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-3 px-5 py-6 text-xs text-ink-subtle sm:flex-row sm:px-8">
          <span>© {new Date().getFullYear()} Enterprise Decision Hub. All rights reserved.</span>
          <span className="flex items-center gap-1.5">
            <BarChart3 size={13} />
            Built for finance, audit and compliance teams
          </span>
        </div>
      </footer>

      {/* Feature detail modal */}
      {activeFeature && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
          <div
            className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm animate-fade-in"
            onClick={() => setActiveFeatureId(null)}
          />
          <div className="relative z-10 flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-line bg-surface shadow-pop animate-scale-in sm:rounded-3xl">
            <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <activeFeature.icon size={19} />
                </span>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-accent">
                    {activeFeature.badge}
                  </span>
                  <h2 className="text-lg font-bold leading-tight text-ink">{activeFeature.label}</h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveFeatureId(null)}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
              >
                <X size={17} />
              </button>
            </div>

            <div className="flex gap-1.5 overflow-x-auto border-b border-line bg-surface-2 px-5 py-2.5 sm:px-6">
              {FEATURES.map((feature) => (
                <button
                  key={feature.id}
                  type="button"
                  onClick={() => setActiveFeatureId(feature.id)}
                  className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                    feature.id === activeFeatureId
                      ? "bg-accent text-white"
                      : "text-ink-muted hover:bg-surface-3"
                  }`}
                >
                  {feature.label}
                </button>
              ))}
            </div>

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
              <div>
                <h3 className="text-base font-bold text-ink">{activeFeature.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                  {activeFeature.description}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {activeFeature.stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl border border-accent/20 bg-accent/[0.06] p-3 text-center"
                  >
                    <div className="text-base font-extrabold text-accent">{stat.value}</div>
                    <div className="mt-0.5 text-[10px] font-medium text-ink-muted">{stat.label}</div>
                  </div>
                ))}
              </div>

              <div>
                <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-ink-subtle">
                  Core capabilities
                </h4>
                <div className="space-y-2">
                  {activeFeature.highlights.map((highlight) => (
                    <div
                      key={highlight}
                      className="flex items-start gap-2.5 rounded-xl border border-line bg-surface-2 p-3"
                    >
                      <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-success" />
                      <span className="text-xs font-medium leading-relaxed text-ink">{highlight}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-line bg-surface-2 px-5 py-3.5 sm:px-6">
              <button
                type="button"
                onClick={() => setActiveFeatureId(null)}
                className="rounded-xl px-4 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-3 hover:text-ink"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveFeatureId(null);
                  navigate("/register");
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-accent-hover"
              >
                Get started
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm animate-fade-in"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="absolute right-0 top-0 flex h-full w-[min(86vw,340px)] flex-col justify-between border-l border-line bg-surface p-5 animate-fade-in">
            <div>
              <div className="flex items-center justify-between pb-4">
                <div className="flex items-center gap-2.5">
                  <Logo size={30} />
                  <span className="text-sm font-extrabold tracking-tight text-ink">
                    Decision Hub
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close menu"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-2"
                >
                  <X size={19} />
                </button>
              </div>

              <div className="divider" />

              <nav className="flex flex-col gap-1 py-3">
                {FEATURES.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <button
                      key={feature.id}
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setActiveFeatureId(feature.id);
                      }}
                      className="flex items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-medium text-ink transition-colors hover:bg-surface-2"
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon size={17} className="text-ink-subtle" />
                        {feature.label}
                      </span>
                      <span className="rounded-md bg-accent/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-accent">
                        {feature.badge}
                      </span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="flex flex-col gap-2 border-t border-line pt-4">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex h-11 items-center justify-center rounded-xl border border-line bg-surface-2 text-sm font-semibold text-ink"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-accent text-sm font-semibold text-white"
              >
                Get started
                <ArrowRight size={15} />
              </Link>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
