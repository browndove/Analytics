import { NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

function withSessionCleared(res: NextResponse): NextResponse {
    res.cookies.delete("helix-session");
    res.cookies.delete("helix-facility");
    return res;
}

export async function POST() {
    try {
        const url = `${API_BASE_URL}/api/v1/auth/logout`;
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
        });
        const text = await res.text();
        let data: unknown;
        try {
            data = JSON.parse(text);
        } catch {
            return withSessionCleared(
                NextResponse.json(
                    { error: "Backend returned invalid response", details: text.substring(0, 200) },
                    { status: 502 },
                ),
            );
        }
        return withSessionCleared(NextResponse.json(data, { status: res.status }));
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return withSessionCleared(NextResponse.json({ error: "Proxy error", details: message }, { status: 500 }));
    }
}
