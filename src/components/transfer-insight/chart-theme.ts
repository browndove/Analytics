import type { ApexOptions } from "apexcharts";

export const chartLabelStyle = {
    colors: "var(--text-secondary)",
    fontSize: "10px",
    fontWeight: 500,
    fontFamily: "Montserrat",
};

export const baseChartOptions: ApexOptions = {
    chart: {
        toolbar: { show: false },
        zoom: { enabled: false },
        animations: { enabled: true, speed: 800 },
        fontFamily: "Montserrat",
    },
    dataLabels: { enabled: false },
    grid: {
        show: true,
        borderColor: "var(--bg-tertiary)",
        strokeDashArray: 0,
        xaxis: { lines: { show: false } },
        yaxis: { lines: { show: true } },
    },
    tooltip: {
        theme: "light",
        style: { fontSize: "12px", fontFamily: "Montserrat" },
    },
};
