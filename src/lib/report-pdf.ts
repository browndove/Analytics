import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { collectReportData, humanizeReportHeader } from "@/lib/report-metrics";
import type { ReportScalarRow } from "@/lib/report-metrics";
import type { ReportLogo } from "@/lib/report-logo";

type AnalyticsRow = Record<string, unknown>;

/* ═══════════════════════════════════════════════════════════════════════════
   Color palette — curated premium tones
   ═══════════════════════════════════════════════════════════════════════════ */
type RGB = [number, number, number];

const BRAND: RGB = [15, 23, 42]; // slate-900
const BRAND_MID: RGB = [30, 41, 59]; // slate-800
const ACCENT: RGB = [13, 148, 136]; // teal-600
const ACCENT_LIGHT: RGB = [20, 184, 166]; // teal-500
const ACCENT_PALE: RGB = [204, 251, 241]; // teal-100
const INK: RGB = [30, 41, 59]; // body text
const MUTED: RGB = [100, 116, 139]; // secondary text
const LINE: RGB = [226, 232, 240]; // border
const PANEL: RGB = [248, 250, 252]; // subtle bg
const WHITE: RGB = [255, 255, 255];
const STRIPE: RGB = [243, 248, 250]; // teal-tinted stripe
const HEADER_GRADIENT_END: RGB = [20, 50, 70]; // navy→teal blend for table heads

/* ═══════════════════════════════════════════════════════════════════════════
   Utilities
   ═══════════════════════════════════════════════════════════════════════════ */

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

type DocWithAutoTable = jsPDF & { lastAutoTable?: { finalY: number } };

function lastTableBottom(doc: jsPDF, fallbackY: number): number {
    const d = doc as DocWithAutoTable;
    return d.lastAutoTable?.finalY ?? fallbackY;
}

function humanizeHead(head: string[]): string[] {
    return head.map(humanizeReportHeader);
}

/**
 * UUID columns are unreadable in print and force the tiny fonts / page splits.
 * They stay in the CSV export, where they are actually useful for joins.
 */
const HIDDEN_PDF_COLUMNS = new Set([
    "department_id",
    "department_group_key",
    "role_id",
    "facility_id",
    "counterparty_facility_id",
]);

function isNumericCell(v: string): boolean {
    return v !== "" && /^-?[\d,]+(\.\d+)?%?$/.test(v);
}

