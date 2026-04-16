"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import CalendarRangePicker from "@/components/CalendarRangePicker";
import { REPORT_METRICS, defaultMetricSelection, type ReportMetricDef } from "@/lib/report-metrics";
import { appendUsageMetricsRange } from "@/lib/usage-metrics-range";

const METRIC_TOTAL = REPORT_METRICS.length;

/** Stable category order for scanning (matches product groups + window/tables). */
const GROUP_ORDER: string[] = [
    "Staff & activity",
    "Messaging",
    "Escalation",
    "Roles",
    "Response times",
    "Scheduling",
    "Window",
    "Tables",
];

type GenerateReportModalProps = {
    open: boolean;
    onClose: () => void;
    defaultDateFrom: string;
    defaultDateTo: string;
};

function isValidRange(from: string, to: string): boolean {
    if (!from || !to) return false;
    const fromMs = new Date(`${from}T00:00:00`).getTime();
    const toMs = new Date(`${to}T00:00:00`).getTime();
    if (Number.isNaN(fromMs) || Number.isNaN(toMs)) return false;
    return fromMs <= toMs;
}

function sortGroups(entries: [string, ReportMetricDef[]][]): [string, ReportMetricDef[]][] {
    const rank = (name: string) => {
        const i = GROUP_ORDER.indexOf(name);
        return i === -1 ? GROUP_ORDER.length + 1 : i;
    };
    return [...entries].sort((a, b) => rank(a[0]) - rank(b[0]));
}

