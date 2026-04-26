import { getFurnitureDef } from '../scene/furnitureCatalog';
import { BUBBLE_FADE_SEC, DODO_PALETTE, ZOOM } from './constants';
import {
  CHAR_H,
  CHAR_W,
  getCharacterSheet,
  getCharFrameRect,
  getFurnitureImage,
  typeFrameIdx,
  walkFrameIdx,
} from './sprites';
import {
  CharacterState,
  Direction,
  TILE_SIZE,
  TileType,
  type Character,
  type Interactable,
} from './types';
import type { GameState } from './gameState';

const TILE_COLORS: Record<TileType, string> = {
  [TileType.WALL]: DODO_PALETTE.wall,
  [TileType.FLOOR]: '#F4E2C2',
  [TileType.KITCHEN]: '#D9D2C5',
  [TileType.DINING]: '#FFF7E6',
  [TileType.COUNTER]: '#3A2018',
  [TileType.CARPET]: '#B73A2E',
  [TileType.VOID]: '#000000',
};

/** Subtle checker tint for a tile, returns hex with slight darkening on alternating tiles. */
function tileFill(tile: TileType, col: number, row: number): string {
  const base = TILE_COLORS[tile];
  if (tile === TileType.DINING || tile === TileType.FLOOR || tile === TileType.KITCHEN) {
    if ((col + row) % 2 === 0) {
      return base;
    }
    // Darken slightly
    return shadeHex(base, -0.04);
  }
  if (tile === TileType.CARPET) {
    if ((col + row) % 2 === 0) return base;
    return shadeHex(base, -0.06);
  }
  return base;
}

function shadeHex(hex: string, pct: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const sh = (v: number) => Math.max(0, Math.min(255, Math.round(v + v * pct)));
  return `#${sh(r).toString(16).padStart(2, '0')}${sh(g).toString(16).padStart(2, '0')}${sh(b).toString(16).padStart(2, '0')}`;
}

export interface Camera {
  x: number;
  y: number;
}

