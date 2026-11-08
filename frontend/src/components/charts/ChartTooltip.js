import React from "react";

/**
 * Recharts tooltip styled with the same tokens as the rest of the UI so it is
 * legible in both themes without hardcoded hex values.
 */
export default function ChartTooltip({ active, payload, label, valueSuffix = "", labelFormatter }) {
  if (!active || !payload || !payload.length) return null;

  const point = payload[0].payload || {};
  const heading = labelFormatter ? labelFormatter(label, point) : label || payload[0].name;

  return (
    <div className="rounded-xl border border-line bg-surface/95 px-3 py-2.5 text-xs shadow-pop backdrop-blur-md">
      <p className="mb-1 font-semibold text-ink">{heading}</p>
      <div className="flex items-center gap-2">
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: payload[0].color || payload[0].fill || "rgb(var(--c-accent))" }}
        />
        <span className="text-ink-muted">{payload[0].name}</span>
        <span className="num ml-auto font-bold text-ink">
          {payload[0].value}
          {valueSuffix}
        </span>
      </div>
      {point.spentAmount !== undefined && point.allocatedAmount !== undefined && (
        <p className="num mt-1 text-[10px] text-ink-subtle">
          ₹{Number(point.spentAmount).toLocaleString()} spent of ₹
          {Number(point.allocatedAmount).toLocaleString()}
        </p>
      )}
    </div>
  );
}
