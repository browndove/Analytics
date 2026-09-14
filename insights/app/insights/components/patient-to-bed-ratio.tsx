"use client";

import * as React from "react";
import Text from "@/components/text";
import DashboardCard from "./dashboard-card";
import { FaBed } from "react-icons/fa6";
import { useState, useEffect } from "react";
import InfoTooltip from "@/components/info-tooltip";
import clsx from "clsx";

const infoText = "Ratio of currently admitted patients to total staffed beds available.";

const PatientToBedRatio: React.FC = () => {
    const [isHovered, setIsHovered] = useState(false);
    const [animatedRatio, setAnimatedRatio] = useState(0);
    const [animatedProgress, setAnimatedProgress] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    
    const targetRatio = 0.79;
    const targetProgress = 100;

    useEffect(() => {
        setIsVisible(true);
    }, []);

    // Animate the ratio and progress bar
    useEffect(() => {
        if (!isVisible) return;
        
        const duration = 1200;
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            
            setAnimatedRatio(targetRatio * eased);
            setAnimatedProgress(targetProgress * eased);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                setAnimatedRatio(targetRatio);
                setAnimatedProgress(targetProgress);
            }
        };
        requestAnimationFrame(animate);
    }, [isVisible]);

    return (
        <DashboardCard
            className="flex flex-col gap-4 flex-1 min-w-[280px]"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="flex justify-between items-start">
                <div className="flex flex-col gap-0.5">
                    <Text variant="body-md-semibold" color="text-primary">
                        Patient-to-Bed Ratio
                    </Text>
                    <Text variant="body-sm" color="text-tertiary">
                        Current number of admitted patients per staffed bed.
                    </Text>
                </div>
                <div className="flex items-center gap-2">
                    <div className={clsx(
                        "w-10 h-10 rounded-[10px] bg-secondary flex items-center justify-center",
                        "transition-transform duration-300",
                        isHovered && "scale-110"
                    )}>
                        <FaBed className="text-text-primary" size={18} />
                    </div>
                    <InfoTooltip text={infoText} show={isHovered} />
                </div>
            </div>
            <div>
                <span className={clsx(
                    "text-[40px] font-bold tracking-tight text-[#1F988B] tabular-nums",
                    "transition-transform duration-300",
                    isHovered && "scale-[1.02] origin-left inline-block"
                )}>
                    {animatedRatio.toFixed(2)} : 1
                </span>
            </div>
            <div className="flex flex-col gap-3">
                {/* Patients - no progress bar */}
                <div className="flex justify-between items-center">
                    <Text variant="body-sm" color="text-secondary">
                        Patients
                    </Text>
                    <div className="bg-[#00C8B333] px-2 py-0.5 rounded-[6px]">
                        <Text variant="body-sm" color="none" className="text-[#1F988B]">
                            110
                        </Text>
                    </div>
                </div>

                {/* Separator line */}
                <div className="w-full h-px bg-tertiary" />

                {/* Beds - with progress bar */}
                <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                        <Text variant="body-sm" color="text-secondary">
                            Beds
                        </Text>
                        <div className="bg-[#00C8B333] px-2 py-0.5 rounded-[6px]">
                            <Text variant="body-sm" color="none" className="text-[#1F988B]">
                                140
                            </Text>
                        </div>
                    </div>
                    <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full bg-[#00C8B3] transition-all duration-1000 ease-out"
                            style={{ width: `${animatedProgress}%` }}
                        />
                    </div>
                </div>
            </div>
        </DashboardCard>
    );
};

export default PatientToBedRatio;
