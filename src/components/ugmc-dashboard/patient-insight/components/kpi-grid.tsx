"use client";

import * as React from "react";
import KPICard from "@/components/ugmc-dashboard/billing-finance/components/kpi-card";

function fmtMin(minutes?: number | null): string {
    if (minutes == null || minutes <= 0) return "—";
    if (minutes < 1) return `${Math.round(minutes * 60)}s`;
    if (minutes < 60) return `${minutes.toFixed(1)}m`;
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function num(v: unknown): number {
    if (v === null || v === undefined || v === "") return 0;
    const n = typeof v === "string" ? parseFloat(v) : Number(v);
    return Number.isFinite(n) ? n : 0;
}

const KPIGrid = ({ data }: { data?: Record<string, unknown> }) => {
    const kpiData = React.useMemo(() => {
        const totalMessages = num(data?.total_messages);
        const criticalMessages = num(data?.critical_messages);
        const escalated = num(data?.escalated_critical_messages);
        const escalationPct = data?.escalation_rate_percent;

        return [
            {
                title: "Average Response Time",
                value: data ? fmtMin(num(data.avg_reply_response_minutes_all)) : "—",
                subtitle: "Average reply time for all messages sent.",
                trend: {
                    type: "up" as const,
                    value: totalMessages > 0 ? `${totalMessages.toLocaleString()} messages` : "No volume",
                    isPositive: true,
                },
                infoText: "Average reply time for all messages sent.",
            },
            {
                title: "Critical Response",
                value: data ? fmtMin(num(data.avg_reply_response_minutes_critical)) : "—",
                subtitle: "Average reply time for critical messages.",
                trend: {
                    type: "up" as const,
                    value:
                        criticalMessages > 0
                            ? `${criticalMessages.toLocaleString()} critical`
                            : "No critical msgs",
                    isPositive: true,
                },
                infoText: "Average reply time for critical messages.",
            },
            {
                title: "Critical Acknowledgment",
                value: data ? fmtMin(num(data.avg_critical_ack_minutes)) : "—",
                subtitle: "Average confirmation time for critical messages.",
                trend: {
                    type: "up" as const,
                    value: criticalMessages > 0 ? "Critical channel" : "No critical msgs",
                    isPositive: true,
                },
                infoText: "Average confirmation time for critical messages.",
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
            <div className="grid min-w-0 grid-cols-1 items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {kpiData.map((kpi, index) => (
                    <div
                        key={kpi.title}
                        className="flex h-full min-h-[149px] animate-slide-in-up"
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