export default function GenerateReportModal({ open, onClose, defaultDateFrom, defaultDateTo }: GenerateReportModalProps) {
    const [dateFrom, setDateFrom] = useState(defaultDateFrom);
    const [dateTo, setDateTo] = useState(defaultDateTo);
    const [selected, setSelected] = useState<Record<string, boolean>>(() => defaultMetricSelection());
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!open) return;
        if (defaultDateFrom && defaultDateTo) {
            setDateFrom(defaultDateFrom);
            setDateTo(defaultDateTo);
        } else {
            const end = new Date();
            const start = new Date();
            start.setDate(end.getDate() - 30);
            setDateFrom(start.toISOString().split("T")[0]);
            setDateTo(end.toISOString().split("T")[0]);
        }
        setSelected(defaultMetricSelection());
        setError("");
    }, [open, defaultDateFrom, defaultDateTo]);

    const groups = useMemo(() => {
        const g = new Map<string, typeof REPORT_METRICS>();
        for (const m of REPORT_METRICS) {
            if (!g.has(m.group)) g.set(m.group, []);
            g.get(m.group)!.push(m);
        }
        return sortGroups(Array.from(g.entries()));
    }, []);

    const anySelected = useMemo(() => REPORT_METRICS.some((m) => selected[m.id]), [selected]);
    const selectedCount = useMemo(() => REPORT_METRICS.filter((m) => selected[m.id]).length, [selected]);

    const toggle = useCallback((id: string) => {
        setSelected((s) => ({ ...s, [id]: !s[id] }));
    }, []);

    const selectAll = useCallback(() => {
        setSelected(defaultMetricSelection());
    }, []);

    const clearAll = useCallback(() => {
        const cleared: Record<string, boolean> = {};
        for (const m of REPORT_METRICS) cleared[m.id] = false;
        setSelected(cleared);
    }, []);

    const handleGenerate = async () => {
        setError("");
        if (!isValidRange(dateFrom, dateTo)) {
            setError("Choose a valid date range (from before or equal to to).");
            return;
        }
        if (!anySelected) {
            setError("Select at least one metric to include.");
            return;
        }
        setBusy(true);
        try {
            const qs = new URLSearchParams();
            appendUsageMetricsRange(qs, dateFrom, dateTo);
            const res = await fetch(`/api/proxy/analytics?${qs.toString()}`);
            const payload = await res.json();
            if (!res.ok) {
                const msg = typeof payload?.error === "string" ? payload.error : "Failed to load analytics for this range.";
                throw new Error(msg);
            }
            const { buildAnalyticsReportPdfBlob } = await import("@/lib/report-pdf");
            const blob = buildAnalyticsReportPdfBlob(payload as Record<string, unknown>, selected, {
                dateFrom,
                dateTo,
                generatedAtIso: new Date().toISOString(),
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `helix-analytics-report_${dateFrom}_to_${dateTo}.pdf`;
            a.rel = "noopener";
            a.click();
            URL.revokeObjectURL(url);
            onClose();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Something went wrong.");
        } finally {
            setBusy(false);
        }
    };

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/35 p-5 sm:p-8 backdrop-blur-[2px]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-modal-title"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div
                data-generate-report-modal
                className="flex max-h-[min(92vh,900px)] min-h-0 w-full max-w-[min(920px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-[0_24px_64px_rgba(15,23,42,0.14)]"
                style={{
                    padding: "clamp(1.5rem, 4vw, 2.75rem) clamp(1.25rem, 4.5vw, 3rem)",
                }}
                onMouseDown={(e) => e.stopPropagation()}
            >
                {/* Fixed header */}
                <header className="shrink-0 border-b border-slate-100 pb-7">
                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                                <h2 id="report-modal-title" className="text-xl font-semibold tracking-tight text-slate-900">
                                    Generate report
                                </h2>
                                <span
                                    className={clsx(
                                        "inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-semibold tabular-nums",
                                        selectedCount === METRIC_TOTAL
                                            ? "border-indigo-200 bg-indigo-50 text-indigo-800"
                                            : "border-slate-200 bg-slate-50 text-slate-700",
                                    )}
                                >
                                    {selectedCount} / {METRIC_TOTAL} selected
                                </span>
                            </div>
                            <p className="mt-2 max-w-[46ch] text-sm leading-relaxed text-slate-600">
                                Choose a date range and which metrics to include in your PDF export.
                            </p>
                            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-slate-500">
                                <button
                                    type="button"
                                    onClick={selectAll}
                                    className="text-indigo-600 underline-offset-2 hover:text-indigo-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded-sm"
                                >
                                    Select all
                                </button>
                                <span className="text-slate-300" aria-hidden>
                                    |
                                </span>
                                <button
                                    type="button"
                                    onClick={clearAll}
                                    className="text-indigo-600 underline-offset-2 hover:text-indigo-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded-sm"
                                >
                                    Clear all
                                </button>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                            aria-label="Close dialog"
                        >
                            <span className="text-xl leading-none" aria-hidden>
                                ×
                            </span>
                        </button>
                    </div>
                </header>

                {/* Date range — prominent pill */}
                <section className="shrink-0 mt-6 rounded-xl border border-slate-200 bg-slate-50/95 px-5 py-6 sm:px-7 sm:py-7">
                    <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Date range</p>
                    <CalendarRangePicker
                        layout="block"
                        presentation="modalPill"
                        from={dateFrom}
                        to={dateTo}
                        onChange={(from, to) => {
                            setDateFrom(from);
                            setDateTo(to);
                        }}
                    />
                </section>

                {/* Scrollable metrics only */}
                <div
                    className="mt-8 min-h-0 flex-1 overflow-y-auto overscroll-contain pb-2"
                    style={{ maxHeight: "min(54vh, 520px)" }}
                >
                    <div className="mb-6 space-y-1">
                        <h3 className="text-sm font-semibold text-slate-900 sm:text-[15px]">Metrics by category</h3>
                        <p className="text-xs leading-relaxed text-slate-500">
                            <span className="font-medium text-slate-600">Included</span> rows show a filled check and indigo highlight;{" "}
                            <span className="font-medium text-slate-600">excluded</span> rows stay neutral with an empty box.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 gap-7 md:grid-cols-2 md:gap-8 lg:gap-10">
                        {groups.map(([groupName, metrics]) => (
                            <article
                                key={groupName}
                                className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                            >
                                <div className="border-b border-slate-100 bg-slate-100/90 px-5 py-3.5 sm:px-6 sm:py-4">
                                    <h4 className="text-[13px] font-bold text-slate-800 sm:text-sm">{groupName}</h4>
                                </div>
                                <div className="flex flex-col gap-3 p-5 sm:p-6 md:gap-3.5">
                                    {metrics.map((m) => {
                                        const on = !!selected[m.id];
                                        return (
                                            <label
                                                key={m.id}
                                                className={clsx(
                                                    "group relative flex min-h-[3rem] w-full min-w-0 cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-[border-color,background-color,box-shadow] sm:min-h-[3.25rem] sm:gap-3.5 sm:px-5 sm:py-3.5",
                                                    "has-focus-visible:z-10 has-focus-visible:ring-2 has-focus-visible:ring-indigo-500 has-focus-visible:ring-offset-2",
                                                    on
                                                        ? "border-indigo-400 bg-indigo-50/95 shadow-[0_0_0_1px_rgba(99,102,241,0.12)]"
                                                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80",
                                                )}
                                            >
                                                <input
                                                    type="checkbox"
                                                    className="peer sr-only"
                                                    checked={on}
                                                    onChange={() => toggle(m.id)}
                                                />
                                                <span
                                                    className={clsx(
                                                        "flex size-[1.125rem] shrink-0 items-center justify-center rounded-[4px] border-2 transition-colors sm:size-5",
                                                        on ? "border-indigo-600 bg-indigo-600" : "border-slate-300 bg-white",
                                                    )}
                                                    aria-hidden
                                                >
                                                    <span
                                                        className={clsx(
                                                            "material-icons-round text-[14px] leading-none sm:text-[16px]",
                                                            on ? "text-white" : "text-indigo-600 opacity-0",
                                                        )}
                                                    >
                                                        check
                                                    </span>
                                                </span>
                                                <span
                                                    className={clsx(
                                                        "min-w-0 flex-1 text-left text-[13px] leading-snug sm:text-sm",
                                                        on ? "font-semibold text-indigo-950" : "font-medium text-slate-600",
                                                    )}
                                                >
                                                    {m.label}
                                                </span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </article>
                        ))}
                    </div>
                </div>

                {error && (
                    <div className="mt-6 shrink-0 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800" role="alert">
                        {error}
                    </div>
                )}

                {/* Sticky footer — always visible */}
                <footer className="mt-8 flex shrink-0 flex-wrap items-center justify-end gap-4 rounded-xl border border-slate-200 bg-slate-50/90 px-5 py-5 sm:px-6 sm:py-6">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={busy}
                        className="rounded-lg border border-transparent px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-white hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        disabled={busy || !anySelected}
                        onClick={handleGenerate}
                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-45"
                    >
                        <span className="material-icons-round text-[18px] leading-none" aria-hidden>
                            download
                        </span>
                        {busy ? "Generating…" : "Download PDF"}
                    </button>
                </footer>
            </div>
        </div>
    );
}
