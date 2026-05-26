export interface TransferCounterpartyRow {
    counterparty_facility_id: string;
    counterparty_facility_name: string;
    total_transfer_requests: number;
    outbound_transfer_requests: number;
    inbound_transfer_requests: number;
    accepted_transfer_requests: number;
    declined_transfer_requests: number;
    pending_transfer_requests: number;
}

export interface TransferRoleRow {
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
}

export interface TransferMetricsData {
    facility_id: string;
    window_days: number;
    from: string;
    to: string;
    total_transfer_requests: number;
    transfer_requests_sent: number;
    transfer_requests_outbound: number;
    transfer_requests_inbound: number;
    transfer_requests_accepted: number;
    transfer_requests_declined: number;
    transfer_requests_pending: number;
    transfer_by_counterparty_facility: TransferCounterpartyRow[];
    transfer_by_role: TransferRoleRow[];
}

export function acceptanceRatePercent(data: TransferMetricsData): number {
    if (data.total_transfer_requests <= 0) return 0;
    return (data.transfer_requests_accepted / data.total_transfer_requests) * 100;
}

export function windowLabel(data: TransferMetricsData): string {
    if (data.window_days === 0) return "Selected period";
    if (data.window_days === 1) return "Today";
    return `Last ${data.window_days} days`;
}
