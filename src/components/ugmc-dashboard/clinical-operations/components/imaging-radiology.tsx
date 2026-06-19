"use client";

import * as React from "react";
import { useEffect, useState, useMemo } from "react";
import Text from "@/components/text";
import DashboardCard from "@/components/ugmc-dashboard/shared/dashboard-card";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });
import { RiExpandDiagonalLine } from "react-icons/ri";
import { GrContract } from "react-icons/gr";
import InfoTooltip from "@/components/info-tooltip";
import FullscreenOverlay from "@/components/fullscreen-overlay";
import {
    type CallMetricsSlice,
    formatRoleName,
    getCallSummary,
    hasOutboundOutcomes,
    num,
    sortOutboundRolesByVolume,
    truncateLabel,
} from "./call-metrics-helpers";

const infoText =
    "Outbound calls by initiating role — answered vs unanswered sessions for the selected period.";

const TOP_ROLES = 4;

type BarChartSeries = { name: string; data: number[] }[];

const CheckIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" clipRule="evenodd" d="M12 21C13.1819 21 14.3522 20.7672 15.4442 20.3149C16.5361 19.8626 17.5282 19.1997 18.364 18.364C19.1997 17.5282 19.8626 16.5361 20.3149 15.4442C20.7672 14.3522 21 13.1819 21 12C21 10.8181 20.7672 9.64778 20.3149 8.55585C19.8626 7.46392 19.1997 6.47177 18.364 5.63604C17.5282 4.80031 16.5361 4.13738 15.4442 3.68508C14.3522 3.23279 13.1819 3 12 3C9.61305 3 7.32387 3.94821 5.63604 5.63604C3.94821 7.32387 3 9.61305 3 12C3 14.3869 3.94821 16.6761 5.63604 18.364C7.32387 20.0518 9.61305 21 12 21ZM11.768 15.64L16.768 9.64L15.232 8.36L10.932 13.519L8.707 11.293L7.293 12.707L10.293 15.707L11.067 16.481L11.768 15.64Z" fill="var(--accent-green)" />
    </svg>
);

const UnansweredIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1.75 4C1.75 3.80109 1.82902 3.61032 1.96967 3.46967C2.11032 3.32902 2.30109 3.25 2.5 3.25H13.5C13.6989 3.25 13.8897 3.32902 14.0303 3.46967C14.171 3.61032 14.25 3.80109 14.25 4C14.25 4.19891 14.171 4.38968 14.0303 4.53033C13.8897 4.67098 13.6989 4.75 13.5 4.75H2.5C2.30109 4.75 2.11032 4.67098 1.96967 4.53033C1.82902 4.38968 1.75 4.19891 1.75 4ZM8.25 7.25H2.5C2.30109 7.25 2.11032 7.32902 1.96967 7.46967C1.82902 7.61032 1.75 7.80109 1.75 8C1.75 8.19891 1.82902 8.38968 1.96967 8.53033C2.11032 8.67098 2.30109 8.75 2.5 8.75H8.25C8.44891 8.75 8.63968 8.67098 8.78033 8.53033C8.92098 8.38968 9 8.19891 9 8C9 7.80109 8.92098 7.61032 8.78033 7.46967C8.63968 7.32902 8.44891 7.25 8.25 7.25ZM8.25 11.25H2.5C2.30109 11.25 2.11032 11.329 1.96967 11.4697C1.82902 11.6103 1.75 11.8011 1.75 12C1.75 12.1989 1.82902 12.3897 1.96967 12.5303C2.11032 12.671 2.30109 12.75 2.5 12.75H8.25C8.44891 12.75 8.63968 12.671 8.78033 12.5303C8.92098 12.3897 9 12.1989 9 12C9 11.8011 8.92098 11.6103 8.78033 11.4697C8.63968 11.329 8.44891 11.25 8.25 11.25ZM15.75 10C15.75 10.1272 15.7177 10.2524 15.656 10.3637C15.5944 10.475 15.5054 10.5688 15.3975 10.6362L11.3975 13.1362C11.284 13.2072 11.1535 13.2465 11.0196 13.25C10.8858 13.2535 10.7534 13.2211 10.6363 13.1562C10.5192 13.0912 10.4216 12.9961 10.3537 12.8808C10.2858 12.7654 10.25 12.6339 10.25 12.5V7.5C10.25 7.3661 10.2858 7.23463 10.3537 7.11924C10.4216 7.00385 10.5192 6.90876 10.6363 6.84383C10.7534 6.7789 10.8858 6.7465 11.0196 6.75C11.1535 6.75351 11.284 6.79278 11.3975 6.86375L15.3975 9.36375C15.5054 9.43119 15.5944 9.52498 15.656 9.63628C15.7177 9.74759 15.75 9.87275 15.75 10ZM13.585 10L11.75 8.85312V11.1469L13.585 10Z" fill="var(--text-primary)" />
    </svg>
);

