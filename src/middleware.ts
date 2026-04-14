import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "helix-session";

function isTokenValid(token: string): boolean {
    try {
        const parts = token.split(".");
        if (parts.length !== 3) return false;
        const payload = JSON.parse(atob(parts[1])) as Record<string, unknown>;
        const expiredAt = payload.expired_at ?? payload.exp;
        if (expiredAt) {
            const expiry =
                typeof expiredAt === "string"
                    ? new Date(expiredAt).getTime()
                    : typeof expiredAt === "number"
                      ? expiredAt * 1000
                      : 0;
            if (expiry && Date.now() > expiry) return false;
        }
        return true;
    } catch {
        return false;
    }
}

export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    if (pathname.startsWith("/api") || pathname.startsWith("/_next") || pathname === "/favicon.ico") {
        return NextResponse.next();
    }

    const token = req.cookies.get(COOKIE_NAME)?.value ?? "";
    const authed = token && isTokenValid(token);

    if (pathname === "/login") {
        if (authed) {
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
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
