"use client";

import Text from "@safety-reports/shared/text";
import DashboardCard from "@safety-reports/components/safety-reports/dashboard-card";

const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN"];

const TransferVolumeChart = () => (
    <DashboardCard className="flex flex-col gap-4" padding="lg">
        <div className="flex flex-col gap-[2px]">
            <Text variant="body-md-semibold" color="text-primary" className="font-bold">
                Transfer Volume
            </Text>
            <Text variant="body-sm" color="text-secondary">
                Incoming & outgoing · Last 6 months
            </Text>
        </div>
        <div className="flex h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-tertiary bg-secondary/50">
            <Text variant="body-sm-semibold" color="text-secondary">
                Chart data coming soon
            </Text>
            <Text variant="body-xs" color="text-tertiary" className="mt-1">
                Connect your transfer metrics API to populate this view
            </Text>
            <div className="mt-6 flex w-full max-w-md items-end justify-between gap-2 px-6 opacity-40">
                {months.map((m) => (
                    <div key={m} className="flex flex-col items-center gap-2">
                        <div className="h-16 w-8 rounded-t bg-tertiary" />
                        <span className="text-[10px] font-medium text-text-tertiary">{m}</span>
                    </div>
                ))}
            </div>
        </div>
    </DashboardCard>
);

export default TransferVolumeChart;
