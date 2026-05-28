import { getProxyHeaders } from "@/lib/proxy-auth";
import { resolveFacilityId } from "@/lib/proxy-facility";
import { extractTransferMetricsFromUsage } from "@/lib/transfer-metrics";
import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

/** GET /api/proxy/transfer-metrics — transfer fields from usage-metrics */
export async function GET(req: NextRequest) {
    try {
        const facilityId = await resolveFacilityId(req, API_BASE_URL);
        if (!facilityId) {
            return NextResponse.json(
                { error: "Unable to resolve facility for current session. Please log in again." },
                { status: 400 },
            );
        }

        const { searchParams } = new URL(req.url);
        const url = new URL(`${API_BASE_URL}/api/v1/facilities/${facilityId}/usage-metrics`);

        const from = searchParams.get("from");
        const to = searchParams.get("to");
        if (from !== null && from !== "") url.searchParams.set("from", from);
        if (to !== null && to !== "") url.searchParams.set("to", to);

        const res = await fetch(url.toString(), {
            method: "GET",
            headers: getProxyHeaders(req),
        });

        const text = await res.text();
        let usagePayload: unknown;
        try {
            usagePayload = text ? JSON.parse(text) : {};
        } catch {
            return NextResponse.json(
                { error: "Backend returned invalid response", details: text.substring(0, 200) },
                { status: 502 },
            );
        }

        if (!res.ok) {
            return NextResponse.json(usagePayload, { status: res.status });
        }

        const transfer = extractTransferMetricsFromUsage(usagePayload);
        if (!transfer) {
            return NextResponse.json(
                {
                    error: "Usage metrics response has no transfer data",
                    facility_id: facilityId,
                },
                { status: 404 },
            );
        }

        return NextResponse.json(transfer);
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({ error: "Proxy error", details: message }, { status: 500 });
    }
}
