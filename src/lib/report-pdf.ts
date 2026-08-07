import jsPDF from "jspdf";
import { collectReportData } from "@/lib/report-metrics";
import type { ReportScalarRow, ReportTableSection } from "@/lib/report-metrics";
import type { ReportLogo } from "@/lib/report-logo";
import {
    chartDailyVolume,
    chartDepartmentHeatmap,
    chartMessageMix,
    chartPerformanceRadar,
    chartRankedMetric,
    chartStackedByColumns,
    type ChartImage,
} from "@/lib/report-charts";

type AnalyticsRow = Record<string, unknown>;

/* ═══════════════════════════════════════════════════════════════════════════
   Palette — restrained, print-first
   ═══════════════════════════════════════════════════════════════════════════ */
type RGB = [number, number, number];

const NAVY: RGB = [12, 24, 38];
const NAVY_DEEP: RGB = [8, 18, 28];
const TEAL_DEEP: RGB = [8, 42, 48];
const TEAL: RGB = [13, 148, 136];
const TEAL_SOFT: RGB = [45, 168, 158];
const INK: RGB = [22, 30, 42];
const MUTED: RGB = [100, 112, 128];
const FAINT: RGB = [148, 158, 170];
const RULE: RGB = [226, 232, 238];
const WASH: RGB = [248, 250, 252];
const WHITE: RGB = [255, 255, 255];

function formatGenerated(iso: string): string {
    try {
        return new Date(iso).toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
        });
    } catch {
        return iso;
    }
}

function formatPeriod(from: string, to: string): string {
    const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };
    try {
        const a = new Date(`${from}T12:00:00`);
        const b = new Date(`${to}T12:00:00`);
        if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return `${from} – ${to}`;
        return `${a.toLocaleDateString(undefined, opts)} – ${b.toLocaleDateString(undefined, opts)}`;
    } catch {
        return `${from} – ${to}`;
    }
}

function logoWidthFor(logo: ReportLogo, height: number): number {
    return (logo.width / logo.height) * height;
}

function drawGradientRect(
    doc: jsPDF,
    x: number,
    y: number,
    w: number,
    h: number,
    from: RGB,
    to: RGB,
    stepH = 1.5
) {
    const steps = Math.max(1, Math.ceil(h / stepH));
    for (let i = 0; i < steps; i++) {
        const t = i / Math.max(1, steps - 1);
        const r = Math.round(from[0] + (to[0] - from[0]) * t);
        const g = Math.round(from[1] + (to[1] - from[1]) * t);
        const b = Math.round(from[2] + (to[2] - from[2]) * t);
        const sy = y + i * stepH;
        const sh = Math.min(stepH, y + h - sy);
        if (sh <= 0) break;
        doc.setFillColor(r, g, b);
        doc.rect(x, sy, w, sh, "F");
    }
}

/** Diagonal-ish wash: left→right blend via vertical strips of horizontal gradients. */
function drawCoverAtmosphere(doc: jsPDF, pageW: number, pageH: number) {
    drawGradientRect(doc, 0, 0, pageW, pageH, NAVY, TEAL_DEEP, 1.5);
    // Soft bottom fade toward deeper navy
    drawGradientRect(doc, 0, pageH * 0.62, pageW, pageH * 0.38, TEAL_DEEP, NAVY_DEEP, 1.5);
    // Quiet left accent wash (narrow vertical gradient strip)
    const stripW = 6;
    drawGradientRect(doc, 0, 0, stripW, pageH, TEAL, TEAL_SOFT, 2);
}

function truncateToWidth(doc: jsPDF, text: string, maxW: number): string {
    if (doc.getTextWidth(text) <= maxW) return text;
    let t = text;
    while (t.length > 1 && doc.getTextWidth(t + "…") > maxW) t = t.slice(0, -1);
    return t + "…";
}

/* ═══════════════════════════════════════════════════════════════════════════
   Content page header — quiet, not a dashboard bar
   ═══════════════════════════════════════════════════════════════════════════ */
function drawPageChrome(
    doc: jsPDF,
    pageW: number,
    margin: number,
    facilityName?: string,
    logo?: ReportLogo | null
) {
    drawGradientRect(doc, 0, 0, pageW, 2.5, TEAL, TEAL_SOFT, 0.5);

    let textX = margin;
    if (logo) {
        const h = 11;
        const w = logoWidthFor(logo, h);
        doc.addImage(logo.dataUrl, "PNG", margin, 14, w, h);
        textX = margin + w + 10;
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...FAINT);
    doc.text("Helix Analytics", textX, 22);

    if (facilityName) {
        doc.setTextColor(...MUTED);
        doc.text(truncateToWidth(doc, facilityName, 220), pageW - margin, 22, { align: "right" });
    }

    doc.setDrawColor(...RULE);
    doc.setLineWidth(0.4);
    doc.line(margin, 34, pageW - margin, 34);
}