/** Logo width for a target height, preserving the source aspect ratio. */
function logoWidthFor(logo: ReportLogo, height: number): number {
    return (logo.width / logo.height) * height;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Simulated gradient — draws thin horizontal strips between two colors.
   jsPDF has no native gradient fill, so we approximate with 2pt-high rects.
   ═══════════════════════════════════════════════════════════════════════════ */
function drawGradientRect(
    doc: jsPDF,
    x: number,
    y: number,
    w: number,
    h: number,
    from: RGB,
    to: RGB,
    stepH = 2
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

/* ═══════════════════════════════════════════════════════════════════════════
   Page chrome — header band drawn on every page after the cover
   ═══════════════════════════════════════════════════════════════════════════ */
function drawPageChrome(
    doc: jsPDF,
    pageW: number,
    margin: number,
    facilityName?: string,
    logo?: ReportLogo | null
) {
    // Thin gradient accent line at the very top
    drawGradientRect(doc, 0, 0, pageW, 3, ACCENT, ACCENT_LIGHT, 1);

    // Subtle brand strip below
    doc.setFillColor(...BRAND);
    doc.rect(0, 3, pageW, 18, "F");

    let textX = margin;
    if (logo) {
        const h = 9;
        const w = logoWidthFor(logo, h);
        doc.setFillColor(...WHITE);
        doc.roundedRect(margin - 2, 6, w + 4, h + 4, 2, 2, "F");
        doc.addImage(logo.dataUrl, "PNG", margin, 8, w, h);
        textX = margin + w + 8;
    }

    doc.setTextColor(148, 163, 184);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text("Helix Analytics Report", textX, 14);
    if (facilityName) {
        doc.setTextColor(226, 232, 240);
        doc.setFontSize(7);
        doc.text(facilityName, pageW - margin, 14, { align: "right" });
    }
}

/* ═══════════════════════════════════════════════════════════════════════════
   Cover page
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
    // Full-page gradient background: deep navy → dark teal
    drawGradientRect(doc, 0, 0, pageW, pageH, BRAND, [10, 50, 55], 2);

    // Accent gradient strip across the bottom third
    drawGradientRect(doc, 0, pageH * 0.72, pageW, pageH * 0.28, [10, 50, 55], [8, 38, 44], 2);

    // ── Decorative geometric shapes ───────────────────────────────
    // Large circle (top-right) — very low opacity via a dark tint
    doc.setFillColor(25, 45, 65);
    doc.circle(pageW - 60, 90, 120, "F");

    // Smaller circle (bottom-left)
    doc.setFillColor(18, 55, 58);
    doc.circle(60, pageH - 120, 80, "F");

    // Thin accent line (horizontal separator)
    doc.setFillColor(...ACCENT);
    doc.rect(margin, pageH * 0.45, pageW - margin * 2, 1.5, "F");

    // ── Branding ──────────────────────────────────────────────────
    let brandY = 180;
    if (meta.logo) {
        const h = 22;
        const w = logoWidthFor(meta.logo, h);
        // Frosted chip behind logo
        doc.setFillColor(255, 255, 255);
        doc.setGState(doc.GState({ opacity: 0.15 }));
        doc.roundedRect(margin - 6, brandY - 6, w + 12, h + 12, 4, 4, "F");
        doc.setGState(doc.GState({ opacity: 1 }));
        doc.addImage(meta.logo.dataUrl, "PNG", margin, brandY, w, h);
        brandY += h + 28;
    }

    // "HELIX" wordmark
    doc.setTextColor(...WHITE);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text("H E L I X", margin, brandY);

    // ── Title ─────────────────────────────────────────────────────
    const titleY = brandY + 50;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(34);
    doc.setTextColor(...WHITE);
    doc.text("Analytics Report", margin, titleY);

    // Subtitle
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(...ACCENT_PALE);
    doc.text("Facility usage & performance overview", margin, titleY + 26);

    // ── Metadata card (frosted glass style) ───────────────────────
    const cardY = titleY + 60;
    const cardH = meta.facilityName ? 90 : 70;
    const cardW = pageW - margin * 2;

    // Semi-transparent white background
    doc.setFillColor(255, 255, 255);
    doc.setGState(doc.GState({ opacity: 0.1 }));
    doc.roundedRect(margin, cardY, cardW, cardH, 8, 8, "F");
    doc.setGState(doc.GState({ opacity: 1 }));

    // Card border (subtle)
    doc.setDrawColor(255, 255, 255);
    doc.setGState(doc.GState({ "stroke-opacity": 0.2 }));
    doc.setLineWidth(0.6);
    doc.roundedRect(margin, cardY, cardW, cardH, 8, 8, "S");
    doc.setGState(doc.GState({ "stroke-opacity": 1 }));

    // Card content
    const colCount = meta.facilityName ? 3 : 2;
    const colW = cardW / colCount;
    let col = 0;

    const drawCardField = (label: string, value: string, idx: number) => {
        const cx = margin + colW * idx + 20;
        if (idx > 0) {
            doc.setDrawColor(255, 255, 255);
            doc.setGState(doc.GState({ "stroke-opacity": 0.15 }));
            doc.setLineWidth(0.5);
            doc.line(margin + colW * idx, cardY + 16, margin + colW * idx, cardY + cardH - 16);
            doc.setGState(doc.GState({ "stroke-opacity": 1 }));
        }
        doc.setTextColor(...ACCENT_LIGHT);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text(label.toUpperCase(), cx, cardY + 28);
        doc.setTextColor(...WHITE);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        // Truncate long values
        const maxW = colW - 40;
        let display = value;
        if (doc.getTextWidth(display) > maxW) {
            display = display.slice(0, Math.max(10, Math.floor(display.length * (maxW / doc.getTextWidth(display))))) + "…";
        }
        doc.text(display, cx, cardY + 44);
    };

    if (meta.facilityName) {
        drawCardField("Facility", meta.facilityName, col++);
    }
    drawCardField("Generated", formatGenerated(meta.generatedAtIso), col++);
    drawCardField("Reporting Period", formatPeriod(meta.dateFrom, meta.dateTo), col);

    // ── Period badge (bottom-right of cover) ─────────────────────
    const badgeY = pageH - 90;
    const periodLabel = formatPeriod(meta.dateFrom, meta.dateTo);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    const periodW = doc.getTextWidth(periodLabel) + 28;
    doc.setFillColor(...ACCENT);
    doc.roundedRect(pageW - margin - periodW, badgeY, periodW, 28, 6, 6, "F");
    doc.setTextColor(...WHITE);
    doc.text(periodLabel, pageW - margin - periodW + 14, badgeY + 17);

    // Confidential notice
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(100, 130, 150);
    doc.text("CONFIDENTIAL — For authorized recipients only", margin, pageH - 30);
}

/* ═══════════════════════════════════════════════════════════════════════════
   Summary metrics — card grid grouped by category
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

    // Group rows by category
    const groups = new Map<string, ReportScalarRow[]>();
    for (const row of rows) {
        if (!groups.has(row.group)) groups.set(row.group, []);
        groups.get(row.group)!.push(row);
    }

    let y = startY;
    const cols = 3;
    const gap = 10;
    const cardW = (contentW - gap * (cols - 1)) / cols;
    const cardH = 52;
    const cardPadX = 12;

    const ensureSpace = (needed: number) => {
        if (y + needed > pageH - footerReserve) {
            doc.addPage();
            y = margin + 28;
        }
    };

    for (const [groupName, items] of groups) {
        // Calculate how much space this group needs
        const groupRows = Math.ceil(items.length / cols);
        const groupHeight = 24 + groupRows * (cardH + gap) + 10;
        ensureSpace(groupHeight);

        // Group label
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(...ACCENT);
        doc.text(groupName.toUpperCase(), margin, y + 4);
        doc.setDrawColor(...LINE);
        doc.setLineWidth(0.4);
        const labelW = doc.getTextWidth(groupName.toUpperCase());
        doc.line(margin + labelW + 8, y + 1, margin + contentW, y + 1);
        y += 18;

        // Metric cards
        for (let i = 0; i < items.length; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);

            if (col === 0 && row > 0) {
                y += cardH + gap;
            }
            if (col === 0) {
                ensureSpace(cardH + gap);
            }

            const cx = margin + col * (cardW + gap);
            const cy = y;

            // Card background
            doc.setFillColor(...PANEL);
            doc.roundedRect(cx, cy, cardW, cardH, 5, 5, "F");
            // Card border
            doc.setDrawColor(...LINE);
            doc.setLineWidth(0.5);
            doc.roundedRect(cx, cy, cardW, cardH, 5, 5, "S");
            // Label
            doc.setFont("helvetica", "normal");
            doc.setFontSize(7);
            doc.setTextColor(...MUTED);
            const maxLabelW = cardW - cardPadX * 2 - 8;
            let labelText = items[i].label;
            if (doc.getTextWidth(labelText) > maxLabelW) {
                while (doc.getTextWidth(labelText + "…") > maxLabelW && labelText.length > 5) {
                    labelText = labelText.slice(0, -1);
                }
                labelText += "…";
            }
            doc.text(labelText, cx + cardPadX + 6, cy + 18);

            // Value
            doc.setFont("helvetica", "bold");
            doc.setFontSize(14);
            doc.setTextColor(...INK);
            const val = items[i].value || "—";
            doc.text(val, cx + cardPadX + 6, cy + 37);
        }
        y += cardH + gap + 6;
    }

    return y;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Section header — gradient banner with pill badge
   ═══════════════════════════════════════════════════════════════════════════ */
function drawSectionBanner(
    doc: jsPDF,
    title: string,
    y: number,
    margin: number,
    contentW: number,
    rowCount?: number
): number {
    const bannerH = 28;
    const r = 6;

    // Solid rounded banner (clean, no corner artifacts)
    doc.setFillColor(...BRAND);
    doc.roundedRect(margin, y, contentW, bannerH, r, r, "F");

    // Accent strip on the left edge of the banner
    doc.setFillColor(...ACCENT);
    doc.roundedRect(margin, y, 4, bannerH, r, r, "F");
    // Fill the right side of the accent strip flush
    doc.rect(margin + 3, y, 3, bannerH, "F");

    // Title text
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...WHITE);
    doc.text(title, margin + 16, y + 17);

    // Row count badge
    if (rowCount != null && rowCount > 0) {
        const countLabel = `${rowCount} ${rowCount === 1 ? "row" : "rows"}`;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        const badgeW = doc.getTextWidth(countLabel) + 14;
        const badgeX = margin + contentW - badgeW - 10;
        const badgeY = y + 7;
        // Subtle lighter pill against the dark banner
        doc.setFillColor(...BRAND_MID);
        doc.roundedRect(badgeX, badgeY, badgeW, 14, 7, 7, "F");
        doc.setDrawColor(...ACCENT);
        doc.setLineWidth(0.5);
        doc.roundedRect(badgeX, badgeY, badgeW, 14, 7, 7, "S");
        doc.setTextColor(...ACCENT_PALE);
        doc.text(countLabel, badgeX + 7, badgeY + 10);
    }

    return y + bannerH + 10;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Footer — drawn on every page
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
    // Gradient line above footer
    drawGradientRect(doc, margin, pageH - 42, pageW - margin * 2, 1.5, ACCENT, ACCENT_LIGHT, 0.5);

    // Branding text
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...MUTED);
    const footerLeft = facilityName
        ? `Helix Analytics  ·  ${facilityName}  ·  Confidential`
        : "Helix Analytics  ·  Confidential";
    doc.text(footerLeft, margin, pageH - 24);

    // Page number in a pill
    const pageLabel = `${pageNum} / ${totalPages}`;
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    const pillW = doc.getTextWidth(pageLabel) + 16;
    const pillX = pageW - margin - pillW;
    const pillY = pageH - 32;
    doc.setFillColor(...BRAND);
    doc.roundedRect(pillX, pillY, pillW, 14, 7, 7, "F");
    doc.setTextColor(...WHITE);
    doc.text(pageLabel, pillX + 8, pillY + 10);
}

