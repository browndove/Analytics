"use client";

import * as React from "react";
import Text from "@/components/text";
import DashboardCard from "./dashboard-card";
import dynamic from "next/dynamic";
import { useState } from "react";
import InfoTooltip from "@/components/info-tooltip";
import { useTheme } from "next-themes";

const infoText = "Distribution of prescription volume across different pharmacy units.";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

type LegendItemProps = {
    color: string;
    bgColor: string;
    label: string;
    value: string;
};

const LegendItem: React.FC<LegendItemProps> = ({ color, bgColor, label, value }) => (
    <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
            <span
                className="w-3 h-3 rounded-[3px]"
                style={{ backgroundColor: color }}
            />
            <Text variant="body-md" color="text-secondary">
                {label}
            </Text>
        </div>
        <span
            className="px-2 py-0.5 rounded-[6px] text-[12px] font-semibold"
            style={{ backgroundColor: bgColor, color: color }}
        >
            {value}
        </span>
    </div>
);

const PharmacyPrescription: React.FC = () => {
    const { resolvedTheme } = useTheme();
    const [isHovered, setIsHovered] = useState(false);
    const [animatedTotal, setAnimatedTotal] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    const totalScripts = 600;

    React.useEffect(() => {
        setIsVisible(true);
    }, []);

    // Animate the total number
    React.useEffect(() => {
        if (!isVisible) return;

        const duration = 1200;
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);

            setAnimatedTotal(Math.round(totalScripts * eased));

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                setAnimatedTotal(totalScripts);
            }
        };
        requestAnimationFrame(animate);
    }, [isVisible]);

    const chartOptions: ApexCharts.ApexOptions = {
        chart: {
            type: "donut",
            sparkline: { enabled: false },
            animations: {
                enabled: true,
                speed: 1200,
                animateGradually: {
                    enabled: true,
                    delay: 150
                },
                dynamicAnimation: {
                    enabled: true,
                    speed: 350
                }
            }
        },
        colors: ["var(--accent-primary)", "var(--accent-red)", "var(--accent-green)", "var(--accent-violet)"],
        plotOptions: {
            pie: {
                donut: {
                    size: "45%",
                    labels: {
                        show: true,
                        name: { show: false },
                        value: { show: false },
                        total: {
                            show: true,
                            showAlways: true,
                            label: "Scripts",
                            fontSize: "10px",
                            fontWeight: 500,
                            color: "var(--text-tertiary)",
                            formatter: () => "600",
                        },
                    },
                },
            },
        },
        dataLabels: { enabled: false },
        stroke: { show: false },
        legend: { show: false },
        tooltip: {
            theme: resolvedTheme === "dark" || resolvedTheme === "blue" ? "dark" : "light",
            enabled: true,
            fillSeriesColor: false,
            shared: false,
            followCursor: true,
            style: {
                fontSize: "12px",
                fontFamily: "Montserrat, sans-serif",
            },
            custom: function ({ series, seriesIndex, w }: any) {
                const labels = ["Main Pharmacy", "Emergency Pharmacy", "ICU Annex", "Outpatient Annex"];
                const colors = ["var(--accent-primary)", "var(--accent-red)", "var(--accent-green)", "var(--accent-violet)"];
                const percentages = ["40%", "40%", "13%", "7%"];
                const value = series[seriesIndex];
                const label = labels[seriesIndex];
                const color = colors[seriesIndex];
                const percentage = percentages[seriesIndex];

                return `
                    <div style="padding: 10px 14px; background: var(--bg-primary); border: none !important; outline: none !important; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); font-family: Montserrat, sans-serif; min-width: 180px; max-width: 220px; overflow: hidden; position: relative;">
                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                            <div style="width: 14px; height: 14px; border-radius: 3px; background: ${color}; flex-shrink: 0;"></div>
                            <span style="font-weight: 600; font-size: 13px; color: var(--text-primary);">${label}</span>
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 4px;">
                            <span style="font-weight: 700; font-size: 18px; color: var(--text-primary); line-height: 1.2;">${value} Scripts</span>
                            <span style="font-size: 12px; color: var(--text-tertiary); font-weight: 500;">${percentage} of total</span>
                        </div>
                    </div>
                `;
            },
        },
    };

    const chartSeries = [240, 240, 80, 40];

    const legendItems = [
        { color: "var(--accent-primary)", bgColor: "color-mix(in srgb, var(--accent-primary) 10%, transparent)", label: "Main Pharmacy", value: "240 Scripts" },
        { color: "var(--accent-red)", bgColor: "color-mix(in srgb, var(--accent-red) 10%, transparent)", label: "Emergency Pharmacy", value: "240 Scripts" },
        { color: "var(--accent-green)", bgColor: "color-mix(in srgb, var(--accent-green) 10%, transparent)", label: "ICU Annex", value: "80 Scripts" },
        { color: "var(--accent-violet)", bgColor: "color-mix(in srgb, var(--accent-violet) 10%, transparent)", label: "Outpatient Annex", value: "40 Scripts" },
    ];

    return (
        <DashboardCard
            className="flex flex-col gap-2 h-full"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <Text variant="body-md-semibold" color="text-primary">
                Pharmacy Prescription Distribution
                <InfoTooltip text={infoText} show={isHovered} />
            </Text>
            <div className="flex items-center justify-center flex-1 bg-accent-primary/5 rounded-[12px] py-2">
                <div className="relative w-[240px] h-[240px] drop-shadow-lg">
                    <style jsx global>{`
                        .apexcharts-tooltip {
                            border: none !important;
                            outline: none !important;
                            box-shadow: none !important;
                            background: transparent !important;
                            padding: 0 !important;
                        }
                        .apexcharts-tooltip * {
                            border: none !important;
                            outline: none !important;
                        }
                        .apexcharts-tooltip.apexcharts-theme-light {
                            border: none !important;
                            outline: none !important;
                            box-shadow: none !important;
                            background: transparent !important;
                            padding: 0 !important;
                        }
                        .apexcharts-tooltip-series-group {
                            border: none !important;
                            outline: none !important;
                            background: transparent !important;
                            padding: 0 !important;
                        }
                        .apexcharts-tooltip-marker {
                            display: none !important;
                        }
                    `}</style>
                    <Chart
                        options={chartOptions}
                        series={chartSeries}
                        type="donut"
                        width="100%"
                        height="100%"
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <Text variant="heading-lg" color="text-primary" className="tabular-nums">
                            {animatedTotal}
                        </Text>
                        <Text variant="body-md" color="text-tertiary">
                            Scripts
                        </Text>
                    </div>
                </div>
            </div>
            <div className="flex flex-col gap-2 mt-auto">
                {legendItems.map((item) => (
                    <LegendItem key={item.label} {...item} />
                ))}
            </div>
        </DashboardCard>
    );
};

export default PharmacyPrescription;