function truncateRoleLabel(name: string, max = 14): string {
    return truncateLabel(name, max);
}

interface ImagingRadiologyProps {
    callMetrics?: CallMetricsSlice;
}

const ImagingRadiology: React.FC<ImagingRadiologyProps> = ({ callMetrics }) => {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const { resolvedTheme } = useTheme();
    const [isHovered, setIsHovered] = useState(false);
    const [animatedAnswered, setAnimatedAnswered] = useState(0);
    const [animatedUnanswered, setAnimatedUnanswered] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    const { answered, unanswered, hasCallData } = getCallSummary(callMetrics);
    const answeredCalls = hasCallData ? answered : 0;
    const unansweredCalls =
        callMetrics?.total_unanswered_calls != null || hasCallData ? unanswered : null;

    const roleChart = useMemo(() => {
        const roles = sortOutboundRolesByVolume(callMetrics, TOP_ROLES);

        if (!roles.length) {
            return {
                categories: [] as string[],
                roleFullNames: [] as string[],
                series: [] as BarChartSeries,
                chartYMax: 80,
                hasPerRoleOutcomes: false,
            };
        }

        const roleFullNames = roles.map((r) => formatRoleName(r.role_name));
        const categories = roleFullNames.map((name) => truncateRoleLabel(name));

        const hasPerRoleOutcomes = roles.some(hasOutboundOutcomes);

        if (hasPerRoleOutcomes) {
            const answeredData = roles.map((r) => num(r.answered_calls));
            const unansweredData = roles.map((r) => num(r.unanswered_calls));
            const peak = Math.max(...answeredData, ...unansweredData, 0);
            const chartYMax = peak <= 0 ? 80 : Math.ceil(peak * 1.15 / 10) * 10;

            return {
                categories,
                roleFullNames,
                chartYMax,
                hasPerRoleOutcomes: true,
                series: [
                    { name: "Answered", data: answeredData },
                    { name: "Unanswered", data: unansweredData },
                ] as BarChartSeries,
            };
        }

        const callTotals = roles.map((r) => num(r.total_calls_made));
        const peak = Math.max(...callTotals, 0);
        const chartYMax = peak <= 0 ? 80 : Math.ceil(peak * 1.15 / 10) * 10;

        return {
            categories,
            roleFullNames,
            chartYMax,
            hasPerRoleOutcomes: false,
            series: [{ name: "Calls", data: callTotals }] as BarChartSeries,
        };
    }, [callMetrics?.by_outbound_role]);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    useEffect(() => {
        if (!isVisible) return;

        const targetAnswered = answeredCalls;
        const targetUnanswered = unansweredCalls ?? 0;
        const animDuration = 1200;
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / animDuration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);

            setAnimatedAnswered(Math.round(targetAnswered * eased));
            setAnimatedUnanswered(Math.round(targetUnanswered * eased));

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                setAnimatedAnswered(targetAnswered);
                setAnimatedUnanswered(targetUnanswered);
            }
        };
        requestAnimationFrame(animate);
    }, [isVisible, answeredCalls, unansweredCalls]);

    useEffect(() => {
        if (isFullscreen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isFullscreen]);

    const chartOptions: ApexCharts.ApexOptions = useMemo(
        () => ({
            chart: {
                type: "bar",
                toolbar: { show: false },
                zoom: { enabled: false },
                animations: {
                    enabled: true,
                    speed: 500,
                    animateGradually: { enabled: true, delay: 250 },
                    dynamicAnimation: { enabled: true, speed: 500 },
                },
            },
            colors: roleChart.hasPerRoleOutcomes
                ? ["var(--accent-green)", "var(--accent-red)"]
                : ["var(--accent-primary)"],
            plotOptions: {
                bar: {
                    horizontal: false,
                    columnWidth: "40px",
                    borderRadius: 4,
                    borderRadiusApplication: "end",
                },
            },
            dataLabels: { enabled: false },
            stroke: { show: true, width: 3, colors: ["transparent"] },
            xaxis: {
                categories: roleChart.categories,
                axisBorder: { show: false },
                axisTicks: { show: false },
                labels: {
                    rotate: 0,
                    rotateAlways: false,
                    trim: true,
                    hideOverlappingLabels: false,
                    style: {
                        colors: "var(--text-secondary)",
                        fontSize: "10px",
                        fontWeight: 500,
                        fontFamily: "Montserrat",
                    },
                },
            },
            yaxis: {
                min: 0,
                max: roleChart.chartYMax,
                tickAmount: 4,
                labels: {
                    style: {
                        colors: "var(--text-secondary)",
                        fontSize: "10px",
                        fontWeight: 500,
                    },
                },
            },
            grid: {
                borderColor: "var(--bg-tertiary)",
                strokeDashArray: 4,
                xaxis: { lines: { show: false } },
                yaxis: { lines: { show: true } },
            },
            legend: {
                show: roleChart.series.length > 0,
                position: "bottom",
                horizontalAlign: "center",
                markers: { size: 8, offsetX: -4 },
                itemMargin: { horizontal: 12, vertical: 0 },
                fontFamily: "Montserrat, sans-serif",
                fontSize: "11px",
                fontWeight: 500,
                labels: { colors: "var(--text-secondary)" },
            },
            tooltip: {
                enabled: true,
                theme: resolvedTheme === "dark" || resolvedTheme === "blue" ? "dark" : "light",
                style: { fontSize: "12px", fontFamily: "Montserrat" },
                x: {
                    formatter: (_val, opts) =>
                        roleChart.roleFullNames[opts?.dataPointIndex ?? 0] ?? _val,
                },
                y: { formatter: (val) => `${val} calls` },
            },
        }),
        [resolvedTheme, roleChart]
    );

    const chartBody = (height: string) => (
        <div className="w-full" style={{ height }}>
            {roleChart.categories.length > 0 ? (
                <Chart
                    options={chartOptions}
                    series={roleChart.series}
                    type="bar"
                    width="100%"
                    height="100%"
                />
            ) : (
                <div className="flex h-full items-center justify-center">
                    <Text variant="body-sm" color="text-secondary">
                        No role breakdown available for this period.
                    </Text>
                </div>
            )}
        </div>
    );

    return (
        <>
            <DashboardCard
                className="flex flex-col gap-4 flex-1 min-w-[320px]"
                padding="lg"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <ChartHeader
                    isFullscreen={isFullscreen}
                    onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
                    isHovered={isHovered}
                />
                <ChartStats
                    hasCallData={hasCallData}
                    animatedAnswered={animatedAnswered}
                    unansweredCalls={unansweredCalls}
                    animatedUnanswered={animatedUnanswered}
                />
                {chartBody("260px")}
            </DashboardCard>

            {isFullscreen && (
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
                        <ChartHeader
                            isFullscreen={isFullscreen}
                            onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
                            isHovered={isHovered}
                        />
                        <ChartStats
                            hasCallData={hasCallData}
                            animatedAnswered={animatedAnswered}
                            unansweredCalls={unansweredCalls}
                            animatedUnanswered={animatedUnanswered}
                        />
                        {chartBody("600px")}
                    </DashboardCard>
                </FullscreenOverlay>
            )}
        </>
    );
};

