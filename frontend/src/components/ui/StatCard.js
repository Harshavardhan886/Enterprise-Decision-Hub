import React from "react";
import cn from "../../lib/cn";

/**
 * KPI tile. The accent rail on the left edge keeps a grid of these from
 * reading as a flat wall of numbers.
 */
export default function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = "accent",
  footer,
  className,
}) {
  const tones = {
    accent: { chip: "bg-accent/10 text-accent", rail: "bg-accent" },
    danger: { chip: "bg-danger/10 text-danger", rail: "bg-danger" },
    warning: { chip: "bg-warning/10 text-warning", rail: "bg-warning" },
    success: { chip: "bg-success/10 text-success", rail: "bg-success" },
    info: { chip: "bg-info/10 text-info", rail: "bg-info" },
    purple: {
      chip: "bg-violet-500/10 text-violet-600 dark:text-violet-300",
      rail: "bg-violet-500",
    },
  };
  const t = tones[tone] || tones.accent;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-line bg-surface p-4 shadow-card transition-all duration-200",
        "hover:-translate-y-0.5 hover:border-line-strong hover:shadow-pop",
        className
      )}
    >
      <span className={cn("absolute inset-y-0 left-0 w-[3px] opacity-80", t.rail)} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-2xs font-semibold uppercase leading-tight tracking-wider text-ink-muted">
            {label}
          </p>
          <p className="num mt-1.5 text-2xl font-extrabold leading-none text-ink sm:text-[1.7rem]">
            {value}
          </p>
        </div>
        {Icon && (
          <span
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105",
              t.chip
            )}
          >
            <Icon size={17} />
          </span>
        )}
      </div>
      {sub && <div className="mt-2.5 text-xs leading-relaxed text-ink-muted">{sub}</div>}
      {footer && <div className="mt-3 border-t border-line pt-2.5 text-2xs">{footer}</div>}
    </div>
  );
}
