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

export function sortInboundDepartmentsByVolume(
    cm?: CallMetricsSlice | null,
    limit = 6
): CallInboundDepartmentMetric[] {
    const depts = cm?.by_inbound_department;
    if (!Array.isArray(depts) || !depts.length) return [];
    return [...depts]
        .filter((d) => hasInboundOutcomes(d))
        .sort(
            (a, b) =>
                num(b.answered_calls) +
                num(b.missed_calls) -
                (num(a.answered_calls) + num(a.missed_calls))
        )
        .slice(0, limit);
}

export function sortInboundRolesByVolume(
    cm?: CallMetricsSlice | null,
    limit = 4
): CallInboundRoleMetric[] {
    const roles = cm?.by_inbound_role;
    if (!Array.isArray(roles) || !roles.length) return [];
    return [...roles]
        .filter((r) => hasInboundOutcomes(r))
        .sort(
            (a, b) =>
                num(b.answered_calls) +
                num(b.missed_calls) -
                (num(a.answered_calls) + num(a.missed_calls))
        )
        .slice(0, limit);
}

export function sumInboundAnswered(cm?: CallMetricsSlice | null): number {
    const roles = cm?.by_inbound_role;
    if (!Array.isArray(roles) || !roles.length) return 0;
    return roles.reduce((sum, r) => sum + num(r.answered_calls), 0);
}

export function sumInboundMissed(cm?: CallMetricsSlice | null): number {
    const fromApi = cm?.total_missed_calls;
    if (fromApi != null) return num(fromApi);
    const roles = cm?.by_inbound_role;
    if (!Array.isArray(roles) || !roles.length) return 0;
    return roles.reduce((sum, r) => sum + num(r.missed_calls), 0);
}

/** Narrative call insights for summary cards (stats + recommended action). */
export function buildCallInsightMessages(cm?: CallMetricsSlice | null): {
    statsInsight: string | null;
    actionInsight: string | null;
} {
    const { answerRate, answered, unanswered, hasCallData } = getCallSummary(cm);
    const spread = getAnsweredSpread(cm);
    const typicalSec = pickTypicalSeconds(spread);
    const q1 = num(spread?.q1_duration_seconds);
    const q3 = num(spread?.q3_duration_seconds);

    let statsInsight: string | null = null;
    if (typicalSec != null && typicalSec > 0) {
        const range = q1 > 0 && q3 > 0 ? typicalSecondsRange(q1, q3) : null;
        const durationPart = `Median answered call is ${fmtDuration(typicalSec)}${
            range ? ` (usual ${range})` : ""
        }`;
        const ratePart =
            answerRate != null && hasCallData ? ` Outbound answer rate is ${answerRate.toFixed(1)}%.` : "";
        statsInsight = `${durationPart}.${ratePart}`.replace(/\.\./g, ".").trim();
    } else if (answerRate != null && hasCallData) {
        statsInsight = `Outbound answer rate is ${answerRate.toFixed(1)}% with ${answered.toLocaleString()} answered and ${unanswered.toLocaleString()} unanswered sessions.`;
    }

    const topOutbound = getTopOutboundRole(cm);
    let actionInsight: string | null = null;
    if (topOutbound) {
        const name = formatRoleName(topOutbound.role_name);
        const calls = num(topOutbound.total_calls_made);
        actionInsight = `${name} placed the most outbound calls (${calls.toLocaleString()}) in this window. Review connect rates if unanswered volume is climbing.`;
    } else {
        const topInbound = sortInboundRolesByVolume(cm, 1)[0];
        if (topInbound) {
            const name = formatRoleName(topInbound.role_name);
            const volume = num(topInbound.answered_calls) + num(topInbound.missed_calls);
            actionInsight = `${name} handles the most incoming call volume (${volume.toLocaleString()}) in this window. Review ring coverage if pickup rates slip.`;
        }
    }

    return { statsInsight, actionInsight };
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
