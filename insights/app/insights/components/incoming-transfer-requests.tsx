"use client";

import * as React from "react";
import Text from "@/components/text";
import DashboardCard from "./dashboard-card";

const IncomingIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="23" viewBox="0 0 22 23" fill="none">
        <path d="M5.15625 3.59375H12.0312C12.6692 3.59446 13.2809 3.85973 13.732 4.33135C14.1831 4.80296 14.4368 5.44241 14.4375 6.10938V10.7812H7.84738L10.111 8.41432C10.2345 8.27843 10.3023 8.09748 10.3 7.91006C10.2977 7.72264 10.2255 7.54357 10.0987 7.41103C9.97191 7.27849 9.80063 7.20297 9.62136 7.20057C9.44208 7.19817 9.269 7.26908 9.13902 7.39818L5.70152 10.9919C5.57269 11.1267 5.50032 11.3095 5.50032 11.5C5.50032 11.6905 5.57269 11.8733 5.70152 12.0081L9.13902 15.6018C9.269 15.7309 9.44208 15.8018 9.62136 15.7994C9.80063 15.797 9.97191 15.7215 10.0987 15.589C10.2255 15.4564 10.2977 15.2774 10.3 15.0899C10.3023 14.9025 10.2345 14.7216 10.111 14.5857L7.84738 12.2188H14.4375V16.8906C14.4375 18.3304 12.9856 19.4062 11.6875 19.4062H5.15625C4.51828 19.4055 3.90664 19.1403 3.45553 18.6687C3.00442 18.197 2.75068 17.5576 2.75 16.8906V6.10938C2.75068 5.44241 3.00442 4.80296 3.45553 4.33135C3.90664 3.85973 4.51828 3.59446 5.15625 3.59375ZM18.5625 10.7812C18.7448 10.7812 18.9197 10.857 19.0486 10.9918C19.1776 11.1266 19.25 11.3094 19.25 11.5C19.25 11.6906 19.1776 11.8734 19.0486 12.0082C18.9197 12.143 18.7448 12.2188 18.5625 12.2188H14.4375V10.7812H18.5625Z" fill="var(--accent-primary)" />
    </svg>
);

const IncomingTransferRequests: React.FC = () => {
    return (
        <DashboardCard className="flex flex-col gap-1.5" padding="sm">
            <div className="flex justify-between items-start">
                <Text variant="body-md-semibold" color="text-primary" className="text-sm">
                    Incoming Transfer Requests
                </Text>
                <div className="w-8 h-8 rounded-[8px] bg-accent-primary/10 flex items-center justify-center shrink-0">
                    <IncomingIcon />
                </div>
            </div>
            <div className="flex flex-col gap-1">
                <Text variant="heading-3xl" className="tracking-tight" color="text-primary" style={{ fontSize: "28px", lineHeight: "1" }}>
                    128
                </Text>
                <div className="w-full h-px relative">
                    <svg width="100%" height="1" viewBox="0 0 265 1" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                        <line x1="0" y1="0.5" x2="265" y2="0.5" stroke="var(--bg-tertiary)" strokeDasharray="8 4" strokeWidth="1" />
                    </svg>
                </div>
                <Text variant="body-sm" color="text-secondary" className="text-xs">
                    Requests from other facilities.
                </Text>
            </div>
        </DashboardCard>
    );
};

export default IncomingTransferRequests;
