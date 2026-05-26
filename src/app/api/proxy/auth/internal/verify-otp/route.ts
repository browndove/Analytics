import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/config";
import { INTERNAL_SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth-cookies";
import { clearAllAuthCookies } from "@/lib/proxy-auth";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const url = `${API_BASE_URL}/api/v1/auth/internal/verify-otp`;
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        const text = await res.text();
        let data: Record<string, unknown>;
        try {
            data = JSON.parse(text) as Record<string, unknown>;
        } catch {
            return NextResponse.json(
                { error: "Backend returned invalid response", details: text.substring(0, 200) },
                { status: 502 },
            );
        }

        const response = NextResponse.json(data, { status: res.status });
        if (res.ok) {
            clearAllAuthCookies(response);
            const access = data.access_token;
            if (typeof access === "string" && access) {
                response.cookies.set(INTERNAL_SESSION_COOKIE, access, sessionCookieOptions(true));
            }
        }
        return response;
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({ error: "Proxy error", details: message }, { status: 500 });
    }
}
