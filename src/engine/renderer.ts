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
import { getInteractableAnchorTile, type GameState } from './gameState';

/** Set of table-surface item def-ids that participate in the intro fade-in.
 *  Hover highlight is only applied to items that also have a station
 *  interactable (checked per-item below using state.interactables). */
export const FOOD_DEF_IDS = new Set([
  'PEPERONI_PIZZA',
  'RANCH_PIZZA',
  'VEGGIE_PIZZA',
  'MUFFIN',
  'DODSTER_WRAP',
  // decorative drinks, dodo mascot, pizza box — fade in with the food reveal
  'TABLE_DODO',
  'PIZZA_BOX',
  'MILKSHAKE',
  'COFFEE_CUP',
  // legacy / decorative — kept so other layouts still highlight them
  'PIZZA',
  'PIZZA_GREEN',
  'PIZZA_WHITE',
  'BURRITO',
  'BREAD',
  'DODSTER',
]);

/** Total characters in the slogan ("ЕСТЬ ТО, ЧТО НАС" + "ОБЪЕДИНЯЕТ"). */
const SLOGAN_TOTAL_CHARS = 16 + 10;

/** Compute the slogan + food state based on play-time. The intro plays
 *  exactly once when the play stage begins.
 *    0.0 – 1.4s  slogan letters appear one-by-one (typewriter)
 *    1.4 – 3.4s  full slogan, gentle pulse glow
 *    3.4 – 4.4s  slogan fades out
 *    4.0 – 5.0s  food fades in (slight overlap with slogan fade)
 *    5.0 +       both stable (slogan gone, food fully present)
 */
