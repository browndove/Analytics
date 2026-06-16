"use client";

import * as React from "react";
import KPICard from "@/components/ugmc-dashboard/billing-finance/components/kpi-card";
import {
    formatMinutes,
    pickTypicalMinutes,
    resolveCriticalAckMinutes,
    resolveReadMinutes,
    typicalMinutesRange,
} from "@/lib/distribution-metrics";

function fmtMin(minutes?: number | null): string {
    if (minutes == null) return "—";
    return formatMinutes(minutes);
}

function num(v: unknown): number {
    if (v === null || v === undefined || v === "") return 0;
    const n = typeof v === "string" ? parseFloat(v) : Number(v);
    return Number.isFinite(n) ? n : 0;
}

function readSubtitle(dist: ReturnType<typeof resolveReadMinutes>): string {
    if (!dist) return "No read data for this period.";
    const q1 = dist.q1_minutes;
    const q3 = dist.q3_minutes;
    const range = typicalMinutesRange(q1, q3);
    if (range !== "—") return `Most reads between ${range}.`;
    return "Typical time to read messages sent.";
}

const KPIGrid = ({ data }: { data?: Record<string, unknown> }) => {
    const kpiData = React.useMemo(() => {
        const totalMessages = num(data?.total_messages);
        const criticalMessages = num(data?.critical_messages);
        const escalated = num(data?.escalated_critical_messages);
        const escalationPct = data?.escalation_rate_percent;

        const readAllDist = resolveReadMinutes(data, "all");
        const readCriticalDist = resolveReadMinutes(data, "critical");
        const ackDist = resolveCriticalAckMinutes(data);

        const readAllTypical = pickTypicalMinutes(readAllDist);
        const readCriticalTypical = pickTypicalMinutes(readCriticalDist);
        const ackTypical = pickTypicalMinutes(ackDist);

        return [
            {
                title: "Typical Read Time",
                value: data ? fmtMin(readAllTypical) : "—",
                subtitle: readSubtitle(readAllDist),
                trend: {
                    type: "up" as const,
                    value: totalMessages > 0 ? `${totalMessages.toLocaleString()} messages` : "No volume",
                    isPositive: true,
                },
                infoText: "Median time to read all messages. Middle 50% fell between Q1 and Q3.",
            },
            {
                title: "Critical Read",
                value: data ? fmtMin(readCriticalTypical) : "—",
                subtitle: readSubtitle(readCriticalDist),
                trend: {
                    type: "up" as const,
                    value:
                        criticalMessages > 0
                            ? `${criticalMessages.toLocaleString()} critical`
                            : "No critical msgs",
                    isPositive: true,
                },
                infoText: "Median time to read critical messages.",
            },
            {
                title: "Critical Acknowledgment",
                value: data ? fmtMin(ackTypical) : "—",
                subtitle: ackDist
                    ? `Most acks between ${typicalMinutesRange(ackDist.q1_minutes, ackDist.q3_minutes)}.`
                    : "Average confirmation time for critical messages.",
                trend: {
                    type: "up" as const,
                    value: criticalMessages > 0 ? "Critical channel" : "No critical msgs",
                    isPositive: true,
                },
                infoText: "Median time to acknowledge critical messages before expiry.",
            },
            {
                title: "Escalation Rate",
                value:
                    data && escalationPct != null
                        ? `${num(escalationPct).toFixed(1)}%`
                        : "—",
                subtitle: "Percentage of critical messages that escalated.",
                trend: {
                    type: "down" as const,
                    value:
                        escalated > 0
                            ? `${escalated.toLocaleString()} escalated`
                            : "None escalated",
                    isPositive: escalated === 0,
                },
                infoText: "Percentage of critical messages that escalated.",
            },
        ];
    }, [data]);

    return (
        <div className="w-full">
            <div className="grid w-full min-w-0 grid-cols-1 items-stretch gap-4 sm:grid-cols-[repeat(2,minmax(0,1fr))] xl:grid-cols-[repeat(4,minmax(0,1fr))]">
                {kpiData.map((kpi, index) => (
                    <div
                        key={kpi.title}
                        className="min-w-0 w-full h-full min-h-[149px] [&>*]:min-w-0 [&>*]:w-full animate-slide-in-up"
                        style={{
                            animationDelay: `${index * 100}ms`,
                            opacity: 0,
                            animationFillMode: "forwards",
                        }}
                    >
                        <KPICard {...kpi} />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default KPIGrid;
