import { NextRequest } from "next/server";
import { getTokenFromCookie } from "@/lib/proxy-auth";
import { FACILITY_ID_COOKIE, getSupportFacilityId, isSupportMode } from "@/lib/auth-cookies";

const FACILITY_CACHE_TTL_MS = 60_000;
const facilityIdCache = new Map<string, { facilityId: string; expiresAt: number }>();

function getCachedFacilityId(token: string): string | undefined {
    const entry = facilityIdCache.get(token);
    if (!entry) return undefined;
    if (entry.expiresAt <= Date.now()) {
        facilityIdCache.delete(token);
        return undefined;
    }
    return entry.facilityId;
}

function setCachedFacilityId(token: string, facilityId: string): void {
    facilityIdCache.set(token, {
        facilityId,
        expiresAt: Date.now() + FACILITY_CACHE_TTL_MS,
    });
}

function extractFacilityIdFromObject(source: Record<string, unknown>): string | undefined {
    const id = String(source.facility_id || source.facilityId || source.current_facility_id || source.currentFacilityId || "").trim();
    if (id) return id;

    if (source.facility && typeof source.facility === "object") {
        const f = source.facility as Record<string, unknown>;
        const nestedId = String(f.id || f.facility_id || "").trim();
        if (nestedId) return nestedId;
    }
    return undefined;
}

function extractFacilityNameFromObject(source: Record<string, unknown>): string | undefined {
    const name = String(source.name || source.facility_name || "").trim();
    if (name) return name;

    if (source.facility && typeof source.facility === "object") {
        const f = source.facility as Record<string, unknown>;
        const nestedName = String(f.name || f.facility_name || "").trim();
        if (nestedName) return nestedName;
    }
    return undefined;
}

export function extractFacilityIdFromPayload(payload: unknown): string | undefined {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) return undefined;
    const root = payload as Record<string, unknown>;

    const topLevel = extractFacilityIdFromObject(root);
    if (topLevel) return topLevel;

    const data =
        root.data && typeof root.data === "object" && !Array.isArray(root.data)
            ? (root.data as Record<string, unknown>)
            : undefined;

    const candidates: unknown[] = [
        root.user,
        root.staff,
        root.admin,
        root.facility,
        data,
        data?.user,
        data?.staff,
        data?.admin,
        data?.facility,
    ];

    for (const candidate of candidates) {
        if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) continue;
        const id = extractFacilityIdFromObject(candidate as Record<string, unknown>);
        if (id) return id;
    }

    return undefined;
}

export function extractFacilityNameFromPayload(payload: unknown): string | undefined {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) return undefined;
    const root = payload as Record<string, unknown>;

    const topLevel = extractFacilityNameFromObject(root);
    if (topLevel) return topLevel;

    const data =
        root.data && typeof root.data === "object" && !Array.isArray(root.data)
            ? (root.data as Record<string, unknown>)
            : undefined;

    const candidates: unknown[] = [
        root.user,
        root.staff,
        root.admin,
        root.facility,
        data,
        data?.user,
        data?.staff,
        data?.admin,
        data?.facility,
    ];

    for (const candidate of candidates) {
        if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) continue;
        const name = extractFacilityNameFromObject(candidate as Record<string, unknown>);
        if (name) return name;
    }

    return undefined;
}

/**
 * Resolve facility_id for tenant APIs (usage-metrics, transfer-metrics, etc.).
 * Support mode: act-as cookies. Facility admin: helix-facility cookie or /auth/me.
 */
export async function resolveFacilityId(req: NextRequest, apiBaseUrl: string): Promise<string | undefined> {
    const token = getTokenFromCookie(req);
    if (!token) return undefined;

    if (isSupportMode(req)) {
        const supportId = getSupportFacilityId(req);
        if (supportId) {
            setCachedFacilityId(token, supportId);
            return supportId;
        }
    }

    const cookieFacilityId = req.cookies.get(FACILITY_ID_COOKIE)?.value?.trim();
    if (cookieFacilityId) {
        setCachedFacilityId(token, cookieFacilityId);
        return cookieFacilityId;
    }

    const cachedFacilityId = getCachedFacilityId(token);
    if (cachedFacilityId) {
        return cachedFacilityId;
    }

    try {
        const meRes = await fetch(`${apiBaseUrl}/api/v1/auth/me`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });
        if (meRes.ok) {
            const meData = await meRes.json();
            const fid = extractFacilityIdFromPayload(meData);
            if (fid) {
                setCachedFacilityId(token, fid);
                return fid;
            }
        }
    } catch {
        return undefined;
    }

    return undefined;
}
