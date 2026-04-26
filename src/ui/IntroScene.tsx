import { useEffect, useRef } from 'react';

import { DODO_PALETTE } from '../engine/constants';
import {
  CHAR_H,
  CHAR_W,
  getCharacterSheet,
  getCharFrameRect,
  walkFrameIdx,
} from '../engine/sprites';
import { Direction } from '../engine/types';

interface IntroSceneProps {
  /** Whether Sasha is on stage */
  showSasha: boolean;
  /** Whether Vika is on stage */
  showVika: boolean;
  /** Speech bubble for Sasha (null = silent) */
  sashaBubble: string | null;
  /** Speech bubble for Vika (null = silent) */
  vikaBubble: string | null;
}

// Stage sized for 2× speech bubbles — comfortable but not overpowering.
// Extra headroom on top so multi-line bubbles never overlap the characters.
const STAGE_W = 960;
const STAGE_H = 440;
const SCENE_ZOOM = 4;
const SASHA_X = STAGE_W * 0.32;
const VIKA_X = STAGE_W * 0.68;
const FLOOR_Y = STAGE_H - 70;

/**
 * Mini-canvas that renders Sasha and Vika side-by-side during the intro.
 * Speech bubbles float above the speaking character. The scene animates
 * Sasha's walk frame and Vika's typing frame so they feel alive even when
 * silent.
 */
export function IntroScene({ showSasha, showVika, sashaBubble, vikaBubble }: IntroSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = STAGE_W * dpr;
    canvas.height = STAGE_H * dpr;
    canvas.style.width = `${STAGE_W}px`;
    canvas.style.height = `${STAGE_H}px`;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let raf = 0;
    const start = performance.now();
    const tick = () => {
      const t = (performance.now() - start) / 1000;
      drawScene(ctx, t, { showSasha, showVika, sashaBubble, vikaBubble });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [showSasha, showVika, sashaBubble, vikaBubble]);

  return <canvas ref={canvasRef} className="introCanvas" />;
}

function drawScene(
  ctx: CanvasRenderingContext2D,
  t: number,
  s: IntroSceneProps,
): void {
  // Background — a strip of dining floor under a darker wall band on top.
  ctx.fillStyle = DODO_PALETTE.wall;
  ctx.fillRect(0, 0, STAGE_W, FLOOR_Y - 40);
  // Wall trim at the floor seam
  ctx.fillStyle = DODO_PALETTE.orange;
  ctx.fillRect(0, FLOOR_Y - 42, STAGE_W, 4);
  // Floor — soft cream checker
  for (let y = FLOOR_Y - 38; y < STAGE_H; y += 16) {
    for (let x = 0; x < STAGE_W; x += 16) {
      const dark = ((Math.floor(x / 16) + Math.floor(y / 16)) % 2) === 0;
      ctx.fillStyle = dark ? '#fff7e6' : '#f4e2c2';
      ctx.fillRect(x, y, 16, 16);
    }
  }

  // Sasha — palette 4 (no tie). Standing pose with a slow walk-frame
  // shuffle so he feels alive.
  if (s.showSasha) {
    drawCharacter(ctx, 4, Direction.DOWN, walkFrameIdx(Math.floor(t * 1.6)), SASHA_X, FLOOR_Y, t);
  }
  // Vika — palette 1 (the blonde girl). Standing pose with a slightly
  // faster shuffle so she's visibly animated. Walk frames keep the
  // character full-height (legs visible); the typing frames hide the
  // legs and made Vika look truncated.
  if (s.showVika) {
    drawCharacter(ctx, 1, Direction.DOWN, walkFrameIdx(Math.floor(t * 2)), VIKA_X, FLOOR_Y, t);
  }

  // Bubble anchor sits well above each character's head so multi-line
  // bubbles never crash into the sprite.
  const bubbleAnchorY = FLOOR_Y - CHAR_H * SCENE_ZOOM - 32;
  if (s.showSasha && s.sashaBubble) {
    drawBubble(ctx, s.sashaBubble, SASHA_X, bubbleAnchorY);
  }
  if (s.showVika && s.vikaBubble) {
    drawBubble(ctx, s.vikaBubble, VIKA_X, bubbleAnchorY);
  }
}

function drawCharacter(
  ctx: CanvasRenderingContext2D,
  palette: number,
  dir: Direction,
  frameIdx: number,
  cx: number,
  feetY: number,
  t: number,
): void {
  const sheet = getCharacterSheet(palette);
  if (!sheet) return;
  const f = getCharFrameRect(sheet, dir, frameIdx);
  const drawW = CHAR_W * SCENE_ZOOM;
  const drawH = CHAR_H * SCENE_ZOOM;
  const bob = Math.round(Math.sin(t * 2) * 1);
  const x = Math.round(cx - drawW / 2);
  const y = Math.round(feetY - drawH + bob);
  ctx.drawImage(f.source, f.sx, f.sy, f.sw, f.sh, x, y, drawW, drawH);
}

// Bubble text sized 2× the original baseline.
const BUBBLE_FONT_PX = 36;
const BUBBLE_PAD_X = 24;
const BUBBLE_PAD_Y = 20;
const BUBBLE_LINE_H = 44;
const BUBBLE_MAX_WIDTH = 720;

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(test).width <= maxWidth) {
      cur = test;
    } else {
      if (cur) lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

function drawBubble(
  ctx: CanvasRenderingContext2D,
  text: string,
  anchorX: number,
  anchorY: number,
): void {
  ctx.save();
  ctx.font = `${BUBBLE_FONT_PX}px PixelSans, monospace`;
  ctx.textBaseline = 'top';
  const lines = wrap(ctx, text, BUBBLE_MAX_WIDTH - BUBBLE_PAD_X * 2);
  const wPx =
    Math.min(
      BUBBLE_MAX_WIDTH,
      Math.max(...lines.map((l) => ctx.measureText(l).width)) + BUBBLE_PAD_X * 2,
    ) | 0;
  const hPx = lines.length * BUBBLE_LINE_H + BUBBLE_PAD_Y * 2;
  let x = Math.round(anchorX - wPx / 2);
  // Keep bubble inside stage horizontally
  x = Math.max(8, Math.min(STAGE_W - wPx - 8, x));
  let y = Math.round(anchorY - hPx);
  // Keep bubble inside stage vertically
  y = Math.max(6, y);

  // Outline
  ctx.fillStyle = '#000';
  ctx.fillRect(x - 3, y - 3, wPx + 6, hPx + 6);
  // Body
  ctx.fillStyle = DODO_PALETTE.cream;
  ctx.fillRect(x, y, wPx, hPx);
  // Tail toward the character
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.moveTo(anchorX - 8, y + hPx + 2);
  ctx.lineTo(anchorX + 8, y + hPx + 2);
  ctx.lineTo(anchorX, y + hPx + 12);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = DODO_PALETTE.cream;
  ctx.beginPath();
  ctx.moveTo(anchorX - 5, y + hPx);
  ctx.lineTo(anchorX + 5, y + hPx);
  ctx.lineTo(anchorX, y + hPx + 7);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = DODO_PALETTE.charcoal;
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], x + BUBBLE_PAD_X, y + BUBBLE_PAD_Y + i * BUBBLE_LINE_H);
  }
  ctx.restore();
}
