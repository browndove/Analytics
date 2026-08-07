/**
 * Premium canvas charts for analytics PDF reports.
 * Styled in the spirit of seaborn / Plotly Express (clean grids, soft fills, curated palettes).
 * Browser-only.
 */

import { buildNiceYAxisScale } from "@/lib/nice-chart-axis";

export type ChartImage = {
    dataUrl: string;
    width: number;
    height: number;
};

/* ─── Theme (seaborn-adjacent) ──────────────────────────────────────────── */

const T = {
    ink: "#1E293B",
    muted: "#64748B",
    faint: "#94A3B8",
    grid: "#E8EEF4",
    axis: "#CBD5E1",
    panel: "#F8FAFC",
    panelAlt: "#F1F5F9",
    white: "#FFFFFF",
    card: "#FFFFFF",
    border: "#E2E8F0",
    // Sequential teal (for heat / rank gradients)
    teal: ["#CCFBF1", "#99F6E4", "#5EEAD4", "#2DD4BF", "#14B8A6", "#0D9488", "#0F766E", "#115E59"] as const,
    // Categorical (plotly-like)
    cat: ["#0D9488", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4", "#EC4899", "#84CC16"] as const,
    danger: "#EF4444",
    warn: "#F59E0B",
    ok: "#0D9488",
    info: "#3B82F6",
};

const FONT = "system-ui, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif";

function createCanvas(width: number, height: number): {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
} {
    const canvas = document.createElement("canvas");
    const scale = Math.min(2.5, typeof window !== "undefined" ? window.devicePixelRatio || 2 : 2);
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D unavailable");
    ctx.scale(scale, scale);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    return { canvas, ctx };
}

function toDataUrl(canvas: HTMLCanvasElement): string {
    return canvas.toDataURL("image/png");
}

function truncate(ctx: CanvasRenderingContext2D, text: string, maxW: number): string {
    if (ctx.measureText(text).width <= maxW) return text;
    let t = text;
    while (t.length > 1 && ctx.measureText(`${t}…`).width > maxW) t = t.slice(0, -1);
    return `${t}…`;
}

function formatTick(n: number): string {
    if (!Number.isFinite(n)) return "";
    if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (Math.abs(n) >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
    if (Number.isInteger(n)) return String(n);
    return n.toFixed(1);
}

function parseCellNumber(v: string): number {
    if (!v) return 0;
    const cleaned = v.replace(/,/g, "").replace(/%$/, "").trim();
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
}

function col(head: string[], key: string): number {
    return head.indexOf(key);
}

function hexToRgb(hex: string): [number, number, number] {
    const h = hex.replace("#", "");
    const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
    return [parseInt(full.slice(0, 2), 16), parseInt(full.slice(2, 4), 16), parseInt(full.slice(4, 6), 16)];
}

function rgbToHex(r: number, g: number, b: number): string {
    const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
    return `#${[clamp(r), clamp(g), clamp(b)].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}

function parseRgb(color: string): [number, number, number] {
    if (color.startsWith("#")) return hexToRgb(color);
    const m = color.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);
    if (m) return [Number(m[1]), Number(m[2]), Number(m[3])];
    return hexToRgb("#0D9488");
}

/** Alpha 0–1 → canvas-safe rgba() (never append hex alpha onto rgb()). */
function withAlpha(color: string, alpha: number): string {
    const [r, g, b] = parseRgb(color);
    const a = Math.max(0, Math.min(1, alpha));
    return `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${a})`;
}

function lerpColor(a: string, b: string, t: number): string {
    const [ar, ag, ab] = parseRgb(a);
    const [br, bg, bb] = parseRgb(b);
    return rgbToHex(
        ar + (br - ar) * t,
        ag + (bg - ag) * t,
        ab + (bb - ab) * t
    );
}

function sequentialColor(t: number, soft = "#CCFBF1", strong = "#0F766E"): string {
    return lerpColor(soft, strong, Math.max(0, Math.min(1, t)));
}

function roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
) {
    const rr = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
}

function paintCard(ctx: CanvasRenderingContext2D, w: number, h: number) {
    // Quiet figure face — no nested card chrome (PDF page already frames the section)
    ctx.fillStyle = T.white;
    ctx.fillRect(0, 0, w, h);
}

function drawLegend(
    ctx: CanvasRenderingContext2D,
    items: { name: string; color: string; style?: "line" | "swatch" | "dash" }[],
    x: number,
    y: number
) {
    let lx = x;
    ctx.font = `500 11px ${FONT}`;
    ctx.textBaseline = "middle";
    for (const it of items) {
        const style = it.style ?? "swatch";
        if (style === "line") {
            ctx.strokeStyle = it.color;
            ctx.lineWidth = 2.5;
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.moveTo(lx, y);
            ctx.lineTo(lx + 16, y);
            ctx.stroke();
            ctx.fillStyle = it.color;
            ctx.beginPath();
            ctx.arc(lx + 8, y, 2.5, 0, Math.PI * 2);
            ctx.fill();
        } else if (style === "dash") {
            ctx.strokeStyle = it.color;
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 3]);
            ctx.beginPath();
            ctx.moveTo(lx, y);
            ctx.lineTo(lx + 16, y);
            ctx.stroke();
            ctx.setLineDash([]);
        } else {
            ctx.fillStyle = it.color;
            roundRect(ctx, lx, y - 5, 11, 11, 3);
            ctx.fill();
        }
        ctx.fillStyle = T.ink;
        ctx.textAlign = "left";
        ctx.fillText(it.name, lx + 20, y);
        lx += 20 + ctx.measureText(it.name).width + 18;
    }
}

function emptyState(ctx: CanvasRenderingContext2D, w: number, h: number, msg = "No data for this period.") {
    paintCard(ctx, w, h);
    ctx.fillStyle = T.faint;
    ctx.font = `italic 13px ${FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(msg, w / 2, h / 2);
}

function rowsFromTable(
    head: string[],
    body: string[][],
    labelKey: string,
    valueKeys: string[],
    limit = 40
): { label: string; values: number[] }[] {
    const li = col(head, labelKey);
    const vis = valueKeys.map((k) => col(head, k));
    if (li < 0 || vis.some((i) => i < 0)) return [];
    return body
        .map((row) => ({
            label: row[li] || "—",
            values: vis.map((i) => parseCellNumber(row[i] ?? "")),
        }))
        .filter((r) => r.label.trim() !== "" && r.values.some((v) => v !== 0))
        .slice(0, limit);
}

/* ═══════════════════════════════════════════════════════════════════════════
   1. Multi-series area / line (time series) — seaborn.lineplot feel
   ═══════════════════════════════════════════════════════════════════════════ */

export type LineSeries = { name: string; data: number[]; color?: string; fill?: boolean };

export function renderAreaChart(opts: {
    categories: string[];
    series: LineSeries[];
    width?: number;
    height?: number;
}): ChartImage {
    const width = opts.width ?? 740;
    const height = opts.height ?? 300;
    const { canvas, ctx } = createCanvas(width, height);
    paintCard(ctx, width, height);

    const pad = { top: 36, right: 28, bottom: 52, left: 58 };
    const plotW = width - pad.left - pad.right;
    const plotH = height - pad.top - pad.bottom;

    const allVals = opts.series.flatMap((s) => s.data);
    const dataMax = Math.max(0, ...allVals);
    const { max: yMax, step } = buildNiceYAxisScale(dataMax, 5);

    // Soft plot band
    ctx.fillStyle = T.panel;
    roundRect(ctx, pad.left, pad.top, plotW, plotH, 6);
    ctx.fill();

    // Grid
    ctx.font = `10px ${FONT}`;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (let v = 0; v <= yMax + 1e-9; v += step) {
        const y = pad.top + plotH - (v / yMax) * plotH;
        ctx.strokeStyle = v === 0 ? T.axis : T.grid;
        ctx.lineWidth = v === 0 ? 1.25 : 1;
        ctx.beginPath();
        ctx.moveTo(pad.left, y);
        ctx.lineTo(pad.left + plotW, y);
        ctx.stroke();
        ctx.fillStyle = T.muted;
        ctx.fillText(formatTick(v), pad.left - 10, y);
    }

    const n = Math.max(1, opts.categories.length - 1);
    const xAt = (i: number) => pad.left + (opts.categories.length <= 1 ? plotW / 2 : (i / n) * plotW);
    const yAt = (v: number) => pad.top + plotH - (Math.max(0, v) / yMax) * plotH;

    // Draw fills first (back → front), then strokes
    opts.series.forEach((series, si) => {
        const color = series.color ?? T.cat[si % T.cat.length];
        const doFill = series.fill !== false && si === 0; // only primary series gets area fill
        if (series.data.length === 0) return;

        if (doFill) {
            const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + plotH);
            grad.addColorStop(0, withAlpha(color, 0.27));
            grad.addColorStop(0.55, withAlpha(color, 0.09));
            grad.addColorStop(1, withAlpha(color, 0));
            ctx.beginPath();
            series.data.forEach((v, i) => {
                const x = xAt(i);
                const y = yAt(v);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            ctx.lineTo(xAt(series.data.length - 1), pad.top + plotH);
            ctx.lineTo(xAt(0), pad.top + plotH);
            ctx.closePath();
            ctx.fillStyle = grad;
            ctx.fill();
        }
    });

    opts.series.forEach((series, si) => {
        const color = series.color ?? T.cat[si % T.cat.length];
        if (series.data.length === 0) return;

        // Smooth-ish polyline
        ctx.beginPath();
        series.data.forEach((v, i) => {
            const x = xAt(i);
            const y = yAt(v);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.strokeStyle = color;
        ctx.lineWidth = si === 0 ? 2.75 : 2;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        if (si > 0) ctx.globalAlpha = 0.92;
        ctx.stroke();
        ctx.globalAlpha = 1;

        if (series.data.length <= 40) {
            series.data.forEach((v, i) => {
                ctx.beginPath();
                ctx.arc(xAt(i), yAt(v), si === 0 ? 3.2 : 2.4, 0, Math.PI * 2);
                ctx.fillStyle = T.white;
                ctx.fill();
                ctx.strokeStyle = color;
                ctx.lineWidth = 1.75;
                ctx.stroke();
            });
        }
    });

    // X labels
    const maxLabels = 9;
    const stepIdx = Math.max(1, Math.ceil(opts.categories.length / maxLabels));
    ctx.fillStyle = T.muted;
    ctx.font = `10px ${FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    opts.categories.forEach((label, i) => {
        if (i % stepIdx !== 0 && i !== opts.categories.length - 1) return;
        ctx.fillText(truncate(ctx, label, 54), xAt(i), pad.top + plotH + 10);
    });

    drawLegend(
        ctx,
        opts.series.map((s, i) => ({
            name: s.name,
            color: s.color ?? T.cat[i % T.cat.length],
            style: "line" as const,
        })),
        pad.left,
        20
    );

    return { dataUrl: toDataUrl(canvas), width, height };
}

/* ═══════════════════════════════════════════════════════════════════════════
   2. Stacked vertical column chart — plotly.bar stacked
   ═══════════════════════════════════════════════════════════════════════════ */

export function renderStackedColumns(opts: {
    categories: string[];
    series: { name: string; data: number[]; color: string }[];
    width?: number;
    height?: number;
}): ChartImage {
    const width = opts.width ?? 740;
    const height = opts.height ?? 300;
    const { canvas, ctx } = createCanvas(width, height);
    paintCard(ctx, width, height);

    if (!opts.categories.length) {
        emptyState(ctx, width, height);
        return { dataUrl: toDataUrl(canvas), width, height };
    }

    const pad = { top: 36, right: 24, bottom: 58, left: 54 };
    const plotW = width - pad.left - pad.right;
    const plotH = height - pad.top - pad.bottom;

    const totals = opts.categories.map((_, i) =>
        opts.series.reduce((s, ser) => s + (ser.data[i] ?? 0), 0)
    );
    const { max: yMax, step } = buildNiceYAxisScale(Math.max(0, ...totals), 5);

    ctx.fillStyle = T.panel;
    roundRect(ctx, pad.left, pad.top, plotW, plotH, 6);
    ctx.fill();

    ctx.font = `10px ${FONT}`;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (let v = 0; v <= yMax + 1e-9; v += step) {
        const y = pad.top + plotH - (v / yMax) * plotH;
        ctx.strokeStyle = v === 0 ? T.axis : T.grid;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pad.left, y);
        ctx.lineTo(pad.left + plotW, y);
        ctx.stroke();
        ctx.fillStyle = T.muted;
        ctx.fillText(formatTick(v), pad.left - 8, y);
    }

    const n = opts.categories.length;
    const gap = 0.28;
    const slot = plotW / n;
    const barW = slot * (1 - gap);

    for (let i = 0; i < n; i++) {
        let yBase = pad.top + plotH;
        const x = pad.left + i * slot + (slot - barW) / 2;
        for (const ser of opts.series) {
            const val = ser.data[i] ?? 0;
            if (val <= 0) continue;
            const h = (val / yMax) * plotH;
            ctx.fillStyle = ser.color;
            // Slightly rounded top of stack only for last visible segment looks hard;
            // use rects for crisp stacked look.
            ctx.fillRect(x, yBase - h, barW, h);
            yBase -= h;
        }
    }

    // X labels
    ctx.fillStyle = T.muted;
    ctx.font = `9.5px ${FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    const labelEvery = Math.max(1, Math.ceil(n / 10));
    opts.categories.forEach((label, i) => {
        if (i % labelEvery !== 0 && i !== n - 1) return;
        const x = pad.left + i * slot + slot / 2;
        ctx.fillText(truncate(ctx, label, slot * 0.95), x, pad.top + plotH + 10);
    });

    drawLegend(
        ctx,
        opts.series.map((s) => ({ name: s.name, color: s.color })),
        pad.left,
        20
    );

    return { dataUrl: toDataUrl(canvas), width, height };
}

/* ═══════════════════════════════════════════════════════════════════════════
   3. Grouped vertical bars — seaborn.barplot hue
   ═══════════════════════════════════════════════════════════════════════════ */

export function renderGroupedBars(opts: {
    categories: string[];
    series: { name: string; data: number[]; color: string }[];
    width?: number;
    height?: number;
    valueSuffix?: string;
}): ChartImage {
    const width = opts.width ?? 740;
    const height = opts.height ?? 300;
    const { canvas, ctx } = createCanvas(width, height);
    paintCard(ctx, width, height);

    if (!opts.categories.length) {
        emptyState(ctx, width, height);
        return { dataUrl: toDataUrl(canvas), width, height };
    }

    const pad = { top: 36, right: 24, bottom: 64, left: 54 };
    const plotW = width - pad.left - pad.right;
    const plotH = height - pad.top - pad.bottom;
    const all = opts.series.flatMap((s) => s.data);
    const { max: yMax, step } = buildNiceYAxisScale(Math.max(0, ...all), 5);

    ctx.fillStyle = T.panel;
    roundRect(ctx, pad.left, pad.top, plotW, plotH, 6);
    ctx.fill();

    ctx.font = `10px ${FONT}`;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (let v = 0; v <= yMax + 1e-9; v += step) {
        const y = pad.top + plotH - (v / yMax) * plotH;
        ctx.strokeStyle = v === 0 ? T.axis : T.grid;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pad.left, y);
        ctx.lineTo(pad.left + plotW, y);
        ctx.stroke();
        ctx.fillStyle = T.muted;
        ctx.fillText(formatTick(v), pad.left - 8, y);
    }

    const n = opts.categories.length;
    const k = opts.series.length;
    const slot = plotW / n;
    const groupGap = 0.22;
    const inner = slot * (1 - groupGap);
    const barW = inner / k;
    const suffix = opts.valueSuffix ?? "";

    for (let i = 0; i < n; i++) {
        const groupX = pad.left + i * slot + (slot - inner) / 2;
        opts.series.forEach((ser, si) => {
            const val = ser.data[i] ?? 0;
            const h = yMax > 0 ? (val / yMax) * plotH : 0;
            const x = groupX + si * barW;
            const y = pad.top + plotH - h;
            ctx.fillStyle = ser.color;
            roundRect(ctx, x + 1, y, Math.max(0, barW - 2), Math.max(0, h), 3);
            ctx.fill();
            if (n <= 8 && h > 18) {
                ctx.fillStyle = T.white;
                ctx.font = `600 9px ${FONT}`;
                ctx.textAlign = "center";
                ctx.textBaseline = "bottom";
                ctx.fillText(formatTick(val) + suffix, x + barW / 2, y + h - 3);
            }
        });
    }

    ctx.fillStyle = T.muted;
    ctx.font = `9.5px ${FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    opts.categories.forEach((label, i) => {
        const x = pad.left + i * slot + slot / 2;
        // Rotate if many / long labels
        if (n > 6) {
            ctx.save();
            ctx.translate(x, pad.top + plotH + 10);
            ctx.rotate(-Math.PI / 5);
            ctx.textAlign = "right";
            ctx.fillText(truncate(ctx, label, 70), 0, 0);
            ctx.restore();
        } else {
            ctx.fillText(truncate(ctx, label, slot * 0.9), x, pad.top + plotH + 10);
        }
    });

    drawLegend(
        ctx,
        opts.series.map((s) => ({ name: s.name, color: s.color })),
        pad.left,
        20
    );

    return { dataUrl: toDataUrl(canvas), width, height };
}

/* ═══════════════════════════════════════════════════════════════════════════
   4. Lollipop / Cleveland dot plot — premium ranking
   ═══════════════════════════════════════════════════════════════════════════ */

export type BarItem = { label: string; value: number; color?: string };

export function renderLollipopChart(opts: {
    items: BarItem[];
    width?: number;
    height?: number;
    valueSuffix?: string;
    maxItems?: number;
    gradient?: boolean;
}): ChartImage {
    const items = opts.items.slice(0, opts.maxItems ?? 12);
    const width = opts.width ?? 740;
    const rowH = 32;
    const pad = { top: 20, right: 64, bottom: 20, left: 150 };
    const height = opts.height ?? pad.top + pad.bottom + Math.max(1, items.length) * rowH + 16;
    const { canvas, ctx } = createCanvas(width, height);
    paintCard(ctx, width, height);

    if (items.length === 0) {
        emptyState(ctx, width, height);
        return { dataUrl: toDataUrl(canvas), width, height };
    }

    const plotW = width - pad.left - pad.right;
    const maxVal = Math.max(...items.map((i) => i.value), 0);
    const { max: xMax } = buildNiceYAxisScale(maxVal, 4);
    const suffix = opts.valueSuffix ?? "";

    // Faint vertical guides
    ctx.strokeStyle = T.grid;
    ctx.lineWidth = 1;
    for (let i = 1; i <= 4; i++) {
        const x = pad.left + (plotW * i) / 4;
        ctx.beginPath();
        ctx.moveTo(x, pad.top);
        ctx.lineTo(x, height - pad.bottom);
        ctx.stroke();
    }

    items.forEach((item, i) => {
        const y = pad.top + 8 + i * rowH + rowH / 2;
        const t = xMax > 0 ? item.value / xMax : 0;
        const xEnd = pad.left + t * plotW;
        const color =
            item.color ??
            (opts.gradient !== false ? sequentialColor(0.35 + t * 0.65, "#99F6E4", "#0F766E") : T.ok);

        ctx.fillStyle = T.ink;
        ctx.font = `500 11.5px ${FONT}`;
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillText(truncate(ctx, item.label, pad.left - 16), pad.left - 12, y);

        // Stem
        ctx.strokeStyle = withAlpha(color, 0.33);
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(pad.left, y);
        ctx.lineTo(xEnd, y);
        ctx.stroke();

        // Dot
        ctx.beginPath();
        ctx.arc(xEnd, y, 6.5, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = T.white;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Value
        ctx.fillStyle = T.muted;
        ctx.font = `600 11px ${FONT}`;
        ctx.textAlign = "left";
        ctx.fillText(formatTick(item.value) + suffix, xEnd + 12, y);
    });

    return { dataUrl: toDataUrl(canvas), width, height };
}

/* ═══════════════════════════════════════════════════════════════════════════
   5. Horizontal bars with gradient rank coloring
   ═══════════════════════════════════════════════════════════════════════════ */

export function renderHorizontalBars(opts: {
    items: BarItem[];
    width?: number;
    height?: number;
    valueSuffix?: string;
    maxItems?: number;
    colorFrom?: string;
    colorTo?: string;
}): ChartImage {
    const items = opts.items.slice(0, opts.maxItems ?? 12);
    const width = opts.width ?? 740;
    const rowH = 30;
    const pad = { top: 18, right: 58, bottom: 18, left: 148 };
    const height = opts.height ?? pad.top + pad.bottom + Math.max(1, items.length) * rowH;
    const { canvas, ctx } = createCanvas(width, height);
    paintCard(ctx, width, height);

    if (items.length === 0) {
        emptyState(ctx, width, height);
        return { dataUrl: toDataUrl(canvas), width, height };
    }

    const plotW = width - pad.left - pad.right;
    const maxVal = Math.max(...items.map((i) => i.value), 0);
    const { max: xMax } = buildNiceYAxisScale(maxVal, 4);
    const suffix = opts.valueSuffix ?? "";
    const from = opts.colorFrom ?? "#5EEAD4";
    const to = opts.colorTo ?? "#0F766E";

    items.forEach((item, i) => {
        const y = pad.top + i * rowH;
        const barH = 15;
        const barY = y + (rowH - barH) / 2;
        const t = xMax > 0 ? item.value / xMax : 0;
        const barW = t * plotW;
        const color = item.color ?? sequentialColor(0.25 + t * 0.75, from, to);

        ctx.fillStyle = T.ink;
        ctx.font = `500 11px ${FONT}`;
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillText(truncate(ctx, item.label, pad.left - 14), pad.left - 10, y + rowH / 2);

        ctx.fillStyle = T.panelAlt;
        roundRect(ctx, pad.left, barY, plotW, barH, 5);
        ctx.fill();

        if (barW > 0) {
            const grad = ctx.createLinearGradient(pad.left, 0, pad.left + Math.max(barW, 8), 0);
            grad.addColorStop(0, withAlpha(color, 0.8));
            grad.addColorStop(1, color);
            ctx.fillStyle = grad;
            roundRect(ctx, pad.left, barY, Math.max(barW, 5), barH, 5);
            ctx.fill();
        }

        ctx.fillStyle = T.muted;
        ctx.font = `600 10.5px ${FONT}`;
        ctx.textAlign = "left";
        ctx.fillText(formatTick(item.value) + suffix, pad.left + barW + 8, y + rowH / 2);
    });

    return { dataUrl: toDataUrl(canvas), width, height };
}

/* ═══════════════════════════════════════════════════════════════════════════
   6. Stacked horizontal bars
   ═══════════════════════════════════════════════════════════════════════════ */

export type StackedBarItem = { label: string; segments: { value: number; color: string; name: string }[] };

export function renderStackedHorizontalBars(opts: {
    items: StackedBarItem[];
    width?: number;
    height?: number;
    legend?: { name: string; color: string }[];
    maxItems?: number;
}): ChartImage {
    const items = opts.items.slice(0, opts.maxItems ?? 10);
    const width = opts.width ?? 740;
    const rowH = 32;
    const legendH = opts.legend?.length ? 28 : 0;
    const pad = { top: 12 + legendH, right: 52, bottom: 16, left: 148 };
    const height = opts.height ?? pad.top + pad.bottom + Math.max(1, items.length) * rowH;
    const { canvas, ctx } = createCanvas(width, height);
    paintCard(ctx, width, height);

    if (opts.legend?.length) {
        drawLegend(
            ctx,
            opts.legend.map((l) => ({ name: l.name, color: l.color })),
            pad.left,
            22
        );
    }

    if (items.length === 0) {
        emptyState(ctx, width, height);
        return { dataUrl: toDataUrl(canvas), width, height };
    }

    const plotW = width - pad.left - pad.right;
    const totals = items.map((it) => it.segments.reduce((s, seg) => s + seg.value, 0));
    const { max: xMax } = buildNiceYAxisScale(Math.max(...totals, 0), 4);

    items.forEach((item, i) => {
        const y = pad.top + i * rowH;
        const barH = 16;
        const barY = y + (rowH - barH) / 2;

        ctx.fillStyle = T.ink;
        ctx.font = `500 11px ${FONT}`;
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillText(truncate(ctx, item.label, pad.left - 14), pad.left - 10, y + rowH / 2);

        ctx.fillStyle = T.panelAlt;
        roundRect(ctx, pad.left, barY, plotW, barH, 4);
        ctx.fill();

        let x = pad.left;
        const segs = item.segments.filter((s) => s.value > 0);
        segs.forEach((seg, si) => {
            const w = xMax > 0 ? (seg.value / xMax) * plotW : 0;
            if (w <= 0) return;
            ctx.fillStyle = seg.color;
            if (si === 0 && si === segs.length - 1) {
                roundRect(ctx, x, barY, w, barH, 4);
                ctx.fill();
            } else if (si === 0) {
                // left rounded
                ctx.beginPath();
                ctx.moveTo(x + 4, barY);
                ctx.lineTo(x + w, barY);
                ctx.lineTo(x + w, barY + barH);
                ctx.lineTo(x + 4, barY + barH);
                ctx.arcTo(x, barY + barH, x, barY, 4);
                ctx.arcTo(x, barY, x + w, barY, 4);
                ctx.closePath();
                ctx.fill();
            } else if (si === segs.length - 1) {
                ctx.beginPath();
                ctx.moveTo(x, barY);
                ctx.lineTo(x + w - 4, barY);
                ctx.arcTo(x + w, barY, x + w, barY + barH, 4);
                ctx.arcTo(x + w, barY + barH, x, barY + barH, 4);
                ctx.lineTo(x, barY + barH);
                ctx.closePath();
                ctx.fill();
            } else {
                ctx.fillRect(x, barY, w, barH);
            }
            x += w;
        });

        ctx.fillStyle = T.muted;
        ctx.font = `600 10.5px ${FONT}`;
        ctx.textAlign = "left";
        ctx.fillText(formatTick(totals[i]), x + 8, y + rowH / 2);
    });

    return { dataUrl: toDataUrl(canvas), width, height };
}

/* ═══════════════════════════════════════════════════════════════════════════
   7. Donut — Plotly pie/donut
   ═══════════════════════════════════════════════════════════════════════════ */

export type DonutSlice = { label: string; value: number; color: string };

export function renderDonutChart(opts: {
    slices: DonutSlice[];
    width?: number;
    height?: number;
    centerLabel?: string;
    centerValue?: string;
}): ChartImage {
    const width = opts.width ?? 740;
    const height = opts.height ?? 260;
    const { canvas, ctx } = createCanvas(width, height);
    paintCard(ctx, width, height);

    const total = opts.slices.reduce((s, sl) => s + Math.max(0, sl.value), 0);
    const cx = 168;
    const cy = height / 2 + 4;
    const r = 88;
    const rInner = 52;

    if (total <= 0) {
        emptyState(ctx, width, height);
        return { dataUrl: toDataUrl(canvas), width, height };
    }

    // Soft ring shadow
    ctx.beginPath();
    ctx.arc(cx, cy, r + 2, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(15, 23, 42, 0.04)";
    ctx.fill();

    let angle = -Math.PI / 2;
    const gap = 0.035; // visual separation between slices
    for (const slice of opts.slices) {
        const portion = Math.max(0, slice.value) / total;
        if (portion <= 0) continue;
        const sweep = Math.max(0, portion * Math.PI * 2 - gap);
        const next = angle + portion * Math.PI * 2;

        ctx.beginPath();
        ctx.arc(cx, cy, r, angle + gap / 2, angle + gap / 2 + sweep);
        ctx.arc(cx, cy, rInner, angle + gap / 2 + sweep, angle + gap / 2, true);
        ctx.closePath();
        ctx.fillStyle = slice.color;
        ctx.fill();
        angle = next;
    }

    // Center
    ctx.beginPath();
    ctx.arc(cx, cy, rInner - 2, 0, Math.PI * 2);
    ctx.fillStyle = T.white;
    ctx.fill();

    if (opts.centerValue) {
        ctx.fillStyle = T.ink;
        ctx.font = `700 22px ${FONT}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(opts.centerValue, cx, cy - (opts.centerLabel ? 8 : 0));
        if (opts.centerLabel) {
            ctx.fillStyle = T.muted;
            ctx.font = `500 11px ${FONT}`;
            ctx.fillText(opts.centerLabel, cx, cy + 14);
        }
    }

    // Legend cards
    let ly = 48;
    const lx = 310;
    for (const slice of opts.slices) {
        const pct = total > 0 ? Math.round((slice.value / total) * 100) : 0;
        roundRect(ctx, lx, ly - 14, width - lx - 28, 44, 8);
        ctx.fillStyle = T.panel;
        ctx.fill();

        ctx.fillStyle = slice.color;
        roundRect(ctx, lx + 12, ly - 4, 12, 12, 3);
        ctx.fill();

        ctx.fillStyle = T.ink;
        ctx.font = `600 12.5px ${FONT}`;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(slice.label, lx + 34, ly - 2);

        ctx.fillStyle = T.muted;
        ctx.font = `500 11px ${FONT}`;
        ctx.fillText(`${formatTick(slice.value)}   ·   ${pct}%`, lx + 34, ly + 16);
        ly += 56;
    }

    return { dataUrl: toDataUrl(canvas), width, height };
}

/* ═══════════════════════════════════════════════════════════════════════════
   8. Heatmap — seaborn.heatmap
   ═══════════════════════════════════════════════════════════════════════════ */

export function renderHeatmap(opts: {
    rowLabels: string[];
    colLabels: string[];
    values: number[][]; // [row][col]
    width?: number;
    height?: number;
    valueSuffix?: string;
}): ChartImage {
    const rows = opts.rowLabels.length;
    const cols = opts.colLabels.length;
    const width = opts.width ?? 740;
    const colLabelH = 56;
    const legendW = 28;
    const pad = { top: 20, right: 52 + legendW, bottom: 20, left: 140 };
    const cellH = Math.max(26, Math.min(36, Math.floor(280 / Math.max(rows, 1))));
    const height = opts.height ?? pad.top + pad.bottom + colLabelH + rows * cellH;
    const { canvas, ctx } = createCanvas(width, height);
    paintCard(ctx, width, height);

    if (!rows || !cols) {
        emptyState(ctx, width, height);
        return { dataUrl: toDataUrl(canvas), width, height };
    }

    const plotW = width - pad.left - pad.right;
    const cellW = plotW / cols;
    const flat = opts.values.flat();
    const vmin = Math.min(...flat, 0);
    const vmax = Math.max(...flat, 1);
    const span = vmax - vmin || 1;
    const suffix = opts.valueSuffix ?? "";

    // Column headers (rotated)
    ctx.fillStyle = T.muted;
    ctx.font = `500 10px ${FONT}`;
    for (let c = 0; c < cols; c++) {
        const x = pad.left + c * cellW + cellW / 2;
        const y = pad.top + colLabelH - 8;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(-Math.PI / 4);
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(truncate(ctx, opts.colLabels[c], 72), 0, 0);
        ctx.restore();
    }

    for (let r = 0; r < rows; r++) {
        const y = pad.top + colLabelH + r * cellH;
        ctx.fillStyle = T.ink;
        ctx.font = `500 11px ${FONT}`;
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillText(truncate(ctx, opts.rowLabels[r], pad.left - 14), pad.left - 10, y + cellH / 2);

        for (let c = 0; c < cols; c++) {
            const v = opts.values[r]?.[c] ?? 0;
            const t = (v - vmin) / span;
            const color = sequentialColor(t, "#F0FDFA", "#0F766E");
            const x = pad.left + c * cellW;
            const inset = 2;
            roundRect(ctx, x + inset, y + inset, cellW - inset * 2, cellH - inset * 2, 4);
            ctx.fillStyle = color;
            ctx.fill();

            ctx.fillStyle = t > 0.55 ? T.white : T.ink;
            ctx.font = `600 10px ${FONT}`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(formatTick(v) + suffix, x + cellW / 2, y + cellH / 2);
        }
    }

    // Colorbar
    const barX = width - pad.right + 14;
    const barY = pad.top + colLabelH;
    const barH = rows * cellH;
    const barW = 12;
    for (let i = 0; i < 40; i++) {
        const t = 1 - i / 39;
        ctx.fillStyle = sequentialColor(t, "#F0FDFA", "#0F766E");
        ctx.fillRect(barX, barY + (i / 40) * barH, barW, barH / 40 + 1);
    }
    roundRect(ctx, barX, barY, barW, barH, 3);
    ctx.strokeStyle = T.border;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = T.muted;
    ctx.font = `10px ${FONT}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(formatTick(vmax) + suffix, barX + barW + 6, barY + 4);
    ctx.fillText(formatTick(vmin) + suffix, barX + barW + 6, barY + barH - 4);

    return { dataUrl: toDataUrl(canvas), width, height };
}

/* ═══════════════════════════════════════════════════════════════════════════
   9. Radar / spider — multi-metric profile
   ═══════════════════════════════════════════════════════════════════════════ */

export function renderRadarChart(opts: {
    axes: { label: string; value: number; max?: number }[];
    width?: number;
    height?: number;
    color?: string;
}): ChartImage {
    const width = opts.width ?? 740;
    const height = opts.height ?? 320;
    const { canvas, ctx } = createCanvas(width, height);
    paintCard(ctx, width, height);

    const axes = opts.axes.filter((a) => a.label);
    if (axes.length < 3) {
        emptyState(ctx, width, height, "Need at least 3 metrics for a radar chart.");
        return { dataUrl: toDataUrl(canvas), width, height };
    }

    const cx = width * 0.38;
    const cy = height / 2 + 6;
    const R = Math.min(width, height) * 0.32;
    const color = opts.color ?? T.ok;
    const n = axes.length;

    const angleAt = (i: number) => -Math.PI / 2 + (i / n) * Math.PI * 2;
    const point = (i: number, t: number) => {
        const a = angleAt(i);
        return { x: cx + Math.cos(a) * R * t, y: cy + Math.sin(a) * R * t };
    };

    // Rings
    for (const ring of [0.25, 0.5, 0.75, 1]) {
        ctx.beginPath();
        for (let i = 0; i < n; i++) {
            const p = point(i, ring);
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
        }
        ctx.closePath();
        ctx.strokeStyle = T.grid;
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    // Spokes + labels
    axes.forEach((ax, i) => {
        const p = point(i, 1);
        ctx.strokeStyle = T.axis;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();

        const lp = point(i, 1.18);
        ctx.fillStyle = T.ink;
        ctx.font = `500 11px ${FONT}`;
        ctx.textAlign = lp.x < cx - 8 ? "right" : lp.x > cx + 8 ? "left" : "center";
        ctx.textBaseline = "middle";
        ctx.fillText(truncate(ctx, ax.label, 110), lp.x, lp.y);
    });

    // Polygon
    ctx.beginPath();
    axes.forEach((ax, i) => {
        const max = ax.max && ax.max > 0 ? ax.max : 100;
        const t = Math.max(0, Math.min(1, ax.value / max));
        const p = point(i, t);
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();
    ctx.fillStyle = withAlpha(color, 0.2);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    axes.forEach((ax, i) => {
        const max = ax.max && ax.max > 0 ? ax.max : 100;
        const t = Math.max(0, Math.min(1, ax.value / max));
        const p = point(i, t);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = T.white;
        ctx.lineWidth = 1.5;
        ctx.stroke();
    });

    // Side stats
    let ly = 56;
    const lx = width * 0.62;
    ctx.font = `600 12px ${FONT}`;
    ctx.fillStyle = T.ink;
    ctx.textAlign = "left";
    ctx.fillText("Metric profile", lx, ly);
    ly += 22;
    for (const ax of axes) {
        ctx.fillStyle = T.muted;
        ctx.font = `500 11px ${FONT}`;
        ctx.fillText(ax.label, lx, ly);
        ctx.fillStyle = T.ink;
        ctx.font = `700 12px ${FONT}`;
        const max = ax.max && ax.max > 0 ? ax.max : 100;
        ctx.fillText(`${formatTick(ax.value)}${max === 100 ? "%" : ""}`, lx + 160, ly);
        ly += 24;
    }

    return { dataUrl: toDataUrl(canvas), width, height };
}

/* ═══════════════════════════════════════════════════════════════════════════
   Domain helpers — map report tables → chart types (variety)
   ═══════════════════════════════════════════════════════════════════════════ */

export function chartDailyVolume(head: string[], body: string[][]): ChartImage | null {
    const dayI = col(head, "day");
    const totI = col(head, "total_messages");
    const critI = col(head, "critical_messages");
    const stdI = col(head, "standard_messages");
    if (dayI < 0 || totI < 0 || body.length === 0) return null;

    const categories = body.map((row) => {
        const raw = row[dayI] || "";
        try {
            const d = new Date(`${raw}T12:00:00`);
            if (!Number.isNaN(d.getTime())) {
                return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
            }
        } catch {
            /* keep */
        }
        return raw;
    });

    const total = body.map((r) => parseCellNumber(r[totI] ?? ""));
    const critical = critI >= 0 ? body.map((r) => parseCellNumber(r[critI] ?? "")) : [];
    const standard = stdI >= 0 ? body.map((r) => parseCellNumber(r[stdI] ?? "")) : [];

    // Prefer stacked columns for short windows; area for longer trends
    if (categories.length <= 14 && critical.length && standard.length) {
        return renderStackedColumns({
            categories,
            series: [
                { name: "Standard", data: standard, color: T.ok },
                { name: "Critical", data: critical, color: T.danger },
            ],
        });
    }

    const series: LineSeries[] = [
        { name: "Total", data: total, color: T.ok, fill: true },
    ];
    if (critical.length) series.push({ name: "Critical", data: critical, color: T.danger, fill: false });
    if (standard.length) series.push({ name: "Standard", data: standard, color: T.info, fill: false });
    return renderAreaChart({ categories, series });
}

export function chartRankedMetric(
    head: string[],
    body: string[][],
    labelKey: string,
    valueKey: string,
    opts?: {
        valueSuffix?: string;
        color?: string;
        maxItems?: number;
        sortDesc?: boolean;
        style?: "lollipop" | "bars";
        colorFrom?: string;
        colorTo?: string;
    }
): ChartImage | null {
    const rows = rowsFromTable(head, body, labelKey, [valueKey], 50);
    if (rows.length === 0) return null;
    const sortDesc = opts?.sortDesc !== false;
    const sorted = [...rows].sort((a, b) => (sortDesc ? b.values[0] - a.values[0] : a.values[0] - b.values[0]));
    const items = sorted.map((r) => ({
        label: r.label,
        value: r.values[0],
        color: opts?.color,
    }));
    if (opts?.style === "bars") {
        return renderHorizontalBars({
            items,
            valueSuffix: opts?.valueSuffix,
            maxItems: opts?.maxItems ?? 12,
            colorFrom: opts?.colorFrom,
            colorTo: opts?.colorTo,
        });
    }
    return renderLollipopChart({
        items,
        valueSuffix: opts?.valueSuffix,
        maxItems: opts?.maxItems ?? 12,
    });
}

export function chartStackedByColumns(
    head: string[],
    body: string[][],
    labelKey: string,
    segments: { key: string; name: string; color: string }[],
    maxItems = 10,
    orientation: "horizontal" | "grouped" = "horizontal"
): ChartImage | null {
    const keys = segments.map((s) => s.key);
    const rows = rowsFromTable(head, body, labelKey, keys, 50);
    if (rows.length === 0) return null;
    const sorted = [...rows].sort(
        (a, b) => b.values.reduce((s, v) => s + v, 0) - a.values.reduce((s, v) => s + v, 0)
    );
    const top = sorted.slice(0, maxItems);

    if (orientation === "grouped") {
        return renderGroupedBars({
            categories: top.map((r) => r.label),
            series: segments.map((seg, i) => ({
                name: seg.name,
                color: seg.color,
                data: top.map((r) => r.values[i]),
            })),
        });
    }

    return renderStackedHorizontalBars({
        items: top.map((r) => ({
            label: r.label,
            segments: segments.map((seg, i) => ({
                name: seg.name,
                color: seg.color,
                value: r.values[i],
            })),
        })),
        legend: segments.map((s) => ({ name: s.name, color: s.color })),
        maxItems,
    });
}

export function chartDepartmentHeatmap(head: string[], body: string[][]): ChartImage | null {
    const nameI = col(head, "department_name");
    const metrics = [
        { key: "role_fill_rate_percent", label: "Fill %" },
        { key: "critical_role_fill_rate_percent", label: "Crit fill %" },
        { key: "escalation_rate_vs_dept_critical_messages_percent", label: "Escalation %" },
        { key: "avg_critical_ack_minutes", label: "Ack (min)" },
    ];
    const idxs = metrics.map((m) => col(head, m.key));
    if (nameI < 0 || idxs.every((i) => i < 0) || body.length === 0) return null;

    // Top departments by activity proxy (critical msgs or fill)
    const critSentI = col(head, "critical_messages_sent");
    const ranked = [...body]
        .map((row) => ({
            row,
            score:
                critSentI >= 0
                    ? parseCellNumber(row[critSentI] ?? "")
                    : parseCellNumber(row[idxs[0]] ?? ""),
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 8);

    const rowLabels = ranked.map((r) => r.row[nameI] || "—");
    const colLabels = metrics.filter((_, i) => idxs[i] >= 0).map((m) => m.label);
    const activeIdx = idxs.map((i, k) => ({ i, k })).filter(({ i }) => i >= 0);

    // Normalize each column 0–100 for fair heatmap comparison where units differ
    const raw: number[][] = ranked.map(({ row }) =>
        activeIdx.map(({ i }) => parseCellNumber(row[i] ?? ""))
    );
    const colMax = activeIdx.map((_, ci) => Math.max(...raw.map((r) => r[ci]), 1));
    const values = raw.map((r) => r.map((v, ci) => (v / colMax[ci]) * 100));

    return renderHeatmap({
        rowLabels,
        colLabels,
        values,
        valueSuffix: "",
    });
}

export function chartMessageMix(data: Record<string, unknown>): ChartImage | null {
    const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : Number(v) || 0);
    const standard = num(data.standard_messages);
    const escalated = num(data.escalated_critical_messages);
    const critical = Math.max(0, num(data.critical_messages) - escalated);
    const total = num(data.total_messages) || standard + critical + escalated;
    if (total <= 0 && standard + critical + escalated <= 0) return null;
    return renderDonutChart({
        slices: [
            { label: "Standard", value: standard, color: T.ok },
            { label: "Critical (not escalated)", value: critical, color: T.warn },
            { label: "Escalated", value: escalated, color: T.danger },
        ],
        centerLabel: "messages",
        centerValue: formatTick(total || standard + critical + escalated),
    });
}

export function chartPerformanceRadar(data: Record<string, unknown>): ChartImage | null {
    const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : Number(v) || 0);
    const axes = [
        { label: "Active users", value: num(data.active_users_rate_percent), max: 100 },
        { label: "Role fill", value: num(data.role_fill_rate_percent), max: 100 },
        { label: "Crit. fill", value: num(data.critical_role_fill_rate_percent), max: 100 },
        { label: "Crit. read", value: num(data.critical_messages_read_percent), max: 100 },
        { label: "Crit. ack", value: num(data.critical_messages_acknowledged_percent), max: 100 },
        // Invert escalation so "better" is outward (100 - rate)
        {
            label: "Low escalation",
            value: Math.max(0, 100 - num(data.escalation_rate_percent)),
            max: 100,
        },
    ].filter((a) => a.value > 0 || num(data.total_messages) > 0);

    if (axes.length < 3) return null;
    return renderRadarChart({ axes, color: T.ok });
}

export { T as REPORT_CHART_COLORS };
