"use client";

import * as React from "react";
import Text from "@/components/text";
import DashboardCard from "./dashboard-card";

const OutgoingIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="17" height="16" viewBox="0 0 17 16" fill="none">
        <path d="M14.0938 0H7.21875C6.58078 0.000713461 5.96914 0.265981 5.51803 0.737598C5.06692 1.20921 4.81318 1.84866 4.8125 2.51562V7.1875H11.4026L9.13902 4.82057C9.01553 4.68468 8.94771 4.50373 8.95 4.31631C8.9523 4.12889 9.02453 3.94982 9.15131 3.81728C9.27809 3.68474 9.44937 3.60922 9.62864 3.60682C9.80792 3.60442 9.981 3.67533 10.111 3.80443L13.5485 7.39818C13.6773 7.53296 13.7497 7.71571 13.7497 7.90625C13.7497 8.09679 13.6773 8.27954 13.5485 8.41432L10.111 12.0081C9.981 12.1372 9.80792 12.2081 9.62864 12.2057C9.44937 12.2033 9.27809 12.1278 9.15131 11.9952C9.02453 11.8627 8.9523 11.6836 8.95 11.4962C8.94771 11.3088 9.01553 11.1278 9.13902 10.9919L11.4026 8.625H4.8125V13.2969C4.8125 14.7366 6.26441 15.8125 7.5625 15.8125H14.0938C14.7317 15.8118 15.3434 15.5465 15.7945 15.0749C16.2456 14.6033 16.4993 13.9638 16.5 13.2969V2.51562C16.4993 1.84866 16.2456 1.20921 15.7945 0.737598C15.3434 0.265981 14.7317 0.000713461 14.0938 0ZM0.6875 7.1875C0.505164 7.1875 0.330295 7.26323 0.201364 7.39802C0.072433 7.53281 0 7.71563 0 7.90625C0 8.09687 0.072433 8.27969 0.201364 8.41448C0.330295 8.54928 0.505164 8.625 0.6875 8.625H4.8125V7.1875H0.6875Z" fill="var(--accent-primary)"/>
    </svg>
);

const OutgoingTransferRequests: React.FC = () => {
    return (
        <DashboardCard className="flex flex-col gap-1.5" padding="sm">
            <div className="flex justify-between items-start">
                <Text variant="body-md-semibold" color="text-primary" className="text-sm">
                    Outgoing Transfer Requests
                </Text>
                <div className="w-8 h-8 rounded-[8px] bg-accent-primary/10 flex items-center justify-center shrink-0">
                    <OutgoingIcon />
                </div>
            </div>
            <div className="flex flex-col gap-1">
                <Text variant="heading-3xl" className="tracking-tight" color="text-primary" style={{ fontSize: "28px", lineHeight: "1" }}>
                    18
                </Text>
                <div className="w-full h-[1px] relative">
                    <svg width="100%" height="1" viewBox="0 0 265 1" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                        <line x1="0" y1="0.5" x2="265" y2="0.5" stroke="var(--bg-tertiary)" strokeDasharray="8 4" strokeWidth="1"/>
                    </svg>
                </div>
                <Text variant="body-sm" color="text-secondary" className="text-xs">
                    Requests sent to other facilities.
                </Text>
            </div>
        </DashboardCard>
    );
};

export default OutgoingTransferRequests;
