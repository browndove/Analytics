"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import Text from "@/components/text";
import { API_ENDPOINTS } from "@/lib/config";
import { readClientFacilityIdFromCookie } from "@/lib/client-facility";
import { IoDownloadOutline, IoLogOut } from "react-icons/io5";
import { MdSpaceDashboard } from "react-icons/md";
import { FaUser } from "react-icons/fa6";
import { BsCreditCardFill } from "react-icons/bs";
import { PiArrowsLeftRight } from "react-icons/pi";

export type DashboardTab = "executive" | "patient" | "billing" | "transfer";

type DashboardSidebarProps = {
    isDocked: boolean;
    onDockToggle: () => void;
    activeTab: DashboardTab;
    onTabChange: (tab: DashboardTab) => void;
    onGenerateReport: () => void;
};

type MenuItem = {
    id: DashboardTab;
    name: string;
    icon: React.ComponentType<{ className?: string; size?: number }>;
};

const menuItems: MenuItem[] = [
    { id: "executive", name: "Usage Summary", icon: MdSpaceDashboard },
    { id: "patient", name: "Response Performance", icon: FaUser },
    { id: "billing", name: "Staffing & Coverage", icon: BsCreditCardFill },
    { id: "transfer", name: "Transfer Insight", icon: PiArrowsLeftRight },
];

const SidebarIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 17 17" fill="none" className={className}>
        <path d="M2.125 3.54167C2.125 2.7602 2.7602 2.125 3.54167 2.125H13.4583C14.2398 2.125 14.875 2.7602 14.875 3.54167V13.4583C14.875 14.2398 14.2398 14.875 13.4583 14.875H3.54167C2.7602 14.875 2.125 14.2398 2.125 13.4583V3.54167ZM6.375 3.54167V13.4583H13.4583V3.54167H6.375Z" fill="currentColor" />
    </svg>
);

