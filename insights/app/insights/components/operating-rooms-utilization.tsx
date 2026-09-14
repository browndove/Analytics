"use client";

import * as React from "react";
import Text from "@/components/text";
import DashboardCard from "./dashboard-card";
import { useState, useEffect } from "react";
import InfoTooltip from "@/components/info-tooltip";
import clsx from "clsx";

const infoText = "Percentage of scheduled operating room time that is actually utilized for procedures.";

const ScissorsIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6.65387 1.63299C6.5564 1.45954 6.39402 1.33191 6.20246 1.27818C6.01089 1.22445 5.80582 1.24902 5.63237 1.34649C5.45892 1.44396 5.33129 1.60633 5.27756 1.7979C5.22383 1.98947 5.2484 2.19454 5.34587 2.36799L11.1399 12.672L8.43187 17.487C8.09009 16.7116 7.49587 16.0748 6.74597 15.6803C5.99608 15.2858 5.1347 15.1568 4.30213 15.3144C3.46957 15.4719 2.71487 15.9067 2.16096 16.5479C1.60705 17.1891 1.28657 17.999 1.25171 18.8456C1.21685 19.6923 1.46967 20.5258 1.96899 21.2103C2.46831 21.8949 3.18471 22.3903 4.0015 22.6158C4.8183 22.8412 5.68736 22.7835 6.46715 22.4519C7.24694 22.1204 7.89151 21.5346 8.29587 20.79L11.9999 14.202L15.7039 20.79C16.1082 21.5343 16.7526 22.1199 17.5322 22.4512C18.3118 22.7826 19.1806 22.8402 19.9971 22.6148C20.8136 22.3893 21.5298 21.8941 22.0289 21.2097C22.528 20.5253 22.7808 19.6921 22.7459 18.8457C22.7111 17.9994 22.3907 17.1898 21.837 16.5487C21.2833 15.9077 20.5288 15.473 19.6965 15.3154C18.8643 15.1579 18.0031 15.2868 17.2534 15.6811C16.5038 16.0754 15.9096 16.7119 15.5679 17.487L12.8599 12.672L18.6539 2.36799C18.7513 2.19454 18.7759 1.98947 18.7222 1.7979C18.6684 1.60633 18.5408 1.44396 18.3674 1.34649C18.1939 1.24902 17.9889 1.22445 17.7973 1.27818C17.6057 1.33191 17.4433 1.45954 17.3459 1.63299L11.9999 11.142L6.65387 1.63299Z" fill="var(--text-primary)" />
    </svg>
);

const OperatingRoomsUtilization: React.FC = () => {
    const [isHovered, setIsHovered] = useState(false);
    const [animatedPercentage, setAnimatedPercentage] = useState(0);
    const [animatedProgress, setAnimatedProgress] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    
    const targetPercentage = 84.4;
    const targetProgress = 84.8;

    useEffect(() => {
        setIsVisible(true);
    }, []);

    // Animate the percentage and progress bar
    useEffect(() => {
        if (!isVisible) return;
        
        const duration = 1200;
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            
            setAnimatedPercentage(targetPercentage * eased);
            setAnimatedProgress(targetProgress * eased);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                setAnimatedPercentage(targetPercentage);
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
                        Operating Rooms Utilization
                    </Text>
                    <Text variant="body-sm" color="text-tertiary">
                        Scheduled vs used time.
                    </Text>
                </div>
                <div className="flex items-center gap-2">
                    <div className={clsx(
                        "w-10 h-10 rounded-[10px] bg-secondary flex items-center justify-center",
                        "transition-transform duration-300",
                        isHovered && "scale-110"
                    )}>
                        <ScissorsIcon />
                    </div>
                    <InfoTooltip text={infoText} show={isHovered} />
                </div>
            </div>
            <div>
                <span className={clsx(
                    "text-[40px] font-bold tracking-tight text-accent-primary tabular-nums",
                    "transition-transform duration-300",
                    isHovered && "scale-[1.02] origin-left inline-block"
                )}>
                    {animatedPercentage.toFixed(1)}%
                </span>
            </div>
            <div className="flex flex-col gap-3">
                {/* Scheduled Time - no progress bar */}
                <div className="flex justify-between items-center">
                    <Text variant="body-sm" color="text-secondary">
                        Scheduled Time
                    </Text>
                    <div className="bg-accent-primary/20 px-2 py-0.5 rounded-[6px]">
                        <Text variant="body-sm" color="accent-primary">
                            168 hrs
                        </Text>
                    </div>
                </div>

                {/* Separator line */}
                <div className="w-full h-px bg-tertiary" />

                {/* Used Time - with progress bar */}
                <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                        <Text variant="body-sm" color="text-secondary">
                            Used Time
                        </Text>
                        <div className="bg-accent-primary/20 px-2 py-0.5 rounded-[6px]">
                            <Text variant="body-sm" color="accent-primary">
                                142.5 hrs
                            </Text>
                        </div>
                    </div>
                    <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full bg-accent-primary transition-all duration-1000 ease-out"
                            style={{ width: `${animatedProgress}%` }}
                        />
                    </div>
                </div>
            </div>
        </DashboardCard>
    );
};

export default OperatingRoomsUtilization;
