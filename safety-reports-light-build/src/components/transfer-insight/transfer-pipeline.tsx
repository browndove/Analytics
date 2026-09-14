"use client";

import Text from "@safety-reports/shared/text";
import DashboardCard from "@safety-reports/components/safety-reports/dashboard-card";

const stages = [
    { label: "Requested", color: "bg-accent-violet/20" },
    { label: "In review", color: "bg-accent-primary/15" },
    { label: "Accepted", color: "bg-accent-green/15" },
    { label: "Completed", color: "bg-tertiary" },
];

const TransferPipeline = () => (
    <DashboardCard className="flex h-full flex-col gap-4" padding="lg">
        <div className="flex flex-col gap-[2px]">
            <Text variant="body-md-semibold" color="text-primary" className="font-bold">
                Transfer Pipeline
            </Text>
            <Text variant="body-sm" color="text-secondary">
                Status breakdown · Year to date
            </Text>
        </div>
        <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4">
            {stages.map((stage) => (
                <div
                    key={stage.label}
                    className={`flex flex-col items-center justify-center gap-2 rounded-xl p-4 ${stage.color}`}
                >
                    <Text variant="heading-lg" color="text-primary" className="tabular-nums">
                        —
                    </Text>
                    <Text variant="body-xs" color="text-secondary" className="text-center">
                        {stage.label}
                    </Text>
                </div>
            ))}
        </div>
    </DashboardCard>
);

export default TransferPipeline;
