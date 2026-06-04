"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import Text from "@/components/text";
import DashboardCard from "@/components/ugmc-dashboard/shared/dashboard-card";
import clsx from "clsx";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });
import { RiExpandDiagonalLine } from "react-icons/ri";
import { GrContract } from "react-icons/gr";
import InfoTooltip from "@/components/info-tooltip";
import FullscreenOverlay from "@/components/fullscreen-overlay";
import {
    type CallMetricsSlice,
    hasBreakdownOutcomes,
    resolveMissedCallsForBreakdown,
} from "./call-metrics-helpers";

const TOP_DEPARTMENTS = 6;

const infoText =
    "Call volume by initiating department, with average call duration and missed calls for the selected period.";

const WarningIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21.1708 15.398L15.2588 5.54399C14.4828 4.25099 13.2958 3.51099 11.9998 3.51099C10.7038 3.51099 9.51681 4.25099 8.74081 5.54199L2.82881 15.398C2.04281 16.707 1.95681 18.103 2.59381 19.228C3.22981 20.354 4.47181 21 5.99981 21H17.9998C19.5278 21 20.7698 20.354 21.4058 19.229C22.0418 18.104 21.9568 16.708 21.1708 15.398ZM11.9998 17.549C11.1458 17.549 10.4498 16.854 10.4498 16C10.4498 15.145 11.1448 14.449 11.9998 14.449C12.8548 14.449 13.5498 15.145 13.5498 16C13.5498 16.854 12.8538 17.549 11.9998 17.549ZM13.6328 10.125C13.6218 10.156 12.2318 13.593 12.2318 13.593C12.1938 13.687 12.1018 13.749 12.0008 13.749C11.8998 13.749 11.8078 13.687 11.7698 13.593L10.3788 10.155C10.2953 9.94661 10.2516 9.72445 10.2498 9.49999C10.2498 8.53499 11.0348 7.74999 11.9998 7.74999C12.2832 7.75071 12.5622 7.82019 12.8129 7.95245C13.0636 8.08471 13.2784 8.2758 13.439 8.50935C13.5996 8.74289 13.7011 9.0119 13.7348 9.2933C13.7686 9.5747 13.7336 9.86009 13.6328 10.125Z" fill="var(--accent-red)" />
    </svg>
);

