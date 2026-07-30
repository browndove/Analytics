import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { collectReportData, humanizeReportHeader } from "@/lib/report-metrics";
import type { ReportLogo } from "@/lib/report-logo";

type AnalyticsRow = Record<string, unknown>;

/** Cool slate + teal — clean modern report palette */
const BRAND: [number, number, number] = [15, 23, 42];
const ACCENT: [number, number, number] = [13, 148, 136];
const INK: [number, number, number] = [30, 41, 59];
const MUTED: [number, number, number] = [100, 116, 139];
const LINE: [number, number, number] = [226, 232, 240];
const PANEL: [number, number, number] = [248, 250, 252];
const WHITE: [number, number, number] = [255, 255, 255];
const STRIPE: [number, number, number] = [241, 245, 249];

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

function drawPageChrome(
    doc: jsPDF,
    pageW: number,
    margin: number,
    facilityName?: string,
    logo?: ReportLogo | null
) {
    doc.setFillColor(...BRAND);
    doc.rect(0, 0, pageW, 22, "F");
    doc.setFillColor(...ACCENT);
    doc.rect(0, 22, pageW, 2.5, "F");

    let textX = margin;
    if (logo) {
        const h = 11;
        const w = logoWidthFor(logo, h);
        // White chip keeps the blue mark legible against the navy band.
        doc.setFillColor(...WHITE);
        doc.roundedRect(margin - 3, 5.5, w + 6, h + 5, 2, 2, "F");
        doc.addImage(logo.dataUrl, "PNG", margin, 8, w, h);
        textX = margin + w + 10;
    }

    doc.setTextColor(148, 163, 184);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Helix Analytics Report", textX, 14);
    if (facilityName) {
        doc.setTextColor(226, 232, 240);
        doc.text(facilityName, pageW - margin, 14, { align: "right" });
    }
}

