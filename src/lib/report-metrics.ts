/**
 * Report metric definitions for CSV export.
 * `id` values are stable keys used in the report UI and CSV builder.
 */

export type ReportMetricKind =
    | "scalar"
    | "table_daily"
    | "table_department"
    | "table_roles_escalated"
    | "table_roles_escalated_least"
    | "table_roles_metrics";

export type ReportMetricDef = {
    id: string;
    label: string;
    group: string;
    kind: ReportMetricKind;
    /** For scalars: key on the analytics payload */
    field?: string;
};

export const REPORT_METRICS: ReportMetricDef[] = [
    { id: "scalar_active_users_count", group: "Staff & activity", label: "Active users (count)", kind: "scalar", field: "active_users_count" },
    { id: "scalar_active_users_rate_percent", group: "Staff & activity", label: "Active users (% of registered)", kind: "scalar", field: "active_users_rate_percent" },
    { id: "scalar_registered_staff_count", group: "Staff & activity", label: "Registered staff (count)", kind: "scalar", field: "registered_staff_count" },

    { id: "scalar_total_messages", group: "Messaging", label: "Total messages", kind: "scalar", field: "total_messages" },
    { id: "scalar_critical_messages", group: "Messaging", label: "Critical messages", kind: "scalar", field: "critical_messages" },
    { id: "scalar_critical_messages_rate_percent", group: "Messaging", label: "Critical messages (% of total)", kind: "scalar", field: "critical_messages_rate_percent" },
    { id: "scalar_standard_messages", group: "Messaging", label: "Standard messages", kind: "scalar", field: "standard_messages" },

    { id: "scalar_escalation_rate_percent", group: "Escalation", label: "Escalation rate (% of critical)", kind: "scalar", field: "escalation_rate_percent" },
    { id: "scalar_escalated_critical_messages", group: "Escalation", label: "Escalated critical messages (count)", kind: "scalar", field: "escalated_critical_messages" },
    { id: "scalar_escalation_rate_of_total_messages_percent", group: "Escalation", label: "Escalation as % of all messages", kind: "scalar", field: "escalation_rate_of_total_messages_percent" },

    { id: "scalar_role_fill_rate_percent", group: "Roles", label: "Role fill rate (%)", kind: "scalar", field: "role_fill_rate_percent" },
    { id: "scalar_filled_roles", group: "Roles", label: "Filled roles (count)", kind: "scalar", field: "filled_roles" },
    { id: "scalar_total_roles", group: "Roles", label: "Total roles (count)", kind: "scalar", field: "total_roles" },
    { id: "scalar_critical_role_fill_rate_percent", group: "Roles", label: "Critical role fill rate (%)", kind: "scalar", field: "critical_role_fill_rate_percent" },
    { id: "scalar_critical_filled_roles", group: "Roles", label: "Critical roles filled (count)", kind: "scalar", field: "critical_filled_roles" },
    { id: "scalar_critical_total_roles", group: "Roles", label: "Critical roles total (count)", kind: "scalar", field: "critical_total_roles" },

    { id: "scalar_avg_critical_ack_minutes", group: "Response times", label: "Avg critical acknowledgment (minutes)", kind: "scalar", field: "avg_critical_ack_minutes" },
    { id: "scalar_avg_first_read_minutes_all", group: "Response times", label: "Avg first read — all messages (minutes)", kind: "scalar", field: "avg_first_read_minutes_all" },
    { id: "scalar_avg_first_read_minutes_critical", group: "Response times", label: "Avg first read — critical (minutes)", kind: "scalar", field: "avg_first_read_minutes_critical" },
    { id: "scalar_avg_first_read_minutes_non_critical", group: "Response times", label: "Avg first read — non-critical (minutes)", kind: "scalar", field: "avg_first_read_minutes_non_critical" },
    { id: "scalar_total_calls_made", group: "Response times", label: "Total calls made", kind: "scalar", field: "total_calls_made" },

    { id: "scalar_avg_sign_in_minutes_since_midnight_utc", group: "Scheduling", label: "Avg sign-in (minutes since midnight UTC)", kind: "scalar", field: "avg_sign_in_minutes_since_midnight_utc" },
    { id: "scalar_avg_sign_out_minutes_since_midnight_utc", group: "Scheduling", label: "Avg sign-out (minutes since midnight UTC)", kind: "scalar", field: "avg_sign_out_minutes_since_midnight_utc" },

    { id: "scalar_window_days", group: "Window", label: "Report window (days returned by API)", kind: "scalar", field: "window_days" },

    { id: "table_daily_message_volume", group: "Tables", label: "Daily message volume (by day)", kind: "table_daily" },
    { id: "table_department_metrics", group: "Tables", label: "Department metrics (by department)", kind: "table_department" },
    { id: "table_top_escalated_roles", group: "Tables", label: "Top escalated roles", kind: "table_roles_escalated" },
    { id: "table_least_escalated_roles", group: "Tables", label: "Least escalated roles", kind: "table_roles_escalated_least" },
    { id: "table_role_metrics", group: "Tables", label: "Role metrics (detail rows)", kind: "table_roles_metrics" },
];

