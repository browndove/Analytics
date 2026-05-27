"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import Text from "@/components/text";
import DashboardCard from "@/components/safety-reports/dashboard-card";
import type { TransferMetricsData } from "@/lib/transfer-metrics";
import { baseChartOptions, chartLabelStyle } from "./chart-theme";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

type TransferByRoleChartProps = {
    data: TransferMetricsData | null;
    loading?: boolean;
};

const TransferByRoleChart = ({ data, loading }: TransferByRoleChartProps) => {
    const rows = React.useMemo(() => {
        const list = [...(data?.transfer_by_role ?? [])];
        list.sort((a, b) => b.total_transfer_requests - a.total_transfer_requests);
        return list.slice(0, 8);
    }, [data]);

    const categories = rows.map((r) => r.role_name);
    const values = rows.map((r) => r.total_transfer_requests);
    const max = Math.max(...values, 1);

    const options: ApexCharts.ApexOptions = {
        ...baseChartOptions,
        chart: { ...baseChartOptions.chart, type: "bar" },
        colors: ["#2980D3"],
        plotOptions: {
            bar: {
                horizontal: true,
                borderRadius: 4,
                barHeight: "65%",
            },
        },
        xaxis: {
            categories,
            labels: { style: chartLabelStyle },
        },
        yaxis: {
            max,
            tickAmount: 4,
            labels: { style: chartLabelStyle },
        },
        legend: { show: false },
        tooltip: {
            ...baseChartOptions.tooltip,
            y: { formatter: (val) => `${val} requests` },
        },
    };

    return (
        <DashboardCard className="flex h-full flex-col gap-4" padding="lg">
            <div className="flex flex-col gap-[2px]">
                <Text variant="body-md-semibold" color="text-primary" className="font-bold">
                    Transfers by Role
                </Text>
                <Text variant="body-sm" color="text-secondary">
                    Requesting roles · Selected period
                </Text>
            </div>
            {loading ? (
                <div className="flex h-[260px] items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-primary border-t-transparent" />
                </div>
            ) : rows.length === 0 ? (
                <Text variant="body-sm" color="text-tertiary" className="py-12 text-center">
                    No role breakdown in this period
                </Text>
            ) : (
                <div className="h-[260px] min-h-0 flex-1">
                    <Chart
                        options={options}
                        series={[{ name: "Requests", data: values }]}
                        type="bar"
                        width="100%"
                        height="100%"
                    />
                </div>
            )}
        </DashboardCard>
    );
};

export default TransferByRoleChart;
