import {
    type CallAnsweredDistribution,
    answeredDistributionHasData,
    formatDurationSeconds,
    pickTypicalSeconds,
    typicalSecondsRange,
} from "@/lib/distribution-metrics";

export function num(v: unknown): number {
    if (v === null || v === undefined || v === "") return 0;
    const n = typeof v === "string" ? parseFloat(v) : Number(v);
    return Number.isFinite(n) ? n : 0;
}

export function formatRoleName(name: string): string {
    return name.replace(/^HH\s*-\s*/i, "").trim() || name;
}

export function truncateLabel(name: string, max = 22): string {
    if (name.length <= max) return name;
    return `${name.slice(0, max - 1)}…`;
}

export function fmtDuration(seconds: number): string {
    return formatDurationSeconds(seconds);
}

export type CallOutboundRoleMetric = {
    role_id?: string;
    role_name: string;
    facility_id?: string;
    facility_name?: string;
    total_calls_made?: number;
    answered_calls?: number;
    unanswered_calls?: number;
};

export type CallOutboundDepartmentMetric = {
    department_id?: string;
    department_name: string;
    facility_id?: string;
    facility_name?: string;
    total_calls_made?: number;
    answered_calls?: number;
    unanswered_calls?: number;
};

export type CallInboundRoleMetric = {
    role_id?: string;
    role_name: string;
    facility_id?: string;
    facility_name?: string;
    missed_calls?: number;
    answered_calls?: number;
};

export type CallInboundDepartmentMetric = {
    department_id?: string;
    department_name: string;
    facility_id?: string;
    facility_name?: string;
    missed_calls?: number;
    answered_calls?: number;
};

export type CallMetricsSlice = {
    total_calls_made?: number;
    total_answered_calls?: number;
    total_unanswered_calls?: number;
    answer_rate_percent?: number;
    total_missed_calls?: number;
    answered?: CallAnsweredDistribution;
    by_outbound_role?: CallOutboundRoleMetric[];
    by_outbound_department?: CallOutboundDepartmentMetric[];
    by_inbound_role?: CallInboundRoleMetric[];
    by_inbound_department?: CallInboundDepartmentMetric[];
};

export function hasAnsweredDuration(cm?: CallMetricsSlice | null): boolean {
    return answeredDistributionHasData(cm?.answered);
}

export function getAnsweredSpread(cm?: CallMetricsSlice | null): CallAnsweredDistribution | undefined {
    return hasAnsweredDuration(cm) ? cm?.answered : undefined;
}

export { pickTypicalSeconds, typicalSecondsRange };

export function hasOutboundOutcomes(
    row: Pick<CallOutboundRoleMetric, "answered_calls" | "unanswered_calls">
): boolean {
    return num(row.answered_calls) > 0 || num(row.unanswered_calls) > 0;
}

export function hasInboundOutcomes(
    row: Pick<CallInboundRoleMetric, "answered_calls" | "missed_calls">
): boolean {
    return num(row.answered_calls) > 0 || num(row.missed_calls) > 0;
}

/** Facility-level call summary for KPI cards and stat boxes. */
export function getCallSummary(cm?: CallMetricsSlice | null) {
    const total = num(cm?.total_calls_made);
    const answered = num(cm?.total_answered_calls);
    const unanswered = num(cm?.total_unanswered_calls);
    const missed = num(cm?.total_missed_calls);
    const answerRate =
        cm?.answer_rate_percent != null && Number.isFinite(num(cm.answer_rate_percent))
            ? num(cm.answer_rate_percent)
            : null;
    const hasCallData = total > 0 || answered > 0 || unanswered > 0 || missed > 0;

    return {
        total,
        answered,
        unanswered,
        missed,
        answerRate,
        hasCallData,
        /** @deprecated use getCallSummary */
        completed: answered,
    };
}

/** @deprecated use getCallSummary */
export function getCallOutcomeTotals(cm?: CallMetricsSlice | null) {
    const s = getCallSummary(cm);
    return {
        ...s,
        hasDuration: hasAnsweredDuration(cm),
        hasMissedFromApi: cm?.total_missed_calls != null,
        completionPct: s.answerRate,
        unanswered: s.unanswered,
    };
}

export function getTopOutboundRole(cm?: CallMetricsSlice | null) {
    const roles = cm?.by_outbound_role;
    if (!Array.isArray(roles) || !roles.length) return null;
    return [...roles]
        .filter((r) => num(r.total_calls_made) > 0)
        .sort((a, b) => num(b.total_calls_made) - num(a.total_calls_made))[0];
}

export function getTopOutboundDepartment(cm?: CallMetricsSlice | null) {
    const depts = cm?.by_outbound_department;
    if (!Array.isArray(depts) || !depts.length) return null;
    return [...depts]
        .filter((d) => num(d.total_calls_made) > 0)
        .sort((a, b) => num(b.total_calls_made) - num(a.total_calls_made))[0];
}

export function sortOutboundDepartmentsByVolume(
    cm?: CallMetricsSlice | null,
    limit = 6
): CallOutboundDepartmentMetric[] {
    const depts = cm?.by_outbound_department;
    if (!Array.isArray(depts) || !depts.length) return [];
    return [...depts]
        .filter((d) => hasOutboundOutcomes(d) || num(d.total_calls_made) > 0)
        .sort(
            (a, b) =>
                num(b.answered_calls) +
                num(b.unanswered_calls) -
                (num(a.answered_calls) + num(a.unanswered_calls))
        )
        .slice(0, limit);
}

export function sortOutboundRolesByVolume(
    cm?: CallMetricsSlice | null,
    limit = 4
): CallOutboundRoleMetric[] {
    const roles = cm?.by_outbound_role;
    if (!Array.isArray(roles) || !roles.length) return [];
    return [...roles]
        .filter((r) => hasOutboundOutcomes(r) || num(r.total_calls_made) > 0)
        .sort(
            (a, b) =>
                num(b.answered_calls) +
                num(b.unanswered_calls) -
                (num(a.answered_calls) + num(a.unanswered_calls))
        )
        .slice(0, limit);
}

export function getTopDepartments(cm?: CallMetricsSlice | null, limit = 4): CallOutboundDepartmentMetric[] {
    const depts = cm?.by_outbound_department;
    if (!Array.isArray(depts) || !depts.length) return [];
    return [...depts]
        .filter((d) => num(d.total_calls_made) > 0)
        .sort((a, b) => num(b.total_calls_made) - num(a.total_calls_made))
        .slice(0, limit);
}

/** @deprecated use getTopOutboundRole */
export const getTopRole = getTopOutboundRole;

/** @deprecated use getTopOutboundDepartment */
export const getTopDepartment = getTopOutboundDepartment;