export function renderFrame(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  camera: Camera,
  viewportW: number,
  viewportH: number,
): void {
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = DODO_PALETTE.charcoal;
  ctx.fillRect(0, 0, viewportW, viewportH);

  const s = TILE_SIZE * ZOOM;
  const offsetX = Math.round(viewportW / 2 - camera.x * ZOOM);
  const offsetY = Math.round(viewportH / 2 - camera.y * ZOOM);

  // Floor + walls
  for (let r = 0; r < state.rows; r++) {
    for (let c = 0; c < state.cols; c++) {
      const tile = state.tileMap[r][c];
      if (tile === TileType.VOID) continue;
      ctx.fillStyle = tileFill(tile, c, r);
      ctx.fillRect(offsetX + c * s, offsetY + r * s, s, s);
    }
  }

  // Wall accent: top edge highlight on walls (Dodo red trim)
  for (let r = 0; r < state.rows; r++) {
    for (let c = 0; c < state.cols; c++) {
      const tile = state.tileMap[r][c];
      if (tile !== TileType.WALL) continue;
      // Bottom edge of wall (where it meets floor) — paint dodo-red strip
      const below = r + 1 < state.rows ? state.tileMap[r + 1][c] : TileType.VOID;
      if (below !== TileType.WALL && below !== TileType.VOID) {
        ctx.fillStyle = DODO_PALETTE.red;
        ctx.fillRect(offsetX + c * s, offsetY + (r + 1) * s - 2 * ZOOM, s, 2 * ZOOM);
      }
    }
  }

  // Interactable highlights: pulsing yellow ring while pending; green + tick when done.
  const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 350);
  for (const it of state.interactables) {
    const isActive = it.id === state.activePromptId;
    const isCompleted = state.completedStationIds.has(it.id);

    if (isCompleted) {
      ctx.strokeStyle = DODO_PALETTE.green;
      ctx.lineWidth = Math.max(2, ZOOM);
      ctx.globalAlpha = isActive ? 0.95 : 0.7;
      ctx.strokeRect(offsetX + it.col * s + 1, offsetY + it.row * s + 1, s - 2, s - 2);
      if (isActive) {
        ctx.globalAlpha = 0.65;
        ctx.strokeRect(offsetX + it.col * s - 2, offsetY + it.row * s - 2, s + 4, s + 4);
      }
      drawCompletedTick(ctx, offsetX + it.col * s, offsetY + it.row * s, s);
    } else {
      ctx.strokeStyle = DODO_PALETTE.yellow;
      ctx.lineWidth = Math.max(2, ZOOM);
      ctx.globalAlpha = isActive ? 0.55 + pulse * 0.45 : 0.18 + pulse * 0.18;
      ctx.strokeRect(offsetX + it.col * s + 1, offsetY + it.row * s + 1, s - 2, s - 2);
      if (isActive) {
        ctx.globalAlpha = 0.35 + pulse * 0.35;
        ctx.strokeRect(offsetX + it.col * s - 2, offsetY + it.row * s - 2, s + 4, s + 4);
      }
    }
  }
  ctx.globalAlpha = 1;

  // Build draw list of furniture + characters, depth-sorted by zY (bottom edge)
  type Drawable = { zY: number; draw: () => void };
  const drawables: Drawable[] = [];

  for (const item of state.furniture) {
    const def = getFurnitureDef(item.defId);
    if (!def) continue;
    const img = getFurnitureImage(def.src);
    if (!img) continue;
    const x = offsetX + item.col * s;
    const yOffset = (def.yOffsetPx ?? 0) * ZOOM;
    const y =
      offsetY + item.row * s + (def.footprintH * TILE_SIZE - def.h) * ZOOM + yOffset;
    const drawW = def.w * ZOOM;
    const drawH = def.h * ZOOM;
    // Z-sort:
    //   - Surface items (pizza on table) jump way up so they always draw in
    //     front of the taller furniture they sit on.
    //   - Chair/sofa with seatLow uses the chair-z-sort from pixel-agents:
    //     cap zY to first-row bottom so a seated character renders in front.
    //   - Default: bottom-edge of the footprint.
    let zY: number;
    if (def.surface) {
      zY = (item.row + def.footprintH) * TILE_SIZE + 10000;
    } else if (def.seatLow) {
      zY = (item.row + 1) * TILE_SIZE;
    } else {
      zY = (item.row + def.footprintH) * TILE_SIZE;
    }
    drawables.push({
      zY,
      draw: () => {
        if (item.mirror) {
          ctx.save();
          ctx.translate(x + drawW, y);
          ctx.scale(-1, 1);
          ctx.drawImage(img, 0, 0, drawW, drawH);
          ctx.restore();
        } else {
          ctx.drawImage(img, x, y, drawW, drawH);
        }
      },
    });
  }

  for (const ch of state.characters) {
    const sheet = getCharacterSheet(ch.paletteIndex);
    if (!sheet) continue;
    let frameIdx = 0;
    if (ch.state === CharacterState.WALK) frameIdx = walkFrameIdx(ch.frame);
    else if (ch.state === CharacterState.TYPE) frameIdx = typeFrameIdx(ch.frame);
    else frameIdx = 0;
    const f = getCharFrameRect(sheet, ch.dir, frameIdx);
    const drawW = CHAR_W * ZOOM;
    const drawH = CHAR_H * ZOOM;
    // Anchor: feet at character's tile center bottom; seated diners drop
    // by ~10 px so they look like they're leaning into the table, and
    // their zY is boosted so they always draw in front of nearby
    // furniture (sofa, table top decoration, etc.) — same trick
    // pixel-agents uses.
    const seatedDrop = ch.seated ? 10 : 0;
    const seatedZBoost = ch.seated ? 1000 : 0;
    const feetX = offsetX + (ch.x - CHAR_W / 2) * ZOOM;
    const feetY = offsetY + (ch.y - CHAR_H + TILE_SIZE / 2 + seatedDrop) * ZOOM;
    const zY = ch.y + TILE_SIZE / 2 + 0.5 + seatedDrop + seatedZBoost;
    const isPlayer = ch.isPlayer;
    const hasBackpack = ch.hasBackpack;
    const dirForBackpack = ch.dir;
    drawables.push({
      zY,
      draw: () => {
        if (hasBackpack) drawBackpack(ctx, feetX, feetY, drawW, drawH, dirForBackpack, true);
        ctx.drawImage(f.source, f.sx, f.sy, f.sw, f.sh, feetX, feetY, drawW, drawH);
        if (hasBackpack) drawBackpack(ctx, feetX, feetY, drawW, drawH, dirForBackpack, false);
        if (isPlayer) drawPlayerMarker(ctx, feetX + drawW / 2, feetY - 4 * ZOOM);
      },
    });
  }

  drawables.sort((a, b) => a.zY - b.zY);
  for (const d of drawables) d.draw();

  // Yellow waypoint triangles above station tiles (after furniture).
  for (const it of state.interactables) {
    const cx = offsetX + it.col * s + s / 2;
    const cy = offsetY + it.row * s - 2 * ZOOM;
    drawStationTriangleMarker(ctx, cx, cy);
  }

  // Speech bubbles drawn on top in DOM-pixel space (still scaled by ZOOM).
  // Bubble anchor follows the character's *visual* head, accounting for the
  // seated drop, so seated diners' bubbles sit just above their heads
  // instead of floating high above the un-seated position.
  for (const ch of state.characters) {
    if (!ch.bubble) continue;
    const seatedDrop = ch.seated ? 10 : 0;
    const px = offsetX + ch.x * ZOOM;
    const py = offsetY + (ch.y - CHAR_H + TILE_SIZE / 2 + seatedDrop - 2) * ZOOM;
    drawSpeechBubble(ctx, ch.bubble.text, px, py, ch.bubble.remaining);
  }
}