/* ═══════════════════════════════════════════════════════════════════════════
   Cover — gradient kept, ornament removed
   ═══════════════════════════════════════════════════════════════════════════ */
function drawCoverPage(
    doc: jsPDF,
    pageW: number,
    pageH: number,
    margin: number,
    meta: {
        dateFrom: string;
        dateTo: string;
        generatedAtIso: string;
        facilityName: string;
        logo: ReportLogo | null;
    }
) {
    drawCoverAtmosphere(doc, pageW, pageH);

    const left = margin + 8;
    let y = 96;

    if (meta.logo) {
        const h = 26;
        const w = logoWidthFor(meta.logo, h);
        doc.addImage(meta.logo.dataUrl, "PNG", left, y, w, h);
        y += h + 36;
    } else {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(...TEAL_SOFT);
        doc.text("HELIX", left, y);
        y += 36;
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(...TEAL_SOFT);
    doc.text("Analytics report", left, y);

    y += 36;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(36);
    doc.setTextColor(...WHITE);
    const facilityTitle = meta.facilityName?.trim() || "Facility overview";
    const titleLines = doc.splitTextToSize(facilityTitle, pageW - left - margin);
    doc.text(titleLines, left, y);
    y += titleLines.length * 40 + 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(180, 210, 210);
    doc.text("Usage, response, and operational performance", left, y);

    // Thin gradient rule under title block
    y += 28;
    drawGradientRect(doc, left, y, Math.min(160, pageW - left - margin), 2, TEAL, TEAL_SOFT, 0.5);

    // Meta block — typography only, no frosted card / pills
    const metaY = pageH - 150;
    const period = formatPeriod(meta.dateFrom, meta.dateTo);
    const generated = formatGenerated(meta.generatedAtIso);

    const fields: { label: string; value: string }[] = [
        { label: "Period", value: period },
        { label: "Generated", value: generated },
    ];
    if (meta.facilityName) {
        fields.unshift({ label: "Facility", value: meta.facilityName });
    }

    const colW = (pageW - left - margin) / fields.length;
    fields.forEach((f, i) => {
        const x = left + i * colW;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(...TEAL_SOFT);
        doc.text(f.label.toUpperCase(), x, metaY);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.setTextColor(...WHITE);
        doc.text(truncateToWidth(doc, f.value, colW - 16), x, metaY + 18);
    });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(120, 145, 155);
    doc.text("Confidential — for authorized recipients only", left, pageH - 36);
}

/* ═══════════════════════════════════════════════════════════════════════════
   Section title — editorial, not a banner
   ═══════════════════════════════════════════════════════════════════════════ */
function drawSectionTitle(
    doc: jsPDF,
    title: string,
    y: number,
    margin: number,
    contentW: number,
    index?: number
): number {
    const label = index != null ? String(index).padStart(2, "0") : null;

    if (label) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(...TEAL);
        doc.text(label, margin, y + 2);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.setTextColor(...INK);
        doc.text(title, margin + 28, y + 2);
    } else {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.setTextColor(...INK);
        doc.text(title, margin, y + 2);
    }

    const ruleY = y + 12;
    drawGradientRect(doc, margin, ruleY, 36, 1.5, TEAL, TEAL_SOFT, 0.5);
    doc.setDrawColor(...RULE);
    doc.setLineWidth(0.4);
    doc.line(margin + 42, ruleY + 0.5, margin + contentW, ruleY + 0.5);

    return y + 28;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Summary metrics — clean columns, no card grid
   ═══════════════════════════════════════════════════════════════════════════ */
function drawSummaryMetrics(
    doc: jsPDF,
    rows: ReportScalarRow[],
    startY: number,
    margin: number,
    contentW: number,
    pageH: number,
    footerReserve: number
): number {
    if (rows.length === 0) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(9);
        doc.setTextColor(...MUTED);
        doc.text("No summary metrics were included.", margin, startY);
        return startY + 22;
    }

    const groups = new Map<string, ReportScalarRow[]>();
    for (const row of rows) {
        if (!groups.has(row.group)) groups.set(row.group, []);
        groups.get(row.group)!.push(row);
    }

    let y = startY;
    const cols = 3;
    const gap = 18;
    const colW = (contentW - gap * (cols - 1)) / cols;
    const rowH = 44;

    const ensureSpace = (needed: number) => {
        if (y + needed > pageH - footerReserve) {
            doc.addPage();
            y = margin + 42;
        }
    };

    for (const [groupName, items] of groups) {
        const groupRows = Math.ceil(items.length / cols);
        ensureSpace(22 + groupRows * rowH + 16);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(...TEAL);
        doc.text(groupName.toUpperCase(), margin, y);
        y += 14;

        // Soft wash behind the group
        const blockH = groupRows * rowH + 4;
        doc.setFillColor(...WASH);
        doc.rect(margin, y - 4, contentW, blockH, "F");

        for (let i = 0; i < items.length; i++) {
            const c = i % cols;
            const r = Math.floor(i / cols);
            const cx = margin + c * (colW + gap);
            const cy = y + r * rowH;

            if (c === 0 && r > 0) {
                doc.setDrawColor(...RULE);
                doc.setLineWidth(0.35);
                doc.line(margin + 8, cy - 2, margin + contentW - 8, cy - 2);
            }

            doc.setFont("helvetica", "normal");
            doc.setFontSize(7.5);
            doc.setTextColor(...MUTED);
            doc.text(truncateToWidth(doc, items[i].label, colW - 8), cx + 10, cy + 14);

            doc.setFont("helvetica", "bold");
            doc.setFontSize(15);
            doc.setTextColor(...INK);
            doc.text(items[i].value || "—", cx + 10, cy + 32);
        }

        y += blockH + 18;
    }

    return y;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Footer
   ═══════════════════════════════════════════════════════════════════════════ */
function drawFooter(
    doc: jsPDF,
    pageW: number,
    pageH: number,
    margin: number,
    pageNum: number,
    totalPages: number,
    facilityName: string
) {
    if (pageNum === 1) return; // cover stays clean

    doc.setDrawColor(...RULE);
    doc.setLineWidth(0.4);
    doc.line(margin, pageH - 40, pageW - margin, pageH - 40);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...FAINT);
    const left = facilityName ? `Helix  ·  ${facilityName}` : "Helix Analytics";
    doc.text(truncateToWidth(doc, left, pageW * 0.55), margin, pageH - 24);

    doc.setTextColor(...MUTED);
    doc.text(`${pageNum - 1} / ${totalPages - 1}`, pageW - margin, pageH - 24, { align: "right" });
}