export function defaultMetricSelection(): Record<string, boolean> {
    const m: Record<string, boolean> = {};
    for (const def of REPORT_METRICS) m[def.id] = true;
    return m;
}

function csvCell(v: unknown): string {
    if (v === null || v === undefined) return "";
    const s = typeof v === "number" && !Number.isFinite(v) ? "" : String(v);
    if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
}

type AnalyticsRow = Record<string, unknown>;

function getScalar(data: AnalyticsRow, field: string): unknown {
    return data[field];
}

const DEPARTMENT_METRIC_HEADERS = [
    "department_name",
    "department_id",
    "role_fill_rate_percent",
    "escalation_rate_vs_dept_critical_messages_percent",
    "filled_roles",
    "total_roles",
    "critical_messages_sent",
    "avg_critical_ack_minutes",
    "avg_reply_response_minutes_all",
    "avg_reply_response_minutes_critical",
    "escalation_notifications",
    "critical_filled_roles",
    "critical_total_roles",
    "critical_role_fill_rate_percent",
] as const;

const DAILY_VOLUME_HEADERS = ["day", "total_messages", "critical_messages", "standard_messages"] as const;

const ESCALATION_ROLE_HEADERS = ["role_name", "role_id", "escalation_count"] as const;

export type ReportTableSection = {
    title: string;
    head: string[];
    body: string[][];
};

