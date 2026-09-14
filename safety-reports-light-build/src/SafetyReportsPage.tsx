"use client";

import Topbar from "@safety-reports/shared/topbar-light";
import {
    KPICard,
    SurgicalErrors,
    NearMissIncidents,
    SeriousSafetyEvents,
    MedicationErrors,
    TopMedicationErrorsDrivers,
} from "@safety-reports/components/safety-reports";

const kpiData = [
    {
        title: "Violence Rate",
        value: "1.8",
        subtitle: "Per 100 staff",
        trend: { type: "down" as const, value: "-7%", isPositive: true },
        infoText: "Violent incidents per 100 staff; lower is safer.",
    },
    {
        title: "Injury Rate",
        value: "2.6",
        subtitle: "Per 100 staff",
        trend: { type: "down" as const, value: "-7%", isPositive: true },
        infoText: "Workplace injuries per 100 staff; trending down.",
    },
    {
        title: "Exposure incidents",
        value: "1.5",
        subtitle: "Per 100 staff",
        trend: { type: "up" as const, value: "7%", isPositive: false },
        infoText: "Exposure incidents per 100 staff; increase needs attention.",
    },
    {
        title: "Active Threats",
        value: "2.0",
        subtitle: "Active",
        indicator: "active" as const,
        infoText: "Current active threats being monitored.",
    },
];

const SafetyReportsPage = () => {
    return (
        <div className="flex flex-col flex-1">
            <Topbar 
                title="Safety Reports" 
            />
            <div className="w-full flex flex-col gap-[15px] overflow-auto pt-[15px]">
                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    {kpiData.map((kpi, index) => (
                        <div 
                            key={index} 
                            className="animate-slide-in-up"
                            style={{ animationDelay: `${index * 100}ms`, opacity: 0, animationFillMode: 'forwards' }}
                        >
                            <KPICard {...kpi} />
                        </div>
                    ))}
                </div>

                {/* Surgical Errors + Near Miss Incidents */}
                <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-4">
                    <div className="animate-slide-in-up" style={{ animationDelay: '200ms', opacity: 0, animationFillMode: 'forwards' }}>
                        <SurgicalErrors />
                    </div>
                    <div className="animate-slide-in-up" style={{ animationDelay: '300ms', opacity: 0, animationFillMode: 'forwards' }}>
                        <NearMissIncidents />
                    </div>
                </div>

                {/* Serious Safety Events + Medication Errors + Top Drivers */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="animate-slide-in-up" style={{ animationDelay: '400ms', opacity: 0, animationFillMode: 'forwards' }}>
                        <SeriousSafetyEvents />
                    </div>
                    <div className="animate-slide-in-up" style={{ animationDelay: '500ms', opacity: 0, animationFillMode: 'forwards' }}>
                        <MedicationErrors />
                    </div>
                    <div className="animate-slide-in-up" style={{ animationDelay: '600ms', opacity: 0, animationFillMode: 'forwards' }}>
                        <TopMedicationErrorsDrivers />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SafetyReportsPage;
