import React from "react";
import cn from "../../lib/cn";

/**
 * Segmented control for switching views inside a panel.
 * items: [{ value, label, icon, count }]
 */
export function SegmentedControl({ value, onChange, items, className, size = "md" }) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex items-center gap-1 rounded-xl border border-line bg-surface-2 p-1",
        className
      )}
    >
      {items.map((item) => {
        const active = item.value === value;
        const Icon = item.icon;
        return (
          <button
            key={item.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg font-semibold transition-all duration-150",
              size === "sm" ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-xs",
              active
                ? "bg-surface text-ink shadow-sm ring-1 ring-line"
                : "text-ink-muted hover:text-ink"
            )}
          >
            {Icon && <Icon size={13} />}
            <span className="whitespace-nowrap">{item.label}</span>
            {item.count !== undefined && (
              <span
                className={cn(
                  "num rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none",
                  active ? "bg-accent/10 text-accent" : "bg-surface-3 text-ink-subtle"
                )}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Pill-style filter row (entity type, risk level, ...).
 * items may be strings or { value, label }.
 */
export function FilterChips({ value, onChange, items, className }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {items.map((raw) => {
        const item = typeof raw === "string" ? { value: raw, label: raw } : raw;
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(item.value)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-150",
              active
                ? "border-accent/30 bg-accent text-white shadow-sm"
                : "border-line bg-surface text-ink-muted hover:border-line-strong hover:text-ink"
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
