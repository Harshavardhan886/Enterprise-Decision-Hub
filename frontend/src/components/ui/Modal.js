import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import cn from "../../lib/cn";

const SIZES = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-3xl",
  xl: "max-w-5xl",
};

/**
 * Accessible modal: traps scroll, closes on Escape and backdrop click.
 * Rendered in a portal so parent stacking contexts cannot clip it.
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  icon: Icon,
  iconTone = "accent",
  size = "md",
  footer,
  children,
  bodyClassName,
}) {
  useEffect(() => {
    if (!isOpen) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose?.();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const iconTones = {
    accent: "bg-accent/10 text-accent",
    danger: "bg-danger/10 text-danger",
    warning: "bg-warning/10 text-warning",
    success: "bg-success/10 text-success",
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-sm animate-fade-in sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : undefined}
        className={cn(
          "flex max-h-[92dvh] w-full flex-col overflow-hidden border border-line bg-surface shadow-pop",
          "animate-scale-in rounded-t-3xl sm:rounded-3xl",
          SIZES[size]
        )}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-start gap-3">
            {Icon && (
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                  iconTones[iconTone] || iconTones.accent
                )}
              >
                <Icon size={17} />
              </span>
            )}
            <div className="min-w-0">
              <h2 className="text-base font-bold leading-tight text-ink">{title}</h2>
              {description && (
                <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">{description}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="-mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <X size={17} />
          </button>
        </div>

        <div className={cn("min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6", bodyClassName)}>
          {children}
        </div>

        {footer && (
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-line bg-surface-2 px-5 py-3.5 sm:px-6">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
