import React from "react";
import cn from "../../lib/cn";

/** Card shell. `interactive` adds a lift-on-hover treatment. */
export default function Card({ as: Tag = "div", interactive = false, className, children, ...props }) {
  return (
    <Tag className={cn("card", interactive && "card-interactive", className)} {...props}>
      {children}
    </Tag>
  );
}

/** Card section with a consistent title row and optional action slot. */
export function CardHeader({ title, subtitle, icon: Icon, action, className }) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-3", className)}>
      <div className="flex min-w-0 items-start gap-3">
        {Icon && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <Icon size={17} />
          </span>
        )}
        <div className="min-w-0">
          <h3 className="truncate text-sm font-bold text-ink">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}

export function CardBody({ className, children }) {
  return <div className={cn("p-5 sm:p-6", className)}>{children}</div>;
}

export function CardDivider({ className }) {
  return <div className={cn("divider", className)} />;
}
