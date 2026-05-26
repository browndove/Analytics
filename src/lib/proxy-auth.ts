import { NextRequest, NextResponse } from "next/server";
import {
    FACILITY_SESSION_COOKIE,
    INTERNAL_SESSION_COOKIE,
    INTERNAL_COOKIE_NAMES,
    SUPPORT_COOKIE_NAMES,
    SUPPORT_MODE_COOKIE,
    SUPPORT_FACILITY_COOKIE,
    FACILITY_ID_COOKIE,
    isSupportMode,
    sessionCookieOptions,
} from "@/lib/auth-cookies";

export {
    FACILITY_SESSION_COOKIE,
    INTERNAL_SESSION_COOKIE,
    SUPPORT_MODE_COOKIE,
    SUPPORT_FACILITY_COOKIE,
    FACILITY_ID_COOKIE,
} from "@/lib/auth-cookies";

/**
 * Bearer token for upstream Helix API calls.
 * In support mode, uses helix-internal-session; otherwise helix-session.
 */
export function getTokenFromCookie(req: NextRequest): string | undefined {
    if (isSupportMode(req)) {
        const internal = req.cookies.get(INTERNAL_SESSION_COOKIE)?.value;
        if (internal) return internal;
    }
    return req.cookies.get(FACILITY_SESSION_COOKIE)?.value;
}

export function getInternalTokenFromCookie(req: NextRequest): string | undefined {
    return req.cookies.get(INTERNAL_SESSION_COOKIE)?.value;
}

export function getInternalProxyHeaders(req: NextRequest): HeadersInit {
    const token = getInternalTokenFromCookie(req);
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }
    return headers;
}

export function getProxyHeaders(req: NextRequest): HeadersInit {
    const token = getTokenFromCookie(req) ?? getInternalTokenFromCookie(req);
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }
    return headers;
}

/** Clear support-mode cookies (act-as context). */
export function clearSupportCookies(res: NextResponse): NextResponse {
    for (const name of SUPPORT_COOKIE_NAMES) {
        res.cookies.delete(name);
    }
    return res;
}

/** Clear internal admin session and support context. */
export function clearInternalCookies(res: NextResponse): NextResponse {
    for (const name of INTERNAL_COOKIE_NAMES) {
        res.cookies.delete(name);
    }
    return res;
}

/** Clear facility tenant session cookies. */
export function clearFacilityCookies(res: NextResponse): NextResponse {
    res.cookies.delete(FACILITY_SESSION_COOKIE);
    res.cookies.delete(FACILITY_ID_COOKIE);
    return res;
}

export function clearAllAuthCookies(res: NextResponse): NextResponse {
    clearFacilityCookies(res);
    clearInternalCookies(res);
    return res;
}

export function setSupportFacilityCookies(
    res: NextResponse,
    facilityId: string,
    maxAge = 60 * 60 * 8,
): NextResponse {
    const opts = sessionCookieOptions;
    res.cookies.set(SUPPORT_MODE_COOKIE, "1", { ...opts(true, maxAge), httpOnly: true });
    res.cookies.set(SUPPORT_FACILITY_COOKIE, facilityId, opts(true, maxAge));
    res.cookies.set(FACILITY_ID_COOKIE, facilityId, opts(false, maxAge));
    return res;
}
