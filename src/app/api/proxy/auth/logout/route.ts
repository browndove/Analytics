import { NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

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
            return NextResponse.json(
                { error: "Backend returned invalid response", details: text.substring(0, 200) },
                { status: 502 }
            );
        }
        const response = NextResponse.json(data, { status: res.status });
        response.cookies.delete("helix-session");
        response.cookies.delete("helix-facility");
        return response;
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({ error: "Proxy error", details: message }, { status: 500 });
    }
}
