import {
    resolveMissedCallsForBreakdown,
    type CallInitiatorBreakdown,
    type CallMetricsSlice,
} from "@/components/ugmc-dashboard/clinical-operations/components/call-metrics-helpers";

function num(v: unknown): number {
    if (v === null || v === undefined || v === "") return 0;
    const n = typeof v === "string" ? parseFloat(v) : Number(v);
    return Number.isFinite(n) ? n : 0;
}

function str(v: unknown): string {
    return typeof v === "string" ? v : "";
}

function isRecord(v: unknown): v is Record<string, unknown> {
    return v != null && typeof v === "object" && !Array.isArray(v);
}

/** Unwrap common API envelopes (`data`, `usage`, `metrics`). */
function unwrapUsagePayload(payload: unknown): Record<string, unknown> | undefined {
    if (!isRecord(payload)) return undefined;
    for (const key of ["data", "usage", "metrics", "result"]) {
        const inner = payload[key];
        if (isRecord(inner)) return inner;
    }
    return payload;
}

/** Read first defined numeric field (0 is valid). */
function pickDefinedNum(obj: Record<string, unknown>, ...keys: string[]): number | undefined {
    for (const key of keys) {
        if (!(key in obj)) continue;
        const v = obj[key];
        if (v === undefined || v === null || v === "") continue;
        return num(v);
    }
    return undefined;
}

function mapDuration(raw: unknown): CallMetricsSlice["duration"] | undefined {
    if (!isRecord(raw)) return undefined;
    const completed = pickDefinedNum(raw, "completed_calls", "completedCalls");
    const avgSeconds = pickDefinedNum(raw, "avg_duration_seconds", "avgDurationSeconds");
    if (
        completed === undefined &&
        avgSeconds === undefined &&
        raw.avg_duration_minutes == null &&
        raw.avgDurationMinutes == null
    ) {
        return undefined;
    }
    return {
        completed_calls: completed,
        avg_duration_seconds: avgSeconds,
        avg_duration_minutes: pickDefinedNum(raw, "avg_duration_minutes", "avgDurationMinutes"),
        min_duration_seconds: pickDefinedNum(raw, "min_duration_seconds", "minDurationSeconds"),
        median_duration_seconds: pickDefinedNum(raw, "median_duration_seconds", "medianDurationSeconds"),
        max_duration_seconds: pickDefinedNum(raw, "max_duration_seconds", "maxDurationSeconds"),
    };
}

function durationFromSource(src: Record<string, unknown>): CallMetricsSlice["duration"] | undefined {
    const nested = mapDuration(src.duration) ?? mapDuration(src.call_duration) ?? mapDuration(src.calls_duration);
    if (nested) return nested;

    const completed = pickDefinedNum(src, "completed_calls", "completedCalls");
    const avgSeconds = pickDefinedNum(src, "avg_duration_seconds", "avgDurationSeconds");
    if (completed === undefined && avgSeconds === undefined) return undefined;

    return {
        completed_calls: completed,
        avg_duration_seconds: avgSeconds,
        avg_duration_minutes: pickDefinedNum(src, "avg_duration_minutes", "avgDurationMinutes"),
        min_duration_seconds: pickDefinedNum(src, "min_duration_seconds", "minDurationSeconds"),
        median_duration_seconds: pickDefinedNum(src, "median_duration_seconds", "medianDurationSeconds"),
        max_duration_seconds: pickDefinedNum(src, "max_duration_seconds", "maxDurationSeconds"),
    };
}

function mapBreakdownRow(raw: unknown): CallInitiatorBreakdown | null {
    if (!isRecord(raw)) return null;
    const total = pickDefinedNum(raw, "total_calls_made", "totalCallsMade", "calls_made");
    const missed = pickDefinedNum(raw, "missed_calls", "missedCalls", "total_missed_calls");
    const duration = mapDuration(raw.duration);
    if (total === undefined && missed === undefined && !duration) return null;
    return {
        total_calls_made: total,
        missed_calls: missed,
        duration,
    };
}