interface ChartHeaderProps {
    isFullscreen: boolean;
    onToggleFullscreen: () => void;
    isHovered: boolean;
}

const ChartHeader = ({ isFullscreen, onToggleFullscreen, isHovered }: ChartHeaderProps) => (
    <div className="flex items-start justify-between">
        <Text variant="body-md-semibold" color="text-primary">
            Calls by Role
        </Text>
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-accent-primary/10 px-2 py-1 rounded-[6px]">
                <span className="w-2 h-2 rounded-full bg-accent-primary animate-pulse" />
                <Text variant="body-sm" color="none" className="text-accent-primary">
                    Live
                </Text>
            </div>
            <div
                className="flex items-center justify-center size-[30px] bg-secondary rounded-[10px] cursor-pointer hover:bg-tertiary transition-colors"
                onClick={onToggleFullscreen}
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
);

interface ChartStatsProps {
    hasCallData: boolean;
    animatedAnswered: number;
    unansweredCalls: number | null;
    animatedUnanswered: number;
}

const ChartStats = ({
    hasCallData,
    animatedAnswered,
    unansweredCalls,
    animatedUnanswered,
}: ChartStatsProps) => (
    <div className="flex gap-3 flex-wrap">
        <div className="flex items-center justify-between min-w-[180px] bg-accent-green/10 rounded-[10px] px-[15px] py-[8px]">
            <div className="flex flex-col">
                <Text variant="body-sm" className="text-accent-green">
                    Calls Answered
                </Text>
                {hasCallData ? (
                    <span className="text-[20px] font-bold text-text-primary tabular-nums">
                        {animatedAnswered.toLocaleString()}
                    </span>
                ) : (
                    <Text variant="heading-sm" color="text-primary">
                        —
                    </Text>
                )}
            </div>
            <CheckIcon />
        </div>
        <div className="flex items-center justify-between min-w-[160px] bg-secondary rounded-[10px] px-[15px] py-[8px]">
            <div className="flex flex-col">
                <Text variant="body-sm" color="text-primary">
                    Unanswered Calls
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
            <UnansweredIcon />
        </div>
    </div>
);

export default ImagingRadiology;