function introAlphas(
  t: number,
): { slogan: number; food: number; chars: number; pulse: number } {
  let slogan: number;
  let chars: number;
  let pulse = 0;
  if (t < 1.4) {
    chars = Math.floor((t / 1.4) * SLOGAN_TOTAL_CHARS);
    slogan = 1;
  } else if (t < 3.4) {
    chars = SLOGAN_TOTAL_CHARS;
    slogan = 1;
    // 0..1 sinusoidal pulse — used for shadow blur intensity
    pulse = 0.5 + 0.5 * Math.sin((t - 1.4) * 4.2);
  } else if (t < 4.4) {
    chars = SLOGAN_TOTAL_CHARS;
    slogan = 1 - (t - 3.4);
  } else {
    chars = SLOGAN_TOTAL_CHARS;
    slogan = 0;
  }

  let food: number;
  if (t < 4.0) food = 0;
  else if (t < 5.0) food = (t - 4.0) / 1.0;
  else food = 1;

  return {
    slogan: Math.max(0, Math.min(1, slogan)),
    food: Math.max(0, Math.min(1, food)),
    chars,
    pulse: Math.max(0, Math.min(1, pulse)),
  };
}

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

  // Pre-compute intro alphas — the slogan engraving fades out, then food
  // fades in. After ~4.5s both are stable and the table looks "set".
  const alphas = introAlphas(state.introElapsed);

  // Completed-station tick — drawn over the linked NPC's tile (not a
  // fixed floor tile) so the green ring follows the visitor as they
  // wander. Static-tile interactables (e.g. legacy fixtures with no
  // npcId) fall back to their col/row.
  for (const it of state.interactables) {
    if (!state.completedStationIds.has(it.id)) continue;
    const pos = getInteractableAnchorTile(it, state);
    const tileX = offsetX + pos.col * s;
    const tileY = offsetY + pos.row * s;
    ctx.strokeStyle = DODO_PALETTE.green;
    ctx.lineWidth = Math.max(2, ZOOM);
    ctx.globalAlpha = 0.55;
    ctx.strokeRect(tileX + 1, tileY + 1, s - 2, s - 2);
    drawCompletedTick(ctx, tileX, tileY, s);
  }
  ctx.globalAlpha = 1;

  // Build draw list of furniture + characters, depth-sorted by zY (bottom edge)
  type Drawable = { zY: number; draw: () => void };
  const drawables: Drawable[] = [];

  // Track BIG_TABLE world position so the slogan overlay + dashed lines can
  // be anchored exactly on the table surface.
  let bigTableAnchor: { x: number; y: number; w: number } | null = null;

  // Pre-compute which (col,row) positions have a glow interactable so we can
  // suppress the hover-brightness on decorative items with no station.
  const stationGlowPositions = new Set<string>();
  // Also track which of those stations are still uncompleted (pulsing).
  const incompletedGlowPositions = new Set<string>();
  for (const it of state.interactables) {
    if (it.glowCol != null && it.glowRow != null) {
      stationGlowPositions.add(`${it.glowCol},${it.glowRow}`);
      if (!state.completedStationIds.has(it.id)) {
        incompletedGlowPositions.add(`${it.glowCol},${it.glowRow}`);
      }
    }
  }

  for (const item of state.furniture) {
    const def = getFurnitureDef(item.defId);
    if (!def) continue;
    const img = getFurnitureImage(def.src);
    if (!img) continue;
    const xOffset = (def.xOffsetPx ?? 0) * ZOOM;
    const x = offsetX + item.col * s + xOffset;
    const yOffset = (def.yOffsetPx ?? 0) * ZOOM;
    const y =
      offsetY + item.row * s + (def.footprintH * TILE_SIZE - def.h) * ZOOM + yOffset;
    const baseDrawW = def.w * ZOOM;
    const baseDrawH = def.h * ZOOM;
    let drawW = baseDrawW;
    let drawH = baseDrawH;
    if (def.preserveAspect && img.width > 0 && img.height > 0) {
      const scale = Math.min(baseDrawW / img.width, baseDrawH / img.height);
      drawW = img.width * scale;
      drawH = img.height * scale;
    }
    const drawX = x + (baseDrawW - drawW) / 2;
    const drawY = y + (baseDrawH - drawH);
    if (item.defId === 'BIG_TABLE') {
      bigTableAnchor = { x, y, w: drawW };
      // Dashed horizontal lines on the upper table surface — fade in with food.
      if (alphas.food > 0.01) {
        const tblX = x;
        const tblY = y;
        const tblW = drawW;
        const lineFood = alphas.food;
        drawables.push({
          zY: (item.row + 2) * TILE_SIZE + 5001,
          draw: () => {
            ctx.save();
            ctx.globalAlpha = lineFood * 0.28;
            ctx.strokeStyle = '#A07840';
            ctx.lineWidth = Math.max(1, ZOOM * 0.5);
            ctx.setLineDash([4 * ZOOM, 3 * ZOOM]);
            const pad = 4 * ZOOM;
            for (let row = 1; row <= 2; row++) {
              const ly = tblY + row * s + 0.5;
              ctx.beginPath();
              ctx.moveTo(tblX + pad, ly);
              ctx.lineTo(tblX + tblW - pad, ly);
              ctx.stroke();
            }
            ctx.setLineDash([]);
            ctx.restore();
          },
        });
      }
    }
    // Food fades in during the intro. Before it's "served" we don't
    // render it at all so it doesn't block the player's walking path
    // visually mid-fade either.
    const isFood = FOOD_DEF_IDS.has(item.defId);
    const itemAlpha = isFood ? alphas.food : 1;
    if (isFood && itemAlpha <= 0.01) continue;
    const ht = state.hoveredTile;
    // Hover/pulse highlights only apply to station items.
    const hasStation = stationGlowPositions.has(`${item.col},${item.row}`);
    const isIncompleteStation =
      isFood && alphas.food >= 1 && incompletedGlowPositions.has(`${item.col},${item.row}`);
    const isHovered =
      isFood &&
      hasStation &&
      alphas.food >= 1 &&
      ht != null &&
      ht.col >= item.col &&
      ht.col < item.col + def.footprintW &&
      ht.row >= item.row &&
      ht.row < item.row + def.footprintH;
    // Z-sort:
    //   - Surface items (pizza on table) jump way up so they always draw in
    //     front of the taller furniture they sit on.
    //   - Chair/sofa with seatLow uses the chair-z-sort from pixel-agents:
    //     cap zY to first-row bottom so a seated character renders in front.
    //   - Default: bottom-edge of the footprint.
    let zY: number;
    if (def.flat) {
      zY = -10000 + item.row * TILE_SIZE;
    } else if (def.surface) {
      zY = (item.row + def.footprintH) * TILE_SIZE + 10000;
    } else if (def.seatLow) {
      zY = (item.row + 1) * TILE_SIZE;
    } else {
      zY = (item.row + def.footprintH) * TILE_SIZE;
    }
    const wantSmoothing = def.smooth === true;
    const itemRotation = item.rotation ?? 0;
    drawables.push({
      zY,
      draw: () => {
        if (itemAlpha < 1) ctx.globalAlpha = itemAlpha;
        if (isHovered) {
          ctx.filter = 'brightness(1.55)';
        } else if (isIncompleteStation) {
          const bri = (1.05 + 0.12 * Math.sin(state.introElapsed * 1.8)).toFixed(2);
          ctx.filter = `brightness(${bri})`;
        }
        if (wantSmoothing) ctx.imageSmoothingEnabled = true;
        if (itemRotation !== 0) {
          const rcx = drawX + drawW / 2;
          const rcy = drawY + drawH / 2;
          ctx.save();
          ctx.translate(rcx, rcy);
          ctx.rotate((itemRotation * Math.PI) / 180);
          ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
          ctx.restore();
        } else if (item.mirror) {
          ctx.save();
          ctx.translate(drawX + drawW, drawY);
          ctx.scale(-1, 1);
          ctx.drawImage(img, 0, 0, drawW, drawH);
          ctx.restore();
        } else {
          ctx.drawImage(img, drawX, drawY, drawW, drawH);
        }
        if (wantSmoothing) ctx.imageSmoothingEnabled = false;
        if (isHovered || isIncompleteStation) ctx.filter = 'none';
        if (itemAlpha < 1) ctx.globalAlpha = 1;
      },
    });
  }

  // Slogan engraving overlay — drawn as a separate drawable on top of the
  // BIG_TABLE so it can be alpha-faded during the intro reveal. zY is
  // chosen to sort just above the table itself but below any food
  // surface items, so when food fades in it visually replaces the
  // slogan rather than the slogan poking through cooked food.
  if (bigTableAnchor && alphas.slogan > 0.01) {
    const anchor = bigTableAnchor;
    // BIG_TABLE is anchored at row 6 (top of the table sprite). The
    // surface where the slogan sits is the upper half of the sprite,
    // around y = top + 18..30 (in sprite px). We z-sort on the surface
    // row so the slogan paints just after the table draws.
    const tableSurfaceRow = 7; // row 6 is decorative back-rim, row 7 is surface top
    const zY = (tableSurfaceRow + 1) * TILE_SIZE + 5000;
    const sloganAlpha = alphas.slogan;
    const sloganChars = alphas.chars;
    const sloganPulse = alphas.pulse;
    drawables.push({
      zY,
      draw: () =>
        drawTableSlogan(
          ctx,
          anchor.x,
          anchor.y,
          anchor.w,
          sloganAlpha,
          sloganChars,
          sloganPulse,
        ),
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
    let seatedDrop = 0;
    if (ch.seated) {
      if (ch.dir === Direction.UP || ch.dir === Direction.DOWN) seatedDrop = 10;
      else seatedDrop = -4; // LEFT/RIGHT — sit a bit higher in the side sofa
    }
    // Booth-back sitter (seen from behind) should sit a touch higher so
    // their torso aligns better with the sofa back.
    if (ch.stillSeated && ch.dir === Direction.UP) seatedDrop = 2;
    const seatedZBoost = ch.seated ? 1000 : 0;
    const feetX = offsetX + (ch.x - CHAR_W / 2) * ZOOM;
    const feetY = offsetY + (ch.y - CHAR_H + TILE_SIZE / 2 + seatedDrop) * ZOOM;
    // Still-seated "booth back" guests (facing UP) should render behind the
    // booth sofa back so only the upper body is visible.
    const renderBehindBoothBack = ch.stillSeated && ch.dir === Direction.UP;
    const zY = renderBehindBoothBack
      ? (ch.tileRow + 1) * TILE_SIZE - 1
      : ch.y + TILE_SIZE / 2 + 0.5 + seatedDrop + seatedZBoost;
    const hasBackpack = ch.hasBackpack;
    const dirForBackpack = ch.dir;
    const dir = ch.dir;
    const hatType = ch.hatType;
    // North-sofa diners face DOWN — crop bottom 8px so legs don't show over table.
    // Booth-back guests face UP (away) — crop bottom 12px behind the sofa back.
    // Player walking into the sofa zone (row 5, cols 7-14) — crop lower body
    // so she appears to stand behind the sofa back, not float on top of it.
    const inSofaZone = ch.isPlayer && ch.tileRow === 5 && ch.tileCol >= 7 && ch.tileCol <= 14;
    const cropBottomSpritePx =
      ch.seated && ch.dir === Direction.DOWN ? 8 :
      ch.stillSeated && ch.dir === Direction.UP ? 12 :
      inSofaZone ? 8 : 0;
    const visibleSpriteH = CHAR_H - cropBottomSpritePx;
    const visibleDrawH = visibleSpriteH * ZOOM;
    drawables.push({
      zY,
      draw: () => {
        if (hasBackpack) drawBackpack(ctx, feetX, feetY, drawW, drawH, dirForBackpack, true);
        ctx.drawImage(
          f.source,
          f.sx,
          f.sy,
          f.sw,
          visibleSpriteH,
          feetX,
          feetY,
          drawW,
          visibleDrawH,
        );
        if (hasBackpack) drawBackpack(ctx, feetX, feetY, drawW, drawH, dirForBackpack, false);
        if (hatType === 'orange') drawPlayerHat(ctx, feetX, feetY, drawW, dir);
        else if (hatType === 'orangeLarge') drawPlayerHat(ctx, feetX, feetY, drawW, dir, 1.4);
        else if (hatType === 'party') drawPartyHat(ctx, feetX, feetY, drawW, dir);
      },
    });
  }

  drawables.sort((a, b) => a.zY - b.zY);
  for (const d of drawables) d.draw();

  // Bouncing orange ▼ pointer above the player's head. Restored as a
  // navigational aid after we'd briefly killed it for clutter — turns
  // out it really does help newcomers locate themselves on a busy map.
  drawPlayerPointer(ctx, state.player, offsetX, offsetY, state.introElapsed);

  // Ambient chatter bubbles — anchored to character heads.
  for (const ch of state.characters) {
    if (!ch.bubble) continue;
    let bubbleDrop = 0;
    if (ch.seated) bubbleDrop = (ch.dir === Direction.UP || ch.dir === Direction.DOWN) ? 10 : 0;
    const px = offsetX + ch.x * ZOOM;
    const py = offsetY + (ch.y - CHAR_H + TILE_SIZE / 2 + bubbleDrop - 2) * ZOOM;
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

/** Cached offscreen canvas for the pixel-art slogan. Invalidated when the
 *  visible text or table width changes. */
let sloganCache: { canvas: HTMLCanvasElement; key: string } | null = null;

/** Render text on a 1/ZOOM offscreen canvas then upscale 3× with
 *  imageSmoothingEnabled=false — produces blocky pixel-art characters. */
function drawTableSlogan(
  ctx: CanvasRenderingContext2D,
  tableScreenX: number,
  tableScreenY: number,
  tableScreenW: number,
  alpha: number,
  charsRevealed: number,
  pulse: number,
): void {
  if (alpha <= 0) return;

  const line1Full = 'ЕСТЬ ТО, ЧТО НАС';
  const line2Full = 'ОБЪЕДИНЯЕТ';
  const line1 = line1Full.substring(0, Math.min(line1Full.length, charsRevealed));
  const line2 = line2Full.substring(0, Math.max(0, charsRevealed - line1Full.length));

  // Small canvas dimensions — rendered at 1/ZOOM then upscaled for pixel look.
  const smallW = Math.ceil(tableScreenW / ZOOM);
  // Probe font size so both lines fit inside ~90% of the small canvas.
  const maxFontPx = 14;
  const probeCanvas = document.createElement('canvas');
  probeCanvas.width = smallW;
  probeCanvas.height = 4;
  const probe = probeCanvas.getContext('2d')!;
  probe.font = `bold ${maxFontPx}px monospace`;
  const probeW = probe.measureText(line1Full).width;
  const fontPx = Math.min(maxFontPx, Math.floor(maxFontPx * (smallW * 0.88) / probeW));
  const lineGap = Math.round(fontPx * 1.4);
  const smallH = fontPx + lineGap + 2;

  const cacheKey = `${line1}|${line2}|${smallW}|${fontPx}`;
  if (!sloganCache || sloganCache.key !== cacheKey) {
    const off = document.createElement('canvas');
    off.width = smallW;
    off.height = smallH;
    const oc = off.getContext('2d')!;
    oc.imageSmoothingEnabled = false;
    oc.clearRect(0, 0, smallW, smallH);
    oc.font = `bold ${fontPx}px monospace`;
    oc.textAlign = 'center';
    oc.textBaseline = 'top';
    const cx = smallW / 2;
    // Highlight pass (1 px below) — wood-burned chisel effect
    oc.fillStyle = '#E0B07A';
    oc.fillText(line1, cx, 1);
    oc.fillText(line2, cx, lineGap + 1);
    // Dark text pass
    oc.fillStyle = '#3A2308';
    oc.fillText(line1, cx, 0);
    oc.fillText(line2, cx, lineGap);
    sloganCache = { canvas: off, key: cacheKey };
  }

  const bigH = smallH * ZOOM;
  const surfaceTop = tableScreenY + TILE_SIZE * ZOOM;
  const surfaceH = 3 * TILE_SIZE * ZOOM;
  const drawY = Math.round(surfaceTop + (surfaceH - bigH) / 2);

  ctx.save();
  ctx.globalAlpha = alpha;
  if (pulse > 0) {
    ctx.shadowColor = `rgba(255, 195, 90, ${0.55 + 0.35 * pulse})`;
    ctx.shadowBlur = 6 * ZOOM * pulse;
  }
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(sloganCache.canvas, tableScreenX, drawY, tableScreenW, bigH);
  ctx.restore();
}

/** Pixel-art Dodo orange cap drawn on top of the player sprite. The cap
 *  sits above their hair, follows the four facing directions, and uses
 *  the same charcoal/orange/yellow palette as the rest of the brand. */
function drawPlayerHat(
  ctx: CanvasRenderingContext2D,
  feetX: number,
  feetY: number,
  drawW: number,
  dir: Direction,
  scale = 1,
): void {
  const px = ZOOM * scale;
  const cx = feetX + drawW / 2;
  // Larger caps shift down so they don't float above the head.
  const hatTop = feetY + Math.round((scale - 1) * 2 * ZOOM) - 2 * ZOOM;
  const cap = DODO_PALETTE.orange;
  const capDark = DODO_PALETTE.redDark;
  const charcoal = DODO_PALETTE.charcoal;
  const cream = '#FFF7E6';

  // Brim — wider than the crown so it reads as a baseball-style cap
  const brimW = 11 * px;
  const brimH = 1 * px;
  const crownW = 9 * px;
  const crownH = 3 * px;

  // Direction tweaks: when facing left/right, shift the brim toward
  // the facing side so the cap silhouette reads as a profile.
  let brimDx = 0;
  if (dir === Direction.LEFT) brimDx = -2 * px;
  else if (dir === Direction.RIGHT) brimDx = 2 * px;

  // Shadow under the brim
  ctx.fillStyle = charcoal;
  ctx.fillRect(Math.round(cx - brimW / 2 + brimDx) - px, hatTop + crownH, brimW + 2 * px, brimH + px);
  // Crown outline
  ctx.fillRect(Math.round(cx - crownW / 2) - px, hatTop - px, crownW + 2 * px, crownH + 2 * px);
  // Crown body
  ctx.fillStyle = cap;
  ctx.fillRect(Math.round(cx - crownW / 2), hatTop, crownW, crownH);
  // Crown highlight (top-left)
  ctx.fillStyle = '#FFB04A';
  ctx.fillRect(Math.round(cx - crownW / 2), hatTop, crownW, px);
  // Crown shadow band along the bottom
  ctx.fillStyle = capDark;
  ctx.fillRect(Math.round(cx - crownW / 2), hatTop + crownH - px, crownW, px);
  // Brim itself
  ctx.fillStyle = capDark;
  ctx.fillRect(Math.round(cx - brimW / 2 + brimDx), hatTop + crownH, brimW, brimH);
  // Tiny cream front-panel "DODO" tag (only when facing the camera)
  if (dir === Direction.DOWN) {
    ctx.fillStyle = cream;
    ctx.fillRect(Math.round(cx - 2 * px), hatTop + px, 4 * px, px);
  }
}

/** Procedural pixel-art party hat — conical shape in Dodo orange/yellow
 *  stripes with a cream pom-pom tip. Drawn without any external image so
 *  it always renders even before asset loading completes. */
function drawPartyHat(
  ctx: CanvasRenderingContext2D,
  feetX: number,
  feetY: number,
  drawW: number,
  _dir: Direction,
): void {
  const px = ZOOM;
  const cx = feetX + drawW / 2;
  const rows = 9;     // sprite-pixel rows in the cone body
  const top = feetY - (rows - 2) * px; // brim at feetY + 2*px (covers hair)
  const maxW = 10;    // base width in sprite pixels

  // Cone body: rows narrow from base (bottom) to apex (top).
  // Draw from top (row 0) down so outlines paint correctly.
  for (let r = 0; r < rows; r++) {
    const w = Math.round(1 + r * (maxW - 1) / (rows - 1));
    const rx = Math.round(cx - (w * px) / 2);
    const ry = Math.round(top + r * px);
    // Alternating orange/yellow stripes
    ctx.fillStyle = r % 2 === 0 ? DODO_PALETTE.orange : DODO_PALETTE.yellow;
    ctx.fillRect(rx, ry, w * px, px);
  }
  // Left/right outline along the cone edges
  ctx.fillStyle = DODO_PALETTE.charcoal;
  for (let r = 0; r < rows; r++) {
    const w = Math.round(1 + r * (maxW - 1) / (rows - 1));
    const rx = Math.round(cx - (w * px) / 2);
    const ry = Math.round(top + r * px);
    ctx.fillRect(rx - px, ry, px, px);
    ctx.fillRect(rx + w * px, ry, px, px);
  }
  // Pom-pom at apex (cream dot, charcoal stem)
  const pomX = Math.round(cx);
  ctx.fillStyle = DODO_PALETTE.charcoal;
  ctx.fillRect(pomX - px, top - 2 * px, 2 * px, 2 * px + px);
  ctx.fillStyle = '#FFF7E6';
  ctx.fillRect(pomX - px, top - 2 * px, 2 * px, 2 * px);
  // Band at base (dark-orange outline + red-dark fill)
  const baseY = Math.round(top + rows * px);
  const bandX = Math.round(cx - (maxW * px) / 2);
  ctx.fillStyle = DODO_PALETTE.charcoal;
  ctx.fillRect(bandX - px, baseY, maxW * px + 2 * px, px + px);
  ctx.fillStyle = DODO_PALETTE.redDark;
  ctx.fillRect(bandX, baseY, maxW * px, px);
}

/** Pulsing orange ▼ pointer over the player's head. Helps newcomers
 *  locate themselves on the busy map. The pointer fades in only after
 *  the intro animation so it doesn't fight the slogan reveal. */
function drawPlayerPointer(
  ctx: CanvasRenderingContext2D,
  player: Character,
  offsetX: number,
  offsetY: number,
  introElapsed: number,
): void {
  // Hold the pointer back during the intro reveal so the slogan reads
  // first. Fade it in over 0.6s once the food has finished arriving.
  const startT = 4.6;
  if (introElapsed < startT) return;
  const fadeT = Math.min(1, (introElapsed - startT) / 0.6);
  const t = performance.now() / 1000;
  const bob = Math.sin(t * 3) * 2 * ZOOM;
  const px = offsetX + player.x * ZOOM;
  const py = offsetY + (player.y - CHAR_H + TILE_SIZE / 2 - 6) * ZOOM + bob;

  ctx.save();
  ctx.globalAlpha = fadeT;
  // Charcoal outline triangle (slightly larger)
  ctx.fillStyle = DODO_PALETTE.charcoal;
  ctx.beginPath();
  ctx.moveTo(px - 8 * ZOOM, py - 7 * ZOOM);
  ctx.lineTo(px + 8 * ZOOM, py - 7 * ZOOM);
  ctx.lineTo(px, py + 1 * ZOOM);
  ctx.closePath();
  ctx.fill();
  // Orange fill triangle
  ctx.fillStyle = DODO_PALETTE.orange;
  ctx.beginPath();
  ctx.moveTo(px - 6 * ZOOM, py - 6 * ZOOM);
  ctx.lineTo(px + 6 * ZOOM, py - 6 * ZOOM);
  ctx.lineTo(px, py - 0 * ZOOM);
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

/** Hit-test a screen click against an interactable. Scans ALL interactables
 *  (matches dodo-game) and returns the closest match within s*1.4 of the
 *  click. Walking + opening the modal is click-driven; `pendingInteract` in
 *  GameCanvas opens on arrival when the click targeted a station from afar. */
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
    // Items on the table use a footprint-aware tile-rect hit test so any of
    // a 2×2 pizza's tiles registers a clean hit. Other interactables fall
    // back to a screen-radius zone around their tile.
    if (it.glowCol != null && it.glowRow != null) {
      const fw = it.glowFootprintW ?? 1;
      const fh = it.glowFootprintH ?? 1;
      const x0 = offsetX + it.glowCol * s;
      const y0 = offsetY + it.glowRow * s;
      const x1 = x0 + fw * s;
      const y1 = y0 + fh * s;
      if (screenX >= x0 && screenX < x1 && screenY >= y0 && screenY < y1) {
        // Distance from rect center for tie-breaking
        const cx = (x0 + x1) / 2;
        const cy = (y0 + y1) / 2;
        const dist = Math.max(Math.abs(screenX - cx), Math.abs(screenY - cy));
        if (!best || dist < best.dist) best = { it, dist };
      }
      continue;
    }
    const cx = offsetX + it.col * s + s / 2;
    const cy = offsetY + it.row * s + s / 2;
    const dx = screenX - cx;
    const dy = screenY - cy + s * 0.7;
    const dist = Math.max(Math.abs(dx), Math.abs(dy));
    if (dist <= s * 1.4) {
      if (!best || dist < best.dist) best = { it, dist };
    }
  }
  return best ? best.it : null;
}

/** Returns true if `tile` lies inside any table-surface food/dodster
 *  footprint. Used by the click handler to route table-item clicks to the
 *  active station rather than walking the player to a blocked surface tile
 *  (which would otherwise route them around to the north of the table and
 *  collide with the seated diners). */
export function isTableFoodTile(
  state: GameState,
  tile: { col: number; row: number },
): boolean {
  for (const item of state.furniture) {
    if (!FOOD_DEF_IDS.has(item.defId)) continue;
    const def = getFurnitureDef(item.defId);
    if (!def) continue;
    if (
      tile.col >= item.col &&
      tile.col < item.col + def.footprintW &&
      tile.row >= item.row &&
      tile.row < item.row + def.footprintH
    ) {
      return true;
    }
  }
  return false;
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
