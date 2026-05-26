import { FACILITY_ID_COOKIE } from "@/lib/auth-cookies";
import { API_ENDPOINTS } from "@/lib/config";

/** Read helix-facility from document.cookie (support mode sets this for client hints). */
export function readClientFacilityIdFromCookie(): string | undefined {
    if (typeof document === "undefined") return undefined;
    const match = document.cookie
        .split(";")
        .map((c) => c.trim())
        .find((c) => c.startsWith(`${FACILITY_ID_COOKIE}=`));
    if (!match) return undefined;
    const value = decodeURIComponent(match.split("=")[1] || "");
    return value.trim() || undefined;
}

/** Current facility in support mode, from cookie or act-as status endpoint. */
export async function resolveClientFacilityId(): Promise<string | undefined> {
    const fromCookie = readClientFacilityIdFromCookie();
    if (fromCookie) return fromCookie;

    try {
        const res = await fetch(API_ENDPOINTS.INTERNAL_ACT_AS, { credentials: "include" });
        if (!res.ok) return undefined;
        const data = (await res.json()) as { support_mode?: boolean; facility_id?: string | null };
        if (data.support_mode && data.facility_id) return String(data.facility_id);
    } catch {
        return undefined;
    }
    return undefined;
}
