import { useEffect, useRef } from 'react';

import { DODO_PALETTE } from '../engine/constants';

export type ChartKind = 'bar' | 'hbar' | 'line' | 'pie';

export interface ChartDatum {
  label: string;
  value: number;
}

export interface PixelChartProps {
  type: ChartKind;
  data: ChartDatum[];
  unit?: string;
  /** Width in CSS pixels (default 420) */
  width?: number;
  /** Height in CSS pixels (default 260) */
  height?: number;
}

const SERIES_COLORS = [
  DODO_PALETTE.orange,
  DODO_PALETTE.yellow,
  '#3FA34D',
  '#2A9DF4',
  '#A65EE0',
  '#993F00',
  '#5C4232',
];

export function PixelChart({
  type,
  data,
  unit,
  width = 420,
  height = 260,
}: PixelChartProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = DODO_PALETTE.cream;
    ctx.fillRect(0, 0, width, height);

    if (type === 'bar') drawBar(ctx, data, width, height, unit);
    else if (type === 'hbar') drawHBar(ctx, data, width, height, unit);
    else if (type === 'line') drawLine(ctx, data, width, height, unit);
    else if (type === 'pie') drawPie(ctx, data, width, height, unit);
  }, [type, data, unit, width, height]);

  return <canvas ref={ref} className="pixelChart" />;
}

// ── Helpers ────────────────────────────────────────────────────

function fmt(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return `${Math.round(n)}`;
}

const FONT = '16px PixelSans, monospace';

function drawBar(
  ctx: CanvasRenderingContext2D,
  data: ChartDatum[],
  w: number,
  h: number,
  unit?: string,
) {
  const padL = 36;
  const padR = 8;
  const padT = 12;
  const padB = 28;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;
  const max = Math.max(...data.map((d) => d.value), 1);

  // Y axis ticks (4 lines)
  ctx.font = FONT;
  ctx.fillStyle = DODO_PALETTE.charcoal;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (let i = 0; i <= 4; i++) {
    const v = (max * (4 - i)) / 4;
    const y = padT + (innerH * i) / 4;
    ctx.strokeStyle = '#0001';
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(padL + innerW, y);
    ctx.stroke();
    ctx.fillText(fmt(v), padL - 4, y);
  }

  const barGap = 6;
  const barW = Math.max(8, (innerW - barGap * (data.length - 1)) / data.length);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  for (let i = 0; i < data.length; i++) {
    const d = data[i];
    const barH = (d.value / max) * innerH;
    const x = padL + i * (barW + barGap);
    const y = padT + innerH - barH;
    // Drop shadow
    ctx.fillStyle = '#0002';
    ctx.fillRect(x + 2, y + 2, barW, barH);
    ctx.fillStyle = DODO_PALETTE.red;
    ctx.fillRect(x, y, barW, barH);
    // Highlight pixel band on top
    ctx.fillStyle = DODO_PALETTE.yellow;
    ctx.fillRect(x, y, barW, Math.max(2, Math.min(4, barH)));

    ctx.fillStyle = DODO_PALETTE.charcoal;
    ctx.fillText(d.label, x + barW / 2, padT + innerH + 4);
  }

  if (unit) {
    ctx.textAlign = 'left';
    ctx.fillText(unit, padL, 0);
  }
}

function drawHBar(
  ctx: CanvasRenderingContext2D,
  data: ChartDatum[],
  w: number,
  h: number,
  unit?: string,
) {
  // Auto-fit label column to longest label so long Russian region names
  // (e.g. "Северо-Западный ФО") aren't clipped.
  ctx.font = FONT;
  const maxLabelW = Math.max(...data.map((d) => ctx.measureText(d.label).width));
  const padL = Math.min(w * 0.55, Math.max(110, maxLabelW + 12));
  const padR = 56;
  const padT = 8;
  const padB = 16;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;
  const max = Math.max(...data.map((d) => d.value), 1);

  const rowGap = 6;
  const rowH = Math.max(10, (innerH - rowGap * (data.length - 1)) / data.length);

  ctx.font = FONT;
  ctx.textBaseline = 'middle';
  for (let i = 0; i < data.length; i++) {
    const d = data[i];
    const y = padT + i * (rowH + rowGap);
    const barW = (d.value / max) * innerW;
    // Label
    ctx.fillStyle = DODO_PALETTE.charcoal;
    ctx.textAlign = 'right';
    ctx.fillText(d.label, padL - 6, y + rowH / 2);
    // Track
    ctx.fillStyle = '#0001';
    ctx.fillRect(padL, y, innerW, rowH);
    // Bar
    ctx.fillStyle = DODO_PALETTE.red;
    ctx.fillRect(padL, y, barW, rowH);
    // Highlight pixel band on left
    ctx.fillStyle = DODO_PALETTE.yellow;
    ctx.fillRect(padL, y, Math.min(3, barW), rowH);
    // Value
    ctx.textAlign = 'left';
    ctx.fillText(`${fmt(d.value)}${unit ? ' ' + unit : ''}`, padL + barW + 4, y + rowH / 2);
  }
}

