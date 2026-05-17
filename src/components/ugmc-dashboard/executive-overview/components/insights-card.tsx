'use client';

import { useMemo, useState } from "react";
import Text from "@/components/text";
import InfoTooltip from "@/components/info-tooltip";
import clsx from "clsx";
import { HiOutlineTrophy, HiOutlineClock, HiOutlineBolt } from "react-icons/hi2";

const infoText = "Top 3 roles by fastest critical acknowledgment time. Lower bars are better (faster responses).";

interface InsightsCardProps {
    data?: {
        role_metrics?: {
            role_name?: string;
            role_id?: string;
            department_name?: string;
            critical_messages?: number;
            escalated_critical_messages?: number;
            avg_critical_ack_minutes?: number;
        }[];
    };
}

function num(v: unknown): number {
    const n = typeof v === "string" ? parseFloat(v) : Number(v);
    return Number.isFinite(n) ? n : 0;
}

const InsightsCard = ({ data }: InsightsCardProps) => {
    const [isHovered, setIsHovered] = useState(false);

    const topRoles = useMemo(() => {
        const roles = (data?.role_metrics || [])
            .filter((r) => num(r?.avg_critical_ack_minutes) > 0 && num(r?.critical_messages) > 0)
            .map((r) => ({
                name: r.role_name || "Role",
                ackMinutes: num(r.avg_critical_ack_minutes),
                critMsgs: num(r.critical_messages),
            }))
            .sort((a, b) => a.ackMinutes - b.ackMinutes)
            .slice(0, 5);
        return roles;
    }, [data]);

    const maxAck = Math.max(...topRoles.map((r) => r.ackMinutes), 1);
    const fastestTime = topRoles.length > 0 ? topRoles[0].ackMinutes : 1;

    return (
        <div
            className={clsx(
                "bg-primary rounded-[12px] flex flex-col shadow-soft overflow-hidden",
                "transition-all duration-500"
            )}
            style={{ padding: 12, width: "100%", height: "100%", minHeight: 0 }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <HiOutlineBolt className="w-[16px] h-[16px] text-accent-violet" />
                    <Text variant="body-md-semibold" color="text-primary">Fastest Acknowledgment</Text>
                </div>
                <InfoTooltip text={infoText} show={isHovered} />
            </div>

            <div className="flex flex-col flex-1 gap-2">
                {topRoles.length === 0 && (
                    <div style={{ padding: "8px 0", textAlign: "center" }}>
                        <Text variant="body-sm" color="text-secondary">No data available</Text>
                    </div>
                )}
                {topRoles.map((role, idx) => {
                    const barWidth = fastestTime > 0 ? (fastestTime / role.ackMinutes) * 100 : 0;
                    
                    // Minimal colors
                    const rankColors = {
                        0: { text: 'text-amber-600', bar: 'bg-amber-400' }, // Gold
                        1: { text: 'text-gray-600', bar: 'bg-gray-400' }, // Silver
                        2: { text: 'text-orange-600', bar: 'bg-orange-400' }, // Bronze
                        3: { text: 'text-blue-600', bar: 'bg-blue-400' },
                        4: { text: 'text-purple-600', bar: 'bg-purple-400' },
                    }[idx] || { text: 'text-gray-600', bar: 'bg-gray-400' };
                    
                    return (
                        <div
                            key={role.name}
                            className="flex items-center gap-3 py-2"
                        >
                            <span className={clsx("text-sm font-bold w-[20px] text-center", rankColors.text)}>
                                {idx + 1}
                            </span>
                            
                            <div className="flex-1 min-w-0">
                                <Text variant="body-sm" color="text-primary" className="truncate">
                                    {role.name}
                                </Text>
                                <div className="mt-1">
                                    <div className="relative w-full h-[3px] bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className={clsx("absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out", rankColors.bar)}
                                            style={{ width: `${barWidth}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-1 shrink-0">
                                <HiOutlineClock className="w-[10px] h-[10px] text-text-secondary" />
                                <Text variant="body-xs" color="text-secondary">
                                    {role.ackMinutes < 1 ? "<1" : role.ackMinutes.toFixed(1)}m
                                </Text>
                            </div>
                        </div>
                    );
                })}
                
                            </div>
        </div>
    );
};

export default InsightsCard;
