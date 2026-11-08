import React from "react";
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from "lucide-react";
import cn from "../../lib/cn";

const TONES = {
  danger: {
    wrap: "border-danger/25 bg-danger/10 text-danger",
    icon: AlertCircle,
  },
  success: {
    wrap: "border-success/25 bg-success/10 text-success",
    icon: CheckCircle2,
  },
  warning: {
    wrap: "border-warning/30 bg-warning/10 text-warning",
    icon: AlertTriangle,
  },
  info: {
    wrap: "border-info/25 bg-info/10 text-info",
    icon: Info,
  },
};

/** Inline banner for errors, confirmations and advisories. */
export default function Alert({ tone = "danger", title, children, onDismiss, className }) {
  const config = TONES[tone] || TONES.danger;
  const Icon = config.icon;

  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2.5 rounded-xl border px-4 py-3 text-xs font-medium animate-fade-in",
        config.wrap,
        className
      )}
    >
      <Icon size={16} className="mt-px shrink-0" />
      <div className="min-w-0 flex-1 leading-relaxed">
        {title && <p className="font-bold">{title}</p>}
        <div className={cn(title && "mt-0.5", "opacity-95")}>{children}</div>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="shrink-0 rounded-md p-0.5 transition-opacity hover:opacity-70"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
