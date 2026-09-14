"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useState } from "react";
import clsx from "clsx";
import { IoSearch } from "react-icons/io5";
import { BiSolidShieldPlus } from "react-icons/bi";
import { PiArrowsLeftRight } from "react-icons/pi";
import Text from "@safety-reports/shared/text";

const SidebarIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 17 17" fill="none" className={className}>
        <path
            d="M2.125 3.54167C2.125 2.7602 2.7602 2.125 3.54167 2.125H13.4583C14.2398 2.125 14.875 2.7602 14.875 3.54167V13.4583C14.875 14.2398 14.2398 14.875 13.4583 14.875H3.54167C2.7602 14.875 2.125 14.2398 2.125 13.4583V3.54167ZM6.375 3.54167V13.4583H13.4583V3.54167H6.375Z"
            fill="currentColor"
        />
    </svg>
);

type SidebarContextValue = { isDocked: boolean; setIsDocked: (docked: boolean) => void };

const SidebarContext = createContext<SidebarContextValue | null>(null);

export const useSidebar = () => {
    const ctx = useContext(SidebarContext);
    if (!ctx) throw new Error("useSidebar must be used within SidebarProvider");
    return ctx;
};

export const SidebarProvider = ({ children }: { children: React.ReactNode }) => {
    const [isDocked, setIsDocked] = useState(false);
    return <SidebarContext.Provider value={{ isDocked, setIsDocked }}>{children}</SidebarContext.Provider>;
};

type MenuItem = {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string; size?: number }>;
};

const menuItems: MenuItem[] = [
    { name: "Safety & Reports", href: "/dashboard/safety-reports", icon: BiSolidShieldPlus },
    { name: "Transfer Insight", href: "/dashboard/transfer-insight", icon: PiArrowsLeftRight },
];

const RightSlot = () => (
    <div className="flex size-[18px] items-center justify-center rounded-[4.605px] bg-tertiary">
        <Text variant="body-xs" color="text-primary" className="text-[7.895px] font-semibold">
            /
        </Text>
    </div>
);

const LogoSection = ({ isDocked, onDockToggle }: { isDocked: boolean; onDockToggle: () => void }) => (
    <div
        className={clsx(
            "flex w-full flex-col border-b border-secondary bg-primary-light",
            isDocked ? "gap-[15px] px-[10px] py-[20px]" : "gap-[15px] px-[15px] py-[20px]",
        )}
    >
        {!isDocked ? (
            <div className="flex items-center gap-[10px] px-[2px]">
                <Image
                    src="/assets/images/ugmc-logo-full-light-mode.png"
                    alt="UGMC"
                    width={173}
                    height={29}
                    className="h-[29px] w-auto"
                />
                <button
                    type="button"
                    onClick={onDockToggle}
                    className="flex flex-1 cursor-pointer items-center justify-end transition-opacity hover:opacity-70"
                    title="Collapse sidebar"
                >
                    <SidebarIcon className="text-[#A3B2BE]" />
                </button>
            </div>
        ) : (
            <button
                type="button"
                onClick={onDockToggle}
                className="flex cursor-pointer items-center justify-center px-[2px] transition-opacity hover:opacity-70"
                title="Expand sidebar"
            >
                <SidebarIcon className="h-[23px] w-[24px] text-[#A3B2BE]" />
            </button>
        )}
        {!isDocked ? (
            <div className="flex h-[35px] items-center justify-between rounded-[10px] border border-tertiary bg-primary px-[11px] py-[7px] shadow-input">
                <div className="flex items-center gap-[4px]">
                    <IoSearch size={15} className="text-[#A3B2BE]" />
                    <Text variant="body-sm" color="text-tertiary">
                        Search anything...
                    </Text>
                </div>
                <RightSlot />
            </div>
        ) : (
            <div className="flex h-[35px] items-center justify-center rounded-[10px] border border-tertiary bg-primary px-[11px] py-[7px] shadow-input">
                <IoSearch size={15} className="text-[#A3B2BE]" />
            </div>
        )}
    </div>
);

const MenuItems = ({ isDocked }: { isDocked: boolean }) => {
    const pathname = usePathname();

    return (
        <div className={clsx("flex w-full flex-col gap-[10px]", isDocked ? "px-[10px]" : "px-[10px]")}>
            {!isDocked && (
                <div className="flex items-center pl-[12px] pr-[7px]">
                    <Text variant="body-sm" color="text-tertiary" className="text-[12px] font-medium">
                        EXECUTIVE DASHBOARD
                    </Text>
                </div>
            )}
            <div className="flex flex-col gap-[5px]">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={clsx(
                                "flex h-[35px] items-center rounded-[5px] transition-all duration-200",
                                isDocked ? "justify-center px-[12px]" : "gap-[5px] px-[12px]",
                                isActive ? "bg-[rgba(41,128,211,0.1)]" : "hover:bg-tertiary",
                            )}
                            title={isDocked ? item.name : undefined}
                        >
                            <Icon
                                size={item.icon === BiSolidShieldPlus ? 20 : 18}
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
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};

export default function Sidebar() {
    const { isDocked, setIsDocked } = useSidebar();

    return (
        <aside
            className={clsx(
                "fixed left-0 top-0 z-30 flex h-full flex-col justify-between border-r border-tertiary bg-primary shadow-soft transition-all duration-300",
                isDocked ? "w-[58px]" : "w-[243px]",
            )}
        >
            <div className="flex w-full flex-col gap-[20px]">
                <LogoSection isDocked={isDocked} onDockToggle={() => setIsDocked(!isDocked)} />
                <MenuItems isDocked={isDocked} />
            </div>
        </aside>
    );
}
