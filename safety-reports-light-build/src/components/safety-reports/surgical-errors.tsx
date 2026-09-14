"use client";

import * as React from "react";
import Text from "@safety-reports/shared/text";
import DashboardCard from "./dashboard-card";
import dynamic from "next/dynamic";
import { RiExpandDiagonalLine } from "react-icons/ri";
import { GrContract } from "react-icons/gr";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

// Maximize icon
const MaximizeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M12.9502 3.23759C12.9502 3.06586 12.8819 2.90116 12.7605 2.77973C12.6391 2.65829 12.4744 2.59007 12.3026 2.59007H9.06504C8.89331 2.59007 8.72861 2.65829 8.60718 2.77973C8.48574 2.90116 8.41752 3.06586 8.41752 3.23759C8.41752 3.40933 8.48574 3.57402 8.60718 3.69546C8.72861 3.81689 8.89331 3.88511 9.06504 3.88511H10.7292L8.6053 6.01545C8.54461 6.07565 8.49644 6.14726 8.46357 6.22617C8.43069 6.30508 8.41377 6.38971 8.41377 6.47519C8.41377 6.56067 8.43069 6.64531 8.46357 6.72421C8.49644 6.80312 8.54461 6.87474 8.6053 6.93493C8.6655 6.99562 8.73711 7.04379 8.81602 7.07667C8.89493 7.10954 8.97956 7.12647 9.06504 7.12647C9.15052 7.12647 9.23516 7.10954 9.31406 7.07667C9.39297 7.04379 9.46459 6.99562 9.52478 6.93493L11.6551 4.80459V6.47519C11.6551 6.64692 11.7233 6.81162 11.8448 6.93306C11.9662 7.05449 12.1309 7.12271 12.3026 7.12271C12.4744 7.12271 12.6391 7.05449 12.7605 6.93306C12.8819 6.81162 12.9502 6.64692 12.9502 6.47519V3.23759ZM6.9347 8.60553C6.87451 8.54484 6.80289 8.49667 6.72398 8.4638C6.64508 8.43092 6.56044 8.414 6.47496 8.414C6.38948 8.414 6.30485 8.43092 6.22594 8.4638C6.14704 8.49667 6.07542 8.54484 6.01522 8.60553L3.88488 10.7294V9.06527C3.88488 8.89354 3.81666 8.72884 3.69523 8.60741C3.5738 8.48597 3.4091 8.41775 3.23736 8.41775C3.06563 8.41775 2.90093 8.48597 2.7795 8.60741C2.65806 8.72884 2.58984 8.89354 2.58984 9.06527V12.3029C2.58984 12.4746 2.65806 12.6393 2.7795 12.7607C2.90093 12.8822 3.06563 12.9504 3.23736 12.9504H6.47496C6.6467 12.9504 6.81139 12.8822 6.93283 12.7607C7.05426 12.6393 7.12248 12.4746 7.12248 12.3029C7.12248 12.1311 7.05426 11.9664 6.93283 11.845C6.81139 11.7236 6.6467 11.6553 6.47496 11.6553H4.80436L6.9347 9.52501C6.99539 9.46481 7.04356 9.3932 7.07644 9.31429C7.10931 9.23539 7.12624 9.15075 7.12624 9.06527C7.12624 8.97979 7.10931 8.89516 7.07644 8.81625C7.04356 8.73734 6.99539 8.66573 6.9347 8.60553Z" fill="#234258" />
    </svg>
);

// Close icon
const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const SurgicalErrors: React.FC = () => {
    const [isMaximized, setIsMaximized] = React.useState(false);
    const chartOptions: ApexCharts.ApexOptions = {
        chart: {
            type: "bar",
            toolbar: { show: false },
            zoom: { enabled: false },
            animations: {
                enabled: true,
                speed: 800,
            },
        },
        colors: ["#FF5F57"],
        plotOptions: {
            bar: {
                borderRadius: 4,
                borderRadiusApplication: "end",
                columnWidth: "60%",
            },
        },
        dataLabels: { enabled: false },
        xaxis: {
            categories: ["JAN", "FEB", "MAR", "APR", "MAY", "JUN"],
            axisBorder: { show: false },
            axisTicks: { show: false },
            labels: {
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
            max: 80,
            tickAmount: 4,
            labels: {
                style: {
                    colors: "var(--text-secondary)",
                    fontSize: "10px",
                    fontWeight: 500,
                    fontFamily: "Montserrat",
                },
                formatter: (val) => val.toString(),
            },
        },
        grid: {
            show: true,
            borderColor: "var(--bg-tertiary)",
            strokeDashArray: 0,
            xaxis: {
                lines: { show: false },
            },
            yaxis: {
                lines: { show: true },
            },
        },
        legend: {
            show: false,
        },
        tooltip: {
            theme: "light",
            style: {
                fontSize: '12px',
                fontFamily: 'Montserrat',
            },
        },
    };

    // Values from image: JAN: 68, FEB: 73, MAR: 40, APR: 55, MAY: 22, JUN: 40
    const chartSeries = [
        {
            name: "Surgical Mortality",
            data: [68, 73, 40, 55, 22, 40],
        },
    ];

    const chartContent = (isModal: boolean = false) => (
        <>
            <div className="flex items-start justify-between">
                <div className="flex flex-col gap-[2px]">
                    <Text variant={isModal ? "body-lg-semibold" : "body-md-semibold"} color="text-primary" className="font-bold">
                        Surgical Mortality
                    </Text>
                    <Text variant="body-sm" color="text-secondary">
                        All Departments · Last 6 Months
                    </Text>
                </div>
                {!isModal && (
                    <button
                        onClick={() => setIsMaximized(true)}
                        className="flex items-center justify-center size-[30px] bg-secondary rounded-[10px] cursor-pointer hover:bg-tertiary transition-colors"
                        title="Maximize"
                    >
                        <RiExpandDiagonalLine className="size-4 text-text-primary" />
                    </button>
                )}
                {isModal && (
                    <button
                        onClick={() => setIsMaximized(false)}
                        className="flex items-center justify-center size-[30px] bg-secondary rounded-[10px] cursor-pointer hover:bg-tertiary transition-colors"
                        title="Close"
                    >
                        <GrContract className="size-4 text-text-primary" />
                    </button>
                )}
            </div>

            <div className={`w-full ${isModal ? "h-[500px]" : "h-[280px]"}`}>
                <Chart
                    options={chartOptions}
                    series={chartSeries}
                    type="bar"
                    width="100%"
                    height="100%"
                />
            </div>
        </>
    );

    return (
        <>
            <DashboardCard className="flex flex-col gap-[15px] flex-1" padding="lg">
                {chartContent(false)}
            </DashboardCard>

            {/* Maximized Modal Overlay */}
            {isMaximized && (
                <div
                    className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6"
                    onClick={() => setIsMaximized(false)}
                >
                    <div
                        className="bg-primary rounded-[20px] p-6 w-full max-w-5xl max-h-[90vh] overflow-auto flex flex-col gap-[15px] shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {chartContent(true)}
                    </div>
                </div>
            )}
        </>
    );
};

export default SurgicalErrors;
