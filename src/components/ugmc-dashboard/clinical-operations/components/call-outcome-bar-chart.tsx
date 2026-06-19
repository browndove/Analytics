"use client";

import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import Text from "@/components/text";
import DashboardCard from "@/components/ugmc-dashboard/shared/dashboard-card";
import dynamic from "next/dynamic";
import { RiExpandDiagonalLine } from "react-icons/ri";
import { GrContract } from "react-icons/gr";
import InfoTooltip from "@/components/info-tooltip";
import FullscreenOverlay from "@/components/fullscreen-overlay";
import {
    type CallMetricsSlice,
    formatRoleName,
    getCallSummary,
    hasInboundOutcomes,
    hasOutboundOutcomes,
    num,
    sortInboundDepartmentsByVolume,
    sortInboundRolesByVolume,
    sortOutboundDepartmentsByVolume,
    sortOutboundRolesByVolume,
    sumInboundAnswered,
    sumInboundMissed,
    truncateLabel,
} from "./call-metrics-helpers";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export type CallChartDirection = "inbound" | "outbound";
export type CallChartDimension = "department" | "role";

type BarChartSeries = { name: string; data: number[] }[];

export type CallOutcomeBarChartProps = {
    callMetrics?: CallMetricsSlice;
    direction: CallChartDirection;
    dimension: CallChartDimension;
    title: string;
    infoText: string;
    limit?: number;
    showLiveBadge?: boolean;
    headerExtra?: React.ReactNode;
    emptyLabel?: string;
};

function truncateCategory(name: string, max = 14): string {
    return truncateLabel(name, max);
}

function buildChartData(
    callMetrics: CallMetricsSlice | undefined,
    direction: CallChartDirection,
    dimension: CallChartDimension,
    limit: number
) {
    const isOutbound = direction === "outbound";
    const isRole = dimension === "role";

    if (isOutbound) {
        const rows = isRole
            ? sortOutboundRolesByVolume(callMetrics, limit)
            : sortOutboundDepartmentsByVolume(callMetrics, limit);

        if (!rows.length) {
            return {
                categories: [] as string[],
                fullNames: [] as string[],
                series: [] as BarChartSeries,
                chartYMax: 80,
                hasOutcomes: false,
            };
        }

        const fullNames = isRole
            ? (rows as ReturnType<typeof sortOutboundRolesByVolume>).map((r) =>
                  formatRoleName(r.role_name)
              )
            : (rows as ReturnType<typeof sortOutboundDepartmentsByVolume>).map((d) => d.department_name);
        const categories = fullNames.map((name) => truncateCategory(name));
        const hasOutcomes = rows.some(hasOutboundOutcomes);

        if (hasOutcomes) {
            const answeredData = rows.map((r) => num(r.answered_calls));
            const negativeData = rows.map((r) => num(r.unanswered_calls));
            const peak = Math.max(...answeredData, ...negativeData, 0);
            return {
                categories,
                fullNames,
                chartYMax: peak <= 0 ? 80 : Math.ceil((peak * 1.15) / 10) * 10,
                hasOutcomes: true,
                series: [
                    { name: "Answered", data: answeredData },
                    { name: "Unanswered", data: negativeData },
                ] as BarChartSeries,
            };
        }

        const volumeData = rows.map((r) => num(r.total_calls_made));
        const peak = Math.max(...volumeData, 0);
        return {
            categories,
            fullNames,
            chartYMax: peak <= 0 ? 80 : Math.ceil((peak * 1.15) / 10) * 10,
            hasOutcomes: false,
            series: [{ name: "Calls placed", data: volumeData }] as BarChartSeries,
        };
    }

    const rows = isRole
        ? sortInboundRolesByVolume(callMetrics, limit)
        : sortInboundDepartmentsByVolume(callMetrics, limit);

    if (!rows.length) {
        return {
            categories: [] as string[],
            fullNames: [] as string[],
            series: [] as BarChartSeries,
            chartYMax: 80,
            hasOutcomes: false,
        };
    }

    const fullNames = isRole
        ? (rows as ReturnType<typeof sortInboundRolesByVolume>).map((r) => formatRoleName(r.role_name))
        : (rows as ReturnType<typeof sortInboundDepartmentsByVolume>).map((d) => d.department_name);
    const categories = fullNames.map((name) => truncateCategory(name));
    const answeredData = rows.map((r) => num(r.answered_calls));
    const missedData = rows.map((r) => num(r.missed_calls));
    const peak = Math.max(...answeredData, ...missedData, 0);

    return {
        categories,
        fullNames,
        chartYMax: peak <= 0 ? 80 : Math.ceil((peak * 1.15) / 10) * 10,
        hasOutcomes: rows.some(hasInboundOutcomes),
        series: [
            { name: "Answered", data: answeredData },
            { name: "Missed", data: missedData },
        ] as BarChartSeries,
    };
}

