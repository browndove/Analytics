import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { collectReportData } from "@/lib/report-metrics";

type AnalyticsRow = Record<string, unknown>;

const BRAND: [number, number, number] = [30, 58, 95];
const INK: [number, number, number] = [26, 35, 50];
const MUTED: [number, number, number] = [100, 116, 139];
const LINE: [number, number, number] = [226, 232, 240];
const PANEL: [number, number, number] = [241, 245, 250];

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

type DocWithAutoTable = jsPDF & { lastAutoTable?: { finalY: number } };

function lastTableBottom(doc: jsPDF, fallbackY: number): number {
    const d = doc as DocWithAutoTable;
    return d.lastAutoTable?.finalY ?? fallbackY;
}

/** Build a styled PDF report (browser / client only). */
export function buildAnalyticsReportPdfBlob(
    data: AnalyticsRow,
    selected: Record<string, boolean>,
    meta: { dateFrom: string; dateTo: string; generatedAtIso: string }
): Blob {
    const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });
    const pageH = doc.internal.pageSize.getHeight();
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 42;
    const contentW = pageW - margin * 2;

    // — Cover header
    doc.setFillColor(...BRAND);
    doc.rect(0, 0, pageW, 96, "F");
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.75);
    doc.line(margin, 78, pageW - margin, 78);

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.text("Helix Analytics", margin, 52);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text("Facility usage & analytics", margin, 74);

    let y = 118;
    doc.setTextColor(...INK);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Generated ${formatGenerated(meta.generatedAtIso)}`, margin, y);
    y += 16;
    doc.setTextColor(...MUTED);
    doc.text(`Reporting period: ${meta.dateFrom} → ${meta.dateTo} (inclusive)`, margin, y);
    y += 28;

    const collected = collectReportData(data, selected);

    const ensureSpace = (needed: number) => {
        if (y + needed > pageH - margin) {
            doc.addPage();
            y = margin;
        }
    };

    const drawSectionLabel = (title: string) => {
        ensureSpace(36);
        doc.setFillColor(...PANEL);
        doc.roundedRect(margin, y, contentW, 26, 5, 5, "F");
        doc.setDrawColor(...LINE);
        doc.roundedRect(margin, y, contentW, 26, 5, 5, "S");
        doc.setTextColor(...BRAND);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text(title, margin + 12, y + 17);
        doc.setTextColor(...INK);
        y += 38;
    };

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
                fontSize: 9.5,
                textColor: INK,
                cellPadding: { top: 7, bottom: 7, left: 10, right: 10 },
                lineColor: LINE,
                lineWidth: 0.35,
            },
            headStyles: {
                fillColor: BRAND,
                textColor: 255,
                fontStyle: "bold",
                halign: "left",
            },
            columnStyles: {
                0: { cellWidth: contentW * 0.58 },
                1: { cellWidth: contentW * 0.42, halign: "right" },
            },
            margin: { left: margin, right: margin },
            tableWidth: contentW,
        });
        y = lastTableBottom(doc, y) + 24;
    }

    const addDataTable = (title: string, head: string[], body: string[][]) => {
        drawSectionLabel(title);
        if (head.length === 0 || body.length === 0) {
            doc.setFont("helvetica", "italic");
            doc.setFontSize(9);
            doc.setTextColor(...MUTED);
            doc.text("No rows for this period.", margin, y);
            y += 24;
            return;
        }
        const colCount = head.length;
        const baseW = contentW / Math.min(colCount, 8);
        const columnStyles: Record<number, { cellWidth: number }> = {};
        for (let i = 0; i < colCount; i++) {
            columnStyles[i] = { cellWidth: Math.max(48, baseW) };
        }
        autoTable(doc, {
            startY: y,
            head: [head],
            body,
            theme: "striped",
            styles: {
                font: "helvetica",
                fontSize: colCount > 8 ? 6.5 : 7.5,
                cellPadding: 4,
                textColor: INK,
                lineColor: LINE,
                overflow: "linebreak",
            },
            headStyles: {
                fillColor: BRAND,
                textColor: 255,
                fontStyle: "bold",
                halign: "left",
            },
            alternateRowStyles: { fillColor: [252, 253, 255] },
            margin: { left: margin, right: margin },
            tableWidth: contentW,
            horizontalPageBreak: colCount > 6,
            showHead: "everyPage",
        });
        y = lastTableBottom(doc, y) + 28;
    };

    if (collected.daily) addDataTable(collected.daily.title, collected.daily.head, collected.daily.body);
    if (collected.departments)
        addDataTable(collected.departments.title, collected.departments.head, collected.departments.body);
    if (collected.topEscalated)
        addDataTable(collected.topEscalated.title, collected.topEscalated.head, collected.topEscalated.body);
    if (collected.leastEscalated)
        addDataTable(collected.leastEscalated.title, collected.leastEscalated.head, collected.leastEscalated.body);
    if (collected.roleMetrics)
        addDataTable(collected.roleMetrics.title, collected.roleMetrics.head, collected.roleMetrics.body);

    // — Footer on every page
    const total = doc.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
        doc.setPage(i);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(...MUTED);
        doc.text(`Helix Analytics · Confidential · Page ${i} of ${total}`, margin, pageH - 26);
    }

    return doc.output("blob");
}
