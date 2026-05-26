import { getProxyHeaders } from "@/lib/proxy-auth";
import { fetchFacilitiesUpstream } from "@/lib/facilities-list";
import { NextRequest, NextResponse } from "next/server";

/** Internal dashboard — same upstream as GET /api/v1/facilities. */
export async function GET(req: NextRequest) {
    try {
        const result = await fetchFacilitiesUpstream(getProxyHeaders(req));
        if (result.rawText !== undefined) {
            return NextResponse.json(
                { error: "Backend returned invalid response", details: result.rawText.substring(0, 200) },
                { status: 502 },
            );
        }
        if (!result.ok) {
            return NextResponse.json(result.errorBody ?? { error: "Failed to load facilities" }, {
                status: result.status,
            });
        }
        return NextResponse.json(result.facilities);
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({ error: "Proxy error", details: message }, { status: 500 });
    }
}
