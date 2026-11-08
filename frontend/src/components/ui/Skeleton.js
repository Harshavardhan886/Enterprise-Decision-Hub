import React from "react";
import cn from "../../lib/cn";

export function Skeleton({ className }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-surface-3/80",
        "after:absolute after:inset-0 after:-translate-x-full after:animate-shimmer",
        "after:bg-gradient-to-r after:from-transparent after:via-ink/5 after:to-transparent",
        className
      )}
    />
  );
}

/** Table placeholder used while a module is fetching its first page of data. */
export default function LoadingSkeleton({ rows = 5, cols = 6 }) {
  return (
    <div aria-busy="true" aria-live="polite" className="p-5">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex items-center gap-4 border-b border-line/60 py-3.5 last:border-0">
          {Array.from({ length: cols }).map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              className={cn("h-3.5", colIndex === 0 ? "w-32" : "flex-1")}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Full-panel chart/section placeholder. */
export function SkeletonBlock({ className }) {
  return <Skeleton className={cn("h-4 w-full", className)} />;
}
