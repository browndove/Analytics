"use client";

import * as React from "react";
import Text from "@/components/text";
import DashboardCard from "./dashboard-card";
import { useState, useEffect } from "react";
import InfoTooltip from "@/components/info-tooltip";
import { FaBed } from "react-icons/fa6";
import clsx from "clsx";

const occupancyInfo = "Current percentage of ICU beds occupied across all units.";
const vacantInfo = "Breakdown of available versus occupied beds in the ICU.";

const CircularProgress: React.FC<{ percentage: number; animated?: boolean }> = ({ percentage, animated = true }) => {
    const [animatedPercentage, setAnimatedPercentage] = useState(0);
    const circumference = 2 * Math.PI * 36;
    const strokeDashoffset = circumference - (animatedPercentage / 100) * circumference;

    useEffect(() => {
        if (!animated) {
            setAnimatedPercentage(percentage);
            return;
        }
        
        const duration = 1200;
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            
            setAnimatedPercentage(percentage * eased);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                setAnimatedPercentage(percentage);
            }
        };
        requestAnimationFrame(animate);
    }, [percentage, animated]);

    return (
        <div className="relative w-[100px] h-[100px]">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
                <circle
                    cx="40"
                    cy="40"
                    r="36"
                    fill="transparent"
                    stroke="var(--bg-tertiary)"
                    strokeWidth="8"
                />
                <circle
                    cx="40"
                    cy="40"
                    r="36"
                    fill="transparent"
                    stroke="var(--accent-green)"
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-100"
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-accent-green text-2xl font-semibold tabular-nums">{Math.round(animatedPercentage)}%</span>
            </div>
        </div>
    );
};

const ICUVacantBeds: React.FC = () => {
    const [isOccupancyHovered, setIsOccupancyHovered] = useState(false);
    const [isVacantHovered, setIsVacantHovered] = useState(false);
    const [animatedOccupancy, setAnimatedOccupancy] = useState(0);
    const [animatedOccupiedBar, setAnimatedOccupiedBar] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    
    const percentage = 84.4;
    const occupied = 21;
    const total = 24;

    useEffect(() => {
        setIsVisible(true);
    }, []);

    // Animate the occupancy percentage and bar
    useEffect(() => {
        if (!isVisible) return;
        
        const duration = 1200;
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            
            setAnimatedOccupancy(percentage * eased);
            setAnimatedOccupiedBar(80 * eased);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                setAnimatedOccupancy(percentage);
                setAnimatedOccupiedBar(80);
            }
        };
        requestAnimationFrame(animate);
    }, [isVisible]);

    return (
        <DashboardCard className="flex flex-col gap-[10px] h-full" padding="sm">
            {/* ICU Occupancy Section */}
            <div
                className="flex flex-col gap-3 bg-tertiary rounded-[12px] p-4 transition-colors"
                onMouseEnter={() => setIsOccupancyHovered(true)}
                onMouseLeave={() => setIsOccupancyHovered(false)}
            >
                <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-0.5">
                        <Text variant="body-md-semibold" color="text-primary">
                            ICU Occupancy %
                        </Text>
                        <Text variant="body-sm" color="text-secondary">
                            All Units
                        </Text>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className={clsx(
                            "w-8 h-8 rounded-[8px] bg-primary flex items-center justify-center shadow-md",
                            "transition-transform duration-300",
                            isOccupancyHovered && "scale-110"
                        )}>
                            <FaBed className="text-text-primary" size={14} />
                        </div>
                        <InfoTooltip text={occupancyInfo} show={isOccupancyHovered} />
                    </div>
                </div>
                <div>
                    <span className={clsx(
                        "text-[28px] font-bold tracking-tight text-accent-primary tabular-nums",
                        "transition-transform duration-300",
                        isOccupancyHovered && "scale-[1.02] origin-left inline-block"
                    )}>
                        {animatedOccupancy.toFixed(1)}%
                    </span>
                </div>
                <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                        <Text variant="body-sm" color="text-secondary">
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
                            className="h-full rounded-full bg-accent-primary transition-all duration-1000 ease-out"
                            style={{ width: `${animatedOccupancy}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Available Vacant Beds Section */}
            <div
                className="flex flex-col gap-3 bg-primary-light rounded-[12px] p-4 transition-colors"
                onMouseEnter={() => setIsVacantHovered(true)}
                onMouseLeave={() => setIsVacantHovered(false)}
            >
                <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-0.5">
                        <Text variant="body-md-semibold" color="text-primary">
                            Available Vacant Beds
                        </Text>
                        <Text variant="body-sm" color="text-secondary">
                            All Units
                        </Text>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className={clsx(
                            "w-8 h-8 rounded-[8px] bg-primary flex items-center justify-center shadow-md",
                            "transition-transform duration-300",
                            isVacantHovered && "scale-110"
                        )}>
                            <FaBed className="text-text-primary" size={14} />
                        </div>
                        <InfoTooltip text={vacantInfo} show={isVacantHovered} />
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
                            <span className="bg-accent-green/20 px-2 py-0.5 rounded-[4px]">
                                <span className="text-accent-green text-sm font-semibold">20%</span>
                            </span>
                            <Text variant="body-sm" color="text-tertiary">
                                2/10 in use
                            </Text>
                        </div>
                    </div>
                    {/* Separator line */}
                    <div className="w-full h-px bg-quaternary" />
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
                            className="h-full rounded-full bg-quaternary transition-all duration-1000 ease-out"
                            style={{ width: `${animatedOccupiedBar}%` }}
                        />
                    </div>
                </div>
            </div>
        </DashboardCard>
    );
};

export default ICUVacantBeds;

