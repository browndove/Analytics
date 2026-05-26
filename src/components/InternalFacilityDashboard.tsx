"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { API_ENDPOINTS } from "@/lib/config";
import { type ApiFacility, type DirectoryFacility, mapApiList } from "@/lib/facility-directory";

export default function InternalFacilityDashboard() {
    const router = useRouter();
    const [facilities, setFacilities] = useState<DirectoryFacility[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actingId, setActingId] = useState<string | null>(null);
    const [filterOpen, setFilterOpen] = useState(false);
    const [query, setQuery] = useState("");

    const loadFacilities = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch(API_ENDPOINTS.FACILITIES, { credentials: "include" });
            const data = await res.json();
            if (!res.ok) {
                setError((data.error as string) || (data.message as string) || "Failed to load facilities");
                setFacilities([]);
                return;
            }
            const rows = Array.isArray(data) ? (data as ApiFacility[]) : [];
            setFacilities(mapApiList(rows));
        } catch {
            setError("Network error loading facilities");
            setFacilities([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadFacilities();
    }, [loadFacilities]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return facilities;
        return facilities.filter(
            (f) =>
                f.name.toLowerCase().includes(q) ||
                f.code.toLowerCase().includes(q) ||
                f.location.toLowerCase().includes(q),
        );
    }, [facilities, query]);

    const handleActAs = async (row: DirectoryFacility) => {
        setActingId(row.id);
        setError("");
        try {
            const res = await fetch(API_ENDPOINTS.INTERNAL_ACT_AS, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ facility_id: row.id }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setError((data.error as string) || (data.message as string) || "Could not open facility");
                return;
            }
            router.push("/");
        } catch {
            setError("Network error");
        } finally {
            setActingId(null);
        }
    };

    const handleLogout = async () => {
        try {
            await fetch(API_ENDPOINTS.LOGOUT, { method: "POST", credentials: "include" });
        } finally {
            window.location.replace("/internal/login");
        }
    };

    return (
        <div className="facility-directory">
            <header className="facility-directory__masthead">
                <div>
                    <p className="facility-directory__kicker">Helix Internal</p>
                    <h1 className="facility-directory__title">Facility Directory</h1>
                </div>
                <button type="button" className="facility-directory__signout" onClick={handleLogout}>
                    Sign out
                </button>
            </header>

            <section className="facility-directory__stats" aria-label="Facility statistics">
                <article className="stat-card stat-card--solo">
                    <span className="stat-card__label">Total Facilities</span>
                    <p className="stat-card__value">{loading ? "—" : facilities.length}</p>
                    <span className="stat-card__delta">+2 this month</span>
                </article>
            </section>

            <section className="facility-directory__table-section">
                <div className="facility-directory__table-head">
                    <h2 className="facility-directory__table-title">Facility Directory</h2>
                    <button
                        type="button"
                        className="facility-directory__filter-btn"
                        onClick={() => setFilterOpen((v) => !v)}
                        aria-expanded={filterOpen}
                    >
                        <span className="facility-directory__filter-icon" aria-hidden>
                            ⫶
                        </span>
                        Filter
                    </button>
                </div>

                {filterOpen ? (
                    <div className="facility-directory__filter-panel">
                        <input
                            type="search"
                            className="facility-directory__filter-input"
                            placeholder="Name, code, or location…"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            autoFocus
                        />
                    </div>
                ) : null}

                {error ? <p className="facility-directory__error">{error}</p> : null}

                <div className="facility-table" role="table" aria-busy={loading}>
                    <div className="facility-table__header" role="row">
                        <span role="columnheader">Facility</span>
                        <span role="columnheader">Location</span>
                        <span role="columnheader" className="facility-table__action-col">
                            Action
                        </span>
                    </div>

                    {loading ? (
                        <p className="facility-table__loading">Loading register…</p>
                    ) : filtered.length === 0 ? (
                        <p className="facility-table__loading">No facilities match.</p>
                    ) : (
                        filtered.map((row, index) => (
                                <div
                                    key={row.id}
                                    className="facility-table__row"
                                    role="row"
                                    style={{ "--row-delay": `${index * 55}ms` } as Record<string, string>}
                                >
                                    <div className="facility-table__facility" role="cell">
                                        <div className="facility-table__name-row">
                                            <span className="facility-table__name">{row.name}</span>
                                            <span className="facility-table__code">{row.code}</span>
                                        </div>
                                    </div>
                                    <div className="facility-table__location" role="cell">
                                        <span className="facility-table__pin" aria-hidden>
                                            ◎
                                        </span>
                                        {row.location}
                                    </div>
                                    <div className="facility-table__action" role="cell">
                                        <button
                                            type="button"
                                            className="facility-table__action-btn"
                                            disabled={actingId === row.id}
                                            onClick={() => handleActAs(row)}
                                        >
                                            {actingId === row.id ? "Opening…" : "Manage →"}
                                        </button>
                                    </div>
                                </div>
                            ))
                    )}
                </div>
            </section>

            <style jsx>{`
                .facility-directory {
                    min-height: 100vh;
                    background: #f5f3ef;
                    color: #1a1a1c;
                    font-family: var(--font-ibm-mono), "IBM Plex Mono", ui-monospace, monospace;
                    padding: 2.5rem clamp(1.25rem, 4vw, 3.5rem) 4rem;
                }

                .facility-directory__masthead {
                    display: flex;
                    align-items: flex-end;
                    justify-content: space-between;
                    gap: 1.5rem;
                    margin-bottom: 2.75rem;
                    padding-bottom: 1.25rem;
                    border-bottom: 1px solid #d4d0c8;
                }

                .facility-directory__kicker {
                    margin: 0 0 0.35rem;
                    font-size: 0.65rem;
                    letter-spacing: 0.22em;
                    text-transform: uppercase;
                    color: #7a766c;
                }

                .facility-directory__title {
                    margin: 0;
                    font-family: var(--font-fraunces), "Fraunces", Georgia, serif;
                    font-size: clamp(1.75rem, 3.5vw, 2.35rem);
                    font-weight: 500;
                    letter-spacing: -0.02em;
                    color: #121214;
                }

                .facility-directory__signout {
                    background: #fff;
                    border: 1px solid #c8c4bc;
                    color: #5a5650;
                    font-family: inherit;
                    font-size: 0.7rem;
                    letter-spacing: 0.12em;
                    text-transform: uppercase;
                    padding: 0.55rem 1rem;
                    cursor: pointer;
                    transition:
                        color 0.2s ease,
                        border-color 0.2s ease,
                        background 0.2s ease;
                }

                .facility-directory__signout:hover {
                    color: #121214;
                    border-color: #9a9690;
                    background: #faf9f7;
                }

                .facility-directory__stats {
                    border: 1px solid #d4d0c8;
                    margin-bottom: 2.5rem;
                    background: #fff;
                }

                .stat-card {
                    padding: 1.35rem 1.5rem 1.25rem;
                }

                .stat-card--solo {
                    max-width: 280px;
                }

                .stat-card__label {
                    display: block;
                    font-size: 0.62rem;
                    letter-spacing: 0.18em;
                    text-transform: uppercase;
                    color: #7a766c;
                    margin-bottom: 0.65rem;
                }

                .stat-card__value {
                    margin: 0;
                    font-family: var(--font-fraunces), "Fraunces", Georgia, serif;
                    font-size: 2.75rem;
                    font-weight: 400;
                    font-variant-numeric: tabular-nums;
                    line-height: 1;
                    color: #121214;
                    letter-spacing: -0.03em;
                }

                .stat-card__delta {
                    display: block;
                    margin-top: 0.5rem;
                    font-size: 0.68rem;
                    color: #2d8a47;
                    letter-spacing: 0.04em;
                }

                .facility-directory__table-section {
                    border: 1px solid #d4d0c8;
                    background: #fff;
                }

                .facility-directory__table-head {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 1rem 1.25rem;
                    border-bottom: 1px solid #d4d0c8;
                    background: #faf9f7;
                }

                .facility-directory__table-title {
                    margin: 0;
                    font-family: var(--font-fraunces), "Fraunces", Georgia, serif;
                    font-size: 1.1rem;
                    font-weight: 500;
                    color: #121214;
                }

                .facility-directory__filter-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.45rem;
                    background: #fff;
                    border: 1px solid #c8c4bc;
                    color: #5a5650;
                    font-family: inherit;
                    font-size: 0.68rem;
                    letter-spacing: 0.14em;
                    text-transform: uppercase;
                    padding: 0.45rem 0.85rem;
                    cursor: pointer;
                    transition:
                        background 0.2s ease,
                        border-color 0.2s ease;
                }

                .facility-directory__filter-btn:hover {
                    background: #f0eeea;
                    border-color: #9a9690;
                }

                .facility-directory__filter-icon {
                    font-size: 0.85rem;
                    opacity: 0.7;
                }

                .facility-directory__filter-panel {
                    padding: 0.75rem 1.25rem;
                    border-bottom: 1px solid #d4d0c8;
                    background: #faf9f7;
                }

                .facility-directory__filter-input {
                    width: 100%;
                    background: #fff;
                    border: 1px solid #d4d0c8;
                    color: #1a1a1c;
                    font-family: inherit;
                    font-size: 0.75rem;
                    padding: 0.6rem 0.75rem;
                    outline: none;
                }

                .facility-directory__filter-input:focus {
                    border-color: #9a9690;
                }

                .facility-directory__error {
                    margin: 0;
                    padding: 0.75rem 1.25rem;
                    font-size: 0.72rem;
                    color: #9a3030;
                    border-bottom: 1px solid #e8c4c4;
                    background: #fdf5f5;
                }

                .facility-table__header,
                .facility-table__row {
                    display: grid;
                    grid-template-columns: minmax(200px, 1.4fr) minmax(160px, 1.2fr) 120px;
                    align-items: center;
                    gap: 1rem;
                }

                @media (max-width: 900px) {
                    .facility-table__header,
                    .facility-table__row {
                        grid-template-columns: 1fr;
                        gap: 0.35rem;
                    }
                    .facility-table__header {
                        display: none;
                    }
                }

                .facility-table__header {
                    padding: 0.65rem 1.25rem;
                    font-size: 0.6rem;
                    letter-spacing: 0.2em;
                    text-transform: uppercase;
                    color: #7a766c;
                    border-bottom: 1px solid #d4d0c8;
                    background: #f0eeea;
                }

                .facility-table__loading {
                    padding: 2rem 1.25rem;
                    margin: 0;
                    font-size: 0.72rem;
                    color: #7a766c;
                    letter-spacing: 0.08em;
                }

                .facility-table__row {
                    padding: 0;
                    border-bottom: 1px solid #e8e4dc;
                    animation: rowEnter 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
                    animation-delay: var(--row-delay, 0ms);
                }

                .facility-table__row:last-child {
                    border-bottom: none;
                }

                .facility-table__row:hover {
                    background: #f7f5f1;
                }

                .facility-table__facility {
                    padding: 0.85rem 1.25rem;
                }

                .facility-table__name-row {
                    display: flex;
                    align-items: baseline;
                    gap: 0.65rem;
                    flex-wrap: wrap;
                }

                .facility-table__name {
                    font-family: var(--font-fraunces), "Fraunces", Georgia, serif;
                    font-size: 0.95rem;
                    font-weight: 500;
                    color: #121214;
                }

                .facility-table__code {
                    font-size: 0.62rem;
                    letter-spacing: 0.14em;
                    color: #3a5a7a;
                    border: 1px solid #c8d4e0;
                    padding: 0.1rem 0.35rem;
                    background: #f4f8fc;
                }

                .facility-table__location,
                .facility-table__action {
                    padding: 0.85rem 0.5rem;
                    font-size: 0.72rem;
                    color: #5a5650;
                }

                @media (max-width: 900px) {
                    .facility-table__location,
                    .facility-table__action {
                        padding-left: 1.25rem;
                    }
                }

                .facility-table__location {
                    display: flex;
                    align-items: center;
                    gap: 0.4rem;
                }

                .facility-table__pin {
                    color: #9a9690;
                    font-size: 0.65rem;
                }

                .facility-table__action-btn {
                    background: #fff;
                    border: 1px solid #c8c4bc;
                    color: #1a3a5c;
                    font-family: inherit;
                    font-size: 0.65rem;
                    letter-spacing: 0.1em;
                    text-transform: uppercase;
                    padding: 0.4rem 0.65rem;
                    cursor: pointer;
                    transition:
                        background 0.18s ease,
                        border-color 0.18s ease,
                        color 0.18s ease,
                        transform 0.12s ease;
                }

                .facility-table__action-btn:hover:not(:disabled) {
                    background: #eef4fa;
                    border-color: #6a8aa8;
                    color: #0f2840;
                    transform: translateX(2px);
                }

                .facility-table__action-btn:disabled {
                    opacity: 0.45;
                    cursor: wait;
                }

                @keyframes rowEnter {
                    from {
                        opacity: 0;
                        transform: translateY(8px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @media (prefers-reduced-motion: reduce) {
                    .facility-table__row {
                        animation: none;
                    }
                    .facility-table__action-btn:hover:not(:disabled) {
                        transform: none;
                    }
                }
            `}</style>
        </div>
    );
}
