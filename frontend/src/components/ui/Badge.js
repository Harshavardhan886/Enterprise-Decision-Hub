import React from "react";
import cn from "../../lib/cn";

const TONES = {
  neutral: "border-line bg-surface-2 text-ink-muted",
  accent: "border-accent/25 bg-accent/10 text-accent",
  success: "border-success/25 bg-success/10 text-success",
  warning: "border-warning/25 bg-warning/10 text-warning",
  danger: "border-danger/25 bg-danger/10 text-danger",
  info: "border-info/25 bg-info/10 text-info",
  orange: "border-orange-500/25 bg-orange-500/10 text-orange-700 dark:text-orange-300",
  purple: "border-violet-500/25 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  pink: "border-pink-500/25 bg-pink-500/10 text-pink-700 dark:text-pink-300",
};

const DOTS = {
  neutral: "bg-ink-subtle",
  accent: "bg-accent",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
  orange: "bg-orange-500",
  purple: "bg-violet-500",
  pink: "bg-pink-500",
};

const SIZES = {
  sm: "gap-1 px-2 py-0.5 text-[10px]",
  md: "gap-1.5 px-2.5 py-1 text-[11px]",
};

export default function Badge({
  tone = "neutral",
  size = "md",
  icon: Icon,
  dot = false,
  className,
  children,
  ...props
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-semibold leading-none",
        SIZES[size],
        TONES[tone] || TONES.neutral,
        className
      )}
      {...props}
    >
      {dot && (
        <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", DOTS[tone] || DOTS.neutral)} />
      )}
      {Icon && <Icon size={11} className="shrink-0" />}
      {children}
    </span>
  );
}