function mapRoleRow(raw: unknown): (CallInitiatorBreakdown & { role_name: string }) | null {
    if (!isRecord(raw)) return null;
    const base = mapBreakdownRow(raw);
    const roleName = str(raw.role_name || raw.roleName || raw.name).trim();
    if (!base || !roleName) return null;
    return { ...base, role_name: roleName };
}

function mapDepartmentRow(raw: unknown): (CallInitiatorBreakdown & { department_name: string }) | null {
    if (!isRecord(raw)) return null;
    const base = mapBreakdownRow(raw);
    const departmentName = str(
        raw.department_name || raw.departmentName || raw.name
    ).trim();
    if (!base || !departmentName) return null;
    return { ...base, department_name: departmentName };
}

function mapRowArray<T>(value: unknown, map: (row: unknown) => T | null): T[] {
    if (!Array.isArray(value)) return [];
    return value.map(map).filter((r): r is T => r !== null);
}

function pickBreakdownArray(src: Record<string, unknown>, role: boolean): unknown {
    if (role) {
        return (
            src.by_initiator_role ??
            src.by_role ??
            src.byRole ??
            src.roles ??
            src.call_by_role ??
            src.calls_by_role
        );
    }
    return (
        src.by_initiator_department ??
        src.by_department ??
        src.byDepartment ??
        src.departments ??
        src.call_by_department ??
        src.calls_by_department
    );
}

function sumMissedFromBreakdown(
    roles: (CallInitiatorBreakdown & { role_name: string })[],
    depts: (CallInitiatorBreakdown & { department_name: string })[]
): number | undefined {
    const rows = roles.length > 0 ? roles : depts;
    if (!rows.length) return undefined;
    const sum = rows.reduce((acc, row) => acc + resolveMissedCallsForBreakdown(row), 0);
    return sum > 0 || rows.some((r) => r.missed_calls !== undefined) ? sum : undefined;
}

/**
 * Extract call metrics from GET usage-metrics / analytics payload.
 * Fields may live on the usage root, inside `call_metrics`, or both (merged like transfer_metrics).
 */
export function normalizeCallMetricsFromUsage(payload: unknown): CallMetricsSlice | undefined {
    const root = unwrapUsagePayload(payload);
    if (!root) return undefined;

    const nestedCandidates = [
        root.call_metrics,
        root.callMetrics,
        root.calls_metrics,
        root.callsMetrics,
    ];

    let src: Record<string, unknown> = root;
    for (const candidate of nestedCandidates) {
        if (isRecord(candidate)) {
            src = { ...root, ...candidate };
            break;
        }
    }

    const total_calls_made = pickDefinedNum(src, "total_calls_made", "totalCallsMade");
    let total_missed_calls = pickDefinedNum(
        src,
        "total_missed_calls",
        "totalMissedCalls",
        "missed_calls",
        "missedCalls"
    );

    const duration = durationFromSource(src);

    const by_initiator_role = mapRowArray(pickBreakdownArray(src, true), mapRoleRow);
    const by_initiator_department = mapRowArray(pickBreakdownArray(src, false), mapDepartmentRow);

    if (total_missed_calls === undefined) {
        total_missed_calls = sumMissedFromBreakdown(by_initiator_role, by_initiator_department);
    }

    const hasCallMetrics =
        total_calls_made !== undefined ||
        total_missed_calls !== undefined ||
        duration != null ||
        by_initiator_role.length > 0 ||
        by_initiator_department.length > 0 ||
        "call_metrics" in root ||
        "callMetrics" in root;

    if (!hasCallMetrics) return undefined;

    return {
        total_calls_made,
        total_missed_calls,
        duration,
        by_initiator_role: by_initiator_role.length ? by_initiator_role : undefined,
        by_initiator_department: by_initiator_department.length ? by_initiator_department : undefined,
    };
}
