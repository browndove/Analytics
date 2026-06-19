"use client";

import * as React from "react";
import Text from "@/components/text";
import {
    type CallMetricsSlice,
    hasAnsweredDuration,
    pickTypicalSeconds,
} from "./call-metrics-helpers";
import { formatDurationSeconds } from "@/lib/distribution-metrics";
import CallOutcomeBarChart from "./call-outcome-bar-chart";

const infoText =
    "Outbound calls we placed, by initiating department — answered vs unanswered sessions.";

interface OutboundCallsByDepartmentProps {
    callMetrics?: CallMetricsSlice;
}

const OutboundCallsByDepartment: React.FC<OutboundCallsByDepartmentProps> = ({ callMetrics }) => {
    const hasAnswered = hasAnsweredDuration(callMetrics);
    const typicalSeconds = pickTypicalSeconds(callMetrics?.answered);

    const headerExtra =
        hasAnswered && typicalSeconds != null ? (
            <div className="flex gap-3 flex-wrap">
                <div className="rounded-[10px] bg-secondary px-[15px] py-[8px]">
                    <Text variant="body-sm" color="text-secondary">
                        Avg answered call duration
                    </Text>
                    <Text variant="heading-sm" color="text-primary">
                        {formatDurationSeconds(typicalSeconds)}
                    </Text>
                </div>
            </div>
        ) : null;

    return (
        <CallOutcomeBarChart
            callMetrics={callMetrics}
            direction="outbound"
            dimension="department"
            title="Outbound Calls by Department"
            infoText={infoText}
            limit={6}
            headerExtra={headerExtra}
        />
    );
};

export default OutboundCallsByDepartment;