const CallOutcomeBarChart: React.FC<CallOutcomeBarChartProps> = ({
    callMetrics,
    direction,
    dimension,
    title,
    infoText,
    limit = dimension === "role" ? 4 : 6,
    showLiveBadge = false,
    headerExtra,
    emptyLabel,
}) => {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [animatedPositive, setAnimatedPositive] = useState(0);
    const [animatedNegative, setAnimatedNegative] = useState(0);

    const { answered, unanswered, hasCallData } = getCallSummary(callMetrics);
    const isOutbound = direction === "outbound";

    const positiveTotal = isOutbound ? answered : sumInboundAnswered(callMetrics);
    const negativeTotal = isOutbound ? unanswered : sumInboundMissed(callMetrics);
    const showStats = isOutbound
        ? hasCallData
        : positiveTotal > 0 || negativeTotal > 0 || num(callMetrics?.total_missed_calls) > 0;

    const positiveLabel = "Answered";
    const negativeLabel = isOutbound ? "Unanswered" : "Missed";

    const chart = useMemo(
        () => buildChartData(callMetrics, direction, dimension, limit),
        [callMetrics, direction, dimension, limit]
    );

    useEffect(() => {
        setIsVisible(true);
    }, []);

    useEffect(() => {
        if (!isVisible) return;
        const targetPositive = showStats ? positiveTotal : 0;
        const targetNegative = showStats ? negativeTotal : 0;
        const animDuration = 1200;
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / animDuration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setAnimatedPositive(Math.round(targetPositive * eased));
            setAnimatedNegative(Math.round(targetNegative * eased));
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                setAnimatedPositive(targetPositive);
                setAnimatedNegative(targetNegative);
            }
        };
        requestAnimationFrame(animate);
    }, [isVisible, positiveTotal, negativeTotal, showStats]);

    useEffect(() => {
        document.body.style.overflow = isFullscreen ? "hidden" : "unset";
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
            colors:
                chart.hasOutcomes || !isOutbound
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
                categories: chart.categories,
                axisBorder: { show: false },
                axisTicks: { show: false },
                labels: {
                    rotate: 0,
                    trim: true,
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
                max: chart.chartYMax,
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
                show: chart.series.length > 1 || chart.series[0]?.name !== "Calls placed",
                position: "bottom",
                horizontalAlign: "center",
                fontFamily: "Montserrat, sans-serif",
                fontSize: "11px",
                fontWeight: 500,
                labels: { colors: "var(--text-secondary)" },
            },
            tooltip: {
                theme: "light",
                fillSeriesColor: false,
                style: { fontSize: "12px", fontFamily: "Montserrat" },
                x: {
                    formatter: (_val, opts) => chart.fullNames[opts?.dataPointIndex ?? 0] ?? _val,
                },
                y: { formatter: (val) => `${val} calls` },
            },
        }),
        [chart, isOutbound]
    );

    const defaultEmpty =
        dimension === "role"
            ? "No role breakdown available for this period."
            : "No department breakdown available for this period.";

    const chartBody = (height: string) => (
        <div className="call-outcome-chart w-full" style={{ height }}>
            {chart.categories.length > 0 ? (
                <Chart
                    options={chartOptions}
                    series={chart.series}
                    type="bar"
                    width="100%"
                    height="100%"
                />
            ) : (
                <div className="flex h-full items-center justify-center px-4">
                    <Text variant="body-sm" color="text-secondary" className="text-center">
                        {emptyLabel ?? defaultEmpty}
                    </Text>
                </div>
            )}
        </div>
    );

    const panel = (height: string) => (
        <>
            <div className="flex items-start justify-between">
                <Text variant="body-md-semibold" color="text-primary">
                    {title}
                </Text>
                <div className="flex items-center gap-2">
                    {showLiveBadge ? (
                        <div className="flex items-center gap-1.5 rounded-[6px] bg-accent-primary/10 px-2 py-1">
                            <span className="h-2 w-2 animate-pulse rounded-full bg-accent-primary" />
                            <Text variant="body-sm" color="none" className="text-accent-primary">
                                Live
                            </Text>
                        </div>
                    ) : null}
                    <div
                        className="flex size-[30px] cursor-pointer items-center justify-center rounded-[10px] bg-secondary transition-colors hover:bg-tertiary"
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

            {headerExtra}

            <div className="flex flex-wrap gap-3">
                <div className="flex min-w-[160px] flex-1 items-center justify-between rounded-[10px] bg-accent-green/10 px-[15px] py-[8px]">
                    <div className="flex flex-col">
                        <Text variant="body-sm" className="text-accent-green">
                            {positiveLabel}
                        </Text>
                        <span className="text-[20px] font-bold tabular-nums text-text-primary">
                            {showStats ? animatedPositive.toLocaleString() : "—"}
                        </span>
                    </div>
                </div>
                <div className="flex min-w-[160px] flex-1 items-center justify-between rounded-[10px] bg-secondary px-[15px] py-[8px]">
                    <div className="flex flex-col">
                        <Text variant="body-sm" color="text-primary">
                            {negativeLabel}
                        </Text>
                        <span className="text-[20px] font-bold tabular-nums text-text-primary">
                            {showStats ? animatedNegative.toLocaleString() : "—"}
                        </span>
                    </div>
                </div>
            </div>

            {chartBody(height)}
        </>
    );

    return (
        <>
            <DashboardCard
                className="flex min-w-[320px] flex-1 flex-col gap-4"
                padding="lg"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {panel("260px")}
            </DashboardCard>

            {isFullscreen ? (
                <FullscreenOverlay
                    onClose={() => setIsFullscreen(false)}
                    panelClassName="bg-transparent shadow-none p-0 w-full!"
                >
                    <DashboardCard
                        className="flex w-[80vw]! flex-col gap-4"
                        padding="lg"
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                    >
                        {panel("600px")}
                    </DashboardCard>
                </FullscreenOverlay>
            ) : null}
        </>
    );
};

export default CallOutcomeBarChart;
