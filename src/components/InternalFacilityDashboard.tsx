"use client";

import { useState, useEffect, useCallback, useRef, useMemo, lazy, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
    KpiCard,
    RevenueChart,
    RoleCriticalTraffic,
    ServiceDistribution,
    DailyPatientFlow,
    RedZoneAlerts,
    LiveUpdates,
    InsightsCard,
    RoleMetricsModal,
} from "@/components/ugmc-dashboard/executive-overview/components";
import { FaUsers, FaEnvelope, FaArrowTrendUp, FaShieldHalved } from "react-icons/fa6";
import CalendarRangePicker from "@/components/CalendarRangePicker";
import Dropdown, { type DropdownOption } from "@/components/dropdown";
import clsx from "clsx";
import DashboardSidebar, { type DashboardTab } from "@/components/sidebar/sidebar";
import GenerateReportModal from "@/components/report/GenerateReportModal";
import { appendUsageMetricsRange } from "@/lib/usage-metrics-range";
import { extractTransferMetricsFromUsage } from "@/lib/transfer-metrics";
import { API_ENDPOINTS } from "@/lib/config";
import { type ApiFacility, type DirectoryFacility, mapApiList } from "@/lib/facility-directory";

const PatientInsightPage = lazy(() => import("@/components/ugmc-dashboard/patient-insight/PatientInsightPage"));
const BillingFinancePage = lazy(() => import("@/components/ugmc-dashboard/billing-finance/BillingFinancePage"));
const TransferInsightPage = lazy(() => import("@/components/transfer-insight/TransferInsightPage"));
const ClinicalOperationsPage = lazy(() => import("@/components/ugmc-dashboard/clinical-operations/ClinicalOperationsPage"));

const TAB_LABELS: Record<DashboardTab, string> = {
    executive: "Usage Summary",
    patient: "Response Performance",
    billing: "Staffing & Coverage",
    transfer: "Transfer Insight",
    insights: "Call Insight",
};

export interface AnalyticsData {
    scope?: "global" | "facility";
    filter_facility_id?: string;
    facilities_in_scope?: number;
    active_users_count: number;
    active_users_rate_percent: number;
    registered_staff_count: number;
    total_messages: number;
    critical_messages: number;
    critical_messages_rate_percent: number;
    standard_messages: number;
    escalation_rate_percent: number;
    escalated_critical_messages: number;
    escalation_rate_of_total_messages_percent: number;
    role_fill_rate_percent: number;
    filled_roles: number;
    total_roles: number;
    critical_role_fill_rate_percent: number;
    critical_filled_roles: number;
    critical_total_roles: number;
    avg_critical_ack_minutes: number;
    avg_first_read_minutes_all: number;
    avg_first_read_minutes_critical: number;
    avg_first_read_minutes_non_critical: number;
    avg_read_minutes_standard?: number;
    total_calls_made: number;
    total_missed_calls?: number;
    call_metrics?: import("@/lib/global-usage-metrics").UsageCallMetrics;
    by_outbound_role?: import("@/lib/global-usage-metrics").CallOutboundRoleMetric[];
    by_outbound_department?: import("@/lib/global-usage-metrics").CallOutboundDepartmentMetric[];
    window_days: number;
    avg_sign_in_minutes_since_midnight_utc: number;
    avg_sign_out_minutes_since_midnight_utc: number;
    daily_message_volume: { day: string; total_messages: number; critical_messages: number; standard_messages: number }[];
    department_metrics: {
        department_name: string;
        department_id?: string;
        department_group_key?: string;
        matched_names?: string[];
        facilities_represented?: number;
        role_fill_rate_percent: number;
        escalation_rate_vs_dept_critical_messages_percent: number;
        filled_roles: number;
        total_roles: number;
        critical_messages_sent: number;
        avg_critical_ack_minutes: number;
        avg_reply_response_minutes_all?: number;
        avg_reply_response_minutes_critical?: number;
        escalation_notifications: number;
        critical_filled_roles: number;
        critical_total_roles: number;
        critical_role_fill_rate_percent: number;
    }[];
    top_escalated_roles: { role_name: string; role_id: string; escalation_count: number }[];
    least_escalated_roles: { role_name: string; role_id: string; escalation_count: number }[];
    role_metrics?: { role_id: string; role_name: string; department_id: string; department_name: string; priority: string; filled: boolean; role_fill_rate_percent: number; critical_total_roles: number; critical_filled_roles: number; critical_role_fill_rate_percent: number; total_messages: number; total_calls_made: number; critical_messages: number; standard_messages: number; critical_messages_rate_percent: number; escalated_critical_messages: number; escalation_rate_percent: number; escalation_rate_of_total_messages_percent: number; avg_critical_ack_minutes: number; avg_reply_response_minutes_all: number; avg_reply_response_minutes_critical: number; avg_sign_in_minutes_since_midnight_utc?: number; avg_sign_out_minutes_since_midnight_utc?: number }[];
}

