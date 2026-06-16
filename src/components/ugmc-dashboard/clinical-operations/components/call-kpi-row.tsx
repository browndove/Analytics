"use client";

import { useMemo } from "react";
import { normalizeCallMetricsFromUsage } from "@/lib/call-metrics";
import {
    formatDurationSeconds,
    pickTypicalSeconds,
    typicalSecondsRange,
} from "@/lib/distribution-metrics";
import SubscriptionCard from "./subscription-card";

export type CallKpiInput = {
    total_calls_made?: number;
    call_metrics?: {
        total_missed_calls?: number;
        duration?: {
            completed_calls?: number;
            avg_duration_seconds?: number;
            avg_duration_minutes?: number;
            median_duration_seconds?: number;
        };
    };
    role_metrics?: { role_name?: string; total_calls_made?: number }[];
};

function num(v: unknown): number {
    if (v === null || v === undefined || v === "") return 0;
    const n = typeof v === "string" ? parseFloat(v) : Number(v);
    return Number.isFinite(n) ? n : 0;
}

function formatRoleName(name: string): string {
    return name.replace(/^HH\s*-\s*/i, "").trim() || name;
}

function truncateTag(text: string, max = 22): string {
    if (text.length <= max) return text;
    return `${text.slice(0, max - 1)}…`;
}

const CallKPIRow = ({ data }: { data?: CallKpiInput }) => {
    const cards = useMemo(() => {
        const callMetrics = normalizeCallMetricsFromUsage(data);
        const total = num(callMetrics?.total_calls_made ?? data?.total_calls_made);
        const answered = callMetrics?.answered;
        const answeredCount = num(answered?.answered_calls);
        const hasAnswered =
            answered != null &&
            (answeredCount > 0 ||
                num(answered.median_duration_seconds) > 0 ||
                num(answered.avg_duration_seconds) > 0);
        const typicalSeconds = pickTypicalSeconds(answered);
        const duration = callMetrics?.duration;
        const completed = num(duration?.completed_calls);
        const hasDuration =
            hasAnswered ||
            (duration != null && (total > 0 || completed > 0 || num(duration.avg_duration_seconds) > 0));

        const roles = Array.isArray(data?.role_metrics) ? data!.role_metrics! : [];
        const topRole = roles.reduce<{ name: string; calls: number } | null>((best, r) => {
            const calls = num(r.total_calls_made);
            if (calls <= 0) return best;
            const name = formatRoleName(String(r.role_name || "").trim());
            if (!name) return best;
            if (!best || calls > best.calls) return { name, calls };
            return best;
        }, null);

        const missed =
            callMetrics?.total_missed_calls !== undefined
                ? num(callMetrics.total_missed_calls)
                : total > 0 && hasDuration
                  ? Math.max(0, total - completed)
                  : 0;
        const completionRate =
            hasDuration && total > 0 ? ((completed / total) * 100).toFixed(1) : null;

        return [
            {
                badge: "TC",
                badgeColor: "purple" as const,
                title: "Total Calls Placed",
                provider: hasDuration && completed > 0 ? "Facility call volume" : "Across all roles",
                amount: data != null ? String(total) : undefined,
                displayValue: data == null ? "—" : undefined,
                footerLabel: "Answered",
                footerValue:
                    hasAnswered && answeredCount > 0
                        ? `${answeredCount.toLocaleString()} calls`
                        : hasDuration && completed > 0
                          ? `${completed.toLocaleString()} calls`
                          : "—",
                infoText: "Total phone calls placed in the selected period.",
            },
            {
                badge: "AD",
                badgeColor: "teal" as const,
                title: "Avg Call Duration",
                provider: hasAnswered ? "Typical answered call" : "Mean call length",
                displayValue:
                    hasAnswered && typicalSeconds != null
                        ? formatDurationSeconds(typicalSeconds)
                        : hasDuration
                          ? formatDurationSeconds(num(duration?.avg_duration_seconds))
                          : "—",
                footerLabel: "Typical range",
                footerValue:
                    hasAnswered
                        ? typicalSecondsRange(
                              num(answered?.q1_duration_seconds),
                              num(answered?.q3_duration_seconds)
                          )
                        : hasDuration && answered?.avg_duration_minutes != null
                          ? `~${num(answered.avg_duration_minutes).toFixed(1)} min avg`
                          : hasDuration && duration?.avg_duration_minutes != null
                            ? `~${num(duration.avg_duration_minutes).toFixed(1)} min`
                            : "Not available",
                infoText:
                    "Median duration of answered calls. Middle 50% lasted between Q1 and Q3.",
            },
            {
                badge: "CR",
                badgeColor: "coral" as const,
                title: "Call Completion Rate",
                provider: "Completed vs total",
                displayValue: completionRate != null ? `${completionRate}%` : "—",
                footerLabel: "Missed",
                footerValue:
                    completionRate != null && missed > 0
                        ? `${missed.toLocaleString()} calls`
                        : completionRate != null
                          ? "None"
                          : "Not available",
                infoText: "Share of calls marked completed versus total calls.",
            },
            {
                badge: "TR",
                badgeColor: "green" as const,
                title: "Top Calling Role",
                provider: topRole ? truncateTag(topRole.name) : "No role data",
                amount: topRole ? String(topRole.calls) : undefined,
                displayValue: topRole ? undefined : "—",
                footerLabel: "Role volume",
                footerValue: topRole ? `${topRole.calls.toLocaleString()} calls` : "—",
                infoText: "Role with the highest call volume in this period.",
            },
        ];
    }, [data]);

    return (
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map((card, index) => (
                <div
                    key={card.title}
                    className="animate-slide-in-up"
                    style={{
                        animationDelay: `${index * 100}ms`,
                        opacity: 0,
                        animationFillMode: "forwards",
                    }}
                >
                    <SubscriptionCard
                        badge={card.badge}
                        badgeColor={card.badgeColor}
                        title={card.title}
                        provider={card.provider}
                        amount={card.amount}
                        displayValue={card.displayValue}
                        footerLabel={card.footerLabel}
                        footerValue={card.footerValue}
                        infoText={card.infoText}
                    />
                </div>
            ))}
        </div>
    );
};

export default CallKPIRow;
