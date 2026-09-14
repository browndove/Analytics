"use client";

import * as React from "react";
import Text from "@/components/text";
import DashboardCard from "./dashboard-card";
import { useState, useEffect } from "react";
import InfoTooltip from "@/components/info-tooltip";

const infoText = "Comparison of actual nurse-to-patient ratios against target safety standards by department.";

type RatioItemProps = {
    department: string;
    target: string;
    actual: string;
    percentage: number;
    delay?: number;
};

const CircularProgress: React.FC<{ percentage: number; delay?: number }> = ({ percentage, delay = 0 }) => {
    const [animatedPercentage, setAnimatedPercentage] = useState(0);
    const radius = 22;
    const circumference = 2 * Math.PI * radius;
    // Cap visual progress at 100% but show actual percentage in text
    const visualPercentage = Math.min(animatedPercentage, 100);
    const strokeDashoffset = circumference - (visualPercentage / 100) * circumference;
    // Use red color for overloaded (>100%) to indicate danger
    const strokeColor = percentage > 100 ? "var(--accent-red)" : "var(--accent-primary)";

    useEffect(() => {
        const timer = setTimeout(() => {
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
        }, delay);

        return () => clearTimeout(timer);
    }, [percentage, delay]);

    return (
        <div className="relative w-14 h-14">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 50 50">
                <circle
                    cx="25"
                    cy="25"
                    r={radius}
                    fill="transparent"
                    stroke="var(--bg-tertiary)"
                    strokeWidth="4"
                />
                <circle
                    cx="25"
                    cy="25"
                    r={radius}
                    fill="transparent"
                    stroke={strokeColor}
                    strokeWidth="5"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-100"
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-[12px] font-semibold tabular-nums ${percentage > 100 ? 'text-accent-red' : 'text-accent-primary'}`}>
                    {animatedPercentage.toFixed(animatedPercentage % 1 === 0 ? 0 : 1)}%
                </span>
            </div>
        </div>
    );
};

const RatioItem: React.FC<RatioItemProps> = ({
    department,
    target,
    actual,
    percentage,
    delay = 0,
}) => {
    const [isHovered, setIsHovered] = useState(false);
    
    return (
        <div 
            className="flex items-center justify-between py-4 px-4 bg-secondary rounded-[10px] h-[85px] transition-all duration-300 hover:bg-tertiary hover:-translate-y-0.5"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="flex items-center gap-4">
                <CircularProgress percentage={percentage} delay={delay} />
                <div className="flex flex-col gap-1">
                    <Text variant="body-md-semibold" color="text-primary">
                        {department}
                    </Text>
                    <Text variant="body-md" color="text-secondary">
                        Target: {target}
                    </Text>
                </div>
            </div>
            <div className={`bg-accent-primary/10 px-3 py-1.5 rounded-[6px] transition-transform duration-300 ${isHovered ? 'scale-105' : ''}`}>
                <Text variant="body-md-semibold" color="none" className="text-accent-primary">
                    {actual}
                </Text>
            </div>
        </div>
    );
};

const NurseToPatientRatio: React.FC = () => {
    const [isHovered, setIsHovered] = useState(false);
    // Nurse-to-patient ratio calculation:
    // Target: safe ratio (e.g., "1:2" = 1 nurse for 2 patients)
    // Actual: current ratio (e.g., "1:3" = 1 nurse for 3 patients)
    // Percentage = (Actual Patients ÷ Target Patients) × 100
    // 100% = exactly safe, >100% = overloaded, <100% = better than required
    const ratioData = [
        { department: "Intensive Care Unit", target: "1:2", actual: "1:3", percentage: 150 },     // 3 ÷ 2 × 100 = 150% (overloaded)
        { department: "Emergency Department", target: "1:4", actual: "1:5", percentage: 125 },   // 5 ÷ 4 × 100 = 125% (overloaded)
        { department: "Medical/Surgical Unit", target: "1:5", actual: "1:5", percentage: 100 },  // 5 ÷ 5 × 100 = 100% (exactly safe)
        { department: "Pediatrics", target: "1:4", actual: "1:3", percentage: 75 },             // 3 ÷ 4 × 100 = 75% (better than required)
        { department: "Outpatient Department", target: "1:8", actual: "1:7", percentage: 87.5 }, // 7 ÷ 8 × 100 = 87.5% (below capacity)
    ];

    return (
        <DashboardCard
            className="flex flex-col gap-2 h-full"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <Text variant="body-md-semibold" color="text-primary">
                Nurse to Patient Ratio
                <InfoTooltip text={infoText} show={isHovered} />
            </Text>
            <div className="flex flex-col gap-3 flex-1 justify-between">
                {ratioData.map((item, index) => (
                    <RatioItem key={index} {...item} delay={index * 150} />
                ))}
            </div>
        </DashboardCard>
    );
};

export default NurseToPatientRatio;

