import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck, Sparkles, TrendingUp, Zap } from "lucide-react";
import Logo from "../Logo";
import ThemeSwitcher from "../ThemeSwitcher";

const HIGHLIGHTS = [
  { icon: Zap, title: "Sub-second risk scoring", text: "ML ensemble on every invoice submission." },
  { icon: ShieldCheck, title: "Deterministic guardrails", text: "YAML policy engine with hot reload." },
  { icon: TrendingUp, title: "Continuous governance", text: "Budget, vendor and anomaly monitoring." },
];

/**
 * Two-panel frame shared by the login and registration screens.
 */
export default function AuthLayout({ children, badge, footerNote }) {
  return (
    <div className="relative flex min-h-screen flex-col bg-canvas lg:flex-row">
      {/* Brand panel */}
      <aside className="relative hidden w-[46%] max-w-[620px] flex-col justify-between overflow-hidden bg-slate-950 p-10 text-white lg:flex xl:p-12">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 10%, rgba(139,92,246,0.45), transparent 45%), radial-gradient(circle at 85% 75%, rgba(59,130,246,0.35), transparent 45%)",
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />

        <div className="relative">
          <Link to="/" className="inline-flex items-center gap-3">
            <Logo size={38} />
            <span>
              <span className="block text-sm font-extrabold leading-tight tracking-tight">
                Enterprise Decision Hub
              </span>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-white/50">
                AI risk & governance
              </span>
            </span>
          </Link>
        </div>

        <div className="relative max-w-md">
          {badge && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/85 backdrop-blur">
              <Sparkles size={12} />
              {badge}
            </span>
          )}
          <h2 className="mt-4 text-3xl font-extrabold leading-[1.15] tracking-tight xl:text-[2.5rem]">
            Every financial decision,
            <span className="bg-gradient-to-r from-violet-300 to-sky-300 bg-clip-text text-transparent">
              {" "}
              scored before it lands.
            </span>
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-white/65">
            Duplicate detection, surplus flagging and policy enforcement in one console built for
            finance and compliance teams.
          </p>

          <ul className="mt-8 space-y-4">
            {HIGHLIGHTS.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.title} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/10">
                    <Icon size={15} className="text-violet-200" />
                  </span>
                  <span>
                    <span className="block text-xs font-semibold text-white">{item.title}</span>
                    <span className="block text-[11px] leading-relaxed text-white/55">
                      {item.text}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="relative flex items-center justify-between border-t border-white/10 pt-5 text-[11px] text-white/40">
          <span>© {new Date().getFullYear()} Enterprise Decision Hub</span>
          <span className="font-mono">SOC-ready · JWT · RBAC</span>
        </div>
      </aside>

      {/* Form panel */}
      <main className="flex flex-1 flex-col">
        <div className="flex items-center justify-between px-5 py-5 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5 lg:invisible" aria-hidden="true">
            <Logo size={32} />
            <span className="text-sm font-extrabold tracking-tight text-ink">Decision Hub</span>
          </Link>

          <div className="flex items-center gap-2">
            <ThemeSwitcher compact />
            <Link
              to="/"
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-line bg-surface px-3 text-xs font-semibold text-ink-muted transition-colors hover:border-line-strong hover:text-ink"
            >
              <ArrowLeft size={14} />
              Home
            </Link>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-5 pb-10 sm:px-8">
          <div className="w-full max-w-[420px]">{children}</div>
        </div>

        {footerNote && (
          <p className="px-5 pb-6 text-center text-[11px] text-ink-subtle sm:px-8">{footerNote}</p>
        )}
      </main>
    </div>
  );
}
