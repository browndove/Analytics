"use client";

import { Suspense } from "react";
import InternalAdminDashboard from "@/components/InternalAdminDashboard";

export default function InternalDashboardPage() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-screen items-center justify-center bg-[#f7f8fa]">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2980d3] border-t-transparent" />
                </div>
            }
        >
            <InternalAdminDashboard />
        </Suspense>
    );
}
