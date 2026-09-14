"use client";

import Text from "@safety-reports/shared/text";
import DashboardCard from "@safety-reports/components/safety-reports/dashboard-card";

const placeholderRows = ["", "", "", ""];

const RecentTransfers = () => (
    <DashboardCard className="flex flex-col gap-4" padding="lg">
        <div className="flex flex-col gap-[2px]">
            <Text variant="body-md-semibold" color="text-primary" className="font-bold">
                Recent Transfers
            </Text>
            <Text variant="body-sm" color="text-secondary">
                Latest incoming and outgoing activity
            </Text>
        </div>
        <div className="flex flex-col gap-2">
            {placeholderRows.map((_, i) => (
                <div
                    key={i}
                    className="flex items-center gap-3 rounded-lg border border-tertiary/80 bg-secondary/40 px-4 py-3"
                >
                    <div className="size-9 shrink-0 rounded-full bg-tertiary" />
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                        <div className="h-3 w-2/5 max-w-[140px] rounded bg-tertiary" />
                        <div className="h-2 w-3/5 max-w-[200px] rounded bg-tertiary/80" />
                    </div>
                    <div className="h-6 w-16 shrink-0 rounded-full bg-tertiary" />
                </div>
            ))}
        </div>
        <Text variant="body-xs" color="text-tertiary" className="text-center">
            Live transfer records will appear here once data is connected
        </Text>
    </DashboardCard>
);

export default RecentTransfers;
