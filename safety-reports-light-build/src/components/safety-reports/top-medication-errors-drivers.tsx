"use client";

import * as React from "react";
import Text from "@safety-reports/shared/text";
import DashboardCard from "./dashboard-card";

type DriverData = {
    name: string;
    cases: string;
    percentage: number;
};

// Total cases: 8 + 5 + 2 + 6 + 19 = 40
const driverData: DriverData[] = [
    { name: "Wrong dose", cases: "8 Cases", percentage: 20 },           // 8/40 = 20%
    { name: "Timing deviation", cases: "5 Cases", percentage: 13 },    // 5/40 = 12.5% ≈ 13%
    { name: "Omission", cases: "2 Cases", percentage: 5 },             // 2/40 = 5%
    { name: "Wrong patient", cases: "6 Cases", percentage: 15 },       // 6/40 = 15%
    { name: "Dosage & Calculation Errors", cases: "19 Cases", percentage: 48 }, // 19/40 = 47.5% ≈ 48%
];

const CircularProgress: React.FC<{ percentage: number }> = ({ percentage }) => {
    const circumference = 2 * Math.PI * 15;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative w-[39px] h-[39px]">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 39 39">
                <circle
                    cx="19.5"
                    cy="19.5"
                    r="15"
                    fill="transparent"
                    stroke="#EAEAEC"
                    strokeWidth="4"
                />
                <circle
                    cx="19.5"
                    cy="19.5"
                    r="15"
                    fill="transparent"
                    stroke="#2980D3"
                    strokeWidth="4"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] font-semibold text-[#2980D3]">{percentage}%</span>
            </div>
        </div>
    );
};

const TopMedicationErrorsDrivers: React.FC = () => {
    return (
        <DashboardCard className="flex flex-col gap-[10px] flex-1 h-full" padding="md">
            {/* Header */}
            <div className="flex flex-col gap-[2px]">
                <Text variant="body-md-semibold" color="text-primary" className="font-bold">
                    Top Medication Errors Drivers
                </Text>
                <Text variant="body-sm" color="text-secondary">
                    All Departments · Last 6 Months
                </Text>
            </div>

            {/* List */}
            <div className="bg-primary-light border border-secondary rounded-[10px] p-[12px] flex flex-col flex-1 justify-between">
                {driverData.map((driver, index) => (
                    <React.Fragment key={driver.name}>
                        <div className="flex items-center justify-between">
                            <Text variant="body-sm-semibold" color="text-primary">
                                {driver.name}
                            </Text>
                            <div className="flex items-center gap-[10px]">
                                <div className="bg-tertiary px-[7px] py-[4px] rounded-[5px] whitespace-nowrap">
                                    <Text variant="body-sm-semibold" color="text-primary">
                                        {driver.cases}
                                    </Text>
                                </div>
                                <CircularProgress percentage={driver.percentage} />
                            </div>
                        </div>
                        {index < driverData.length - 1 && (
                            <div className="border-t border-tertiary" />
                        )}
                    </React.Fragment>
                ))}
            </div>
        </DashboardCard>
    );
};

export default TopMedicationErrorsDrivers;
