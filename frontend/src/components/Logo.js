import React from "react";
import logoImg from "../assets/logo.jpg";
import cn from "../lib/cn";

/** Brand mark. Falls back to the monogram tile if the bitmap fails to load. */
export default function Logo({ size = 36, className = "" }) {
  const [failed, setFailed] = React.useState(false);

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl",
        "bg-accent text-white ring-1 ring-inset ring-white/20",
        className
      )}
      style={{ width: size, height: size }}
      title="Enterprise Decision Hub"
    >
      {failed ? (
        <span className="text-[0.9em] font-extrabold leading-none" style={{ fontSize: size * 0.45 }}>
          ED
        </span>
      ) : (
        <img
          src={logoImg}
          alt="Enterprise Decision Hub"
          onError={() => setFailed(true)}
          className="h-full w-full scale-110 object-cover object-center"
        />
      )}
    </span>
  );
}
