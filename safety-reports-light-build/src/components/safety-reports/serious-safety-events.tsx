"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import Text from "@safety-reports/shared/text";

// Decrease icon (positive outcome - green, arrow going down)
const DecreaseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="7" viewBox="0 0 12 7" fill="none">
        <path d="M7.57129 6H10.7141V2.85714" stroke="#37A152" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10.7143 6L6.275 1.56071C6.20156 1.48873 6.10283 1.44841 6 1.44841C5.89717 1.44841 5.79844 1.48873 5.725 1.56071L3.91786 3.36786C3.84442 3.43984 3.74569 3.48016 3.64286 3.48016C3.54003 3.48016 3.44129 3.43984 3.36786 3.36786L0.5 0.5" stroke="#37A152" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const SemiCircleGauge: React.FC<{ value: number; maxValue: number }> = ({ value, maxValue }) => {
    const [animatedValue, setAnimatedValue] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    const strokeWidth = 40;
    const radius = 100;
    const svgWidth = 260;
    const svgHeight = 150;
    const centerX = svgWidth / 2;
    const centerY = svgHeight - 20;

    // Calculate arc path
    const startX = centerX - radius;
    const endX = centerX + radius;
    const arcPath = `M ${startX} ${centerY} A ${radius} ${radius} 0 0 1 ${endX} ${centerY}`;

    // Calculate circumference of semi-circle and dash offset
    const circumference = Math.PI * radius;
    const percentage = (animatedValue / maxValue) * 100;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    useEffect(() => {
        setIsVisible(true);
    }, []);

    useEffect(() => {
        if (!isVisible) return;

        const duration = 1800;
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);

            setAnimatedValue(value * eased);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                setAnimatedValue(value);
            }
        };
        requestAnimationFrame(animate);
    }, [isVisible, value]);

    return (
        <div className="relative flex flex-col items-center">
            <svg width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
                <defs>
                    <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#FFA857" />
                        <stop offset="100%" stopColor="#FF5F57" />
                    </linearGradient>
                </defs>
                {/* Background arc */}
                <path
                    d={arcPath}
                    fill="none"
                    stroke="#EAEBEC"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                />
                {/* Foreground arc with gradient - animated */}
                <path
                    d={arcPath}
                    fill="none"
                    stroke="url(#gaugeGradient)"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-100"
                />
            </svg>
            {/* Center text */}
            <div className="absolute bottom-[-12px] flex flex-col items-center">
                <span className="text-[40px] font-bold text-[#FF5F57] tabular-nums">{animatedValue.toFixed(1)}</span>
                <div className="text-[13px] font-semibold text-text-secondary text-center">
                    <p>Per 1000</p>
                    <p>Encounters</p>
                </div>
            </div>
        </div>
    );
};

const SeriousSafetyEvents: React.FC = () => {
    const [animatedObserved, setAnimatedObserved] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    const observedValue = 6.8;

    useEffect(() => {
        setIsVisible(true);
    }, []);

    useEffect(() => {
        if (!isVisible) return;

        const duration = 1800;
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);

            setAnimatedObserved(observedValue * eased);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                setAnimatedObserved(observedValue);
            }
        };
        requestAnimationFrame(animate);
    }, [isVisible]);

    return (
        <div className="serious-safety-card relative h-full rounded-[15px] bg-primary p-4 flex flex-col items-center justify-between">
            {/* Header */}
            <div className="flex items-center justify-between w-full">
                <div className="flex flex-col gap-[2px]">
                    <Text variant="body-md-semibold" color="text-primary" className="font-bold">
                        Serious Safety Events
                    </Text>
                    <Text variant="body-sm" color="text-secondary">
                        All Departments · Last 6 Months
                    </Text>
                </div>
                <div className="flex items-center gap-[5px] px-[10px] py-[4px] rounded-full bg-[#37A1521A]">
                    <DecreaseIcon />
                    <span className="text-[12px] font-semibold text-[#37A152]">
                        -7%
                    </span>
                </div>
            </div>

            {/* Gauge */}
            <div className="flex-1 flex items-center justify-center py-2">
                <SemiCircleGauge value={6.8} maxValue={12} />
            </div>

            {/* Legend */}
            <div className="bg-secondary rounded-[8px] p-[10px] w-full flex flex-col gap-[10px]">
                <div className="flex items-center justify-between">
                    <Text variant="body-sm" color="text-primary">Observed</Text>
                    <div className="bg-[#FF5F5733] px-[6px] py-[2px] rounded-[5px]">
                        <Text variant="body-sm-semibold" color="none" className="text-[#FF5F57] tabular-nums">
                            {animatedObserved.toFixed(1)}
                        </Text>
                    </div>
                </div>
            </div>

            {/* Trail gradient border using ::before pseudo-element */}
            <style jsx>{`
                @property --border-angle {
                    syntax: "<angle>";
                    inherits: true;
                    initial-value: 0turn;
                }
                .serious-safety-card {
                    position: relative;
                    --border-angle: 0turn;
                }
                .serious-safety-card::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    border-radius: 15px;
                    padding: 2px;
                    background: conic-gradient(
                        from var(--border-angle),
                        transparent 0deg,
                        transparent 30deg,
                        rgba(255, 95, 87, 0.05) 60deg,
                        rgba(255, 95, 87, 0.15) 90deg,
                        rgba(255, 95, 87, 0.3) 120deg,
                        rgba(255, 168, 87, 0.5) 150deg,
                        rgba(255, 168, 87, 0.7) 180deg,
                        rgba(255, 95, 87, 0.85) 210deg,
                        #FF5F57 240deg,
                        #FF5F57 270deg,
                        rgba(255, 95, 87, 0.6) 300deg,
                        rgba(255, 95, 87, 0.2) 330deg,
                        transparent 360deg
                    );
                    -webkit-mask: 
                        linear-gradient(#fff 0 0) content-box, 
                        linear-gradient(#fff 0 0);
                    -webkit-mask-composite: xor;
                    mask: 
                        linear-gradient(#fff 0 0) content-box, 
                        linear-gradient(#fff 0 0);
                    mask-composite: exclude;
                    pointer-events: none;
                }
                .serious-safety-card:hover {
                    animation: border-spin 3s linear infinite;
                }
                @keyframes border-spin {
                    to {
                        --border-angle: 1turn;
                    }
                }
            `}</style>
        </div>
    );
};

export default SeriousSafetyEvents;