/** Build a styled PDF report (browser / client only). */
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
    const footerReserve = 48;
    const facilityName = meta.facilityName?.trim() || "";
    const logo = meta.logo ?? null;

    // ── Cover band ──────────────────────────────────────────────
    doc.setFillColor(...BRAND);
    doc.rect(0, 0, pageW, 108, "F");
    doc.setFillColor(...ACCENT);
    doc.rect(0, 108, pageW, 4, "F");

    doc.setTextColor(...WHITE);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    if (logo) {
        const h = 13;
        const w = logoWidthFor(logo, h);
        // White chip keeps the blue mark legible against the navy cover band.
        doc.setFillColor(...WHITE);
        doc.roundedRect(margin - 4, 18, w + 8, h + 7, 3, 3, "F");
        doc.addImage(logo.dataUrl, "PNG", margin, 21, w, h);
        doc.setTextColor(...WHITE);
        doc.text("HELIX", margin + w + 12, 32);
    } else {
        doc.text("HELIX", margin, 32);
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("Analytics Report", margin, 56);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    if (facilityName) {
        doc.setTextColor(204, 251, 241); // teal-100
        doc.text(facilityName, margin, 78);
        doc.setTextColor(148, 163, 184);
        doc.setFontSize(9);
        doc.text("Facility usage & performance overview", margin, 94);
    } else {
        doc.setTextColor(148, 163, 184);
        doc.setFontSize(10);
        doc.text("Facility usage & performance overview", margin, 78);
    }

    // Period chip on cover
    doc.setFillColor(30, 41, 59);
    const periodLabel = formatPeriod(meta.dateFrom, meta.dateTo);
    doc.setFontSize(9);
    const periodW = doc.getTextWidth(periodLabel) + 20;
    doc.roundedRect(pageW - margin - periodW, 48, periodW, 22, 4, 4, "F");
    doc.setTextColor(...WHITE);
    doc.text(periodLabel, pageW - margin - periodW + 10, 62);

    let y = 136;

    // ── Meta strip ──────────────────────────────────────────────
    const metaCols = facilityName ? 3 : 2;
    const colW = contentW / metaCols;

    doc.setFillColor(...PANEL);
    doc.roundedRect(margin, y, contentW, 36, 6, 6, "F");
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.6);
    doc.roundedRect(margin, y, contentW, 36, 6, 6, "S");

    const drawMetaCol = (label: string, value: string, colIndex: number) => {
        const x = margin + colW * colIndex + 14;
        if (colIndex > 0) {
            doc.setDrawColor(...LINE);
            doc.line(margin + colW * colIndex, y + 8, margin + colW * colIndex, y + 28);
        }
        doc.setTextColor(...MUTED);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text(label, x, y + 14);
        doc.setTextColor(...INK);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        const maxValW = colW - 28;
        const clipped =
            doc.getTextWidth(value) > maxValW
                ? value.slice(0, Math.max(8, Math.floor(value.length * (maxValW / doc.getTextWidth(value))))) + "…"
                : value;
        doc.text(clipped, x, y + 27);
    };

    let col = 0;
    if (facilityName) {
        drawMetaCol("FACILITY", facilityName, col++);
    }
    drawMetaCol("GENERATED", formatGenerated(meta.generatedAtIso), col++);
    drawMetaCol("REPORTING PERIOD", `${meta.dateFrom}  →  ${meta.dateTo}`, col);

    y += 56;

    const collected = collectReportData(data, selected);

    const ensureSpace = (needed: number) => {
        if (y + needed > pageH - footerReserve) {
            doc.addPage();
            y = margin + 28;
        }
    };

    const drawSectionLabel = (title: string, rowCount?: number) => {
        ensureSpace(40);
        doc.setFillColor(...ACCENT);
        doc.roundedRect(margin, y + 2, 3.5, 14, 1.5, 1.5, "F");
        doc.setTextColor(...BRAND);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text(title, margin + 12, y + 13);
        let lineStart = margin + 12 + doc.getTextWidth(title) + 10;

        if (rowCount != null && rowCount > 0) {
            const countLabel = `${rowCount} ${rowCount === 1 ? "row" : "rows"}`;
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);
            doc.setTextColor(...MUTED);
            doc.text(countLabel, lineStart, y + 13);
            lineStart += doc.getTextWidth(countLabel) + 10;
        }

        doc.setDrawColor(...LINE);
        doc.setLineWidth(0.5);
        doc.line(lineStart, y + 9, pageW - margin, y + 9);
        y += 28;
    };

    // ── Summary metrics ─────────────────────────────────────────
    drawSectionLabel("Summary metrics");
    if (collected.scalarRows.length === 0) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(9);
        doc.setTextColor(...MUTED);
        doc.text("No summary metrics were included.", margin, y);
        y += 22;
    } else {
        autoTable(doc, {
            startY: y,
            head: [["Metric", "Value"]],
            body: collected.scalarRows,
            theme: "plain",
            styles: {
                font: "helvetica",
                fontSize: 9,
                textColor: INK,
                cellPadding: { top: 8, bottom: 8, left: 12, right: 12 },
                lineColor: LINE,
                lineWidth: 0,
                overflow: "linebreak",
                valign: "middle",
            },
            headStyles: {
                fillColor: BRAND,
                textColor: 255,
                fontStyle: "bold",
                fontSize: 8,
                cellPadding: { top: 7, bottom: 7, left: 12, right: 12 },
            },
            bodyStyles: {
                fillColor: WHITE,
            },
            alternateRowStyles: {
                fillColor: PANEL,
            },
            columnStyles: {
                0: { cellWidth: contentW * 0.62, fontStyle: "normal", textColor: MUTED },
                1: {
                    cellWidth: contentW * 0.38,
                    halign: "right",
                    fontStyle: "bold",
                    textColor: INK,
                    fontSize: 10,
                },
            },
            didDrawCell: (hookData) => {
                if (hookData.section === "body") {
                    const { x, y: cy, width, height } = hookData.cell;
                    doc.setDrawColor(...LINE);
                    doc.setLineWidth(0.4);
                    doc.line(x, cy + height, x + width, cy + height);
                }
            },
            margin: { left: margin, right: margin, top: margin + 28 },
            tableWidth: contentW,
        });
        y = lastTableBottom(doc, y) + 28;
    }

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
            // Drop columns with nothing in them (e.g. joins the payload could not resolve).
            .filter(({ i }) => rawBody.length === 0 || rawBody.some((row) => (row[i] ?? "") !== ""));
        const head = keep.map(({ h }) => h);
        const body = rawBody
            .map((row) => keep.map(({ i }) => row[i] ?? ""))
            .filter((row) => row.some((c) => c !== ""));

        drawSectionLabel(title, body.length);
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
        const fontSize = colCount > 8 ? 7 : colCount > 5 ? 8 : 9;

        // Right-align columns whose values are all numeric — easier to scan and compare.
        const columnStyles: Record<number, { halign: "right"; cellWidth?: number }> = {};
        for (let c = 0; c < colCount; c++) {
            const values = body.map((row) => row[c]).filter((v) => v !== "");
            if (values.length > 0 && values.every(isNumericCell)) {
                columnStyles[c] = { halign: "right" };
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
                cellPadding: { top: 6, bottom: 6, left: 6, right: 6 },
                textColor: INK,
                lineColor: LINE,
                lineWidth: 0,
                overflow: "linebreak",
                valign: "middle",
            },
            headStyles: {
                fillColor: BRAND,
                textColor: 255,
                fontStyle: "bold",
                fontSize: Math.max(7, fontSize - 0.5),
                cellPadding: { top: 7, bottom: 7, left: 6, right: 6 },
                halign: "left",
                valign: "bottom",
            },
            columnStyles,
            alternateRowStyles: { fillColor: STRIPE },
            didDrawCell: (hookData) => {
                if (hookData.section === "body") {
                    const { x, y: cy, width, height } = hookData.cell;
                    doc.setDrawColor(...LINE);
                    doc.setLineWidth(0.35);
                    doc.line(x, cy + height, x + width, cy + height);
                }
            },
            margin: { left: margin, right: margin, top: margin + 28 },
            tableWidth: contentW,
            horizontalPageBreak: colCount > 8,
            // Repeat the first (identity) column so split pages aren't anonymous number grids.
            horizontalPageBreakRepeat: 0,
            showHead: "everyPage",
        });
        y = lastTableBottom(doc, y) + 26;
    };

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

    // ── Footer on every page ────────────────────────────────────
    const total = doc.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
        doc.setPage(i);
        if (i > 1) {
            drawPageChrome(doc, pageW, margin, facilityName || undefined, logo);
        }
        doc.setDrawColor(...LINE);
        doc.setLineWidth(0.6);
        doc.line(margin, pageH - 36, pageW - margin, pageH - 36);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(...MUTED);
        const footerLeft = facilityName
            ? `Helix Analytics  ·  ${facilityName}  ·  Confidential`
            : "Helix Analytics  ·  Confidential";
        doc.text(footerLeft, margin, pageH - 22);
        doc.text(`${i} / ${total}`, pageW - margin, pageH - 22, { align: "right" });
        doc.setFillColor(...ACCENT);
        doc.circle(pageW / 2, pageH - 24, 2, "F");
    }

    return doc.output("blob");
}
