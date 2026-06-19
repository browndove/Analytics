"use client";

import * as React from "react";
import KPICard from "@/components/ugmc-dashboard/billing-finance/components/kpi-card";
import {
    buildMinutesSpreadForKpi,
    formatMinutes,
    mergeInfoWithSpread,
    pickTypicalMinutes,
    resolveCriticalAckMinutes,
    resolveReadMinutes,
    type MinutesDistribution,
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

function spreadProps(dist: MinutesDistribution | undefined, baseInfo: string) {
    const spread = buildMinutesSpreadForKpi(dist);
    return {
        spreadStats: spread.inline.length ? spread.inline : undefined,
        spreadStatsOverflow: spread.overflow.length ? spread.overflow : undefined,
        infoText: mergeInfoWithSpread(baseInfo, spread.infoDetail),
    };
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

        const readAllSpread = spreadProps(
            readAllDist,
            "Median time to read all messages. Middle 50% fell between Q1 and Q3."
        );
        const readCriticalSpread = spreadProps(
            readCriticalDist,
            "Median time to read critical messages."
        );
        const ackSpread = spreadProps(
            ackDist,
            "Median time to acknowledge critical messages before expiry."
        );

        return [
            {
                title: "Average Read Time",
                value: data ? fmtMin(readAllTypical) : "—",
                subtitle: "Median time to read all messages.",
                trend: {
                    type: "up" as const,
                    value: totalMessages > 0 ? `${totalMessages.toLocaleString()} messages` : "No volume",
                    isPositive: true,
                },
                ...readAllSpread,
            },
            {
                title: "Average Read Time (Critical)",
                value: data ? fmtMin(readCriticalTypical) : "—",
                subtitle: "Median time to read critical messages.",
                trend: {
                    type: "up" as const,
                    value:
                        criticalMessages > 0
                            ? `${criticalMessages.toLocaleString()} critical`
                            : "No critical msgs",
                    isPositive: true,
                },
                ...readCriticalSpread,
            },
            {
                title: "Average Acknowledgment Time",
                value: data ? fmtMin(ackTypical) : "—",
                subtitle: "Median time to acknowledge critical messages.",
                trend: {
                    type: "up" as const,
                    value: criticalMessages > 0 ? "Critical channel" : "No critical msgs",
                    isPositive: true,
                },
                ...ackSpread,
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
                        className="min-w-0 w-full h-full min-h-[200px] [&>*]:min-w-0 [&>*]:w-full animate-slide-in-up"
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
