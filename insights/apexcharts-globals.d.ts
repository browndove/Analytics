type ApexAxisChartSeries = Array<{
	name?: string;
	data: Array<any>;
	[key: string]: any;
}>;

declare namespace ApexCharts {
	type ApexOptions = import("apexcharts").ApexOptions;
}
