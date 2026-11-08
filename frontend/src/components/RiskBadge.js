import React from "react";
import { AlertTriangle, Flame, ShieldAlert, ShieldCheck } from "lucide-react";
import Badge from "./ui/Badge";

/**
 * Sentry risk bands shared by the dashboard, invoice table and alerts.
 * 0–3 GREEN · 4–6 YELLOW · 7–8 ORANGE · 9–10 RED
 */
export function computeSentryLevel(score) {
  const numericScore = typeof score === "number" ? score : Number(score) || 0;
  if (numericScore >= 9) return "RED";
  if (numericScore >= 7) return "ORANGE";
  if (numericScore >= 4) return "YELLOW";
  return "GREEN";
}

const LEVELS = {
  RED: {
    tone: "danger",
    icon: Flame,
    sentry: "RED",
    plain: "Critical",
    title: "Critical risk",
  },
  ORANGE: {
    tone: "orange",
    icon: ShieldAlert,
    sentry: "ORANGE",
    plain: "High",
    title: "High risk",
  },
  YELLOW: {
    tone: "warning",
    icon: AlertTriangle,
    sentry: "YELLOW",
    plain: "Medium",
    title: "Medium risk",
  },
  GREEN: {
    tone: "success",
    icon: ShieldCheck,
    sentry: "GREEN",
    plain: "Low",
    title: "Low risk",
  },
};

export default function RiskBadge({ score, sentryLevel, showSentry = true }) {
  const numericScore = typeof score === "number" ? score : Number(score) || 0;
  const level = String(sentryLevel || computeSentryLevel(numericScore)).toUpperCase();
  const config = LEVELS[level] || LEVELS.GREEN;

  return (
    <Badge
      tone={config.tone}
      icon={config.icon}
      title={`${config.title} — Sentry ${config.sentry} (score ${numericScore}/10)`}
    >
      <span>{showSentry ? config.sentry : config.plain}</span>
      <span className="num font-medium opacity-70">{numericScore}/10</span>
    </Badge>
  );
}
