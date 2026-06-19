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
    getCallSummary,
} from "./call-metrics-helpers";

const infoText =
    "Inbound miss events per person — a role may miss more than one call in a group session.";

interface OperatingRoomsUtilizationProps {
    callMetrics?: CallMetricsSlice;
}

const OperatingRoomsUtilization: React.FC<OperatingRoomsUtilizationProps> = ({ callMetrics }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [animatedMissed, setAnimatedMissed] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    const { total, unanswered, missed, hasCallData } = getCallSummary(callMetrics);
    const showData = hasCallData && (total > 0 || missed > 0);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    useEffect(() => {
        if (!isVisible) return;

        const duration = 1200;
        const startTime = Date.now();
        const targetMissed = missed;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);

            setAnimatedMissed(Math.round(targetMissed * eased));

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                setAnimatedMissed(targetMissed);
            }
        };
        requestAnimationFrame(animate);
    }, [isVisible, missed]);

    return (
        <DashboardCard
            className="flex flex-col gap-4 flex-1 min-w-[280px]"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="flex justify-between items-start">
                <div className="flex flex-col gap-0.5">
                    <Text variant="body-md-semibold" color="text-primary">
                        Missed Incoming Calls
                    </Text>
                    <Text variant="body-sm" color="text-tertiary">
                        Incoming rings not picked up.
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
                        Calls placed
                    </Text>
                    <div className="bg-accent-primary/20 px-2 py-0.5 rounded-[6px]">
                        <Text variant="body-sm" color="accent-primary">
                            {showData ? total.toLocaleString() : "—"}
                        </Text>
                    </div>
                </div>
                <div className="w-full h-px bg-tertiary" />
                <div className="flex justify-between items-center">
                    <Text variant="body-sm" color="text-secondary">
                        Unanswered sessions
                    </Text>
                    <div className="bg-secondary px-2 py-0.5 rounded-[6px]">
                        <Text variant="body-sm" color="text-primary">
                            {showData ? unanswered.toLocaleString() : "—"}
                        </Text>
                    </div>
                </div>
            </div>
        </DashboardCard>
    );
};

export default OperatingRoomsUtilization;
