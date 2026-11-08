import React from "react";
import cn from "../../lib/cn";

/** Standard page masthead: eyebrow, title, description and action cluster. */
export default function PageHeader({ eyebrow, title, description, badge, actions, className }) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 border-b border-line pb-5 lg:flex-row lg:items-end lg:justify-between",
        className
      )}
    >
      <div className="min-w-0 flex-1">
        {eyebrow && (
          <p className="mb-1.5 text-2xs font-bold uppercase tracking-[0.14em] text-accent">
            {eyebrow}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-xl font-extrabold leading-tight text-ink sm:text-2xl">{title}</h1>
          {badge}
        </div>
        {description && (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-muted">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">{actions}</div>
      )}
    </header>
  );
}

/** Small count/status pill used in headers and toolbars. */
export function MetaPill({ label, value, tone = "neutral" }) {
  const tones = {
    neutral: "border-line bg-surface text-ink",
    accent: "border-accent/25 bg-accent/10 text-accent",
    danger: "border-danger/25 bg-danger/10 text-danger",
    success: "border-success/25 bg-success/10 text-success",
    purple: "border-violet-500/25 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm",
        tones[tone] || tones.neutral
      )}
    >
      <span className="text-ink-muted">{label}</span>
      <span className="num font-bold">{value}</span>
    </span>
  );
}