export default function DashboardSidebar({ isDocked, onDockToggle, activeTab, onTabChange, onGenerateReport }: DashboardSidebarProps) {
    const [inSupportMode, setInSupportMode] = useState(false);

    useEffect(() => {
        if (readClientFacilityIdFromCookie()) {
            setInSupportMode(true);
            return;
        }
        fetch(API_ENDPOINTS.INTERNAL_ACT_AS, { credentials: "include" })
            .then((res) => (res.ok ? res.json() : null))
            .then((data: { support_mode?: boolean } | null) => {
                if (data?.support_mode) setInSupportMode(true);
            })
            .catch(() => undefined);
    }, []);

    const headerBlockPadding = isDocked
        ? { paddingLeft: 12, paddingRight: 12, paddingTop: 20, paddingBottom: 20 }
        : { paddingLeft: 18, paddingRight: 18, paddingTop: 20, paddingBottom: 20 };

    const navBlockPadding = isDocked
        ? { paddingLeft: 8, paddingRight: 8 }
        : { paddingLeft: 14, paddingRight: 14 };

    const footerBlockPadding = { paddingLeft: 14, paddingRight: 14, paddingTop: 15, paddingBottom: 15 };

    const menuButtonPadding = isDocked
        ? { paddingLeft: 10, paddingRight: 10 }
        : { paddingLeft: 14, paddingRight: 14 };

    const handleExitSupport = async () => {
        try {
            await fetch(API_ENDPOINTS.INTERNAL_EXIT_ACT_AS, {
                method: "POST",
                credentials: "include",
            });
        } catch {
            /* redirect anyway */
        } finally {
            window.location.replace("/internal/dashboard");
        }
    };

    const showSupportBanner = inSupportMode && !isDocked;

    const handleLogout = async () => {
        const wasSupport = inSupportMode;
        try {
            if (wasSupport) {
                await fetch(API_ENDPOINTS.INTERNAL_EXIT_ACT_AS, {
                    method: "POST",
                    credentials: "include",
                });
            }
            await fetch(API_ENDPOINTS.LOGOUT, {
                method: "POST",
                credentials: "include",
            });
        } catch {
            /* still redirect — server may have cleared cookies */
        } finally {
            window.location.replace(wasSupport ? "/internal/login" : "/login");
        }
    };

    return (
        <aside
            className={clsx(
                "fixed left-0 top-0 z-30 hidden h-full flex-col justify-between border-r border-tertiary bg-primary shadow-soft transition-all duration-300 lg:flex",
                isDocked ? "w-[58px]" : "w-[243px]"
            )}
            style={{ boxSizing: "border-box" }}
        >
            <div className="flex flex-col gap-[20px]">
                <div
                    className={clsx(
                        "flex w-full flex-col border-b border-secondary bg-primary-light",
                        isDocked ? "gap-[15px]" : "gap-[15px]"
                    )}
                    style={{ boxSizing: "border-box", ...headerBlockPadding }}
                >
                    {!isDocked ? (
                        <div
                            className="flex w-full min-w-0 items-center gap-2"
                            style={{ paddingLeft: 2, paddingRight: 2, boxSizing: "border-box" }}
                        >
                            <img
                                src="/assets/images/helix-logo.png"
                                alt="Helix"
                                width={32}
                                height={32}
                                style={{
                                    height: 24,
                                    width: "auto",
                                    flexShrink: 0,
                                    display: "block",
                                    objectFit: "contain",
                                }}
                            />
                            <span
                                className="min-w-0 flex-1 truncate leading-tight tracking-tight text-text-primary"
                                style={{ fontSize: "14px", fontWeight: 700, lineHeight: 1.2 }}
                            >
                                Helix Analytics
                            </span>
                            <button
                                type="button"
                                onClick={onDockToggle}
                                className="flex shrink-0 cursor-pointer items-center justify-end text-[#A3B2BE] transition-opacity hover:opacity-70"
                                title="Collapse sidebar"
                                aria-label="Collapse sidebar"
                            >
                                <SidebarIcon />
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={onDockToggle}
                            className="flex cursor-pointer items-center justify-center text-[#A3B2BE] transition-opacity hover:opacity-70"
                            style={{ paddingLeft: 2, paddingRight: 2 }}
                            title="Expand sidebar"
                            aria-label="Expand sidebar"
                        >
                            <SidebarIcon className="h-[23px] w-[24px]" />
                        </button>
                    )}
                </div>

                <div className="flex w-full flex-col gap-[10px]" style={{ boxSizing: "border-box", ...navBlockPadding }}>
                    {!isDocked && (
                        <div className="flex items-center" style={{ paddingLeft: 4, paddingRight: 4 }}>
                            <Text variant="body-sm" color="text-tertiary" className="text-[12px] font-medium">
                                EXECUTIVE DASHBOARD
                            </Text>
                        </div>
                    )}

                    <div className="flex flex-col gap-[5px]">
                        {menuItems.map((item) => {
                            const isActive = activeTab === item.id;
                            const Icon = item.icon;

                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => onTabChange(item.id)}
                                    className={clsx(
                                        "flex h-[35px] items-center rounded-[5px] transition-all duration-200",
                                        isDocked ? "justify-center" : "gap-[5px]",
                                        isActive ? "bg-[rgba(41,128,211,0.1)]" : "hover:bg-tertiary"
                                    )}
                                    style={{ boxSizing: "border-box", ...menuButtonPadding }}
                                    title={isDocked ? item.name : undefined}
                                >
                                    <div className={clsx("flex items-center", isDocked ? "" : "gap-[5px]")}>
                                        <Icon
                                            size={item.id === "billing" ? 18 : item.id === "patient" ? 17 : item.id === "transfer" ? 18 : 15}
                                            className={clsx("shrink-0", isActive ? "text-accent-primary" : "text-text-secondary")}
                                        />
                                        {!isDocked && (
                                            <Text
                                                variant="body-sm-semibold"
                                                color={isActive ? "accent-primary" : "text-secondary"}
                                            >
                                                {item.name}
                                            </Text>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-4">
                <div className="w-full border-t border-tertiary" style={{ boxSizing: "border-box", ...footerBlockPadding }}>
                    {showSupportBanner ? (
                        <div className="mb-3 flex flex-col items-start gap-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                            <Text
                                as="p"
                                variant="body-sm-semibold"
                                color="text-primary"
                                className="m-0 w-full"
                            >
                                Support mode
                            </Text>
                            <button
                                type="button"
                                onClick={handleExitSupport}
                                className="m-0 border-0 bg-transparent p-0 text-left text-[11px] font-semibold text-accent-primary hover:underline"
                            >
                                Exit support
                            </button>
                        </div>
                    ) : null}
                    <button
                        type="button"
                        onClick={onGenerateReport}
                        className={clsx(
                            "mb-3 flex h-[40px] w-full cursor-pointer items-center rounded-[8px] bg-accent-primary/10 transition-all duration-200 hover:bg-accent-primary/20",
                            isDocked ? "justify-center" : "gap-1"
                        )}
                        style={{
                            boxSizing: "border-box",
                            paddingLeft: isDocked ? 10 : 14,
                            paddingRight: isDocked ? 10 : 14,
                        }}
                        title={isDocked ? "Generate report" : undefined}
                    >
                        <IoDownloadOutline size={18} className="min-w-[18px] shrink-0 text-accent-primary" />
                        {!isDocked && (
                            <Text variant="body-sm-semibold" color="accent-primary">
                                Generate report
                            </Text>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={handleLogout}
                        className={clsx(
                            "flex h-[40px] w-full cursor-pointer items-center rounded-[8px] bg-accent-red/10 transition-all duration-200 hover:bg-accent-red/20",
                            isDocked ? "justify-center" : "gap-1"
                        )}
                        style={{
                            boxSizing: "border-box",
                            paddingLeft: isDocked ? 10 : 14,
                            paddingRight: isDocked ? 10 : 14,
                        }}
                        title={isDocked ? "Logout" : undefined}
                    >
                        <IoLogOut size={18} className="min-w-[18px] text-accent-red" />
                        {!isDocked && (
                            <Text variant="body-sm-semibold" color="accent-red">
                                Logout
                            </Text>
                        )}
                    </button>
                </div>
            </div>
        </aside>
    );
}