/* ═══════════════════════════════════════════════════════════════════════════
   Main export
   ═══════════════════════════════════════════════════════════════════════════ */

/** Build a premium styled PDF report (browser / client only). */
export function buildAnalyticsReportPdfBlob(
    data: AnalyticsRow,
    selected: Record<string, boolean>,
    meta: {
        dateFrom: string;
        dateTo: string;
        generatedAtIso: string;
        facilityName?: string;
        logo?: ReportLogo | null;
    }
): Blob {
    const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });
    const pageH = doc.internal.pageSize.getHeight();
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 48;
    const contentW = pageW - margin * 2;
    const footerReserve = 56;
    const facilityName = meta.facilityName?.trim() || "";
    const logo = meta.logo ?? null;

    drawCoverPage(doc, pageW, pageH, margin, {
        dateFrom: meta.dateFrom,
        dateTo: meta.dateTo,
        generatedAtIso: meta.generatedAtIso,
        facilityName,
        logo,
    });

    doc.addPage();
    let y = margin + 42;
    let sectionIndex = 1;

    const collected = collectReportData(data, selected);

    const ensureSpace = (needed: number) => {
        if (y + needed > pageH - footerReserve) {
            doc.addPage();
            y = margin + 42;
        }
    };

    const addChart = (title: string, chart: ChartImage | null, emptyHint = "No data for this period.") => {
        ensureSpace(72);
        y = drawSectionTitle(doc, title, y, margin, contentW, sectionIndex++);

        if (!chart) {
            doc.setFont("helvetica", "italic");
            doc.setFontSize(9);
            doc.setTextColor(...MUTED);
            doc.text(emptyHint, margin, y);
            y += 28;
            return;
        }

        const imgW = contentW;
        const imgH = (chart.height / chart.width) * imgW;
        ensureSpace(imgH + 20);
        doc.addImage(chart.dataUrl, "PNG", margin, y, imgW, imgH);
        y += imgH + 28;
    };

    const sectionOrNull = (s: ReportTableSection | null) => (s && s.body.length > 0 ? s : null);

    // Summary
    ensureSpace(60);
    y = drawSectionTitle(doc, "Key metrics", y, margin, contentW, sectionIndex++);
    y = drawSummaryMetrics(doc, collected.scalarRows, y, margin, contentW, pageH, footerReserve);
    y += 8;

    const hasMessagingScalars = collected.scalarRows.some(
        (r) => r.group === "Messaging" || r.group === "Escalation"
    );
    const hasStaffScalars = collected.scalarRows.some(
        (r) => r.group === "Staff & activity" || r.group === "Roles" || r.group === "Response times"
    );
    if (hasMessagingScalars) addChart("Message mix", chartMessageMix(data));
    if (hasMessagingScalars || hasStaffScalars) addChart("Performance profile", chartPerformanceRadar(data));

    if (collected.daily) {
        const s = sectionOrNull(collected.daily);
        addChart("Daily message volume", s ? chartDailyVolume(s.head, s.body) : null);
    }

    if (collected.departments) {
        const s = sectionOrNull(collected.departments);
        addChart("Department metric heatmap", s ? chartDepartmentHeatmap(s.head, s.body) : null);
        addChart(
            "Department escalation rate",
            s
                ? chartRankedMetric(
                      s.head,
                      s.body,
                      "department_name",
                      "escalation_rate_vs_dept_critical_messages_percent",
                      { valueSuffix: "%", maxItems: 10, style: "lollipop", color: "#EF4444" }
                  )
                : null
        );
        addChart(
            "Department role fill rate",
            s
                ? chartRankedMetric(s.head, s.body, "department_name", "role_fill_rate_percent", {
                      valueSuffix: "%",
                      maxItems: 10,
                      style: "bars",
                      colorFrom: "#5EEAD4",
                      colorTo: "#0F766E",
                  })
                : null
        );
    }

    if (collected.topEscalated) {
        const s = sectionOrNull(collected.topEscalated);
        addChart(
            "Top escalated roles",
            s
                ? chartRankedMetric(s.head, s.body, "role_name", "escalation_count", {
                      maxItems: 10,
                      style: "lollipop",
                      color: "#EF4444",
                  })
                : null
        );
    }
    if (collected.leastEscalated) {
        const s = sectionOrNull(collected.leastEscalated);
        addChart(
            "Least escalated roles",
            s
                ? chartRankedMetric(s.head, s.body, "role_name", "escalation_count", {
                      maxItems: 10,
                      sortDesc: false,
                      style: "lollipop",
                      color: "#3B82F6",
                  })
                : null
        );
    }

    if (collected.roleMetrics) {
        const s = sectionOrNull(collected.roleMetrics);
        addChart(
            "Top roles by message volume",
            s
                ? chartRankedMetric(s.head, s.body, "role_name", "total_messages", {
                      maxItems: 12,
                      style: "bars",
                      colorFrom: "#99F6E4",
                      colorTo: "#0D9488",
                  })
                : null
        );
    }

    const callStack = [
        { key: "answered_calls", name: "Answered", color: "#0D9488" },
        { key: "unanswered_calls", name: "Unanswered", color: "#EF4444" },
    ];
    if (collected.callByRole) {
        const s = sectionOrNull(collected.callByRole);
        addChart(
            "Outbound calls by role",
            s ? chartStackedByColumns(s.head, s.body, "role_name", callStack, 8, "grouped") : null
        );
    }
    if (collected.callByDept) {
        const s = sectionOrNull(collected.callByDept);
        addChart(
            "Outbound calls by department",
            s ? chartStackedByColumns(s.head, s.body, "department_name", callStack, 8, "grouped") : null
        );
    }

    const transferStack = [
        { key: "outbound_transfer_requests", name: "Outbound", color: "#0D9488" },
        { key: "inbound_transfer_requests", name: "Inbound", color: "#3B82F6" },
    ];
    if (collected.transferByCounterparty) {
        const s = sectionOrNull(collected.transferByCounterparty);
        addChart(
            "Transfers by counterparty facility",
            s ? chartStackedByColumns(s.head, s.body, "counterparty_facility_name", transferStack, 10) : null
        );
    }
    if (collected.transferByRole) {
        const s = sectionOrNull(collected.transferByRole);
        addChart(
            "Transfers by role",
            s ? chartStackedByColumns(s.head, s.body, "role_name", transferStack, 10) : null
        );
    }

    const total = doc.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
        doc.setPage(i);
        if (i > 1) {
            drawPageChrome(doc, pageW, margin, facilityName || undefined, logo);
        }
        drawFooter(doc, pageW, pageH, margin, i, total, facilityName);
    }

    return doc.output("blob");
}
