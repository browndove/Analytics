"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, LogOut, Plus, Search } from "lucide-react";
import clsx from "clsx";
import { API_ENDPOINTS } from "@/lib/config";
import { type ApiFacility, mapApiList, type DirectoryFacility } from "@/lib/facility-directory";

export default function InternalAdminDashboard() {
    const router = useRouter();
    const [facilities, setFacilities] = useState<DirectoryFacility[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [ticketId, setTicketId] = useState("");
    const [reason, setReason] = useState("");
    const [accessingId, setAccessingId] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [exiting, setExiting] = useState(false);

    const loadFacilities = useCallback(async () => {
        setLoading(true);
        setLoadError(null);
        try {
            const res = await fetch(API_ENDPOINTS.INTERNAL_FACILITIES, { credentials: "include" });
            const json = await res.json();
            if (!res.ok) {
                const msg =
                    (json?.error as string) ||
                    (json?.message as string) ||
                    "Failed to load facilities.";
                setLoadError(msg);
                setFacilities([]);
                return;
            }
            const rows = Array.isArray(json) ? (json as ApiFacility[]) : [];
            setFacilities(
                mapApiList(rows).sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }))
            );
        } catch {
            setLoadError("Network error while loading facilities.");
            setFacilities([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadFacilities();
    }, [loadFacilities]);

    const filteredFacilities = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return facilities;
        return facilities.filter(
            (f) => f.name.toLowerCase().includes(q) || f.code.toLowerCase().includes(q)
        );
    }, [facilities, searchQuery]);

    const handleExitSession = async () => {
        setExiting(true);
        try {
            await fetch(API_ENDPOINTS.INTERNAL_EXIT_ACT_AS, {
                method: "POST",
                credentials: "include",
            }).catch(() => undefined);
            await fetch(API_ENDPOINTS.LOGOUT, {
                method: "POST",
                credentials: "include",
            }).catch(() => undefined);
        } finally {
            window.location.replace("/internal/login");
        }
    };

    const handleAccessFacility = async (facility: DirectoryFacility) => {
        setAccessingId(facility.id);
        setActionError(null);
        try {
            const body: Record<string, string> = { facility_id: facility.id };
            const ticket = ticketId.trim();
            const reasonText = reason.trim();
            if (ticket) body.ticket_id = ticket;
            if (reasonText) body.reason = reasonText;

            const res = await fetch(API_ENDPOINTS.INTERNAL_ACT_AS, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(body),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setActionError(
                    (data?.error as string) ||
                        (data?.message as string) ||
                        "Could not enter support mode for this facility."
                );
                return;
            }
            router.push("/");
        } catch {
            setActionError("Network error. Please try again.");
        } finally {
            setAccessingId(null);
        }
    };

    const inputClass =
        "w-full rounded-lg border border-[#e2e6ec] bg-white px-4 py-2.5 text-sm text-[#1a2332] placeholder:text-[#7c8898] outline-none transition-shadow focus:border-[#2980d3] focus:ring-2 focus:ring-[#2980d3]/20";

    return (
        <div className="flex min-h-screen flex-col bg-[#f7f8fa] text-[#1a2332]">
            <main className="flex-1">
                <div className="border-b border-[#e2e6ec] bg-white/80 backdrop-blur-sm">
                    <div className="mx-auto max-w-7xl px-6 py-8">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex items-start gap-4">
                                <img
                                    src="/assets/images/helix-logo.png"
                                    alt="Helix"
                                    width={40}
                                    height={40}
                                    className="mt-1 h-10 w-10 shrink-0 object-contain"
                                />
                                <div>
                                    <h1 className="text-3xl font-bold tracking-tight text-[#1a2332]">
                                        Internal Admin Dashboard
                                    </h1>
                                    <p className="mt-2 max-w-2xl text-sm text-[#64748b]">
                                        Select a facility to enter support mode and view the tenant analytics
                                        context.
                                    </p>
                                </div>
                            </div>
                            <div className="flex shrink-0 flex-wrap gap-3">
                                <button
                                    type="button"
                                    onClick={handleExitSession}
                                    disabled={exiting}
                                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#e2e6ec] bg-white px-4 py-2 text-sm font-medium text-[#475569] transition-colors hover:bg-[#f0f2f5] disabled:opacity-60"
                                >
                                    {exiting ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <LogOut className="h-4 w-4" />
                                    )}
                                    Exit internal session
                                </button>
                                <a
                                    href="https://helixhealth.app/admin/index.html"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2980d3] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2473bd]"
                                >
                                    <Plus className="h-4 w-4" />
                                    Add Facility
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-b border-[#e2e6ec] bg-white/50">
                    <div className="mx-auto max-w-7xl px-6 py-6">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                            <div className="relative md:col-span-2">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7c8898]" />
                                <input
                                    type="text"
                                    placeholder="Search facility by name or code..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className={clsx(inputClass, "pl-10")}
                                />
                            </div>
                            <input
                                type="text"
                                placeholder="Ticket ID (optional)"
                                value={ticketId}
                                onChange={(e) => setTicketId(e.target.value)}
                                className={inputClass}
                            />
                            <input
                                type="text"
                                placeholder="Reason (optional)"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className={inputClass}
                            />
                        </div>
                    </div>
                </div>

                <div className="mx-auto max-w-7xl px-6 py-8">
                    {actionError ? (
                        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {actionError}
                        </p>
                    ) : null}

                    <div className="overflow-hidden rounded-xl border border-[#e2e6ec] bg-white shadow-sm">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-[#e2e6ec] bg-[#fafbfc]">
                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#64748b]">
                                        Facility
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#64748b]">
                                        Code
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-[#64748b]">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-16 text-center">
                                            <div className="inline-flex items-center gap-2 text-sm text-[#64748b]">
                                                <Loader2 className="h-5 w-5 animate-spin text-[#2980d3]" />
                                                Loading facilities…
                                            </div>
                                        </td>
                                    </tr>
                                ) : loadError ? (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-12 text-center">
                                            <p className="text-sm text-red-600">{loadError}</p>
                                            <button
                                                type="button"
                                                onClick={loadFacilities}
                                                className="mt-3 text-sm font-medium text-[#2980d3] hover:underline"
                                            >
                                                Try again
                                            </button>
                                        </td>
                                    </tr>
                                ) : filteredFacilities.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-12 text-center text-sm text-[#64748b]">
                                            No facilities found matching your search.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredFacilities.map((facility) => {
                                        const busy = accessingId === facility.id;
                                        return (
                                            <tr
                                                key={facility.id}
                                                className="border-b border-[#edf0f4] transition-colors last:border-b-0 hover:bg-[#f7f8fa]"
                                            >
                                                <td className="px-6 py-4 text-sm font-medium text-[#1a2332]">
                                                    {facility.name}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-block rounded-md bg-[#f0f2f5] px-2.5 py-1 text-xs font-medium text-[#475569]">
                                                        {facility.code}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        type="button"
                                                        disabled={accessingId !== null}
                                                        onClick={() => handleAccessFacility(facility)}
                                                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2980d3] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2473bd] disabled:cursor-not-allowed disabled:opacity-60"
                                                    >
                                                        {busy ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <>
                                                                Access facility
                                                                <ArrowRight className="h-4 w-4" />
                                                            </>
                                                        )}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {!loading && !loadError && facilities.length > 0 ? (
                        <p className="mt-4 text-xs text-[#7c8898]">
                            Showing {filteredFacilities.length} of {facilities.length} facilities
                        </p>
                    ) : null}
                </div>
            </main>

            <footer className="border-t border-[#e2e6ec] bg-white/60 backdrop-blur-sm">
                <div className="mx-auto max-w-7xl px-6 py-8">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                        <a
                            href="https://admintest.helixhealth.app/login"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex flex-col gap-1.5 rounded-lg p-3 transition-colors hover:bg-[#f0f2f5]"
                        >
                            <span className="text-sm font-medium text-[#1a2332] group-hover:text-[#2980d3]">
                                Test Admin
                            </span>
                            <span className="text-xs text-[#7c8898]">Staging tenant admin</span>
                        </a>
                        <a
                            href="https://admin.helixhealth.app/login"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex flex-col gap-1.5 rounded-lg p-3 transition-colors hover:bg-[#f0f2f5]"
                        >
                            <span className="text-sm font-medium text-[#1a2332] group-hover:text-[#2980d3]">
                                Production Admin
                            </span>
                            <span className="text-xs text-[#7c8898]">Production tenant admin</span>
                        </a>
                        <a
                            href="https://analyticstest.helixhealth.app/login?from=%2F"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex flex-col gap-1.5 rounded-lg p-3 transition-colors hover:bg-[#f0f2f5]"
                        >
                            <span className="text-sm font-medium text-[#1a2332] group-hover:text-[#2980d3]">
                                Test Analytics
                            </span>
                            <span className="text-xs text-[#7c8898]">Staging analytics</span>
                        </a>
                        <a
                            href="https://analytics.helixhealth.app/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex flex-col gap-1.5 rounded-lg p-3 transition-colors hover:bg-[#f0f2f5]"
                        >
                            <span className="text-sm font-medium text-[#1a2332] group-hover:text-[#2980d3]">
                                Production Analytics
                            </span>
                            <span className="text-xs text-[#7c8898]">Production analytics</span>
                        </a>
                        <a
                            href="https://helixhealth.app/admin/index.html"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex flex-col gap-1.5 rounded-lg p-3 transition-colors hover:bg-[#f0f2f5]"
                        >
                            <span className="text-sm font-medium text-[#1a2332] group-hover:text-[#2980d3]">
                                Onboarding Admin
                            </span>
                            <span className="text-xs text-[#7c8898]">Facility onboarding</span>
                        </a>
                    </div>
                    <div className="mt-8 border-t border-[#edf0f4] pt-6">
                        <p className="text-center text-xs text-[#7c8898]">
                            Internal Admin Dashboard · All access is logged and monitored
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