/**
 * Draw a chunky pixel-art delivery backpack on a character. Called twice per
 * character render — first as a "behind" pass (drawn before the character so
 * it appears behind their head/body when facing the camera) and again as a
 * "front" pass (drawn over the character when they face away).
 */
function drawBackpack(
  ctx: CanvasRenderingContext2D,
  feetX: number,
  feetY: number,
  drawW: number,
  _drawH: number,
  dir: Direction,
  isBehindPass: boolean,
): void {
  // Backpack shape (in sprite-pixel units, ZOOM applied):
  //   16 wide, 18 tall block sitting roughly between the character's
  //   shoulders. Painted in Dodo orange with a charcoal outline and a
  //   small yellow logo strip.
  const facingAway = dir === Direction.UP;
  const facingDown = dir === Direction.DOWN;
  if (facingAway && isBehindPass) return; // back is visible — draw on the front pass
  if (!facingAway && !isBehindPass) return; // front-facing character — draw behind
  const px = ZOOM;
  const cx = feetX + drawW / 2;
  // Vertical position: backpack sits on the upper third of the sprite
  const top = feetY + 6 * px;
  // Horizontal offset for side-facing characters so the pack hangs off one
  // shoulder rather than centered.
  let dx = 0;
  if (dir === Direction.LEFT) dx = 2 * px;
  else if (dir === Direction.RIGHT) dx = -2 * px;
  const w = 11 * px;
  const h = 14 * px;
  const left = Math.round(cx - w / 2 + dx);
  const t = Math.round(top);
  // Outline
  ctx.fillStyle = DODO_PALETTE.charcoal;
  ctx.fillRect(left - px, t - px, w + 2 * px, h + 2 * px);
  // Body
  ctx.fillStyle = DODO_PALETTE.orange;
  ctx.fillRect(left, t, w, h);
  // Top flap
  ctx.fillStyle = DODO_PALETTE.redDark;
  ctx.fillRect(left, t, w, 3 * px);
  // Yellow strap / logo strip
  ctx.fillStyle = DODO_PALETTE.yellow;
  ctx.fillRect(left + 2 * px, t + 5 * px, w - 4 * px, 2 * px);
  // Two carry-strap shoulders for the front-facing variants only
  if (facingDown) {
    ctx.fillStyle = DODO_PALETTE.charcoal;
    ctx.fillRect(left - 2 * px, t + px, 2 * px, 5 * px);
    ctx.fillRect(left + w, t + px, 2 * px, 5 * px);
  }
}

