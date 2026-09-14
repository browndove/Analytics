"use client";

import * as React from "react";
import Text from "@safety-reports/shared/text";
import DashboardCard from "./dashboard-card";
import clsx from "clsx";

type ErrorCategory = {
    name: string;
    percentage: number;
    color: string;
    bgColor: string;
    textColor: string;
};

// Total: 142 errors = 14 + 36 + 50 + 42
const errorCategories: ErrorCategory[] = [
    { name: "Critical", percentage: 10, color: "#FF5F57", bgColor: "#FF5F571A", textColor: "#FF5F57" },
    { name: "Moderate", percentage: 25, color: "#FF9257", bgColor: "#FF92571A", textColor: "#FF9257" },
    { name: "Serious", percentage: 35, color: "#FFCA57", bgColor: "#FFCA5733", textColor: "#C68904" },
    { name: "Minor", percentage: 30, color: "#00C8B3", bgColor: "#00C8B31A", textColor: "#089A8A" },
];

const MedicationErrors: React.FC = () => {
    const [animatedTotal, setAnimatedTotal] = React.useState(0);
    const [animatedBars, setAnimatedBars] = React.useState([0, 0, 0, 0]);
    const [isVisible, setIsVisible] = React.useState(false);
    
    const totalErrors = 142;

    React.useEffect(() => {
        setIsVisible(true);
    }, []);

    // Animate the total number and bars (slower animation)
    React.useEffect(() => {
        if (!isVisible) return;
        
        const duration = 2500;
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            
            setAnimatedTotal(Math.round(totalErrors * eased));
            setAnimatedBars(errorCategories.map(cat => cat.percentage * eased));
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                setAnimatedTotal(totalErrors);
                setAnimatedBars(errorCategories.map(cat => cat.percentage));
            }
        };
        requestAnimationFrame(animate);
    }, [isVisible]);

    return (
        <DashboardCard className="flex flex-col gap-[15px] flex-1" padding="md">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-[2px]">
                    <Text variant="body-md-semibold" color="text-primary" className="font-bold">
                        Medication Errors
                    </Text>
                    <Text variant="body-sm" color="text-secondary">
                        All Departments · Last 6 Months
                    </Text>
                </div>
                <div className="bg-[#2980D31A] px-[7px] py-[4px] rounded-[5px] whitespace-nowrap">
                    <Text variant="body-sm-semibold" color="none" className="text-[#2980D3]">
                        <span className="tabular-nums">{animatedTotal}</span> Total
                    </Text>
                </div>
            </div>

            {/* Big number */}
            <div className="flex flex-col gap-[2px]">
                <span className="text-[32px] font-bold text-[#2980D3] tabular-nums">{animatedTotal}</span>
                <Text variant="body-sm" color="text-secondary">Errors this period</Text>
            </div>

            {/* Stacked bar - animated percentages */}
            <div className="flex h-[35px] rounded-[10px] overflow-hidden">
                <div 
                    className="shrink-0 bg-[#FF5F57] rounded-l-[10px] transition-all duration-100" 
                    style={{ width: `${animatedBars[0]}%` }}
                />
                <div 
                    className="shrink-0 bg-[#FF9257] transition-all duration-100" 
                    style={{ width: `${animatedBars[1]}%` }}
                />
                <div 
                    className="shrink-0 bg-[#FFCA57] transition-all duration-100" 
                    style={{ width: `${animatedBars[2]}%` }}
                />
                <div 
                    className="flex-1 bg-[#00C8B3] rounded-r-[10px] transition-all duration-100" 
                    style={{ minWidth: `${animatedBars[3]}%` }}
                />
            </div>

            {/* Legend */}
            <div className="flex flex-col gap-[10px]">
                {errorCategories.map((category, index) => (
                    <React.Fragment key={category.name}>
                        <div className="flex items-center justify-between hover:bg-secondary/50 rounded-md px-1 -mx-1 transition-colors">
                            <div className="flex items-center gap-[5px]">
                                <div
                                    className="w-[10px] h-[10px] rounded-[2px]"
                                    style={{ backgroundColor: category.color }}
                                />
                                <Text variant="body-sm" color="text-primary">{category.name}</Text>
                            </div>
                            <div
                                className="px-[7px] py-[4px] rounded-[5px]"
                                style={{ backgroundColor: category.bgColor }}
                            >
                                <span
                                    className="text-[12px] font-semibold tabular-nums"
                                    style={{ color: category.textColor }}
                                >
                                    {Math.round(animatedBars[index])}%
                                </span>
                            </div>
                        </div>
                        {index < errorCategories.length - 1 && (
                            <div className="border-t border-tertiary" />
                        )}
                    </React.Fragment>
                ))}
            </div>
        </DashboardCard>
    );
};

export default MedicationErrors;
