"use client";

import * as React from "react";
import Text from "@/components/text";
import DashboardCard from "@/components/ugmc-dashboard/shared/dashboard-card";
import { useState, useEffect } from "react";
import InfoTooltip from "@/components/info-tooltip";
import clsx from "clsx";
import { FaPhone } from "react-icons/fa6";
import {
    type CallMetricsSlice,
    getCallOutcomeTotals,
} from "./call-metrics-helpers";

const infoText = "Percentage of placed calls that were marked completed in the selected period.";

interface OperatingRoomsUtilizationProps {
    callMetrics?: CallMetricsSlice;
}

const OperatingRoomsUtilization: React.FC<OperatingRoomsUtilizationProps> = ({ callMetrics }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [animatedPercentage, setAnimatedPercentage] = useState(0);
    const [animatedProgress, setAnimatedProgress] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    const { total, completed, hasDuration, completionPct } = getCallOutcomeTotals(callMetrics);
    const targetPercentage = completionPct ?? 0;
    const targetProgress = targetPercentage;
    const showData = hasDuration && total > 0;

    useEffect(() => {
        setIsVisible(true);
    }, []);

    useEffect(() => {
        if (!isVisible) return;

        const duration = 1200;
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);

            setAnimatedPercentage(targetPercentage * eased);
            setAnimatedProgress(targetProgress * eased);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                setAnimatedPercentage(targetPercentage);
                setAnimatedProgress(targetProgress);
            }
        };
        requestAnimationFrame(animate);
    }, [isVisible, targetPercentage, targetProgress]);

    return (
        <DashboardCard
            className="flex flex-col gap-4 flex-1 min-w-[280px]"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="flex justify-between items-start">
                <div className="flex flex-col gap-0.5">
                    <Text variant="body-md-semibold" color="text-primary">
                        Call Completion Rate
                    </Text>
                    <Text variant="body-sm" color="text-tertiary">
                        Completed vs total calls placed.
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
                        <FaPhone className="text-text-primary" size={16} />
                    </div>
                    <InfoTooltip text={infoText} show={isHovered} />
                </div>
            </div>
            <div>
                <span
                    className={clsx(
                        "text-[40px] font-bold tracking-tight text-accent-primary tabular-nums",
                        "transition-transform duration-300",
                        isHovered && "scale-[1.02] origin-left inline-block"
                    )}
                >
                    {showData ? `${animatedPercentage.toFixed(1)}%` : "—"}
                </span>
            </div>
            <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                    <Text variant="body-sm" color="text-secondary">
                        Total Calls
                    </Text>
                    <div className="bg-accent-primary/20 px-2 py-0.5 rounded-[6px]">
                        <Text variant="body-sm" color="accent-primary">
                            {showData ? total.toLocaleString() : "—"}
                        </Text>
                    </div>
                </div>
                <div className="w-full h-px bg-tertiary" />
                <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                        <Text variant="body-sm" color="text-secondary">
                            Completed
                        </Text>
                        <div className="bg-accent-primary/20 px-2 py-0.5 rounded-[6px]">
                            <Text variant="body-sm" color="accent-primary">
                                {showData ? completed.toLocaleString() : "—"}
                            </Text>
                        </div>
                    </div>
                    <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full bg-accent-primary transition-all duration-1000 ease-out"
                            style={{ width: showData ? `${animatedProgress}%` : "0%" }}
                        />
                    </div>
                </div>
            </div>
        </DashboardCard>
    );
};

export default OperatingRoomsUtilization;
