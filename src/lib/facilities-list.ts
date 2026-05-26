import { API_BASE_URL } from "@/lib/config";

const FACILITIES_URL = `${API_BASE_URL}/api/v1/facilities`;

export function normalizeFacilitiesPayload(data: unknown): unknown[] {
    if (Array.isArray(data)) return data;
    if (data && typeof data === "object") {
        const root = data as Record<string, unknown>;
        if (Array.isArray(root.data)) return root.data;
        if (Array.isArray(root.facilities)) return root.facilities;
    }
    return [];
}

/** Proxy GET /api/v1/facilities with the given Authorization headers. */
export async function fetchFacilitiesUpstream(headers: HeadersInit): Promise<{
    ok: boolean;
    status: number;
    facilities: unknown[];
    errorBody?: unknown;
    rawText?: string;
}> {
    const res = await fetch(FACILITIES_URL, {
        method: "GET",
        headers,
        cache: "no-store",
    });
    const text = await res.text();
    let data: unknown;
    try {
        data = text ? JSON.parse(text) : [];
    } catch {
        return {
            ok: false,
            status: 502,
            facilities: [],
            rawText: text,
        };
    }
    if (!res.ok) {
        return { ok: false, status: res.status, facilities: [], errorBody: data };
    }
    return { ok: true, status: res.status, facilities: normalizeFacilitiesPayload(data) };
}
