"use client";

import * as React from "react";
import Text from "@/components/text";
import DashboardCard from "@/components/ugmc-dashboard/shared/dashboard-card";
import { useState, useEffect } from "react";
import InfoTooltip from "@/components/info-tooltip";
import { FaClock } from "react-icons/fa6";
import clsx from "clsx";
import {
    type CallMetricsSlice,
    fmtDuration,
    getCallOutcomeTotals,
    num,
} from "./call-metrics-helpers";

const avgInfo = "Mean duration of completed calls in the selected period.";
const rangeInfo = "Shortest and longest completed call durations recorded.";

interface ICUVacantBedsProps {
    callMetrics?: CallMetricsSlice;
}

const ICUVacantBeds: React.FC<ICUVacantBedsProps> = ({ callMetrics }) => {
    const [isAvgHovered, setIsAvgHovered] = useState(false);
    const [isRangeHovered, setIsRangeHovered] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    const duration = callMetrics?.duration;
    const avgSeconds = num(duration?.avg_duration_seconds);
    const minSeconds = num(duration?.min_duration_seconds);
    const maxSeconds = num(duration?.max_duration_seconds);
    const medianSeconds = num(duration?.median_duration_seconds);
    const { completed, hasDuration } = getCallOutcomeTotals(callMetrics);
    const showData = hasDuration && (avgSeconds > 0 || completed > 0);

    const rangePct =
        maxSeconds > 0 && minSeconds >= 0
            ? Math.min(100, Math.round((minSeconds / maxSeconds) * 100))
            : 0;

    useEffect(() => {
        setIsVisible(true);
    }, []);

    return (
        <DashboardCard className="flex flex-col gap-[10px] h-full" padding="sm">
            <div
                className="flex flex-col gap-3 bg-tertiary rounded-[12px] p-4 transition-colors"
                onMouseEnter={() => setIsAvgHovered(true)}
                onMouseLeave={() => setIsAvgHovered(false)}
            >
                <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-0.5">
                        <Text variant="body-md-semibold" color="text-primary">
                            Avg Call Duration
                        </Text>
                        <Text variant="body-sm" color="text-secondary">
                            Completed calls
                        </Text>
                    </div>
                    <div className="flex items-center gap-2">
                        <div
                            className={clsx(
                                "w-8 h-8 rounded-[8px] bg-primary flex items-center justify-center shadow-md",
                                "transition-transform duration-300",
                                isAvgHovered && "scale-110"
                            )}
                        >
                            <FaClock className="text-text-primary" size={14} />
                        </div>
                        <InfoTooltip text={avgInfo} show={isAvgHovered} />
                    </div>
                </div>
                <div>
                    <span
                        className={clsx(
                            "text-[28px] font-bold tracking-tight text-accent-primary tabular-nums",
                            "transition-transform duration-300",
                            isAvgHovered && isVisible && "scale-[1.02] origin-left inline-block"
                        )}
                    >
                        {showData ? fmtDuration(avgSeconds) : "—"}
                    </span>
                </div>
                <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                        <Text variant="body-sm" color="text-secondary">
                            {showData
                                ? `${completed.toLocaleString()} calls completed`
                                : "No duration data"}
                        </Text>
                        {medianSeconds > 0 && (
                            <div className="bg-accent-primary/20 px-2 py-0.5 rounded-[6px]">
                                <Text variant="body-sm" color="accent-primary">
                                    Median {fmtDuration(medianSeconds)}
                                </Text>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div
                className="flex flex-col gap-3 bg-primary-light rounded-[12px] p-4 transition-colors"
                onMouseEnter={() => setIsRangeHovered(true)}
                onMouseLeave={() => setIsRangeHovered(false)}
            >
                <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-0.5">
                        <Text variant="body-md-semibold" color="text-primary">
                            Call Duration Range
                        </Text>
                        <Text variant="body-sm" color="text-secondary">
                            Shortest to longest
                        </Text>
                    </div>
                    <div className="flex items-center gap-2">
                        <div
                            className={clsx(
                                "w-8 h-8 rounded-[8px] bg-primary flex items-center justify-center shadow-md",
                                "transition-transform duration-300",
                                isRangeHovered && "scale-110"
                            )}
                        >
                            <FaClock className="text-text-primary" size={14} />
                        </div>
                        <InfoTooltip text={rangeInfo} show={isRangeHovered} />
                    </div>
                </div>
                <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                        <Text variant="body-sm" color="text-secondary">
                            Shortest
                        </Text>
                        <div className="bg-accent-green/20 px-2 py-0.5 rounded-[4px]">
                            <span className="text-accent-green text-sm font-semibold">
                                {showData && minSeconds > 0 ? fmtDuration(minSeconds) : "—"}
                            </span>
                        </div>
                    </div>
                    <div className="w-full h-px bg-quaternary" />
                    <div className="flex justify-between items-center">
                        <Text variant="body-sm" color="text-secondary">
                            Longest
                        </Text>
                        <span className="bg-quaternary px-1.5 py-0.5 rounded-[4px]">
                            <Text variant="body-sm" color="text-primary">
                                {showData && maxSeconds > 0 ? fmtDuration(maxSeconds) : "—"}
                            </Text>
                        </span>
                    </div>
                    <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full bg-quaternary transition-all duration-1000 ease-out"
                            style={{ width: showData ? `${rangePct}%` : "0%" }}
                        />
                    </div>
                </div>
            </div>
        </DashboardCard>
    );
};

export default ICUVacantBeds;
