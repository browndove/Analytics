import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/config";
import { getInternalTokenFromCookie } from "@/lib/proxy-auth";
import { isInternalAdminToken } from "@/lib/auth-cookies";

/**
 * GET /api/proxy/usage-metrics
 * Proxies to GET /api/v1/usage-metrics (global cross-facility analytics).
 * Internal admin token required.
 */
export async function GET(req: NextRequest) {
    const token = getInternalTokenFromCookie(req);
    if (!token || !isInternalAdminToken(token)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const url = new URL(`${API_BASE_URL}/api/v1/usage-metrics`);

        // Forward supported query params
        const facilityId = searchParams.get("facility_id");
        if (facilityId) url.searchParams.set("facility_id", facilityId);

        const days = searchParams.get("days");
        if (days) url.searchParams.set("days", days);

        const from = searchParams.get("from");
        const to = searchParams.get("to");
        if (from) url.searchParams.set("from", from);
        if (to) url.searchParams.set("to", to);

        const dailyVolumeDays = searchParams.get("daily_volume_days");
        if (dailyVolumeDays) url.searchParams.set("daily_volume_days", dailyVolumeDays);

        const headers: Record<string, string> = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        };
        if (facilityId) {
            headers["X-Facility-Id"] = facilityId;
        }

        console.log("[usage-metrics] Request to:", url.toString());

        const res = await fetch(url.toString(), {
            method: "GET",
            headers,
        });

        const text = await res.text();
        console.log("[usage-metrics] Backend response status:", res.status);

        let data: unknown;
        try {
            data = JSON.parse(text);
        } catch {
            console.error("[usage-metrics] Failed to parse backend response as JSON");
            return NextResponse.json(
                { error: "Backend returned invalid response", details: text.substring(0, 200) },
                { status: 502 },
            );
        }

        return NextResponse.json(data, { status: res.status });
    } catch (err) {
        console.error("[usage-metrics] Proxy error:", err);
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({ error: "Proxy error", details: message }, { status: 500 });
    }
}
