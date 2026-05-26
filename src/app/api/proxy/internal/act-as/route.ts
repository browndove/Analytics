import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/config";
import { getSupportFacilityId, isInternalAdminToken, isSupportMode } from "@/lib/auth-cookies";
import {
    clearFacilityCookies,
    clearSupportCookies,
    getInternalProxyHeaders,
    getInternalTokenFromCookie,
    setSupportFacilityCookies,
} from "@/lib/proxy-auth";

export async function GET(req: NextRequest) {
    const token = getInternalTokenFromCookie(req);
    if (!token || !isInternalAdminToken(token)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isSupportMode(req)) {
        return NextResponse.json({ support_mode: false });
    }

    const facilityId = getSupportFacilityId(req);
    return NextResponse.json({
        support_mode: true,
        facility_id: facilityId ?? null,
    });
}

export async function POST(req: NextRequest) {
    const token = getInternalTokenFromCookie(req);
    if (!token || !isInternalAdminToken(token)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const facilityId = String(body.facility_id ?? body.facilityId ?? "").trim();
        if (!facilityId) {
            return NextResponse.json({ error: "facility_id is required" }, { status: 400 });
        }

        const url = `${API_BASE_URL}/api/v1/internal/act-as`;
        const res = await fetch(url, {
            method: "POST",
            headers: getInternalProxyHeaders(req),
            body: JSON.stringify({
                facility_id: facilityId,
                reason: body.reason,
                ticket_id: body.ticket_id ?? body.ticketId,
            }),
        });

        const text = await res.text();
        let data: Record<string, unknown> = {};
        if (text) {
            try {
                data = JSON.parse(text) as Record<string, unknown>;
            } catch {
                if (res.status !== 404) {
                    return NextResponse.json(
                        { error: "Backend returned invalid response", details: text.substring(0, 200) },
                        { status: 502 },
                    );
                }
            }
        }

        if (!res.ok && res.status !== 404) {
            return NextResponse.json(data, { status: res.status });
        }

        const response = NextResponse.json(
            res.ok ? data : { facility_id: facilityId, support_mode: true },
            { status: 200 },
        );
        clearFacilityCookies(response);
        clearSupportCookies(response);
        setSupportFacilityCookies(response, facilityId);
        return response;
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({ error: "Proxy error", details: message }, { status: 500 });
    }
}
