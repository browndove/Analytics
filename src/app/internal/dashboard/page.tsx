"use client";

import { Suspense } from "react";
import InternalFacilityDashboard from "@/components/InternalFacilityDashboard";

export default function InternalDashboardPage() {
    return (
        <Suspense fallback={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-secondary)' }}>
                <div style={{ width: 32, height: 32, border: '2px solid #4b5563', borderTop: '2px solid #8b8faa', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            </div>
        }>
            <InternalFacilityDashboard />
        </Suspense>
    );
}
