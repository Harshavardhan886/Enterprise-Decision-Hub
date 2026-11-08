import React from "react";
import { ChevronDown } from "lucide-react";
import cn from "../../lib/cn";

/** Label + control + hint/error wrapper used by every form in the app. */
export function Field({ label, hint, error, htmlFor, className, children }) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={htmlFor} className="label">
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p className="mt-1 text-[10px] font-medium text-danger">{error}</p>
      ) : (
        hint && <p className="mt-1 text-[10px] text-ink-subtle">{hint}</p>
      )}
    </div>
  );
}

export const Input = React.forwardRef(function Input(
  { invalid = false, size = "md", className, ...props },
  ref
) {
  return (
    <input
      ref={ref}
      className={cn("field", size === "sm" && "field-sm", invalid && "field-invalid", className)}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
});

export const Textarea = React.forwardRef(function Textarea(
  { invalid = false, className, ...props },
  ref
) {
  return (
    <textarea
      ref={ref}
      className={cn("field resize-y leading-relaxed", invalid && "field-invalid", className)}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
});

export const Select = React.forwardRef(function Select(
  { invalid = false, size = "md", className, children, ...props },
  ref
) {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          "field cursor-pointer appearance-none pr-9",
          size === "sm" && "field-sm pr-8",
          invalid && "field-invalid",
          className
        )}
        aria-invalid={invalid || undefined}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        size={15}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-subtle"
      />
    </div>
  );
});

/** Search input with a leading icon, used by every table toolbar. */
export const SearchInput = React.forwardRef(function SearchInput(
  { icon: Icon, className, ...props },
  ref
) {
  return (
    <div className={cn("relative", className)}>
      {Icon && (
        <Icon
          size={15}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-subtle"
        />
      )}
      <input ref={ref} className="field pl-10" {...props} />
    </div>
  );
});

export function Checkbox({ label, className, id, ...props }) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "inline-flex cursor-pointer select-none items-center gap-2 text-xs font-medium text-ink",
        className
      )}
    >
      <input
        id={id}
        type="checkbox"
        className="h-4 w-4 cursor-pointer rounded border-line-strong text-accent accent-accent focus:ring-2 focus:ring-accent/30"
        {...props}
      />
      {label}
    </label>
  );
}
