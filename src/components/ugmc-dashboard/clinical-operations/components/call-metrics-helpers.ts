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

export type CallDurationSpread = {
    completed_calls?: number;
    avg_duration_seconds?: number;
    avg_duration_minutes?: number;
    min_duration_seconds?: number;
    q1_duration_seconds?: number;
    median_duration_seconds?: number;
    q3_duration_seconds?: number;
    max_duration_seconds?: number;
};

export type CallInitiatorBreakdown = {
    total_calls_made?: number;
    missed_calls?: number;
    duration?: CallDurationSpread;
};

export type CallMetricsSlice = {
    total_calls_made?: number;
    total_missed_calls?: number;
    /** Answered-call duration spread — preferred for call duration UI. */
    answered?: CallAnsweredDistribution;
    /** @deprecated Legacy — use `answered` for duration UI. */
    duration?: CallDurationSpread;
    by_initiator_role?: (CallInitiatorBreakdown & { role_name: string })[];
    by_initiator_department?: (CallInitiatorBreakdown & { department_name: string })[];
};

export function hasAnsweredDuration(cm?: CallMetricsSlice | null): boolean {
    return answeredDistributionHasData(cm?.answered);
}

export function getAnsweredSpread(cm?: CallMetricsSlice | null): CallAnsweredDistribution | undefined {
    return hasAnsweredDuration(cm) ? cm?.answered : undefined;
}

export { pickTypicalSeconds, typicalSecondsRange };

function missedDefined(v: unknown): boolean {
    return v !== undefined && v !== null && v !== "";
}

/** Prefer missed_calls on a role/dept row; otherwise derive from total − completed. */
export function resolveMissedCallsForBreakdown(item: CallInitiatorBreakdown): number {
    if (missedDefined(item.missed_calls)) return num(item.missed_calls);
    const total = num(item.total_calls_made);
    const completed = num(item.duration?.completed_calls);
    if (total > 0) return Math.max(0, total - completed);
    return 0;
}

export function hasBreakdownOutcomes(item: CallInitiatorBreakdown): boolean {
    return missedDefined(item.missed_calls) || missedDefined(item.duration?.completed_calls);
}

/** Prefer backend total_missed_calls; otherwise derive from total − completed. */
export function resolveMissedCalls(cm?: CallMetricsSlice | null): number {
    if (missedDefined(cm?.total_missed_calls)) return num(cm!.total_missed_calls);
    const total = num(cm?.total_calls_made);
    const completed = num(cm?.duration?.completed_calls);
    if (total > 0) return Math.max(0, total - completed);
    return 0;
}

export function getCallOutcomeTotals(cm?: CallMetricsSlice | null) {
    const total = num(cm?.total_calls_made);
    const completed = num(cm?.duration?.completed_calls);
    const hasMissedFromApi = missedDefined(cm?.total_missed_calls);
    const hasDuration =
        cm?.duration != null && (total > 0 || completed > 0);
    const hasCallData =
        total > 0 || completed > 0 || hasMissedFromApi || hasDuration;
    const missed = hasCallData ? resolveMissedCalls(cm) : 0;
    const completionPct =
        hasCallData && total > 0
            ? parseFloat(((completed / total) * 100).toFixed(1))
            : null;
    const missedPct =
        hasCallData && total > 0
            ? parseFloat(((missed / total) * 100).toFixed(1))
            : hasCallData && missed > 0 && total <= 0
              ? 100
              : null;
    return {
        total,
        completed,
        missed,
        unanswered: missed,
        hasDuration,
        hasCallData,
        hasMissedFromApi,
        completionPct,
        missedPct,
    };
}

export function getTopRole(cm?: CallMetricsSlice | null) {
    const roles = cm?.by_initiator_role;
    if (!Array.isArray(roles) || !roles.length) return null;
    return [...roles]
        .filter((r) => num(r.total_calls_made) > 0)
        .sort((a, b) => num(b.total_calls_made) - num(a.total_calls_made))[0];
}

export function getTopDepartment(cm?: CallMetricsSlice | null) {
    const depts = cm?.by_initiator_department;
    if (!Array.isArray(depts) || !depts.length) return null;
    return [...depts]
        .filter((d) => num(d.total_calls_made) > 0)
        .sort((a, b) => num(b.total_calls_made) - num(a.total_calls_made))[0];
}

export function getTopDepartments(cm?: CallMetricsSlice | null, limit = 4) {
    const depts = cm?.by_initiator_department;
    if (!Array.isArray(depts) || !depts.length) return [];
    return [...depts]
        .filter((d) => num(d.total_calls_made) > 0)
        .sort((a, b) => num(b.total_calls_made) - num(a.total_calls_made))
        .slice(0, limit);
}
