"use client";

import * as React from "react";
import Text from "@/components/text";
import DashboardCard from "@/components/ugmc-dashboard/shared/dashboard-card";
import { FaClock } from "react-icons/fa6";
import { useState, useEffect } from "react";
import InfoTooltip from "@/components/info-tooltip";
import clsx from "clsx";
import {
    type CallMetricsSlice,
    fmtDuration,
    num,
} from "./call-metrics-helpers";

const infoText =
    "Median call length and range for completed calls in the selected period.";

interface CallDurationCardProps {
    callMetrics?: CallMetricsSlice;
}

const CallDurationCard: React.FC<CallDurationCardProps> = ({ callMetrics }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [animatedProgress, setAnimatedProgress] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    const duration = callMetrics?.duration;
    const avgSeconds = num(duration?.avg_duration_seconds);
    const medianSeconds = num(duration?.median_duration_seconds);
    const minSeconds = num(duration?.min_duration_seconds);
    const maxSeconds = num(duration?.max_duration_seconds);
    const completed = num(duration?.completed_calls);
    const hasDuration =
        duration != null &&
        (avgSeconds > 0 || medianSeconds > 0 || minSeconds > 0 || maxSeconds > 0 || completed > 0);
    const heroSeconds = medianSeconds > 0 ? medianSeconds : avgSeconds;
    const targetProgress =
        hasDuration && maxSeconds > 0 && heroSeconds > 0
            ? Math.min(100, (heroSeconds / maxSeconds) * 100)
            : 0;

    useEffect(() => {
        setIsVisible(true);
    }, []);

    useEffect(() => {
        if (!isVisible) return;

        const durationMs = 1200;
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / durationMs, 1);
            const eased = 1 - Math.pow(1 - progress, 3);

            setAnimatedProgress(targetProgress * eased);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                setAnimatedProgress(targetProgress);
            }
        };
        requestAnimationFrame(animate);
    }, [isVisible, targetProgress]);

    return (
        <DashboardCard
            className="flex flex-col gap-4 flex-1 min-w-[280px]"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="flex justify-between items-start">
                <div className="flex flex-col gap-0.5">
                    <Text variant="body-md-semibold" color="text-primary">
                        Call Duration
                    </Text>
                    <Text variant="body-sm" color="text-tertiary">
                        Median and range for completed calls.
                    </Text>
                </div>
                <div className="flex items-center gap-2">
                    <div
                        className={clsx(
                            "w-10 h-10 rounded-[10px] bg-secondary flex items-center justify-center",
                            "transition-transform duration-300",
                            isHovered && "scale-110"
                        )}
                    >
                        <FaClock className="text-text-primary" size={16} />
                    </div>
                    <InfoTooltip text={infoText} show={isHovered} />
                </div>
            </div>
            <div>
                <span
                    className={clsx(
                        "text-[40px] font-bold tracking-tight text-[#1F988B] tabular-nums",
                        "transition-transform duration-300",
                        isHovered && "scale-[1.02] origin-left inline-block"
                    )}
                >
                    {hasDuration && heroSeconds > 0 ? fmtDuration(heroSeconds) : "—"}
                </span>
            </div>
            <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                    <Text variant="body-sm" color="text-secondary">
                        Average
                    </Text>
                    <div className="bg-[#00C8B333] px-2 py-0.5 rounded-[6px]">
                        <Text variant="body-sm" color="none" className="text-[#1F988B]">
                            {hasDuration && avgSeconds > 0 ? fmtDuration(avgSeconds) : "—"}
                        </Text>
                    </div>
                </div>
                <div className="w-full h-px bg-tertiary" />
                <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                        <Text variant="body-sm" color="text-secondary">
                            Shortest · Longest
                        </Text>
                        <div className="bg-[#00C8B333] px-2 py-0.5 rounded-[6px]">
                            <Text variant="body-sm" color="none" className="text-[#1F988B]">
                                {hasDuration && minSeconds > 0 && maxSeconds > 0
                                    ? `${fmtDuration(minSeconds)} · ${fmtDuration(maxSeconds)}`
                                    : "—"}
                            </Text>
                        </div>
                    </div>
                    <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full bg-[#00C8B3] transition-all duration-1000 ease-out"
                            style={{ width: hasDuration ? `${animatedProgress}%` : "0%" }}
                        />
                    </div>
                </div>
            </div>
        </DashboardCard>
    );
};

export default CallDurationCard;
