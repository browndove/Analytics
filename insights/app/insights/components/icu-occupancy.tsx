"use client";

import * as React from "react";
import Text from "@/components/text";
import DashboardCard from "./dashboard-card";
import { FaBed } from "react-icons/fa6";

const ICUOccupancy: React.FC = () => {
    const percentage = 84.4;
    const occupied = 21;
    const total = 24;

    return (
        <DashboardCard className="flex flex-col gap-3 bg-tertiary">
            <div className="flex justify-between items-start">
                <div className="flex flex-col gap-0.5">
                    <Text variant="body-md-semibold" color="text-primary">
                        ICU Occupancy %
                    </Text>
                    <Text variant="body-sm" color="text-secondary">
                        All Units
                    </Text>
                </div>
                <div className="w-8 h-8 rounded-[8px] bg-primary flex items-center justify-center">
                    <FaBed className="text-text-primary" size={14} />
                </div>
            </div>
            <div>
                <Text variant="heading-lg" color="accent-primary" className="tracking-tight">
                    {percentage}%
                </Text>
            </div>
            <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                    <Text variant="body-xs" color="text-secondary">
                        {occupied} of {total} beds occupied
                    </Text>
                    <div className="bg-accent-primary/20 px-2 py-0.5 rounded-[6px]">
                        <Text variant="body-sm" color="accent-primary">
                            168 hrs
                        </Text>
                    </div>
                </div>
                <div className="w-full h-2 bg-primary rounded-full overflow-hidden">
                    <div
                        className="h-full rounded-full bg-accent-primary transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                    />
                </div>
            </div>
        </DashboardCard>
    );
};

export default ICUOccupancy;