function fmt(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toLocaleString();
}

export default function InternalFacilityDashboard() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    // Facility filter state
    const [facilities, setFacilities] = useState<DirectoryFacility[]>([]);
    const [facilityId, setFacilityId] = useState<string | null>(null);
    const [facilitiesLoading, setFacilitiesLoading] = useState(true);

    const [activeTab, setActiveTab] = useState<DashboardTab>('executive');
    const [tabMounted, setTabMounted] = useState<Record<DashboardTab, boolean>>({
        executive: true,
        patient: false,
        billing: false,
        transfer: false,
        insights: false,
    });
    const [isSidebarDocked, setIsSidebarDocked] = useState(false);
    const [revenueFullscreen, setRevenueFullscreen] = useState(false);
    const [patientFlowFullscreen, setPatientFlowFullscreen] = useState(false);
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [roleMetricsModalOpen, setRoleMetricsModalOpen] = useState(false);
    const [reportModalOpen, setReportModalOpen] = useState(false);

    const searchParamsRef = useRef(searchParams);
    useEffect(() => { searchParamsRef.current = searchParams; }, [searchParams]);

    useEffect(() => {
        setTabMounted((m) => (m[activeTab] ? m : { ...m, [activeTab]: true }));
    }, [activeTab]);

    const analyticsCacheRef = useRef<Map<string, AnalyticsData>>(new Map());

    const initialFrom = searchParams.get("from");
    const initialTo = searchParams.get("to");
    const getInitialDates = () => {
        if (!initialFrom || !initialTo) return { from: "", to: "" };
        const fromDate = new Date(`${initialFrom}T00:00:00`);
        const toDate = new Date(`${initialTo}T00:00:00`);
        if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime()) || fromDate > toDate) {
            return { from: "", to: "" };
        }
        return { from: initialFrom, to: initialTo };
    };

    const initialDateState = getInitialDates();
    const [dateFrom, setDateFrom] = useState(initialDateState.from);
    const [dateTo, setDateTo] = useState(initialDateState.to);

    // Load facilities for filter dropdown
    const loadFacilities = useCallback(async () => {
        setFacilitiesLoading(true);
        try {
            const res = await fetch(API_ENDPOINTS.INTERNAL_FACILITIES, { credentials: "include" });
            const json = await res.json();
            if (res.ok) {
                const rows = Array.isArray(json) ? (json as ApiFacility[]) : [];
                setFacilities(
                    mapApiList(rows).sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }))
                );
            }
        } catch {
            // Facilities picker may be unavailable — dashboard still works
        } finally {
            setFacilitiesLoading(false);
        }
    }, []);

    useEffect(() => { loadFacilities(); }, [loadFacilities]);

    // Legacy act-as sessions should start on the All-facilities view.
    useEffect(() => {
        fetch(API_ENDPOINTS.INTERNAL_ACT_AS, { credentials: "include" })
            .then((res) => (res.ok ? res.json() : null))
            .then((data: { support_mode?: boolean } | null) => {
                if (data?.support_mode) {
                    fetch(API_ENDPOINTS.INTERNAL_EXIT_ACT_AS, {
                        method: "POST",
                        credentials: "include",
                    }).catch(() => undefined);
                }
            })
            .catch(() => undefined);
    }, []);

    const fetchAnalytics = useCallback(async () => {
        const params = new URLSearchParams();
        if (facilityId) params.set("facility_id", facilityId);
        const sp = searchParamsRef.current;
        let cacheKey = `${facilityId ?? "global"}`;

        if (dateFrom && dateTo) {
            appendUsageMetricsRange(params, dateFrom, dateTo);
            cacheKey += `|from=${dateFrom}|to=${dateTo}`;

            const urlParams = new URLSearchParams(sp.toString());
            urlParams.set("from", dateFrom);
            urlParams.set("to", dateTo);
            router.replace(`${pathname}?${urlParams.toString()}`, { scroll: false });
        } else {
            cacheKey += "|default";
            if (sp.has("from") || sp.has("to")) {
                const urlParams = new URLSearchParams(sp.toString());
                urlParams.delete("from");
                urlParams.delete("to");
                router.replace(`${pathname}?${urlParams.toString()}`, { scroll: false });
            }
        }

        const cached = analyticsCacheRef.current.get(cacheKey);
        if (cached) {
            setData(cached);
            setLoading(false);
        } else {
            setLoading(true);
        }

        try {
            let url: string;
            if (facilityId) {
                // Use facility-specific endpoint for complete data (includes role_metrics)
                const facilityParams = new URLSearchParams();
                if (dateFrom && dateTo) {
                    appendUsageMetricsRange(facilityParams, dateFrom, dateTo);
                }
                const qs = facilityParams.toString();
                url = `/api/proxy/analytics?facility_id=${facilityId}${qs ? `&${qs}` : ""}`;
            } else {
                // Use global usage-metrics endpoint for all-facilities view
                const qs = params.toString();
                url = `${API_ENDPOINTS.USAGE_METRICS}${qs ? `?${qs}` : ""}`;
            }
            console.log("[internal-dashboard] Fetching:", url);
            const res = await fetch(url, { credentials: "include", cache: "no-store" });
            if (res.ok) {
                const json = (await res.json()) as AnalyticsData;
                console.log("[internal-dashboard] Response window_days:", json.window_days, "total_messages:", json.total_messages, "role_metrics:", json.role_metrics?.length ?? 0);
                analyticsCacheRef.current.set(cacheKey, json);
                setData(json);
            }
        } catch (err) {
            console.error("Failed to fetch analytics:", err);
        } finally {
            setLoading(false);
        }
    }, [dateFrom, dateTo, facilityId, router, pathname]);

    useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

    const transferData = useMemo(() => extractTransferMetricsFromUsage(data), [data]);

    const activeUsers = data?.active_users_count ?? 0;
    const activityRate = data?.active_users_rate_percent ?? 0;
    const totalMessages = data?.total_messages ?? 0;
    const criticalRate = data?.critical_messages_rate_percent ?? 0;
    const escalationRate = data?.escalation_rate_percent ?? 0;
    const escalatedCount = data?.escalated_critical_messages ?? 0;
    const roleFillRate = data?.role_fill_rate_percent ?? 0;
    const filledRoles = data?.filled_roles ?? 0;
    const totalRoles = data?.total_roles ?? 0;

    const facilityOptions: DropdownOption[] = useMemo(() => [
        { value: "", label: "All" },
        ...facilities.map((f) => ({ value: f.id, label: f.name })),
    ], [facilities]);

    const scopeLabel = useMemo(() => {
        if (!data) return "";
        if (data.scope === "global" || !facilityId) {
            return `All facilities (${data.facilities_in_scope ?? facilities.length})`;
        }
        const f = facilities.find((x) => x.id === (data.filter_facility_id ?? facilityId));
        return f?.name ?? "Filtered facility";
    }, [data, facilities, facilityId]);

    return (
        <div style={{ ["--sidebar-width" as string]: isSidebarDocked ? "58px" : "243px" }}>
            <DashboardSidebar
                isDocked={isSidebarDocked}
                onDockToggle={() => setIsSidebarDocked((prev) => !prev)}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onGenerateReport={() => setReportModalOpen(true)}
            />
            <GenerateReportModal
                open={reportModalOpen}
                onClose={() => setReportModalOpen(false)}
                defaultDateFrom={dateFrom}
                defaultDateTo={dateTo}
            />
            <div className={clsx('usage-dashboard-shell')}>
                <div className="usage-inner">
                {/* Header Row */}
                <div className="animate-slide-in-up usage-header-row">
                    <div className="flex min-w-0 flex-1 flex-col gap-3 min-[900px]:flex-row min-[900px]:flex-wrap min-[900px]:items-center min-[900px]:gap-x-4 min-[900px]:gap-y-2">
                        <div className="flex min-w-0 shrink-0 flex-col justify-center">
                            <span className="text-[1.5rem] font-bold leading-snug text-text-primary">
                                {TAB_LABELS[activeTab]}
                            </span>
                            <span className="text-xs leading-snug text-gray-400">
                                {scopeLabel && <>{scopeLabel} · </>}
                                {dateFrom && dateTo && dateFrom === dateTo
                                    ? `Today \u2014 ${new Date(dateFrom + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                                    : dateFrom && dateTo
                                        ? `${new Date(dateFrom + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} \u2014 ${new Date(dateTo + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                                        : (data?.window_days === 0 ? 'Today' : `Last ${data?.window_days ?? 30} days`)}
                            </span>
                        </div>
                    </div>

                    <div className="flex shrink-0 flex-col items-stretch gap-2 min-[900px]:flex-row min-[900px]:items-center min-[900px]:justify-end min-[900px]:gap-3">
                        <div className="relative">
                            <Dropdown
                                options={facilityOptions}
                                value={facilityId ?? ""}
                                onChange={(v) => setFacilityId(v || null)}
                                placeholder="All"
                                renderMenuInPortal
                                portalZIndex={10000}
                            />
                        </div>
                        <CalendarRangePicker
                            from={dateFrom}
                            to={dateTo}
                            onChange={(f, t) => { setDateFrom(f); setDateTo(t); }}
                        />
                    </div>
                </div>

                {/* Tab panels */}
                {tabMounted.executive && (
                <div
                    className={clsx(activeTab !== "executive" && "hidden")}
                    aria-hidden={activeTab !== "executive"}
                >
                <div className="usage-kpi-grid">
                    <KpiCard
                        icon={<FaUsers className="w-5 h-5 text-accent-primary" />}
                        iconBgColor="bg-[rgba(36,132,199,0.1)]"
                        label="Active Users"
                        value={loading ? '—' : fmt(activeUsers)}
                        change={{ value: `${activityRate.toFixed(1)}%`, label: "Activity Rate", trend: activityRate >= 50 ? "up" : "down" }}
                        infoText="Number of staff members currently active on the platform out of total registered staff."
                        animationDelay={0}
                    />
                    <KpiCard
                        icon={<FaEnvelope className="w-5 h-5 text-accent-green" />}
                        iconBgColor="bg-[rgba(0,200,179,0.1)]"
                        label="Total Messages"
                        value={loading ? '—' : fmt(totalMessages)}
                        change={{ value: `${criticalRate.toFixed(1)}%`, label: "Critical Rate", trend: criticalRate > 20 ? "up" : "down" }}
                        infoText="Total messages sent across all departments including critical and standard messages."
                        animationDelay={1}
                    />
                    <KpiCard
                        icon={<FaArrowTrendUp className="w-5 h-5 text-accent-red" />}
                        iconBgColor="bg-[rgba(255,95,87,0.1)]"
                        label="Escalation Rate"
                        value={loading ? '—' : `${escalationRate.toFixed(1)}%`}
                        change={{ value: fmt(escalatedCount), label: "Escalated", trend: escalationRate > 15 ? "up" : "down" }}
                        infoText="Percentage of critical messages that triggered escalation notifications out of total messages."
                        animationDelay={2}
                    />
                    <KpiCard
                        icon={<FaShieldHalved className="w-5 h-5 text-accent-violet" />}
                        iconBgColor="bg-[rgba(105,116,247,0.1)]"
                        label="Role Coverage"
                        value={loading ? '—' : `${roleFillRate.toFixed(1)}%`}
                        change={{ value: `${filledRoles}/${totalRoles}`, label: "Roles Filled", trend: roleFillRate >= 70 ? "up" : "down" }}
                        infoText="Percentage of defined roles that are currently filled with assigned staff members."
                        animationDelay={3}
                    />
                </div>

                <div className="usage-main-grid" style={{ marginTop: 24 }}>
                    <div className="usage-main-grid__main">
                        <div className="usage-main-grid__chart animate-slide-in-up stagger-2">
                            <RevenueChart
                                isFullscreen={revenueFullscreen}
                                onToggleFullscreen={() => setRevenueFullscreen(!revenueFullscreen)}
                                dailyVolume={data?.daily_message_volume}
                            />
                        </div>

                        <div className="usage-main-grid__twocol dashboard-two-col">
                            <div className="animate-slide-in-up stagger-3">
                                <RoleCriticalTraffic roles={data?.role_metrics} />
                            </div>
                            <div className="animate-slide-in-up stagger-4">
                                <ServiceDistribution departments={data?.department_metrics} />
                            </div>
                        </div>

                        <div className="usage-main-grid__full animate-slide-in-up stagger-5">
                            <DailyPatientFlow
                                isFullscreen={patientFlowFullscreen}
                                onToggleFullscreen={() => setPatientFlowFullscreen(!patientFlowFullscreen)}
                                dailyVolume={data?.daily_message_volume}
                            />
                        </div>
                    </div>

                    <div className="usage-main-grid__sidebar">
                        <div className="animate-slide-in-right stagger-3">
                            <RedZoneAlerts roles={data?.top_escalated_roles} />
                        </div>
                        <div className="animate-slide-in-right stagger-4">
                            <LiveUpdates responseTimes={data ? {
                                avg_critical_ack_minutes: data.avg_critical_ack_minutes,
                                avg_first_read_minutes_all: data.avg_first_read_minutes_all,
                                avg_first_read_minutes_critical: data.avg_first_read_minutes_critical,
                                avg_first_read_minutes_non_critical: data.avg_first_read_minutes_non_critical,
                                total_calls_made: data.total_calls_made,
                            } : undefined} />
                        </div>
                        <div className="animate-slide-in-right stagger-5 usage-sidebar-sticky">
                            <InsightsCard data={data ?? undefined} />
                        </div>
                    </div>
                </div>
                </div>
                )}
                {tabMounted.patient && (
                    <div
                        className={clsx(activeTab !== "patient" && "hidden")}
                        aria-hidden={activeTab !== "patient"}
                    >
                        <Suspense
                            fallback={
                                <div className="flex items-center justify-center py-20">
                                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-primary border-t-transparent" />
                                </div>
                            }
                        >
                            <PatientInsightPage data={data} onViewMoreRoles={() => setRoleMetricsModalOpen(true)} />
                        </Suspense>
                    </div>
                )}
                {tabMounted.billing && (
                    <div
                        className={clsx(activeTab !== "billing" && "hidden")}
                        aria-hidden={activeTab !== "billing"}
                    >
                        <Suspense
                            fallback={
                                <div className="flex items-center justify-center py-20">
                                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-primary border-t-transparent" />
                                </div>
                            }
                        >
                            <BillingFinancePage data={data} />
                        </Suspense>
                    </div>
                )}
                {tabMounted.transfer && (
                    <div
                        className={clsx(activeTab !== "transfer" && "hidden")}
                        aria-hidden={activeTab !== "transfer"}
                    >
                        <Suspense
                            fallback={
                                <div className="flex items-center justify-center py-20">
                                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-primary border-t-transparent" />
                                </div>
                            }
                        >
                            <TransferInsightPage data={transferData} loading={loading} />
                        </Suspense>
                    </div>
                )}
                {tabMounted.insights && (
                    <div
                        className={clsx(activeTab !== "insights" && "hidden")}
                        aria-hidden={activeTab !== "insights"}
                    >
                        <Suspense
                            fallback={
                                <div className="flex items-center justify-center py-20">
                                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-primary border-t-transparent" />
                                </div>
                            }
                        >
                            <ClinicalOperationsPage data={data} />
                        </Suspense>
                    </div>
                )}

                <RoleMetricsModal
                    isOpen={roleMetricsModalOpen}
                    onClose={() => setRoleMetricsModalOpen(false)}
                    roles={data?.role_metrics || []}
                />
                </div>
            </div>
        </div>
    );
}