function drawCompletedTick(
  ctx: CanvasRenderingContext2D,
  tileX: number,
  tileY: number,
  tileSize: number,
): void {
  // Pixel-art checkmark inside a small green circle in the top-right of the tile
  ctx.save();
  ctx.globalAlpha = 1;
  const r = Math.round(tileSize * 0.28);
  const cx = tileX + tileSize - r - 2;
  const cy = tileY + r + 2;
  // Outline circle
  ctx.fillStyle = DODO_PALETTE.charcoal;
  ctx.beginPath();
  ctx.arc(cx, cy, r + 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = DODO_PALETTE.green;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  // Pixel checkmark
  ctx.fillStyle = '#FFFFFF';
  const px = Math.max(2, Math.floor(r / 4));
  // Diagonal up-right (4 px), then up-right longer (6 px) — emulating a chunky check
  ctx.fillRect(cx - px * 2, cy, px, px);
  ctx.fillRect(cx - px, cy + px, px, px);
  ctx.fillRect(cx, cy, px, px);
  ctx.fillRect(cx + px, cy - px, px, px);
  ctx.fillRect(cx + px * 2, cy - px * 2, px, px);
  ctx.restore();
}

/** Small down-pointing triangle above a station tile (corporate yellow + outline). */
function drawStationTriangleMarker(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
  const px = ZOOM;
  const halfW = 5 * px;
  const h = 5 * px;
  const pad = px;
  ctx.save();
  ctx.translate(Math.round(cx), Math.round(cy));
  // Outline
  ctx.fillStyle = DODO_PALETTE.charcoal;
  ctx.beginPath();
  ctx.moveTo(-halfW - pad, -pad);
  ctx.lineTo(halfW + pad, -pad);
  ctx.lineTo(0, h + pad);
  ctx.closePath();
  ctx.fill();
  // Fill
  ctx.fillStyle = DODO_PALETTE.yellow;
  ctx.beginPath();
  ctx.moveTo(-halfW, 0);
  ctx.lineTo(halfW, 0);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawPlayerMarker(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
  const t = (performance.now() / 400) % (Math.PI * 2);
  const bob = Math.sin(t) * 2;
  const pad = 2;
  // Pixel chevron (down-pointing arrow) in Dodo orange with charcoal outline
  ctx.save();
  ctx.translate(Math.round(cx), Math.round(cy + bob));
  // Outline
  ctx.fillStyle = DODO_PALETTE.charcoal;
  ctx.fillRect(-7 - pad, -10 - pad, 14 + pad * 2, 6 + pad * 2);
  ctx.beginPath();
  ctx.moveTo(-7 - pad, -4 - pad);
  ctx.lineTo(7 + pad, -4 - pad);
  ctx.lineTo(0, 6 + pad);
  ctx.closePath();
  ctx.fill();
  // Fill — corporate orange
  ctx.fillStyle = DODO_PALETTE.orange;
  ctx.fillRect(-7, -10, 14, 6);
  ctx.beginPath();
  ctx.moveTo(-7, -4);
  ctx.lineTo(7, -4);
  ctx.lineTo(0, 6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// ── Speech bubble ──────────────────────────────────────────────────

// In-game speech bubbles — sized to be readable across the room without
// dominating the screen.
const BUBBLE_FONT_PX = 26;
const BUBBLE_PAD_X = 14;
const BUBBLE_PAD_Y = 12;
const BUBBLE_LINE_H = 30;
const BUBBLE_MAX_WIDTH_PX = 480;

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const w of words) {
    const test = current ? `${current} ${w}` : w;
    if (ctx.measureText(test).width <= maxWidth) {
      current = test;
    } else {
      if (current) lines.push(current);
      current = w;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function drawSpeechBubble(
  ctx: CanvasRenderingContext2D,
  text: string,
  anchorX: number,
  anchorY: number,
  remaining: number,
): void {
  ctx.save();
  ctx.font = `${BUBBLE_FONT_PX}px PixelSans, monospace`;
  ctx.textBaseline = 'top';
  const lines = wrapText(ctx, text, BUBBLE_MAX_WIDTH_PX - BUBBLE_PAD_X * 2);
  const w =
    Math.min(
      BUBBLE_MAX_WIDTH_PX,
      Math.max(...lines.map((l) => ctx.measureText(l).width)) + BUBBLE_PAD_X * 2,
    ) | 0;
  const h = lines.length * BUBBLE_LINE_H + BUBBLE_PAD_Y * 2;
  const x = Math.round(anchorX - w / 2);
  const y = Math.round(anchorY - h - 6);

  const fade = Math.min(1, remaining / BUBBLE_FADE_SEC);
  ctx.globalAlpha = fade;

  // Black outline (scaled to match the font)
  ctx.fillStyle = '#000';
  ctx.fillRect(x - 3, y - 3, w + 6, h + 6);
  // White body
  ctx.fillStyle = '#FFF7E6';
  ctx.fillRect(x, y, w, h);
  // Tail
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.moveTo(anchorX - 7, y + h);
  ctx.lineTo(anchorX + 7, y + h);
  ctx.lineTo(anchorX, y + h + 10);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#FFF7E6';
  ctx.beginPath();
  ctx.moveTo(anchorX - 4, y + h);
  ctx.lineTo(anchorX + 4, y + h);
  ctx.lineTo(anchorX, y + h + 6);
  ctx.closePath();
  ctx.fill();

  // Text
  ctx.fillStyle = '#1A1A1A';
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], x + BUBBLE_PAD_X, y + BUBBLE_PAD_Y + i * BUBBLE_LINE_H);
  }
  ctx.restore();
}

/** Hit-test a screen click against an interactable. Hit area is a 3x3 tile
 *  region centered on the interactable tile, plus a generous slop above so
 *  clicks on tall furniture sprites still register. */
export function hitTestInteractable(
  state: GameState,
  camera: Camera,
  viewportW: number,
  viewportH: number,
  screenX: number,
  screenY: number,
): Interactable | null {
  const s = TILE_SIZE * ZOOM;
  const offsetX = Math.round(viewportW / 2 - camera.x * ZOOM);
  const offsetY = Math.round(viewportH / 2 - camera.y * ZOOM);
  let best: { it: Interactable; dist: number } | null = null;
  for (const it of state.interactables) {
    const cx = offsetX + it.col * s + s / 2;
    const cy = offsetY + it.row * s + s / 2;
    const dx = screenX - cx;
    // Bias upward (negative y) so clicks above the tile (on tall furniture) hit
    const dy = (screenY - cy) + s * 0.7;
    const dist = Math.max(Math.abs(dx), Math.abs(dy));
    if (dist <= s * 1.4) {
      if (!best || dist < best.dist) best = { it, dist };
    }
  }
  return best ? best.it : null;
}

/** Convert screen coords to tile coords */
export function screenToTile(
  camera: Camera,
  viewportW: number,
  viewportH: number,
  screenX: number,
  screenY: number,
): { col: number; row: number } {
  const s = TILE_SIZE * ZOOM;
  const offsetX = Math.round(viewportW / 2 - camera.x * ZOOM);
  const offsetY = Math.round(viewportH / 2 - camera.y * ZOOM);
  return {
    col: Math.floor((screenX - offsetX) / s),
    row: Math.floor((screenY - offsetY) / s),
  };
}
