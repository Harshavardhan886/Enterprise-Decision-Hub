import React from "react";
import { ShieldAlert, ShieldCheck, AlertTriangle, Flame } from "lucide-react";

export function computeSentryLevel(score) {
  const numericScore = typeof score === "number" ? score : 0;
  if (numericScore >= 9) return "RED";
  if (numericScore >= 7) return "ORANGE";
  if (numericScore >= 4) return "YELLOW";
  return "GREEN";
}

export default function RiskBadge({ score, sentryLevel, showSentry = true }) {
  const numericScore = typeof score === "number" ? score : 0;
  const level = sentryLevel || computeSentryLevel(numericScore);

  switch (level.toUpperCase()) {
    case "RED":
      return (
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300 shadow-sm"
          title={`Critical Risk - Sentry RED (Score: ${numericScore}/10)`}
        >
          <Flame size={13} className="text-red-600 animate-pulse" />
          <span>{showSentry ? "RED" : "Critical"}</span>
          <span className="text-red-500 font-normal">({numericScore}/10)</span>
        </span>
      );

    case "ORANGE":
      return (
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-300 shadow-sm"
          title={`High Risk - Sentry ORANGE (Score: ${numericScore}/10)`}
        >
          <ShieldAlert size={13} className="text-orange-600" />
          <span>{showSentry ? "ORANGE" : "High"}</span>
          <span className="text-orange-500 font-normal">({numericScore}/10)</span>
        </span>
      );

    case "YELLOW":
      return (
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 shadow-sm"
          title={`Medium Risk - Sentry YELLOW (Score: ${numericScore}/10)`}
        >
          <AlertTriangle size={13} className="text-amber-600" />
          <span>{showSentry ? "YELLOW" : "Medium"}</span>
          <span className="text-amber-500 font-normal">({numericScore}/10)</span>
        </span>
      );

    case "GREEN":
    default:
      return (
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm"
          title={`Low Risk - Sentry GREEN (Score: ${numericScore}/10)`}
        >
          <ShieldCheck size={13} className="text-emerald-600" />
          <span>{showSentry ? "GREEN" : "Low"}</span>
          <span className="text-emerald-500 font-normal">({numericScore}/10)</span>
        </span>
      );
  }
}
