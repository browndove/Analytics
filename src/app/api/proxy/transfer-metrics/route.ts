import { getProxyHeaders } from "@/lib/proxy-auth";
import { resolveFacilityId } from "@/lib/proxy-facility";
import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

/** GET /api/proxy/transfer-metrics — facility transfer request metrics */
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
        const url = new URL(`${API_BASE_URL}/api/v1/facilities/${facilityId}/transfer-metrics`);

        const from = searchParams.get("from");
        const to = searchParams.get("to");
        if (from !== null && from !== "") url.searchParams.set("from", from);
        if (to !== null && to !== "") url.searchParams.set("to", to);

        console.log("[transfer-metrics] Request to:", url.toString());

        const res = await fetch(url.toString(), {
            method: "GET",
            headers: getProxyHeaders(req),
        });

        const text = await res.text();
        console.log("[transfer-metrics] Backend response status:", res.status);

        let data: unknown;
        try {
            data = JSON.parse(text);
        } catch {
            console.error("[transfer-metrics] Failed to parse backend response as JSON");
            return NextResponse.json(
                { error: "Backend returned invalid response", details: text.substring(0, 200) },
                { status: 502 },
            );
        }

        return NextResponse.json(data, { status: res.status });
    } catch (err) {
        console.error("[transfer-metrics] Proxy error:", err);
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({ error: "Proxy error", details: message }, { status: 500 });
    }
}
