"use client";

import * as React from "react";
import Text from "@/components/text";
import DashboardCard from "./dashboard-card";
import { FaBed } from "react-icons/fa6";

const CircularProgress: React.FC<{ percentage: number }> = ({ percentage }) => {
    const circumference = 2 * Math.PI * 28;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative w-[70px] h-[70px]">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 64 64">
                <circle
                    cx="32"
                    cy="32"
                    r="28"
                    fill="transparent"
                    stroke="var(--bg-tertiary)"
                    strokeWidth="5"
                />
                <circle
                    cx="32"
                    cy="32"
                    r="28"
                    fill="transparent"
                    stroke="var(--accent-green)"
                    strokeWidth="5"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-accent-green text-xs font-semibold">{percentage}%</span>
            </div>
        </div>
    );
};

const VacantBeds: React.FC = () => {
    return (
        <DashboardCard className="flex flex-col gap-3 bg-secondary">
            <div className="flex justify-between items-start">
                <div className="flex flex-col gap-0.5">
                    <Text variant="body-md-semibold" color="text-primary">
                        Available Vacant Beds
                    </Text>
                    <Text variant="body-xs" color="text-secondary">
                        All Units
                    </Text>
                </div>
                <div className="w-8 h-8 rounded-[8px] bg-primary flex items-center justify-center">
                    <FaBed className="text-text-primary" size={14} />
                </div>
            </div>
            <div className="flex items-center gap-4">
                <CircularProgress percentage={20} />
            </div>
            <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                    <Text variant="body-sm" color="text-secondary">
                        Vacant
                    </Text>
                    <div className="flex items-center gap-2">
                        <span className="bg-accent-green/20 px-1.5 py-0.5 rounded-[4px]">
                            <span className="text-accent-green text-base font-semibold">20%</span>
                        </span>
                        <Text variant="body-xs" color="text-tertiary">
                            2/10 in use
                        </Text>
                    </div>
                </div>
                <div className="flex justify-between items-center">
                    <Text variant="body-sm" color="text-secondary">
                        Occupied
                    </Text>
                    <span className="bg-quaternary px-1.5 py-0.5 rounded-[4px]">
                        <Text variant="body-sm" color="text-primary">
                            80%
                        </Text>
                    </span>
                </div>
                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                        className="h-full rounded-full bg-quaternary transition-all duration-500"
                        style={{ width: "80%" }}
                    />
                </div>
            </div>
        </DashboardCard>
    );
};

export default VacantBeds;
