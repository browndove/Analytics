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
    if (!seconds || seconds <= 0) return "—";
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    if (m < 60) return s > 0 ? `${m}m ${s}s` : `${m}m`;
    const h = Math.floor(m / 60);
    const rm = m % 60;
    return rm > 0 ? `${h}h ${rm}m` : `${h}h`;
}

export type CallMetricsSlice = {
    total_calls_made?: number;
    duration?: {
        completed_calls?: number;
        avg_duration_seconds?: number;
        avg_duration_minutes?: number;
        min_duration_seconds?: number;
        median_duration_seconds?: number;
        max_duration_seconds?: number;
    };
    by_initiator_role?: { role_name: string; total_calls_made: number }[];
    by_initiator_department?: { department_name: string; total_calls_made: number }[];
};

export function getCallOutcomeTotals(cm?: CallMetricsSlice | null) {
    const total = num(cm?.total_calls_made);
    const completed = num(cm?.duration?.completed_calls);
    const hasDuration =
        cm?.duration != null && (total > 0 || completed > 0);
    const unanswered = hasDuration && total > 0 ? Math.max(0, total - completed) : 0;
    const completionPct =
        hasDuration && total > 0
            ? parseFloat(((completed / total) * 100).toFixed(1))
            : null;
    return { total, completed, unanswered, hasDuration, completionPct };
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
