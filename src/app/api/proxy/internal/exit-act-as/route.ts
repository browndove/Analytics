import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/config";
import { isInternalAdminToken } from "@/lib/auth-cookies";
import {
    clearSupportCookies,
    getInternalProxyHeaders,
    getInternalTokenFromCookie,
} from "@/lib/proxy-auth";

export async function POST(req: NextRequest) {
    const token = getInternalTokenFromCookie(req);
    if (!token || !isInternalAdminToken(token)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const url = `${API_BASE_URL}/api/v1/internal/exit-act-as`;
        const res = await fetch(url, {
            method: "POST",
            headers: getInternalProxyHeaders(req),
            body: JSON.stringify({}),
        });

        const text = await res.text();
        let data: unknown = {};
        if (text) {
            try {
                data = JSON.parse(text);
            } catch {
                if (res.status !== 404) {
                    const response = NextResponse.json(
                        { error: "Backend returned invalid response", details: text.substring(0, 200) },
                        { status: 502 },
                    );
                    clearSupportCookies(response);
                    return response;
                }
            }
        }

        const response = NextResponse.json(data, { status: 200 });
        clearSupportCookies(response);
        return response;
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        const response = NextResponse.json({ error: "Proxy error", details: message }, { status: 500 });
        clearSupportCookies(response);
        return response;
    }
}
