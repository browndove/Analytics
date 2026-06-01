"use client";

import * as React from "react";
import Text from "@/components/text";
import DashboardCard from "@/components/ugmc-dashboard/shared/dashboard-card";
import { FaPhoneVolume } from "react-icons/fa6";
import { useState, useEffect } from "react";
import InfoTooltip from "@/components/info-tooltip";
import clsx from "clsx";
import {
    type CallMetricsSlice,
    getCallOutcomeTotals,
} from "./call-metrics-helpers";

const infoText = "Comparison of completed calls versus unanswered calls for the selected period.";

interface PatientToBedRatioProps {
    callMetrics?: CallMetricsSlice;
}

const PatientToBedRatio: React.FC<PatientToBedRatioProps> = ({ callMetrics }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [animatedProgress, setAnimatedProgress] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    const { total, completed, unanswered, hasDuration, completionPct } =
        getCallOutcomeTotals(callMetrics);
    const showData = hasDuration && total > 0;
    const targetProgress = completionPct ?? 0;

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
                        Completed vs Unanswered
                    </Text>
                    <Text variant="body-sm" color="text-tertiary">
                        Call outcomes for the selected period.
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
                        <FaPhoneVolume className="text-text-primary" size={16} />
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
                    {showData
                        ? `${completed.toLocaleString()} : ${unanswered.toLocaleString()}`
                        : "—"}
                </span>
            </div>
            <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                    <Text variant="body-sm" color="text-secondary">
                        Completed
                    </Text>
                    <div className="bg-[#00C8B333] px-2 py-0.5 rounded-[6px]">
                        <Text variant="body-sm" color="none" className="text-[#1F988B]">
                            {showData ? completed.toLocaleString() : "—"}
                        </Text>
                    </div>
                </div>
                <div className="w-full h-px bg-tertiary" />
                <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                        <Text variant="body-sm" color="text-secondary">
                            Unanswered
                        </Text>
                        <div className="bg-[#00C8B333] px-2 py-0.5 rounded-[6px]">
                            <Text variant="body-sm" color="none" className="text-[#1F988B]">
                                {showData ? unanswered.toLocaleString() : "—"}
                            </Text>
                        </div>
                    </div>
                    <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full bg-[#00C8B3] transition-all duration-1000 ease-out"
                            style={{ width: showData ? `${animatedProgress}%` : "0%" }}
                        />
                    </div>
                </div>
            </div>
        </DashboardCard>
    );
};

export default PatientToBedRatio;
