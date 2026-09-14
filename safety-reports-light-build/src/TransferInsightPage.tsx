"use client";

import Topbar from "@safety-reports/shared/topbar-light";
import { KPICard } from "@safety-reports/components/safety-reports";
import {
    TransferStatCard,
    TransferVolumeChart,
    TransferPipeline,
    RecentTransfers,
} from "@safety-reports/components/transfer-insight";

const IncomingIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 22 23" fill="none">
        <path
            d="M5.15625 3.59375H12.0312C12.6692 3.59446 13.2809 3.85973 13.732 4.33135C14.1831 4.80296 14.4368 5.44241 14.4375 6.10938V10.7812H7.84738L10.111 8.41432C10.2345 8.27843 10.3023 8.09748 10.3 7.91006C10.2977 7.72264 10.2255 7.54357 10.0987 7.41103C9.97191 7.27849 9.80063 7.20297 9.62136 7.20057C9.44208 7.19817 9.269 7.26908 9.13902 7.39818L5.70152 10.9919C5.57269 11.1267 5.50032 11.3095 5.50032 11.5C5.50032 11.6905 5.57269 11.8733 5.70152 12.0081L9.13902 15.6018C9.269 15.7309 9.44208 15.8018 9.62136 15.7994C9.80063 15.797 9.97191 15.7215 10.0987 15.589C10.2255 15.4564 10.2977 15.2774 10.3 15.0899C10.3023 14.9025 10.2345 14.7216 10.111 14.5857L7.84738 12.2188H14.4375V16.8906C14.4375 18.3304 12.9856 19.4062 11.6875 19.4062H5.15625C4.51828 19.4055 3.90664 19.1403 3.45553 18.6687C3.00442 18.197 2.75068 17.5576 2.75 16.8906V6.10938C2.75068 5.44241 3.00442 4.80296 3.45553 4.33135C3.90664 3.85973 4.51828 3.59446 5.15625 3.59375ZM18.5625 10.7812C18.7448 10.7812 18.9197 10.857 19.0486 10.9918C19.1776 11.1266 19.25 11.3094 19.25 11.5C19.25 11.6906 19.1776 11.8734 19.0486 12.0082C18.9197 12.143 18.7448 12.2188 18.5625 12.2188H14.4375V10.7812H18.5625Z"
            fill="var(--accent-primary)"
        />
    </svg>
);

const OutgoingIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 17 16" fill="none">
        <path
            d="M14.0938 0H7.21875C6.58078 0.000713461 5.96914 0.265981 5.51803 0.737598C5.06692 1.20921 4.81318 1.84866 4.8125 2.51562V7.1875H11.4026L9.13902 4.82057C9.01553 4.68468 8.94771 4.50373 8.95 4.31631C8.9523 4.12889 9.02453 3.94982 9.15131 3.81728C9.27809 3.68474 9.44937 3.60922 9.62864 3.60682C9.80792 3.60442 9.981 3.67533 10.111 3.80443L13.5485 7.39818C13.6773 7.53296 13.7497 7.71571 13.7497 7.90625C13.7497 8.09679 13.6773 8.27954 13.5485 8.41432L10.111 12.0081C9.981 12.1372 9.80792 12.2081 9.62864 12.2057C9.44937 12.2033 9.27809 12.1278 9.15131 11.9952C9.02453 11.8627 8.9523 11.6836 8.95 11.4962C8.94771 11.3088 9.01553 11.1278 9.13902 10.9919L11.4026 8.625H4.8125V13.2969C4.8125 14.7366 6.26441 15.8125 7.5625 15.8125H14.0938C14.7317 15.8118 15.3434 15.5465 15.7945 15.0749C16.2456 14.6033 16.4993 13.9638 16.5 13.2969V2.51562C16.4993 1.84866 16.2456 1.20921 15.7945 0.737598C15.3434 0.265981 14.7317 0.000713461 14.0938 0ZM0.6875 7.1875C0.505164 7.1875 0.330295 7.26323 0.201364 7.39802C0.072433 7.53281 0 7.71563 0 7.90625C0 8.09687 0.072433 8.27969 0.201364 8.41448C0.330295 8.54928 0.505164 8.625 0.6875 8.625H4.8125V7.1875H0.6875Z"
            fill="var(--accent-primary)"
        />
    </svg>
);

const kpiData = [
    {
        title: "Total Transfers",
        value: "0",
        subtitle: "Year to date",
        infoText: "Combined incoming and outgoing transfers. Data will populate when connected.",
    },
    {
        title: "Avg. Acceptance Time",
        value: "0",
        subtitle: "Hours",
        infoText: "Average time from request to acceptance. Data will populate when connected.",
    },
    {
        title: "Pending Review",
        value: "0",
        subtitle: "Active",
        infoText: "Transfers awaiting clinical or bed assignment review.",
    },
    {
        title: "Completion Rate",
        value: "0",
        subtitle: "Percent",
        infoText: "Share of initiated transfers completed within SLA.",
    },
];

type TransferInsightPageProps = {
    /** Hide top bar when rendered inside Helix Analytics tab shell */
    embedded?: boolean;
};

const TransferInsightPage = ({ embedded = false }: TransferInsightPageProps) => (
    <div className="flex flex-1 flex-col">
        {!embedded && <Topbar title="Transfer Insight" />}
        <div className={embedded ? "flex w-full flex-col gap-[15px]" : "flex w-full flex-col gap-[15px] overflow-auto pt-[15px]"}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {kpiData.map((kpi, index) => (
                    <div
                        key={kpi.title}
                        className="animate-slide-in-up"
                        style={{ animationDelay: `${index * 100}ms`, opacity: 0, animationFillMode: "forwards" }}
                    >
                        <KPICard {...kpi} />
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]">
                <div
                    className="animate-slide-in-up"
                    style={{ animationDelay: "200ms", opacity: 0, animationFillMode: "forwards" }}
                >
                    <TransferVolumeChart />
                </div>
                <div
                    className="flex animate-slide-in-up flex-col gap-2"
                    style={{ animationDelay: "300ms", opacity: 0, animationFillMode: "forwards" }}
                >
                    <TransferStatCard
                        title="Incoming Transfer Requests"
                        description="Requests from other facilities."
                        icon={<IncomingIcon />}
                    />
                    <TransferStatCard
                        title="Outgoing Transfer Requests"
                        description="Requests sent to other facilities."
                        icon={<OutgoingIcon />}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div
                    className="animate-slide-in-up"
                    style={{ animationDelay: "400ms", opacity: 0, animationFillMode: "forwards" }}
                >
                    <TransferPipeline />
                </div>
                <div
                    className="animate-slide-in-up"
                    style={{ animationDelay: "500ms", opacity: 0, animationFillMode: "forwards" }}
                >
                    <RecentTransfers />
                </div>
            </div>
        </div>
    </div>
);

export default TransferInsightPage;
