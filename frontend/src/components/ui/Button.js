import React from "react";
import { Loader2 } from "lucide-react";
import cn from "../../lib/cn";

const VARIANTS = {
  primary:
    "bg-accent text-white shadow-sm hover:bg-accent-hover active:brightness-95",
  secondary:
    "border border-line bg-surface text-ink shadow-sm hover:border-line-strong hover:bg-surface-2",
  subtle:
    "bg-accent/10 text-accent hover:bg-accent/15 border border-accent/20",
  ghost:
    "text-ink-muted hover:bg-surface-2 hover:text-ink",
  danger:
    "bg-danger text-white shadow-sm hover:brightness-95 active:brightness-90",
  dangerSubtle:
    "border border-danger/25 bg-danger/10 text-danger hover:bg-danger/15",
  success:
    "bg-success text-white shadow-sm hover:brightness-95",
};

const SIZES = {
  xs: "h-7 gap-1.5 rounded-lg px-2.5 text-2xs",
  sm: "h-8 gap-1.5 rounded-lg px-3 text-xs",
  md: "h-10 gap-2 rounded-xl px-4 text-sm",
  lg: "h-11 gap-2 rounded-xl px-5 text-sm",
};

const ICON_ONLY = {
  xs: "w-7 px-0",
  sm: "w-8 px-0",
  md: "w-10 px-0",
  lg: "w-11 px-0",
};

/**
 * The single button in the app. Renders an <a> when `href` is supplied so
 * link-styled actions keep correct semantics.
 */
const Button = React.forwardRef(function Button(
  {
    as: Tag = "button",
    variant = "primary",
    size = "md",
    icon: Icon,
    iconRight: IconRight,
    loading = false,
    iconOnly = false,
    fullWidth = false,
    className,
    children,
    disabled,
    ...props
  },
  ref
) {
  const isInert = disabled || loading;

  return (
    <Tag
      ref={ref}
      className={cn(
        "inline-flex select-none items-center justify-center whitespace-nowrap font-semibold",
        "transition-all duration-150 focus-visible:outline-none",
        "disabled:pointer-events-none disabled:opacity-50",
        SIZES[size],
        VARIANTS[variant],
        iconOnly && ICON_ONLY[size],
        fullWidth && "w-full",
        className
      )}
      disabled={Tag === "button" ? isInert : undefined}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <Loader2 className="animate-spin" size={size === "xs" || size === "sm" ? 13 : 15} />
      ) : (
        Icon && <Icon size={size === "xs" || size === "sm" ? 13 : 15} className="shrink-0" />
      )}
      {!iconOnly && children}
      {!loading && IconRight && (
        <IconRight size={size === "xs" || size === "sm" ? 13 : 15} className="shrink-0" />
      )}
    </Tag>
  );
});

export default Button;
