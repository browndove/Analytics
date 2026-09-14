import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/config";
import { getInternalTokenFromCookie, getProxyHeaders } from "@/lib/proxy-auth";
import { isInternalAdminToken } from "@/lib/auth-cookies";
import { resolveFacilityId } from "@/lib/proxy-facility";

/**
 * GET /api/proxy/feature-usage-metrics
 * Proxies to GET /api/v1/feature-usage-metrics (daily active users, feature opens, time in app).
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const url = new URL(`${API_BASE_URL}/api/v1/feature-usage-metrics`);

        const explicitFacilityId = searchParams.get("facility_id")?.trim() || null;
        const internalToken = getInternalTokenFromCookie(req);
        const isInternal = Boolean(internalToken && isInternalAdminToken(internalToken));

        let facilityId: string | null = explicitFacilityId;
        if (!facilityId && !isInternal) {
            facilityId = (await resolveFacilityId(req, API_BASE_URL)) ?? null;
            if (!facilityId) {
                return NextResponse.json(
                    { error: "Unable to resolve facility for current session. Please log in again." },
                    { status: 400 },
                );
            }
        }

        if (facilityId) {
            url.searchParams.set("facility_id", facilityId);
        }

        const from = searchParams.get("from");
        const to = searchParams.get("to");
        if (from) url.searchParams.set("from", from);
        if (to) url.searchParams.set("to", to);

        const days = searchParams.get("days");
        if (days) url.searchParams.set("days", days);

        const headers: Record<string, string> = {
            ...(getProxyHeaders(req) as Record<string, string>),
        };
        if (facilityId) {
            headers["X-Facility-Id"] = facilityId;
        }

        const res = await fetch(url.toString(), {
            method: "GET",
            headers,
        });

        const text = await res.text();
        let data: unknown;
        try {
            data = text ? JSON.parse(text) : {};
        } catch {
            return NextResponse.json(
                { error: "Backend returned invalid response", details: text.substring(0, 200) },
                { status: 502 },
            );
        }

        return NextResponse.json(data, { status: res.status });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({ error: "Proxy error", details: message }, { status: 500 });
    }
}