const ClockIcon = () => (
    <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 10.1667C1 15.2294 5.10392 19.3333 10.1667 19.3333C15.2294 19.3333 19.3333 15.2294 19.3333 10.1667C19.3333 5.10392 15.2294 1 10.1667 1" stroke="var(--text-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M15.6665 10.1667C15.6665 7.12928 13.2039 4.66666 10.1665 4.66666C7.12913 4.66666 4.6665 7.12928 4.6665 10.1667C4.6665 13.204 7.12913 15.6667 10.1665 15.6667" stroke="var(--text-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

function fmtDuration(seconds: number): string {
    if (!seconds || seconds <= 0) return "—";
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    if (m < 60) return s > 0 ? `${m}m ${s}s` : `${m}m`;
    const h = Math.floor(m / 60);
    const rm = m % 60;
    return rm > 0 ? `${h}h ${rm}m` : `${h}h`;
}

function num(v: unknown): number {
    if (v === null || v === undefined || v === "") return 0;
    const n = typeof v === "string" ? parseFloat(v) : Number(v);
    return Number.isFinite(n) ? n : 0;
}

const UnansweredCallsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path fillRule="evenodd" clipRule="evenodd" d="M0 10C0 4.477 4.477 0 10 0C15.523 0 20 4.477 20 10C20 15.523 15.523 20 10 20C4.477 20 0 15.523 0 10ZM10 6C10 5.73478 9.89464 5.48043 9.70711 5.29289C9.51957 5.10536 9.26522 5 9 5C8.73478 5 8.48043 5.10536 8.29289 5.29289C8.10536 5.48043 8 5.73478 8 6V11C8 11.2652 8.10536 11.5196 8.29289 11.7071C8.48043 11.8946 8.73478 12 9 12H14C14.2652 12 14.5196 11.8946 14.7071 11.7071C14.8946 11.5196 15 11.2652 15 11C15 10.7348 14.8946 10.4804 14.7071 10.2929C14.5196 10.1054 14.2652 10 14 10H10V6Z" fill="var(--text-primary)" />
    </svg>
);

interface CallMetricsDuration {
    completed_calls?: number;
    avg_duration_seconds?: number;
    avg_duration_minutes?: number;
    min_duration_seconds?: number;
    median_duration_seconds?: number;
    max_duration_seconds?: number;
}

interface LabTestsVolumeProps {
    callMetrics?: CallMetricsSlice;
}

const LabTestsVolume: React.FC<LabTestsVolumeProps> = ({ callMetrics }) => {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const { resolvedTheme } = useTheme();
    const [isHovered, setIsHovered] = useState(false);
    const [animatedUnanswered, setAnimatedUnanswered] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    const totalCalls = num(callMetrics?.total_calls_made);
    const completedCalls = num(callMetrics?.duration?.completed_calls);
    const duration = callMetrics?.duration;
    const hasDuration =
        duration != null &&
        (totalCalls > 0 || completedCalls > 0 || num(duration.avg_duration_seconds) > 0);

    const missedDefined = (v: unknown) => v !== undefined && v !== null && v !== "";
    const unansweredCalls = missedDefined(callMetrics?.total_missed_calls)
        ? num(callMetrics!.total_missed_calls)
        : hasDuration && totalCalls > 0
          ? Math.max(0, totalCalls - completedCalls)
          : null;

    const avgSeconds = num(duration?.avg_duration_seconds);
    const avgCallDurationDisplay = hasDuration
        ? avgSeconds > 0
            ? fmtDuration(avgSeconds)
            : duration?.avg_duration_minutes != null
              ? `${num(duration.avg_duration_minutes).toFixed(1)} min`
              : "—"
        : "—";

    useEffect(() => {
        setIsVisible(true);
    }, []);

    // Animate unanswered count when data is available
    useEffect(() => {
        if (!isVisible || unansweredCalls === null) {
            setAnimatedUnanswered(0);
            return;
        }

        const animDuration = 1200;
        const startTime = Date.now();
        const target = unansweredCalls;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / animDuration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);

            setAnimatedUnanswered(Math.round(target * eased));

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                setAnimatedUnanswered(target);
            }
        };
        requestAnimationFrame(animate);
    }, [isVisible, unansweredCalls]);

    const fallbackCategories = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
    const fallbackData = [120, 480, 220, 320, 580, 340, 560];

    const deptChart = React.useMemo(() => {
        const depts = Array.isArray(callMetrics?.by_initiator_department)
            ? [...callMetrics.by_initiator_department]
                  .filter((d) => num(d.total_calls_made) > 0 || num(d.missed_calls) > 0)
                  .sort((a, b) => num(b.total_calls_made) - num(a.total_calls_made))
                  .slice(0, TOP_DEPARTMENTS)
            : [];

        if (!depts.length) {
            if (!callMetrics?.by_initiator_department?.length) {
                return {
                    mode: "empty" as const,
                    categories: fallbackCategories,
                    categoryFullNames: fallbackCategories,
                    series: [{ name: "Calls", data: fallbackData }],
                    chartYMax: 600,
                    hasPerDeptOutcomes: false,
                };
            }
            return {
                mode: "nodata" as const,
                categories: [] as string[],
                categoryFullNames: [] as string[],
                series: [] as { name: string; data: number[] }[],
                chartYMax: 0,
                hasPerDeptOutcomes: false,
            };
        }

        const categoryFullNames = depts.map((d) => d.department_name);
        const categories = categoryFullNames.map((name) =>
            name.length > 14 ? `${name.slice(0, 12)}…` : name
        );

        const hasPerDeptOutcomes = depts.some(hasBreakdownOutcomes);

        if (hasPerDeptOutcomes) {
            const missedData = depts.map((d) => resolveMissedCallsForBreakdown(d));
            const completedData = depts.map((d) => num(d.duration?.completed_calls));
            const peak = Math.max(...missedData, ...completedData, 0);
            const chartYMax = peak <= 0 ? 80 : Math.ceil(peak * 1.15 / 10) * 10;

            return {
                mode: "outcomes" as const,
                categories,
                categoryFullNames,
                hasPerDeptOutcomes: true,
                chartYMax,
                series: [
                    { name: "Missed", data: missedData },
                    { name: "Completed", data: completedData },
                ],
            };
        }

        const volumeData = depts.map((d) => num(d.total_calls_made));
        const peak = Math.max(...volumeData, 0);
        const chartYMax = peak <= 0 ? 600 : Math.ceil(peak * 1.15 / 50) * 50;

        return {
            mode: "volume" as const,
            categories,
            categoryFullNames,
            hasPerDeptOutcomes: false,
            chartYMax,
            series: [{ name: "Calls", data: volumeData }],
        };
    }, [callMetrics?.by_initiator_department]);

    // Prevent body scroll when fullscreen
    useEffect(() => {
        if (isFullscreen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isFullscreen]);

    const chartOptions: ApexCharts.ApexOptions = {
        chart: {
            type: deptChart.mode === "outcomes" ? "bar" : "area",
            toolbar: { show: false },
            sparkline: { enabled: false },
            zoom: { enabled: false },
            animations: {
                enabled: true,
                speed: deptChart.mode === "outcomes" ? 500 : 1500,
                animateGradually: {
                    enabled: true,
                    delay: deptChart.mode === "outcomes" ? 250 : 200,
                },
                dynamicAnimation: {
                    enabled: true,
                    speed: 500,
                },
            },
        },
        colors:
            deptChart.mode === "outcomes"
                ? ["var(--accent-red)", "var(--accent-green)"]
                : ["var(--accent-primary)"],
        ...(deptChart.mode === "volume" || deptChart.mode === "empty"
            ? {
                  fill: {
                      type: "gradient",
                      gradient: {
                          shade: "light",
                          type: "vertical",
                          shadeIntensity: 0.3,
                          gradientToColors: ["var(--accent-primary)"],
                          inverseColors: false,
                          opacityFrom: 0.5,
                          opacityTo: 0.1,
                          stops: [0, 100],
                      },
                  },
                  stroke: {
                      curve: "smooth",
                      width: 3,
                      colors: ["var(--accent-primary)"],
                  },
                  markers: {
                      size: 5,
                      colors: ["var(--accent-primary)"],
                      strokeColors: "var(--bg-primary)",
                      strokeWidth: 2,
                  },
              }
            : {
                  plotOptions: {
                      bar: {
                          horizontal: false,
                          columnWidth: "40px",
                          borderRadius: 4,
                          borderRadiusApplication: "end",
                      },
                  },
                  stroke: { show: true, width: 3, colors: ["transparent"] },
              }),
        dataLabels: { enabled: false },
        legend: {
            show: deptChart.mode === "outcomes",
            position: "bottom",
            horizontalAlign: "center",
            fontFamily: "Montserrat, sans-serif",
            fontSize: "11px",
            fontWeight: 500,
            labels: { colors: "var(--text-secondary)" },
        },
        xaxis: {
            categories: deptChart.categories,
            axisBorder: { show: false },
            axisTicks: { show: false },
            labels: {
                rotate: 0,
                rotateAlways: false,
                trim: true,
                hideOverlappingLabels: false,
                style: {
                    colors: "var(--text-secondary)",
                    fontSize: "11px",
                    fontWeight: 500,
                    fontFamily: "Montserrat",
                },
            },
        },
        yaxis: {
            min: 0,
            max: deptChart.chartYMax,
            tickAmount: 4,
            labels: {
                style: {
                    colors: "var(--text-secondary)",
                    fontSize: "12px",
                    fontWeight: 500,
                    fontFamily: "Montserrat",
                },
                formatter: (val) => val.toString(),
                offsetX: -10,
            },
        },
        grid: {
            show: true,
            borderColor: "var(--bg-tertiary)",
            strokeDashArray: 5,
            xaxis: {
                lines: {
                    show: true,
                },
            },
            yaxis: {
                lines: {
                    show: true,
                },
            },
            padding: {
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
            },
        },
        tooltip: {
            theme: resolvedTheme === "dark" || resolvedTheme === "blue" ? "dark" : "light",
            style: {
                fontSize: '12px',
                fontFamily: "Montserrat",
            },
            x: {
                formatter: (_val, opts) =>
                    deptChart.categoryFullNames[opts?.dataPointIndex ?? 0] ?? _val,
            },
            y: { formatter: (val) => `${val} calls` },
        },
    };

    const ChartContent = ({
        chartHeight,
    }: {
        chartHeight?: string;
    }) => {
        return (
            <div className="flex flex-col gap-4 w-full">
                <div className="flex items-center justify-between">
                    <Text variant="body-md-semibold" color="text-primary">
                        Calls by Department
                    </Text>
                    <div className="flex items-center gap-2">
                        <div
                            className="flex items-center justify-center size-[30px] bg-tertiary rounded-[10px] cursor-pointer hover:bg-secondary transition-colors"
                            onClick={() => setIsFullscreen(!isFullscreen)}
                        >
                            {isFullscreen ? (
                                <GrContract className="size-4 text-text-primary" />
                            ) : (
                                <RiExpandDiagonalLine className="size-4 text-text-primary" />
                            )}
                        </div>
                        <InfoTooltip text={infoText} show={isHovered} />
                    </div>
                </div>
                <div className="flex gap-3 flex-wrap">
                    <div className="flex items-center gap-5 bg-secondary rounded-[10px] px-[15px] py-[8px]">
                        <div className="flex flex-col">
                            <Text variant="body-sm" color="text-secondary">
                                Avg Call Duration
                            </Text>
                            <Text variant="heading-sm" color="text-primary">
                                {avgCallDurationDisplay}
                            </Text>
                        </div>
                        <ClockIcon />
                    </div>
                    <div className="flex items-center gap-5 bg-tertiary rounded-[10px] px-[15px] py-[8px]">
                        <div className="flex flex-col">
                            <Text variant="body-sm" color="text-secondary">
                                Missed Calls
                            </Text>
                            {unansweredCalls !== null ? (
                                <span className="text-[20px] font-bold text-text-primary tabular-nums">
                                    {animatedUnanswered.toLocaleString()}
                                </span>
                            ) : (
                                <Text variant="heading-sm" color="text-primary">
                                    —
                                </Text>
                            )}
                        </div>
                        <UnansweredCallsIcon />
                    </div>
                </div>
                <div style={{ height: chartHeight ?? "260px" }} className="w-full">
                    {deptChart.mode === "nodata" ? (
                        <div className="flex h-full items-center justify-center">
                            <Text variant="body-sm" color="text-secondary">
                                No department breakdown available for this period.
                            </Text>
                        </div>
                    ) : (
                        <Chart
                            options={chartOptions}
                            series={deptChart.series}
                            type={deptChart.mode === "outcomes" ? "bar" : "area"}
                            width="100%"
                            height="100%"
                        />
                    )}
                </div>
            </div>
        );
    }

    return (
        <>
            <DashboardCard
                className="flex flex-col gap-4 flex-1 min-w-[320px]"
                padding="lg"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <ChartContent />
            </DashboardCard>

            {
                isFullscreen && (
                    <FullscreenOverlay
                        onClose={() => setIsFullscreen(false)}
                        panelClassName="bg-transparent shadow-none p-0 w-full!"
                    >
                        <DashboardCard
                            className="flex flex-col gap-4 w-[80vw]!"
                            padding="lg"
                            onMouseEnter={() => setIsHovered(true)}
                            onMouseLeave={() => setIsHovered(false)}
                            >
                                <ChartContent chartHeight="600px" />
                        </DashboardCard>
                    </FullscreenOverlay>
                )
            }
        </>
    );
};

export default LabTestsVolume;
