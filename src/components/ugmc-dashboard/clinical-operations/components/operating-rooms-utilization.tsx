"use client";

import * as React from "react";
import Text from "@/components/text";
import DashboardCard from "@/components/ugmc-dashboard/shared/dashboard-card";
import { useMemo, useState } from "react";
import InfoTooltip from "@/components/info-tooltip";
import clsx from "clsx";
import { FaLightbulb } from "react-icons/fa6";
import { type CallMetricsSlice, buildCallInsightMessages } from "./call-metrics-helpers";

const infoText =
    "Auto-generated call insights from answered-call duration, outbound answer rate, and the busiest calling roles in this period.";

interface OperatingRoomsUtilizationProps {
    callMetrics?: CallMetricsSlice;
}

const OperatingRoomsUtilization: React.FC<OperatingRoomsUtilizationProps> = ({ callMetrics }) => {
    const [isHovered, setIsHovered] = useState(false);

    const { statsInsight, actionInsight } = useMemo(
        () => buildCallInsightMessages(callMetrics),
        [callMetrics]
    );

    const hasInsight = Boolean(statsInsight || actionInsight);

    return (
        <DashboardCard
            className="flex min-h-[280px] flex-1 flex-col gap-4 min-w-[280px]"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="flex items-start justify-between">
                <div className="flex flex-col gap-0.5">
                    <Text variant="body-md-semibold" color="text-primary">
                        Calls Insight
                    </Text>
                    <Text variant="body-sm" color="text-tertiary">
                        What stands out in this window.
                    </Text>
                </div>
                <div className="flex items-center gap-2">
                    <div
                        className={clsx(
                            "flex h-10 w-10 items-center justify-center rounded-[10px] bg-secondary",
                            "transition-transform duration-300",
                            isHovered && "scale-110"
                        )}
                    >
                        <FaLightbulb className="text-accent-primary" size={16} />
                    </div>
                    <InfoTooltip text={infoText} show={isHovered} />
                </div>
            </div>

            <div className="flex flex-1 flex-col justify-center gap-3">
                {statsInsight ? (
                    <div className="rounded-[10px] border border-[#2980D333] bg-[#2980D31A] p-3">
                        <Text
                            variant="body-md"
                            color="none"
                            className="font-medium leading-snug"
                            style={{ color: "#2980D3" }}
                        >
                            {statsInsight}
                        </Text>
                    </div>
                ) : null}

                {actionInsight ? (
                    <div className="rounded-[10px] border border-[#0EAF9F33] bg-[#0EAF9F1A] p-3">
                        <Text
                            variant="body-md"
                            color="none"
                            className="break-words font-medium leading-snug"
                            style={{ color: "#0EAF9F" }}
                        >
                            {actionInsight}
                        </Text>
                    </div>
                ) : null}

                {!hasInsight ? (
                    <div className="flex flex-1 items-center justify-center rounded-[10px] border border-dashed border-tertiary bg-secondary/30 px-4 py-8">
                        <Text variant="body-sm" color="text-secondary" className="text-center">
                            Call insights will appear once there is enough activity in this period.
                        </Text>
                    </div>
                ) : null}
            </div>
        </DashboardCard>
    );
};

export default OperatingRoomsUtilization;
