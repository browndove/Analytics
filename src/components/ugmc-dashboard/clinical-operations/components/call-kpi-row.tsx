"use client";

import { useMemo } from "react";
import SubscriptionCard from "./subscription-card";

export type CallKpiInput = {
    total_calls_made?: number;
    call_metrics?: {
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

function fmtDuration(seconds: number): string {
    if (!seconds || seconds <= 0) return "—";
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    if (m < 60) return s > 0 ? `${m}m ${s}s` : `${m}m`;
    const h = Math.floor(m / 60);
    const rm = m % 60;
    return rm > 0 ? `${h}h ${rm}m` : `${h}h`;
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
        const total = num(data?.total_calls_made);
        const duration = data?.call_metrics?.duration;
        const completed = num(duration?.completed_calls);
        const hasDuration =
            duration != null && (total > 0 || completed > 0 || num(duration.avg_duration_seconds) > 0);

        const roles = Array.isArray(data?.role_metrics) ? data!.role_metrics! : [];
        const topRole = roles.reduce<{ name: string; calls: number } | null>((best, r) => {
            const calls = num(r.total_calls_made);
            if (calls <= 0) return best;
            const name = formatRoleName(String(r.role_name || "").trim());
            if (!name) return best;
            if (!best || calls > best.calls) return { name, calls };
            return best;
        }, null);

        const unanswered = total > 0 && hasDuration ? Math.max(0, total - completed) : 0;
        const completionRate =
            hasDuration && total > 0 ? ((completed / total) * 100).toFixed(1) : null;

        return [
            {
                badge: "TC",
                badgeColor: "purple" as const,
                title: "Total Calls",
                provider: hasDuration && completed > 0 ? "Facility call volume" : "Across all roles",
                amount: data != null ? String(total) : undefined,
                displayValue: data == null ? "—" : undefined,
                footerLabel: "Completed",
                footerValue:
                    hasDuration && completed > 0
                        ? `${completed.toLocaleString()} calls`
                        : "—",
                infoText: "Total phone calls placed in the selected period.",
            },
            {
                badge: "AD",
                badgeColor: "teal" as const,
                title: "Avg Call Duration",
                provider: "Mean call length",
                displayValue: hasDuration ? fmtDuration(num(duration?.avg_duration_seconds)) : "—",
                footerLabel: "In minutes",
                footerValue:
                    hasDuration && duration?.avg_duration_minutes != null
                        ? `~${num(duration.avg_duration_minutes).toFixed(1)} min`
                        : "Not available",
                infoText: "Average duration of completed calls.",
            },
            {
                badge: "CR",
                badgeColor: "coral" as const,
                title: "Call Completion Rate",
                provider: "Completed vs total",
                displayValue: completionRate != null ? `${completionRate}%` : "—",
                footerLabel: "Unanswered",
                footerValue:
                    completionRate != null && unanswered > 0
                        ? `${unanswered.toLocaleString()} calls`
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
