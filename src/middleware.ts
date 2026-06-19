import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
    FACILITY_SESSION_COOKIE,
    INTERNAL_SESSION_COOKIE,
    isInternalAdminToken,
    isTokenValid,
} from "@/lib/auth-cookies";

function facilityAuthed(req: NextRequest): boolean {
    const token = req.cookies.get(FACILITY_SESSION_COOKIE)?.value;
    return Boolean(token && isTokenValid(token));
}

function internalAuthed(req: NextRequest): boolean {
    const token = req.cookies.get(INTERNAL_SESSION_COOKIE)?.value;
    return Boolean(token && isTokenValid(token) && isInternalAdminToken(token));
}

function appAuthed(req: NextRequest): boolean {
    if (facilityAuthed(req)) return true;
    return internalAuthed(req);
}

export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    if (
        pathname.startsWith("/api") ||
        pathname.startsWith("/_next") ||
        pathname === "/favicon.ico" ||
        pathname.startsWith("/assets/")
    ) {
        return NextResponse.next();
    }

    const internal = internalAuthed(req);
    const facility = facilityAuthed(req);
    const authed = appAuthed(req);

    const isInternalPath = pathname === "/internal/login" || pathname.startsWith("/internal/");

    if (isInternalPath) {
        if (pathname === "/internal/login") {
            if (internal) {
                return NextResponse.redirect(new URL("/", req.url));
            }
            return NextResponse.next();
        }

        if (pathname === "/internal/dashboard") {
            return NextResponse.redirect(new URL(internal ? "/" : "/internal/login", req.url));
        }

        if (!internal) {
            const login = new URL("/internal/login", req.url);
            login.searchParams.set("from", pathname);
            return NextResponse.redirect(login);
        }

        return NextResponse.next();
    }

    if (pathname === "/login") {
        if (facility) {
            return NextResponse.redirect(new URL("/", req.url));
        }
        if (internal) {
            return NextResponse.redirect(new URL("/", req.url));
        }
        return NextResponse.next();
    }

    if (!authed) {
        const login = new URL("/login", req.url);
        login.searchParams.set("from", pathname);
        return NextResponse.redirect(login);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|assets/).*)"],
};
