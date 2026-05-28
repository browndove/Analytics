export type StaffGenderBucket = {
    gender: string;
    count: number;
    percent: number;
};

export type StaffGenderBreakdown = {
    total_staff: number;
    buckets: StaffGenderBucket[];
};

export type DailyMessagePoint = {
    day: string;
    total_messages: number;
    critical_messages: number;
    standard_messages: number;
};

export type TransferCounterparty = {
    counterparty_facility_id: string;
    counterparty_facility_name: string;
    total_transfer_requests: number;
    outbound_transfer_requests: number;
    inbound_transfer_requests: number;
    accepted_transfer_requests: number;
    declined_transfer_requests: number;
    pending_transfer_requests: number;
};

export type TransferByRole = {
    role_id: string;
    role_name: string;
    facility_id: string;
    facility_name: string;
    total_transfer_requests: number;
    outbound_transfer_requests: number;
    inbound_transfer_requests: number;
    accepted_transfer_requests: number;
    declined_transfer_requests: number;
    pending_transfer_requests: number;
};

export type DepartmentMetrics = {
    department_group_key: string;
    department_name: string;
    matched_names?: string[];
    facilities_represented: number;

    total_roles: number;
    filled_roles: number;
    role_fill_rate_percent: number;

    critical_total_roles: number;
    critical_filled_roles: number;
    critical_role_fill_rate_percent: number;

    critical_messages_sent: number;
    escalated_critical_messages_distinct: number;
    escalation_notifications: number;
    escalation_rate_vs_dept_critical_messages_percent: number;

    avg_critical_ack_minutes: number;
    avg_reply_response_minutes_all: number;
    avg_reply_response_minutes_critical: number;

    staff_count?: number;
    staff_gender?: StaffGenderBreakdown;
};

export type GlobalUsageMetricsResponse = {
    scope: "global" | "facility";
    filter_facility_id?: string;
    facilities_in_scope: number;
    window_days: number;
    from: string;
    to: string;

    total_messages: number;
    total_calls_made: number;
    critical_messages: number;
    standard_messages: number;
    critical_messages_rate_percent: number;

    escalated_critical_messages: number;
    escalation_hops: number;
    escalation_rate_percent: number;
    escalation_rate_of_total_messages_percent: number;
    avg_critical_ack_minutes: number;

    avg_read_minutes_all: number;
    avg_read_minutes_critical: number;
    avg_reply_response_minutes_all: number;
    avg_reply_response_minutes_critical: number;

    total_transfer_requests: number;
    transfer_requests_sent: number;
    transfer_requests_outbound: number;
    transfer_requests_inbound: number;
    transfer_requests_accepted: number;
    transfer_requests_declined: number;
    transfer_requests_pending: number;
    transfer_by_counterparty_facility: TransferCounterparty[];
    transfer_by_role: TransferByRole[];

    active_users_count: number;
    registered_staff_count: number;
    active_users_rate_percent: number;

    daily_message_volume: DailyMessagePoint[];
    daily_message_volume_window_days: number;
    daily_message_volume_from: string;
    daily_message_volume_to: string;

    total_roles: number;
    filled_roles: number;
    role_fill_rate_percent: number;
    critical_total_roles: number;
    critical_filled_roles: number;
    critical_role_fill_rate_percent: number;

    avg_sign_in_minutes_since_midnight_utc: number;
    avg_sign_out_minutes_since_midnight_utc: number;

    department_metrics: DepartmentMetrics[];
    staff_gender?: StaffGenderBreakdown;
};

export function minutesSinceMidnightToLabel(minutes: number): string {
    const h = Math.floor(minutes / 60) % 24;
    const m = Math.round(minutes % 60);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")} UTC`;
}