/* ═══════════════════════════════════════════════════════════════════════════
   Smart column widths — allocate space intelligently
   ═══════════════════════════════════════════════════════════════════════════ */
function computeColumnWidths(
    doc: jsPDF,
    head: string[],
    body: string[][],
    totalW: number,
    fontSize: number
): Record<number, { cellWidth: number }> | undefined {
    if (head.length <= 3) return undefined; // Let autotable handle small tables

    doc.setFont("helvetica", "normal");
    doc.setFontSize(fontSize);

    // Measure max content width per column (header + body)
    const maxWidths: number[] = head.map((h) => {
        doc.setFont("helvetica", "bold");
        return doc.getTextWidth(h) + 14;
    });

    for (const row of body.slice(0, 30)) {
        // Sample up to 30 rows for performance
        doc.setFont("helvetica", "normal");
        for (let c = 0; c < row.length && c < head.length; c++) {
            const w = doc.getTextWidth(row[c] || "") + 14;
            if (w > maxWidths[c]) maxWidths[c] = w;
        }
    }

    // Apply minimum widths
    const minW = 36;
    const maxSingleCol = totalW * 0.35;
    const adjusted = maxWidths.map((w) => Math.max(minW, Math.min(w, maxSingleCol)));

    // Scale to fit totalW
    const sum = adjusted.reduce((a, b) => a + b, 0);
    const scale = totalW / sum;

    const result: Record<number, { cellWidth: number }> = {};
    for (let i = 0; i < adjusted.length; i++) {
        result[i] = { cellWidth: Math.max(minW, adjusted[i] * scale) };
    }
    return result;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Main export — build the premium PDF
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
    const margin = 40;
    const contentW = pageW - margin * 2;
    const footerReserve = 52;
    const facilityName = meta.facilityName?.trim() || "";
    const logo = meta.logo ?? null;

    // ── Cover page ──────────────────────────────────────────────
    drawCoverPage(doc, pageW, pageH, margin, {
        dateFrom: meta.dateFrom,
        dateTo: meta.dateTo,
        generatedAtIso: meta.generatedAtIso,
        facilityName,
        logo,
    });

    // ── Content starts on page 2 ────────────────────────────────
    doc.addPage();
    let y = margin + 28;

    const collected = collectReportData(data, selected);

    const ensureSpace = (needed: number) => {
        if (y + needed > pageH - footerReserve) {
            doc.addPage();
            y = margin + 28;
        }
    };

    // ── Summary metrics (card grid) ─────────────────────────────
    ensureSpace(60);
    y = drawSectionBanner(doc, "Summary Metrics", y, margin, contentW);
    y = drawSummaryMetrics(doc, collected.scalarRows, y, margin, contentW, pageH, footerReserve);
    y += 10;

    // ── Data table renderer ─────────────────────────────────────
    const addDataTable = (
        title: string,
        rawHead: string[],
        rawBody: string[][],
        pdfColumns?: string[]
    ) => {
        const ordered =
            pdfColumns && pdfColumns.length
                ? pdfColumns
                      .map((h) => ({ h, i: rawHead.indexOf(h) }))
                      .filter(({ i }) => i >= 0)
                : rawHead.map((h, i) => ({ h, i }));

        const keep = ordered
            .filter(({ h }) => !HIDDEN_PDF_COLUMNS.has(h))
            // Drop columns with nothing in them
            .filter(({ i }) => rawBody.length === 0 || rawBody.some((row) => (row[i] ?? "") !== ""));
        const head = keep.map(({ h }) => h);
        const body = rawBody
            .map((row) => keep.map(({ i }) => row[i] ?? ""))
            .filter((row) => row.some((c) => c !== ""));

        ensureSpace(60);
        y = drawSectionBanner(doc, title, y, margin, contentW, body.length);

        if (head.length === 0 || body.length === 0) {
            doc.setFont("helvetica", "italic");
            doc.setFontSize(9);
            doc.setTextColor(...MUTED);
            doc.text("No rows for this period.", margin, y);
            y += 24;
            return;
        }

        const displayHead = humanizeHead(head);
        const colCount = displayHead.length;

        // Wide table? Switch to landscape for this table's pages
        const needsLandscape = colCount > 6;
        let tablePageW = pageW;
        let tableMargin = margin;
        let tableContentW = contentW;
        let tablePageH = pageH;

        if (needsLandscape) {
            doc.addPage("a4", "landscape");
            y = margin + 28;
            tablePageW = doc.internal.pageSize.getWidth();
            tablePageH = doc.internal.pageSize.getHeight();
            tableMargin = 36;
            tableContentW = tablePageW - tableMargin * 2;
        }

        const fontSize = colCount > 8 ? 7 : colCount > 5 ? 7.5 : 8.5;
        const headFontSize = Math.max(7, fontSize);

        // Right-align numeric columns
        const columnStyles: Record<number, { halign?: "right" | "left"; cellWidth?: number }> = {};
        for (let c = 0; c < colCount; c++) {
            const values = body.map((row) => row[c]).filter((v) => v !== "");
            if (values.length > 0 && values.every(isNumericCell)) {
                columnStyles[c] = { halign: "right" };
            }
        }

        // Smart column widths for wide tables
        const smartWidths = computeColumnWidths(doc, displayHead, body, tableContentW, fontSize);
        if (smartWidths) {
            for (const [k, v] of Object.entries(smartWidths)) {
                const idx = Number(k);
                columnStyles[idx] = { ...columnStyles[idx], ...v };
            }
        }

        autoTable(doc, {
            startY: y,
            head: [displayHead],
            body,
            theme: "plain",
            styles: {
                font: "helvetica",
                fontSize,
                cellPadding: { top: 9, bottom: 9, left: 10, right: 10 },
                textColor: [51, 65, 85], // slate-700 (softer than INK for body text)
                lineColor: LINE,
                lineWidth: 0,
                overflow: "linebreak",
                valign: "middle",
            },
            headStyles: {
                fillColor: BRAND,
                textColor: WHITE,
                fontStyle: "bold",
                fontSize: headFontSize,
                cellPadding: { top: 11, bottom: 11, left: 10, right: 10 },
                halign: "left",
                valign: "bottom",
            },
            columnStyles,
            alternateRowStyles: { fillColor: STRIPE },
            didDrawCell: (hookData) => {
                if (hookData.section === "head") {
                    const { x, y: cy, width, height } = hookData.cell;
                    // Vertical separator between header cells (subtle)
                    if (hookData.column.index > 0) {
                        doc.setDrawColor(60, 80, 100);
                        doc.setLineWidth(0.3);
                        doc.line(x, cy + 6, x, cy + height - 6);
                    }
                    // Bottom border (accent color) for the entire header
                    doc.setDrawColor(...ACCENT);
                    doc.setLineWidth(1.5);
                    doc.line(x, cy + height, x + width, cy + height);
                }
                if (hookData.section === "body") {
                    const { x, y: cy, width, height } = hookData.cell;
                    // Subtle bottom border for body rows
                    doc.setDrawColor(...LINE);
                    doc.setLineWidth(0.3);
                    doc.line(x, cy + height, x + width, cy + height);
                }
            },
            margin: { left: tableMargin, right: tableMargin, top: tableMargin + 28 },
            tableWidth: tableContentW,
            showHead: "everyPage",
        });
        y = lastTableBottom(doc, y) + 26;

        // Switch back to portrait if we went landscape
        if (needsLandscape) {
            doc.addPage("a4", "portrait");
            y = margin + 28;
        }
    };

    // ── Render all data tables ──────────────────────────────────
    if (collected.daily) addDataTable(collected.daily.title, collected.daily.head, collected.daily.body);
    if (collected.departments)
        addDataTable(collected.departments.title, collected.departments.head, collected.departments.body);
    if (collected.topEscalated)
        addDataTable(collected.topEscalated.title, collected.topEscalated.head, collected.topEscalated.body);
    if (collected.leastEscalated)
        addDataTable(collected.leastEscalated.title, collected.leastEscalated.head, collected.leastEscalated.body);
    if (collected.roleMetrics)
        addDataTable(
            collected.roleMetrics.title,
            collected.roleMetrics.head,
            collected.roleMetrics.body,
            collected.roleMetrics.pdfColumns
        );
    if (collected.callByRole)
        addDataTable(collected.callByRole.title, collected.callByRole.head, collected.callByRole.body);
    if (collected.callByDept)
        addDataTable(collected.callByDept.title, collected.callByDept.head, collected.callByDept.body);
    if (collected.transferByCounterparty)
        addDataTable(
            collected.transferByCounterparty.title,
            collected.transferByCounterparty.head,
            collected.transferByCounterparty.body
        );
    if (collected.transferByRole)
        addDataTable(collected.transferByRole.title, collected.transferByRole.head, collected.transferByRole.body);

    // ── Footer + page chrome on every page ──────────────────────
    const total = doc.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
        doc.setPage(i);
        if (i > 1) {
            drawPageChrome(doc, doc.internal.pageSize.getWidth(), margin, facilityName || undefined, logo);
        }
        drawFooter(
            doc,
            doc.internal.pageSize.getWidth(),
            doc.internal.pageSize.getHeight(),
            i > 1 && doc.internal.pageSize.getWidth() > doc.internal.pageSize.getHeight() ? 36 : margin,
            i,
            total,
            facilityName
        );
    }

    return doc.output("blob");
}
