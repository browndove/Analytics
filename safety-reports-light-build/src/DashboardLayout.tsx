"use client";

import clsx from "clsx";
import Sidebar, { SidebarProvider, useSidebar } from "@safety-reports/shared/sidebar";

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
    const { isDocked } = useSidebar();

    return (
        <div className="min-h-screen bg-secondary">
            <Sidebar />
            <main
                className={clsx(
                    "flex min-h-screen flex-col transition-all duration-300",
                    isDocked ? "ml-[58px]" : "ml-[243px]",
                )}
            >
                <div className="flex flex-1 flex-col px-4 pb-4">{children}</div>
            </main>
        </div>
    );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <DashboardLayoutInner>{children}</DashboardLayoutInner>
        </SidebarProvider>
    );
}
