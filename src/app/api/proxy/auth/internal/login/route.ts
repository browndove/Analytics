import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/config";

export async function POST(req: NextRequest) {
    const url = `${API_BASE_URL}/api/v1/auth/internal/login`;

    try {
        const body = await req.json();
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(15000),
        });
        const text = await res.text();
        let data: unknown;
        try {
            data = text ? JSON.parse(text) : {};
        } catch {
            return NextResponse.json(
                {
                    error: "Backend returned invalid response",
                    details: text.substring(0, 200),
                },
                { status: 502 },
            );
        }
        return NextResponse.json(data, { status: res.status });
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return NextResponse.json({ error: "Proxy error", details: message }, { status: 500 });
    }
}