/** Normalized rows for CSV / PDF (same selection rules). */
export function collectReportData(data: AnalyticsRow, selected: Record<string, boolean>) {
    const scalarRows: [string, string][] = [];
    for (const def of REPORT_METRICS) {
        if (!selected[def.id] || def.kind !== "scalar" || !def.field) continue;
        const v = getScalar(data, def.field);
        scalarRows.push([def.label, v === null || v === undefined ? "" : String(v)]);
    }

    let daily: ReportTableSection | null = null;
    if (selected.table_daily_message_volume) {
        const vol = data.daily_message_volume;
        const head = [...DAILY_VOLUME_HEADERS];
        const body: string[][] = [];
        if (Array.isArray(vol)) {
            for (const row of vol) {
                if (!row || typeof row !== "object") continue;
                const r = row as Record<string, unknown>;
                body.push(
                    head.map((h) => {
                        const x = r[h];
                        return x === null || x === undefined ? "" : String(x);
                    })
                );
            }
        }
        daily = { title: "Daily message volume", head, body };
    }

    let departments: ReportTableSection | null = null;
    if (selected.table_department_metrics) {
        const head = [...DEPARTMENT_METRIC_HEADERS];
        const body: string[][] = [];
        const depts = data.department_metrics;
        if (Array.isArray(depts)) {
            for (const row of depts) {
                if (!row || typeof row !== "object") continue;
                const r = row as Record<string, unknown>;
                body.push(head.map((h) => (r[h] === null || r[h] === undefined ? "" : String(r[h]))));
            }
        }
        departments = { title: "Department metrics", head, body };
    }

    let topEscalated: ReportTableSection | null = null;
    if (selected.table_top_escalated_roles) {
        const head = [...ESCALATION_ROLE_HEADERS];
        const body: string[][] = [];
        const list = data.top_escalated_roles;
        if (Array.isArray(list)) {
            for (const item of list) {
                if (!item || typeof item !== "object") continue;
                const r = item as Record<string, unknown>;
                body.push(head.map((h) => (r[h] === null || r[h] === undefined ? "" : String(r[h]))));
            }
        }
        topEscalated = { title: "Top escalated roles", head, body };
    }

    let leastEscalated: ReportTableSection | null = null;
    if (selected.table_least_escalated_roles) {
        const head = [...ESCALATION_ROLE_HEADERS];
        const body: string[][] = [];
        const list = data.least_escalated_roles;
        if (Array.isArray(list)) {
            for (const item of list) {
                if (!item || typeof item !== "object") continue;
                const r = item as Record<string, unknown>;
                body.push(head.map((h) => (r[h] === null || r[h] === undefined ? "" : String(r[h]))));
            }
        }
        leastEscalated = { title: "Least escalated roles", head, body };
    }

    let roleMetrics: ReportTableSection | null = null;
    if (selected.table_role_metrics) {
        const roles = data.role_metrics;
        if (Array.isArray(roles) && roles.length > 0) {
            const first = roles[0];
            const head =
                first && typeof first === "object" ? Object.keys(first as object) : [];
            const body: string[][] = [];
            if (head.length) {
                for (const row of roles) {
                    if (!row || typeof row !== "object") continue;
                    const r = row as Record<string, unknown>;
                    body.push(head.map((h) => (r[h] === null || r[h] === undefined ? "" : String(r[h]))));
                }
            }
            roleMetrics = { title: "Role metrics", head, body };
        } else {
            roleMetrics = { title: "Role metrics", head: [], body: [] };
        }
    }

    return {
        scalarRows,
        daily,
        departments,
        topEscalated,
        leastEscalated,
        roleMetrics,
    };
}

/** Build UTF-8 CSV text for selected metrics. */
export function buildAnalyticsReportCsv(
    data: AnalyticsRow,
    selected: Record<string, boolean>,
    meta: { dateFrom: string; dateTo: string; generatedAtIso: string }
): string {
    const collected = collectReportData(data, selected);
    const lines: string[] = [];
    lines.push(csvCell("Helix Analytics report"));
    lines.push(`${csvCell("Generated")},${csvCell(meta.generatedAtIso)}`);
    lines.push(`${csvCell("Date range (inclusive)")},${csvCell(`${meta.dateFrom} to ${meta.dateTo}`)}`);
    lines.push("");
    lines.push(`${csvCell("Metric")},${csvCell("Value")}`);
    for (const [k, v] of collected.scalarRows) {
        lines.push(`${csvCell(k)},${csvCell(v)}`);
    }

    const appendTableCsv = (section: ReportTableSection | null) => {
        if (!section) return;
        lines.push("");
        lines.push(csvCell(section.title));
        if (section.body.length === 0) {
            lines.push(csvCell("(no rows)"));
            return;
        }
        lines.push(section.head.map(csvCell).join(","));
        for (const row of section.body) {
            lines.push(row.map(csvCell).join(","));
        }
    };

    appendTableCsv(collected.daily);
    appendTableCsv(collected.departments);
    appendTableCsv(collected.topEscalated);
    appendTableCsv(collected.leastEscalated);
    appendTableCsv(collected.roleMetrics);

    return lines.join("\n");
}
