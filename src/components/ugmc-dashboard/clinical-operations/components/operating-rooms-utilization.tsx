"use client";

import * as React from "react";
import Text from "@/components/text";
import DashboardCard from "@/components/ugmc-dashboard/shared/dashboard-card";
import { useState, useEffect } from "react";
import InfoTooltip from "@/components/info-tooltip";
import clsx from "clsx";
import { FaPhoneSlash } from "react-icons/fa6";
import {
    type CallMetricsSlice,
    getCallOutcomeTotals,
} from "./call-metrics-helpers";

const infoText =
    "Calls that were not answered or completed in the selected period.";

interface OperatingRoomsUtilizationProps {
    callMetrics?: CallMetricsSlice;
}

const OperatingRoomsUtilization: React.FC<OperatingRoomsUtilizationProps> = ({ callMetrics }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [animatedMissed, setAnimatedMissed] = useState(0);
    const [animatedProgress, setAnimatedProgress] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    const { total, missed, hasCallData, missedPct } = getCallOutcomeTotals(callMetrics);
    const targetMissed = missed;
    const targetProgress = missedPct ?? 0;
    const showData = hasCallData && (total > 0 || missed > 0);

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

            setAnimatedMissed(Math.round(targetMissed * eased));
            setAnimatedProgress(targetProgress * eased);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                setAnimatedMissed(targetMissed);
                setAnimatedProgress(targetProgress);
            }
        };
        requestAnimationFrame(animate);
    }, [isVisible, targetMissed, targetProgress]);

    return (
        <DashboardCard
            className="flex flex-col gap-4 flex-1 min-w-[280px]"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="flex justify-between items-start">
                <div className="flex flex-col gap-0.5">
                    <Text variant="body-md-semibold" color="text-primary">
                        Missed Calls
                    </Text>
                    <Text variant="body-sm" color="text-tertiary">
                        Calls not answered or completed.
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
                        <FaPhoneSlash className="text-accent-red" size={16} />
                    </div>
                    <InfoTooltip text={infoText} show={isHovered} />
                </div>
            </div>
            <div>
                <span
                    className={clsx(
                        "text-[40px] font-bold tracking-tight text-accent-red tabular-nums",
                        "transition-transform duration-300",
                        isHovered && "scale-[1.02] origin-left inline-block"
                    )}
                >
                    {showData ? animatedMissed.toLocaleString() : "—"}
                </span>
            </div>
            <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                    <Text variant="body-sm" color="text-secondary">
                        Total Calls Placed
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
                            Miss rate
                        </Text>
                        <div className="bg-accent-red/20 px-2 py-0.5 rounded-[6px]">
                            <Text variant="body-sm" color="none" className="text-accent-red">
                                {showData && missedPct != null
                                    ? `${animatedProgress.toFixed(1)}%`
                                    : "—"}
                            </Text>
                        </div>
                    </div>
                    <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full bg-accent-red transition-all duration-1000 ease-out"
                            style={{ width: showData ? `${animatedProgress}%` : "0%" }}
                        />
                    </div>
                </div>
            </div>
        </DashboardCard>
    );
};

export default OperatingRoomsUtilization;
