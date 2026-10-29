import React from "react";

export default function LoadingSkeleton({ rows = 5, cols = 6 }) {
  return (
    <div className="w-full space-y-3 p-4 animate-pulse">
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div key={rIdx} className="flex items-center gap-4 py-3 border-b border-[#192837]/5">
          {Array.from({ length: cols }).map((_, cIdx) => (
            <div
              key={cIdx}
              className="h-4 bg-[#192837]/10 rounded-md"
              style={{ width: `${Math.floor(60 + (cIdx * 15) % 40)}px` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