function drawLine(
  ctx: CanvasRenderingContext2D,
  data: ChartDatum[],
  w: number,
  h: number,
  unit?: string,
) {
  const padL = 36;
  const padR = 8;
  const padT = 12;
  const padB = 28;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;
  const max = Math.max(...data.map((d) => d.value), 1);

  ctx.font = FONT;
  ctx.fillStyle = DODO_PALETTE.charcoal;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (let i = 0; i <= 4; i++) {
    const v = (max * (4 - i)) / 4;
    const y = padT + (innerH * i) / 4;
    ctx.strokeStyle = '#0001';
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(padL + innerW, y);
    ctx.stroke();
    ctx.fillText(fmt(v), padL - 4, y);
  }

  const stepX = innerW / Math.max(1, data.length - 1);
  // Pixel-art line: draw blocky 3px squares per data point + thick line segments
  const points = data.map((d, i) => ({
    x: padL + i * stepX,
    y: padT + innerH - (d.value / max) * innerH,
  }));

  ctx.strokeStyle = DODO_PALETTE.red;
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  }
  ctx.stroke();

  // Pixel markers
  ctx.fillStyle = DODO_PALETTE.charcoal;
  for (const p of points) {
    ctx.fillRect(Math.round(p.x) - 3, Math.round(p.y) - 3, 6, 6);
    ctx.fillStyle = DODO_PALETTE.yellow;
    ctx.fillRect(Math.round(p.x) - 2, Math.round(p.y) - 2, 4, 4);
    ctx.fillStyle = DODO_PALETTE.charcoal;
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  for (let i = 0; i < data.length; i++) {
    ctx.fillText(data[i].label, padL + i * stepX, padT + innerH + 4);
  }

  if (unit) {
    ctx.textAlign = 'left';
    ctx.fillText(unit, padL, 0);
  }
}

function drawPie(
  ctx: CanvasRenderingContext2D,
  data: ChartDatum[],
  w: number,
  h: number,
  unit?: string,
) {
  const cx = h / 2 + 10;
  const cy = h / 2;
  const radius = Math.min(h, w) / 2 - 16;
  const total = data.reduce((s, d) => s + d.value, 0) || 1;

  // Pixelated pie: draw radial pixels
  const PIX = 3;
  for (let py = 0; py < h; py += PIX) {
    for (let px = 0; px < h; px += PIX) {
      const dx = px - cx + PIX / 2;
      const dy = py - cy + PIX / 2;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > radius) continue;
      // Angle: 0 = up, clockwise
      let a = Math.atan2(dx, -dy);
      if (a < 0) a += Math.PI * 2;
      const frac = a / (Math.PI * 2);
      let acc = 0;
      let idx = 0;
      for (let i = 0; i < data.length; i++) {
        acc += data[i].value / total;
        if (frac <= acc) {
          idx = i;
          break;
        }
      }
      ctx.fillStyle = SERIES_COLORS[idx % SERIES_COLORS.length];
      ctx.fillRect(px, py, PIX, PIX);
    }
  }

  // Outline ring
  ctx.strokeStyle = DODO_PALETTE.charcoal;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();

  // Legend
  ctx.font = FONT;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  const legendX = h + 16;
  const lineH = 18;
  for (let i = 0; i < data.length; i++) {
    const y = 14 + i * lineH;
    ctx.fillStyle = SERIES_COLORS[i % SERIES_COLORS.length];
    ctx.fillRect(legendX, y - 5, 10, 10);
    ctx.fillStyle = DODO_PALETTE.charcoal;
    const pct = ((data[i].value / total) * 100).toFixed(0);
    ctx.fillText(
      `${data[i].label} — ${pct}${unit === '%' ? '%' : ''}`,
      legendX + 16,
      y,
    );
  }
}
