/**
 * Sprite loader: characters and furniture.
 *
 * Characters: 112×96 PNG, 3 direction rows (down, up, right) × 7 frames.
 * Frame layout in each row: walk-1, walk-2, walk-3, type-1, type-2, read-1, read-2.
 * Each frame is 16×32 (CHAR_W × CHAR_H).
 */
import { Direction } from './types';

export const CHAR_W = 16;
export const CHAR_H = 32;
export const CHAR_FRAMES_PER_ROW = 7;
export const CHAR_PALETTE_COUNT = 6;

export interface CharacterSheet {
  /** Source image, used with drawImage for sub-rect rendering */
  img: HTMLImageElement;
  /** Pre-rendered horizontally-flipped image for left-facing frames */
  imgFlipped: HTMLCanvasElement;
}

const charSheets: (CharacterSheet | null)[] = new Array(CHAR_PALETTE_COUNT).fill(null);
const furnitureImgs = new Map<string, HTMLImageElement>();
let assetsReady = false;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${src}`));
    img.src = withBase(src);
  });
}

/** Prepend Vite's BASE_URL to absolute-rooted asset paths so they resolve
 *  correctly when the site is hosted at `https://user.github.io/repo/`.
 *  Leaves data:, blob:, http(s):, and synthetic:// URLs alone. */
function withBase(src: string): string {
  if (
    src.startsWith('http://') ||
    src.startsWith('https://') ||
    src.startsWith('data:') ||
    src.startsWith('blob:') ||
    src.startsWith('synthetic://')
  ) {
    return src;
  }
  const base = import.meta.env.BASE_URL || '/';
  // Trim leading slash off src so we don't end up with "//".
  const trimmed = src.startsWith('/') ? src.slice(1) : src;
  // Trim trailing slash off base for clean concat.
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  return `${cleanBase}${trimmed}`;
}

function flipHorizontal(img: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.translate(img.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(img, 0, 0);
  return canvas;
}

export async function loadCharacterSheets(): Promise<void> {
  for (let i = 0; i < CHAR_PALETTE_COUNT; i++) {
    const img = await loadImage(`/characters/char_${i}.png`);
    charSheets[i] = { img, imgFlipped: flipHorizontal(img) };
  }
}

export function getCharacterSheet(paletteIndex: number): CharacterSheet | null {
  return charSheets[paletteIndex % CHAR_PALETTE_COUNT];
}

/** Compute frame source rect for a character, given direction and frame index 0-6.
 *  Returns {sx, sy, sw, sh, source} where source is the right image to draw from. */
export interface CharFrameRect {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  source: CanvasImageSource;
}

export function getCharFrameRect(
  sheet: CharacterSheet,
  dir: Direction,
  frameIdx: number,
): CharFrameRect {
  // Direction rows: down=0, up=1, right=2 ; left = flipped right
  let row = 0;
  let useFlipped = false;
  switch (dir) {
    case Direction.DOWN:
      row = 0;
      break;
    case Direction.UP:
      row = 1;
      break;
    case Direction.RIGHT:
      row = 2;
      break;
    case Direction.LEFT:
      row = 2;
      useFlipped = true;
      break;
  }
  const source = useFlipped ? sheet.imgFlipped : sheet.img;
  const totalRowW = CHAR_FRAMES_PER_ROW * CHAR_W;
  // For flipped image, frame indexes are mirrored around the row width
  const sxBase = frameIdx * CHAR_W;
  const sx = useFlipped ? totalRowW - sxBase - CHAR_W : sxBase;
  return { sx, sy: row * CHAR_H, sw: CHAR_W, sh: CHAR_H, source };
}

/** Frame index for walk animation (4-step cycle: 0, 1, 2, 1) */
export function walkFrameIdx(frame: number): number {
  const cycle = [0, 1, 2, 1];
  return cycle[frame % 4];
}

/** Frame index for typing (alternates frames 3 and 4) */
export function typeFrameIdx(frame: number): number {
  return 3 + (frame % 2);
}

// ── Furniture ──────────────────────────────────────────────────

/** Anything drawImage accepts works as a furniture sprite; we mix loaded
 *  PNGs with synthetic canvases (e.g. the procedural pizza). */
export type FurnitureSprite = HTMLImageElement | HTMLCanvasElement;

const furnitureCanvases = new Map<string, HTMLCanvasElement>();

export interface FurnitureImageRequest {
  src: string;
  /** Optional post-load tint applied to every non-transparent pixel,
   *  preserving lightness and alpha. Used to recolor stock sprites to
   *  match the Dodo corporate palette. */
  tint?: 'orange';
}

export async function loadFurnitureImages(
  requests: Array<string | FurnitureImageRequest>,
): Promise<void> {
  const pending = requests
    .map((r): FurnitureImageRequest => (typeof r === 'string' ? { src: r } : r))
    .filter(
      (req) =>
        !req.src.startsWith('synthetic://') &&
        !furnitureImgs.has(req.src) &&
        !furnitureCanvases.has(req.src),
    );
  await Promise.all(
    pending.map(async (req) => {
      const img = await loadImage(req.src);
      if (req.tint === 'orange') {
        furnitureCanvases.set(req.src, tintImageOrange(img));
      } else {
        furnitureImgs.set(req.src, img);
      }
    }),
  );
}

/**
 * Recolor every non-transparent pixel of an image to the corporate orange,
 * preserving the original pixel's lightness and alpha. Effectively a "Hue"
 * blend: we keep the shading detail of the original sprite but swap the hue.
 */
function tintImageOrange(img: HTMLImageElement): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = img.width;
  c.height = img.height;
  const ctx = c.getContext('2d');
  if (!ctx) return c;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, c.width, c.height);
  const d = data.data;
  // Target hue: Dodo orange #FF6900 → roughly H=24°, S=100%, L=50%.
  // For each pixel, compute its lightness and rebuild as orange of the same L.
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue;
    const r = d[i] / 255;
    const g = d[i + 1] / 255;
    const b = d[i + 2] / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    // Build orange-with-lightness-l using a simple ramp:
    //   l=0   -> #000000
    //   l=0.5 -> #FF6900
    //   l=1   -> #FFFFFF
    let outR: number;
    let outG: number;
    let outB: number;
    if (l <= 0.5) {
      const f = l / 0.5;
      outR = 255 * f;
      outG = 105 * f;
      outB = 0;
    } else {
      const f = (l - 0.5) / 0.5;
      outR = 255;
      outG = 105 + (255 - 105) * f;
      outB = 0 + 255 * f;
    }
    d[i] = Math.round(outR);
    d[i + 1] = Math.round(outG);
    d[i + 2] = Math.round(outB);
  }
  ctx.putImageData(data, 0, 0);
  return c;
}

export function getFurnitureImage(src: string): FurnitureSprite | null {
  return furnitureImgs.get(src) ?? furnitureCanvases.get(src) ?? null;
}

/** Register a procedurally-built canvas as a furniture sprite under `src`. */
export function registerSyntheticSprite(src: string, canvas: HTMLCanvasElement): void {
  furnitureCanvases.set(src, canvas);
}

/** Build all procedural pixel-art sprites that the catalog references via
 *  `synthetic://...` paths. Idempotent. */
export function buildSyntheticSprites(): void {
  buildPizza();
  buildPizzaGreen();
  buildPizzaWhite();
  buildCash();
  buildBurrito();
  buildBreadBasket();
  buildSamovar();
  buildDodoTableDecal();
  buildBigTable();
  buildRug();
  buildWindow();
  buildPainting();
  buildFridge();
  buildExitDoor();
  buildSmallEmptyTable();
  buildStationDiscs();
}

/** Six coloured glass pucks on the table — one colour per guided station. */
function buildStationDiscs(): void {
  const colors = [
    '#FF6900',
    '#FFD23F',
    '#62D26F',
    '#4DA3FF',
    '#E04444',
    '#B388FF',
  ];
  for (let i = 0; i < colors.length; i++) {
    const src = `synthetic://station-disc-${i}`;
    if (furnitureCanvases.has(src)) continue;
    const W = 16;
    const H = 16;
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const ctx = c.getContext('2d');
    if (!ctx) continue;
    ctx.imageSmoothingEnabled = false;
    const body = colors[i]!;
    const dark = '#1a1208';
    const hi = '#FFF7E6';
    // Outline + glassy fill
    ctx.fillStyle = dark;
    ctx.fillRect(2, 2, W - 4, H - 4);
    ctx.fillStyle = body;
    ctx.fillRect(3, 3, W - 6, H - 6);
    // Highlight arc (top-left)
    ctx.fillStyle = hi;
    ctx.fillRect(4, 4, 4, 2);
    ctx.fillRect(4, 4, 2, 4);
    // Inner dark ring
    ctx.fillStyle = dark;
    ctx.fillRect(6, 6, 4, 4);
    ctx.fillStyle = body;
    ctx.fillRect(7, 7, 2, 2);
    registerSyntheticSprite(src, c);
  }
}

function buildPizza(): void {
  if (furnitureCanvases.has('synthetic://pizza')) return;
  const c = document.createElement('canvas');
  c.width = 32;
  c.height = 16;
  const ctx = c.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  // Board (wooden cutting board, oval-ish)
  drawPixelOval(ctx, 16, 9, 14, 6, '#8b5a2b');
  drawPixelOval(ctx, 16, 9, 14, 6, '#8b5a2b');
  // Crust ring
  drawPixelOval(ctx, 16, 8, 12, 5, '#c98a4b');
  // Sauce
  drawPixelOval(ctx, 16, 8, 10, 4, '#d83a2a');
  // Cheese highlights (small yellow-cream blobs)
  putPixel(ctx, 11, 7, '#ffe066');
  putPixel(ctx, 13, 6, '#ffe066');
  putPixel(ctx, 18, 6, '#ffe066');
  putPixel(ctx, 21, 7, '#ffe066');
  putPixel(ctx, 12, 9, '#ffe066');
  putPixel(ctx, 19, 9, '#ffe066');
  // Pepperoni dots (darker red)
  putPixel(ctx, 10, 8, '#a31c14');
  putPixel(ctx, 14, 7, '#a31c14');
  putPixel(ctx, 17, 9, '#a31c14');
  putPixel(ctx, 20, 7, '#a31c14');
  putPixel(ctx, 22, 9, '#a31c14');
  // Tiny basil leaves (green)
  putPixel(ctx, 15, 9, '#4a8b3a');
  putPixel(ctx, 19, 8, '#4a8b3a');
  // Crust shadow on bottom edge
  for (let x = 6; x <= 26; x++) putPixel(ctx, x, 12, '#5e3a18');
  registerSyntheticSprite('synthetic://pizza', c);
}

/** Variant pizza — pesto/green sauce with mozzarella balls, mushrooms,
 *  and basil. Same shape as the classic pizza but a clearly different
 *  palette so two pizzas on the same table read as two different pies. */
function buildPizzaGreen(): void {
  if (furnitureCanvases.has('synthetic://pizza-green')) return;
  const c = document.createElement('canvas');
  c.width = 32;
  c.height = 16;
  const ctx = c.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  // Wood board
  drawPixelOval(ctx, 16, 9, 14, 6, '#8b5a2b');
  // Crust ring (slightly more golden than classic)
  drawPixelOval(ctx, 16, 8, 12, 5, '#dca465');
  // Pesto sauce — bright herb green
  drawPixelOval(ctx, 16, 8, 10, 4, '#6c9f3a');
  // White mozzarella balls (cream highlights)
  putPixel(ctx, 11, 7, '#fff8e0');
  putPixel(ctx, 13, 6, '#fff8e0');
  putPixel(ctx, 18, 6, '#fff8e0');
  putPixel(ctx, 21, 7, '#fff8e0');
  putPixel(ctx, 12, 9, '#fff8e0');
  putPixel(ctx, 19, 9, '#fff8e0');
  // Mushroom slices (warm beige)
  putPixel(ctx, 10, 8, '#d2a373');
  putPixel(ctx, 14, 7, '#d2a373');
  putPixel(ctx, 17, 9, '#d2a373');
  putPixel(ctx, 20, 7, '#d2a373');
  putPixel(ctx, 22, 9, '#d2a373');
  // Darker basil leaves
  putPixel(ctx, 15, 9, '#2f5e22');
  putPixel(ctx, 19, 8, '#2f5e22');
  // Crust shadow on bottom edge
  for (let x = 6; x <= 26; x++) putPixel(ctx, x, 12, '#5e3a18');
  registerSyntheticSprite('synthetic://pizza-green', c);
}

/** A 16×16 pixel burrito held foil-down — the way you actually grip a
 *  to-go burrito. Top half: warm-brown burrito (the eating end).
 *  Bottom half: silver foil wrapper with a jagged top edge. */
function buildBurrito(): void {
  if (furnitureCanvases.has('synthetic://burrito')) return;
  const c = document.createElement('canvas');
  c.width = 16;
  c.height = 16;
  const ctx = c.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;

  // Burrito body — fat oval across the top half (the eating end)
  const burritoOutline = '#3a2308';
  const burritoBody = '#a86a36';
  const burritoHi = '#c98a52';
  ctx.fillStyle = burritoOutline;
  ctx.fillRect(2, 1, 12, 8);
  ctx.fillStyle = burritoBody;
  ctx.fillRect(3, 2, 10, 6);
  // Highlight band along the lower crease
  ctx.fillStyle = burritoHi;
  ctx.fillRect(4, 6, 8, 1);
  // Round the top corners off
  ctx.clearRect(2, 1, 1, 1);
  ctx.clearRect(13, 1, 1, 1);

  // Foil — covers the bottom half with a jagged TOP edge (where the
  // foil tears as you eat down toward the wrapped grip).
  const foilOutline = '#4d4d4d';
  const foil = '#bcbcbc';
  const foilHi = '#f5f5f5';
  ctx.fillStyle = foilOutline;
  ctx.fillRect(3, 7, 10, 8);
  ctx.fillStyle = foil;
  ctx.fillRect(4, 8, 8, 6);
  // Crinkle highlights — a couple of bright pixels
  putPixel(ctx, 5, 11, foilHi);
  putPixel(ctx, 8, 12, foilHi);
  putPixel(ctx, 10, 9, foilHi);
  putPixel(ctx, 6, 13, foilHi);
  // Jagged foil TOP edge — alternate pixels of foil + cleared makes a
  // torn/folded edge look
  ctx.fillStyle = foil;
  putPixel(ctx, 4, 7, foil);
  putPixel(ctx, 6, 7, foil);
  putPixel(ctx, 8, 7, foil);
  putPixel(ctx, 10, 7, foil);
  ctx.clearRect(5, 7, 1, 1);
  ctx.clearRect(7, 7, 1, 1);
  ctx.clearRect(9, 7, 1, 1);
  ctx.clearRect(11, 7, 1, 1);
  // Round the foil's bottom corners off so it doesn't look like a brick
  ctx.clearRect(3, 14, 1, 1);
  ctx.clearRect(12, 14, 1, 1);

  registerSyntheticSprite('synthetic://burrito', c);
}

/** A 16×16 pixel "cash" tile — a single fat dollar bill that fills the
 *  entire tile, with a chunky $ symbol in the middle. */
function buildCash(): void {
  if (furnitureCanvases.has('synthetic://cash')) return;
  const c = document.createElement('canvas');
  c.width = 16;
  c.height = 16;
  const ctx = c.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;

  // Fill whole tile with a green bill: dark outer outline, mid-green
  // edge band, and a lighter green inner panel.
  ctx.fillStyle = '#0e3e1a'; // dark outline
  ctx.fillRect(0, 0, 16, 16);
  ctx.fillStyle = '#1f7a3a'; // mid green edge band
  ctx.fillRect(1, 1, 14, 14);
  ctx.fillStyle = '#9dd9a8'; // light green inner
  ctx.fillRect(2, 2, 12, 12);
  // Subtle inner border line for the "engraved" bill look
  ctx.fillStyle = '#1a5a2a';
  ctx.fillRect(3, 3, 10, 1);
  ctx.fillRect(3, 12, 10, 1);
  ctx.fillRect(3, 3, 1, 10);
  ctx.fillRect(12, 3, 1, 10);

  // Big bold $ symbol centered around (8, 8). Drawn with thick 2-px
  // strokes so it reads at game zoom.
  const dark = '#0e3e1a';
  // Vertical stem (2 px wide, 8 px tall) through the middle
  ctx.fillStyle = dark;
  ctx.fillRect(7, 4, 2, 8);
  // Top of S — top horizontal cap
  ctx.fillRect(5, 5, 6, 1);
  // Top-left curl of S
  ctx.fillRect(5, 5, 1, 2);
  // Middle horizontal bar
  ctx.fillRect(5, 7, 6, 1);
  // Bottom-right curl of S
  ctx.fillRect(10, 8, 1, 2);
  // Bottom horizontal cap
  ctx.fillRect(5, 10, 6, 1);

  // Tiny corner marks evoking serial numbers / denomination
  ctx.fillStyle = dark;
  putPixel(ctx, 4, 4, dark);
  putPixel(ctx, 11, 4, dark);
  putPixel(ctx, 4, 11, dark);
  putPixel(ctx, 11, 11, dark);

  registerSyntheticSprite('synthetic://cash', c);
}

/**
 * Placeholder Dodo identics + slogan decal printed on the communal table.
 * 80×32 canvas → 5 tiles wide × 2 tiles tall, scaled up to feel like a
 * proper printed runner across the middle of the long banquet table.
 * Cream placemat background, orange Dodo "D" mark on the left, the
 * slogan "Есть то, что нас объединяет" centered as pixel text. Replace
 * with a real SVG overlay later by swapping to an HTML <img> over the
 * same tile coords (camera state is exposed via the renderer).
 */
function buildDodoTableDecal(): void {
  if (furnitureCanvases.has('synthetic://dodo-table-decal')) return;
  const W = 80;
  const H = 32;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;

  // Soft cream placemat with a dark hairline outline + a 1px orange band
  // inside it. Slightly translucent edges sell it as a printed runner
  // rather than a sticker.
  ctx.fillStyle = '#1a1208';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#FFF7E6';
  ctx.fillRect(1, 1, W - 2, H - 2);
  // Inner orange frame (1 px Dodo-orange border just inside the placemat)
  ctx.fillStyle = '#FF6900';
  ctx.fillRect(2, 2, W - 4, 1);
  ctx.fillRect(2, H - 3, W - 4, 1);
  ctx.fillRect(2, 2, 1, H - 4);
  ctx.fillRect(W - 3, 2, 1, H - 4);

  // Bigger Dodo "D" mark on the left — orange disc with eye + cream
  // chick-bite mouth on the right side.
  const lcx = 13;
  const lcy = H / 2;
  drawPixelOval(ctx, lcx, lcy, 9, 9, '#FF6900');
  // Eye dot (charcoal pixel cluster)
  ctx.fillStyle = '#1a1208';
  ctx.fillRect(lcx + 1, lcy - 4, 2, 2);
  // Cream "mouth" — chick beak look, opens to the right
  ctx.fillStyle = '#FFF7E6';
  ctx.fillRect(lcx + 6, lcy - 1, 4, 3);
  ctx.fillRect(lcx + 6, lcy - 2, 3, 1);
  ctx.fillRect(lcx + 6, lcy + 2, 3, 1);

  // Slogan text — 3 lines stacked centered on the right two-thirds.
  // Canvas text rendering is used (so we don't have to hand-pixel
  // Cyrillic glyphs); kept small so it still feels like pixel art.
  ctx.textBaseline = 'top';
  ctx.font = 'bold 6px sans-serif';
  ctx.fillStyle = '#1a1208';
  const tx = 28;
  ctx.fillText('ЕСТЬ ТО,', tx, 6);
  ctx.fillText('ЧТО НАС', tx, 14);
  ctx.fillStyle = '#FF6900';
  ctx.fillText('ОБЪЕДИНЯЕТ', tx, 22);

  // Brand identic dots in the four corners
  putPixel(ctx, 4, 4, '#FF6900');
  putPixel(ctx, W - 5, 4, '#FF6900');
  putPixel(ctx, 4, H - 5, '#FF6900');
  putPixel(ctx, W - 5, H - 5, '#FF6900');

  registerSyntheticSprite('synthetic://dodo-table-decal', c);
}

/**
 * Communal banquet table — 8 tiles wide × 4 tall (128×64 px).
 * Top tile (0..15 px) is decorative back-rim and doesn't block walking;
 * the lower 3 tiles are the table top + apron + legs. Wood is warm tan
 * with subtle horizontal grain only (no vertical plank seams).
 *
 * The slogan "Есть то, что нас объединяет" is *engraved* (not pasted as
 * a placemat decal) into the back half of the table surface so it reads
 * as wood-burned text — a darker-tone glyph row with a single highlight
 * pixel underneath each line for a chiseled look. Food sits on the
 * front half of the surface, never on top of the engraving.
 */
function buildBigTable(): void {
  if (furnitureCanvases.has('synthetic://big-table')) return;
  const W = 128;
  const H = 80; // 5 tiles tall (1 back-rim + 3 surface + 1 apron/legs)
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;

  const woodHi = '#E0B07A';
  const wood = '#C8945C';
  const woodMid = '#A87038';
  const woodDark = '#5D3A18';
  const apron = '#8B5A2C';
  const apronShadow = '#3A2308';

  // ── Decorative back-rim (top tile, y 0..15) ─────────────────────
  ctx.fillStyle = apronShadow;
  ctx.fillRect(0, 0, W, 1);
  ctx.fillStyle = woodMid;
  ctx.fillRect(0, 1, W, 2);
  ctx.fillStyle = woodHi;
  ctx.fillRect(0, 3, W, 1);
  ctx.fillStyle = wood;
  ctx.fillRect(0, 4, W, 12);

  // ── Surface (rows 1..3, y 16..63) — 3 tile rows tall ────────────
  ctx.fillStyle = wood;
  ctx.fillRect(0, 16, W, 48);

  // Subtle horizontal grain — short flecks every 10 px, varied per row
  ctx.fillStyle = woodMid;
  for (let x = 4; x < W - 4; x += 10) {
    ctx.fillRect(x, 21, 3, 1);
    ctx.fillRect(x + 2, 30, 5, 1);
    ctx.fillRect(x + 6, 39, 3, 1);
    ctx.fillRect(x + 4, 50, 4, 1);
    ctx.fillRect(x + 1, 58, 3, 1);
  }

  // Front-edge highlight just before the apron drops away
  ctx.fillStyle = woodHi;
  ctx.fillRect(0, 63, W, 1);

  // ── Apron (y 64..68) ─────────────────────────────────────────────
  ctx.fillStyle = apron;
  ctx.fillRect(0, 64, W, 5);
  ctx.fillStyle = apronShadow;
  ctx.fillRect(0, 69, W, 1);

  // ── Legs (y 69..79) ──────────────────────────────────────────────
  const legPositions = [4, 42, 82, 120];
  ctx.fillStyle = woodDark;
  for (const lx of legPositions) {
    ctx.fillRect(lx, 69, 4, 11);
  }
  ctx.fillStyle = apronShadow;
  for (const lx of legPositions) {
    ctx.fillRect(lx, 79, 4, 1);
  }

  registerSyntheticSprite('synthetic://big-table', c);
}

/**
 * Pixel rug — a 6×4 tile (96×64 px) rectangular rug with a warm Dodo
 * orange field and a darker border. Drawn as a "surface" sprite is
 * impossible because we want it UNDER the table; instead the catalog
 * renders this as backgroundTiles=footprintH so it doesn't block, and
 * the renderer's default z-sort lays it bottom-edge first — the table
 * (taller footprint, deeper zY) draws on top of it.
 */
function buildRug(): void {
  if (furnitureCanvases.has('synthetic://rug')) return;
  const W = 192;
  const H = 96;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;

  const fieldDark = '#7A2E0E';
  const field = '#A8431A';
  const fieldHi = '#C66237';
  const border = '#3A1408';
  const accent = '#FFD23F';
  const cream = '#F2D8A0';

  // Outer dark border
  ctx.fillStyle = border;
  ctx.fillRect(0, 0, W, H);
  // Inner field
  ctx.fillStyle = field;
  ctx.fillRect(3, 3, W - 6, H - 6);
  // Subtle stripes (lighter horizontal bands every 10 px)
  ctx.fillStyle = fieldHi;
  for (let y = 8; y < H - 6; y += 10) {
    ctx.fillRect(4, y, W - 8, 1);
  }
  // Cream inner frame (a "panel" border 4 px in from outer dark border)
  ctx.fillStyle = cream;
  ctx.fillRect(7, 7, W - 14, 1);
  ctx.fillRect(7, H - 8, W - 14, 1);
  ctx.fillRect(7, 7, 1, H - 14);
  ctx.fillRect(W - 8, 7, 1, H - 14);
  // Diamond accents along the centerline (warm yellow diamonds)
  for (let x = 18; x < W - 18; x += 24) {
    const cx = x + 6;
    const cy = H / 2;
    ctx.fillStyle = accent;
    ctx.fillRect(cx, cy - 2, 1, 1);
    ctx.fillRect(cx - 1, cy - 1, 3, 1);
    ctx.fillRect(cx - 2, cy, 5, 1);
    ctx.fillRect(cx - 1, cy + 1, 3, 1);
    ctx.fillRect(cx, cy + 2, 1, 1);
    // Tiny dark center dot to read as a 'jewel'
    ctx.fillStyle = fieldDark;
    ctx.fillRect(cx, cy, 1, 1);
  }
  // Soft fringe at left and right (vertical 1-px ticks)
  ctx.fillStyle = cream;
  for (let y = 4; y < H - 4; y += 3) {
    ctx.fillRect(0, y, 1, 1);
    ctx.fillRect(W - 1, y, 1, 1);
  }

  registerSyntheticSprite('synthetic://rug', c);
}

/**
 * Pixel window — 16×32 px (1×2 tile) wall-mounted window with a wood
 * frame, a 4-pane glass split, and a warm dusk-orange sky to give the
 * pizzeria a cozy "dinnertime" feel.
 */
function buildWindow(): void {
  if (furnitureCanvases.has('synthetic://window')) return;
  const W = 16;
  const H = 32;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;

  // Frame (warm brown)
  ctx.fillStyle = '#5D3A18';
  ctx.fillRect(0, 8, W, 22);
  // Sill
  ctx.fillStyle = '#8B5A2C';
  ctx.fillRect(0, 28, W, 2);
  // Glass — dusk gradient (top: orange, bottom: warm yellow)
  ctx.fillStyle = '#FF8B3C';
  ctx.fillRect(2, 10, W - 4, 8);
  ctx.fillStyle = '#FFD27A';
  ctx.fillRect(2, 18, W - 4, 8);
  // Mullions (cross dividing the glass into 4)
  ctx.fillStyle = '#5D3A18';
  ctx.fillRect(W / 2 - 1, 10, 2, 16);
  ctx.fillRect(2, 17, W - 4, 2);
  // Subtle highlight on top-left pane
  ctx.fillStyle = '#FFE0A8';
  ctx.fillRect(3, 11, 2, 1);
  ctx.fillRect(3, 12, 1, 1);
  ctx.fillStyle = '#FFE0A8';
  ctx.fillRect(W / 2 + 2, 19, 2, 1);

  registerSyntheticSprite('synthetic://window', c);
}

/**
 * Pixel painting — 16×16 px wall art: a stylized Russian onion-dome
 * silhouette in cream against a Dodo-orange sky, framed in dark wood.
 * Hung on interior walls to make the room feel decorated.
 */
function buildPainting(): void {
  if (furnitureCanvases.has('synthetic://painting')) return;
  const W = 16;
  const H = 16;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;

  // Frame
  ctx.fillStyle = '#3A2308';
  ctx.fillRect(0, 0, W, H);
  // Mat
  ctx.fillStyle = '#FFF7E6';
  ctx.fillRect(1, 1, W - 2, H - 2);
  // Sky
  ctx.fillStyle = '#FF8B3C';
  ctx.fillRect(2, 2, W - 4, H - 5);
  // Ground
  ctx.fillStyle = '#7A4422';
  ctx.fillRect(2, H - 3, W - 4, 1);
  // Onion dome silhouette (cream)
  ctx.fillStyle = '#FFF7E6';
  ctx.fillRect(7, 9, 2, 4);
  ctx.fillRect(6, 8, 4, 1);
  ctx.fillRect(7, 7, 2, 1);
  ctx.fillRect(6, 6, 4, 1);
  ctx.fillRect(7, 5, 2, 1);
  ctx.fillRect(7, 4, 2, 1);
  // Cross on top
  ctx.fillStyle = '#1a1208';
  ctx.fillRect(7, 3, 2, 1);
  ctx.fillRect(7, 2, 1, 1);
  // Small tower next to the dome
  ctx.fillStyle = '#FFF7E6';
  ctx.fillRect(10, 10, 2, 3);
  ctx.fillRect(10, 9, 2, 1);
  ctx.fillStyle = '#1a1208';
  ctx.fillRect(10, 8, 2, 1);

  registerSyntheticSprite('synthetic://painting', c);
}

/**
 * Variant pizza #3 — white sauce / quattro formaggi look. Same
 * silhouette as the classic pizza but with a creamy-white base, golden
 * cheese flecks, and a few rosemary specks. Used to scatter a third
 * pizza style across the long table so it reads as a true Russian
 * 8-федеральных-округов sharing many pies.
 */
function buildPizzaWhite(): void {
  if (furnitureCanvases.has('synthetic://pizza-white')) return;
  const c = document.createElement('canvas');
  c.width = 32;
  c.height = 16;
  const ctx = c.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  // Wood board
  drawPixelOval(ctx, 16, 9, 14, 6, '#8b5a2b');
  // Crust ring (extra-golden)
  drawPixelOval(ctx, 16, 8, 12, 5, '#e6b06a');
  // White cream sauce
  drawPixelOval(ctx, 16, 8, 10, 4, '#fff1c6');
  // Cheese melt freckles (warm yellow)
  putPixel(ctx, 11, 7, '#f7c867');
  putPixel(ctx, 13, 6, '#f7c867');
  putPixel(ctx, 17, 6, '#f7c867');
  putPixel(ctx, 20, 7, '#f7c867');
  putPixel(ctx, 12, 9, '#f7c867');
  putPixel(ctx, 19, 9, '#f7c867');
  // Toasted spots
  putPixel(ctx, 10, 8, '#c98a4b');
  putPixel(ctx, 14, 7, '#c98a4b');
  putPixel(ctx, 18, 9, '#c98a4b');
  putPixel(ctx, 22, 8, '#c98a4b');
  // Rosemary specks
  putPixel(ctx, 15, 9, '#3a6b22');
  putPixel(ctx, 19, 8, '#3a6b22');
  // Crust shadow on bottom edge
  for (let x = 6; x <= 26; x++) putPixel(ctx, x, 12, '#5e3a18');
  registerSyntheticSprite('synthetic://pizza-white', c);
}

/**
 * Bread basket — 16×16 a wicker basket with rye loaves stacked. A
 * classic "shared meal" prop on the communal table.
 */
function buildBreadBasket(): void {
  if (furnitureCanvases.has('synthetic://bread')) return;
  const W = 16;
  const H = 16;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;

  // Wicker basket — warm brown
  const basketDark = '#5D3A18';
  const basket = '#8B5A2C';
  const basketHi = '#C28548';

  ctx.fillStyle = basketDark;
  ctx.fillRect(2, 9, 12, 6);
  ctx.fillStyle = basket;
  ctx.fillRect(3, 10, 10, 4);
  // Wicker pattern (alternating 1px highlights)
  ctx.fillStyle = basketHi;
  for (let x = 3; x <= 12; x += 2) {
    ctx.fillRect(x, 11, 1, 1);
    ctx.fillRect(x + 1, 13, 1, 1);
  }

  // Bread loaves stacked above
  const breadDark = '#7A4422';
  const bread = '#D9A867';
  const breadHi = '#F2D8A0';
  // Back loaf
  ctx.fillStyle = breadDark;
  ctx.fillRect(3, 4, 8, 5);
  ctx.fillStyle = bread;
  ctx.fillRect(4, 5, 6, 3);
  ctx.fillStyle = breadHi;
  ctx.fillRect(5, 5, 4, 1);
  // Front loaf (offset right)
  ctx.fillStyle = breadDark;
  ctx.fillRect(7, 6, 7, 4);
  ctx.fillStyle = bread;
  ctx.fillRect(8, 7, 5, 2);
  ctx.fillStyle = breadHi;
  ctx.fillRect(9, 7, 3, 1);
  // Score marks
  ctx.fillStyle = breadDark;
  putPixel(ctx, 6, 6, breadDark);
  putPixel(ctx, 9, 8, breadDark);

  registerSyntheticSprite('synthetic://bread', c);
}

/**
 * Pixel samovar — 16×32 (1×2 tile) Russian samovar. The most iconic
 * "communal table" prop in Russia — perfect for a slogan about regions
 * united by a shared meal.
 */
function buildSamovar(): void {
  if (furnitureCanvases.has('synthetic://samovar')) return;
  const W = 16;
  const H = 32;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;

  // Brass body — warm gold ramp
  const bodyDark = '#8B5A1C';
  const body = '#D9A23A';
  const bodyHi = '#FBD274';
  const dark = '#3A2308';
  const accent = '#FF6900';

  // Base plate
  ctx.fillStyle = dark;
  ctx.fillRect(3, 28, 10, 3);
  ctx.fillStyle = bodyDark;
  ctx.fillRect(4, 29, 8, 2);

  // Pedestal
  ctx.fillStyle = dark;
  ctx.fillRect(6, 25, 4, 4);
  ctx.fillStyle = body;
  ctx.fillRect(7, 26, 2, 3);

  // Belly (urn shape)
  ctx.fillStyle = dark;
  ctx.fillRect(2, 12, 12, 13);
  ctx.fillStyle = body;
  ctx.fillRect(3, 13, 10, 11);
  ctx.fillStyle = bodyHi;
  ctx.fillRect(4, 14, 2, 8); // left highlight
  ctx.fillRect(11, 14, 1, 8); // right thin highlight
  // Belly band (etched line)
  ctx.fillStyle = bodyDark;
  ctx.fillRect(3, 18, 10, 1);
  ctx.fillRect(3, 22, 10, 1);

  // Spigot on the right
  ctx.fillStyle = dark;
  ctx.fillRect(12, 19, 3, 3);
  ctx.fillStyle = body;
  ctx.fillRect(13, 20, 1, 1);
  // Drip
  ctx.fillStyle = accent;
  putPixel(ctx, 14, 23, accent);

  // Handles on left and right
  ctx.fillStyle = dark;
  ctx.fillRect(1, 14, 1, 5);
  ctx.fillRect(2, 14, 1, 1);
  ctx.fillRect(2, 18, 1, 1);
  // (Right side spigot already covers right handle area)

  // Neck
  ctx.fillStyle = dark;
  ctx.fillRect(5, 8, 6, 4);
  ctx.fillStyle = body;
  ctx.fillRect(6, 9, 4, 3);
  ctx.fillStyle = bodyHi;
  putPixel(ctx, 6, 10, bodyHi);

  // Lid + crown
  ctx.fillStyle = dark;
  ctx.fillRect(4, 6, 8, 3);
  ctx.fillStyle = body;
  ctx.fillRect(5, 7, 6, 2);
  // Steam plume
  ctx.fillStyle = '#FFF7E6';
  putPixel(ctx, 7, 4, '#FFF7E6');
  putPixel(ctx, 8, 3, '#FFF7E6');
  putPixel(ctx, 9, 2, '#FFF7E6');
  putPixel(ctx, 8, 1, '#FFF7E6');
  putPixel(ctx, 7, 5, '#FFF7E6');
  // Top finial knob
  ctx.fillStyle = dark;
  ctx.fillRect(7, 4, 2, 2);
  ctx.fillStyle = accent;
  ctx.fillRect(7, 4, 2, 1);

  registerSyntheticSprite('synthetic://samovar', c);
}

/**
 * Pizzeria fridge — 16×32 (1×2 tile) tall double-door commercial fridge,
 * cream body with a Dodo-orange top band, chrome handles, and a small
 * "DODO" badge on the upper door. Sits in the cash-register area as a
 * piece of working equipment behind the counter.
 */
function buildFridge(): void {
  if (furnitureCanvases.has('synthetic://fridge')) return;
  const W = 16;
  const H = 32;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;

  const dark = '#1a1208';
  const shellDark = '#7C7468';
  const shell = '#E8E0CC';
  const shellHi = '#FFF7E6';
  const accent = '#FF6900';
  const accentDark = '#B33F00';
  const chrome = '#BFC4C9';
  const chromeHi = '#F2F4F7';

  // Whole body outline
  ctx.fillStyle = dark;
  ctx.fillRect(1, 1, W - 2, H - 1);
  // Inner shell (the cream box)
  ctx.fillStyle = shell;
  ctx.fillRect(2, 2, W - 4, H - 3);
  // Side highlight (subtle vertical bevel on the left)
  ctx.fillStyle = shellHi;
  ctx.fillRect(2, 2, 1, H - 4);
  // Side shadow (right edge)
  ctx.fillStyle = shellDark;
  ctx.fillRect(W - 3, 2, 1, H - 4);

  // Top "control" band — Dodo orange with a 1px dark hairline below
  ctx.fillStyle = accent;
  ctx.fillRect(2, 2, W - 4, 4);
  ctx.fillStyle = accentDark;
  ctx.fillRect(2, 5, W - 4, 1);
  // Tiny indicator lights on the band (one green, one red)
  ctx.fillStyle = '#62D26F';
  ctx.fillRect(4, 3, 1, 1);
  ctx.fillStyle = '#E04444';
  ctx.fillRect(6, 3, 1, 1);
  // Temperature digits
  ctx.fillStyle = dark;
  ctx.fillRect(10, 3, 1, 2);
  ctx.fillRect(12, 3, 1, 2);

  // Door split horizontal seam (halfway down body, dark line)
  ctx.fillStyle = dark;
  ctx.fillRect(2, 17, W - 4, 1);

  // Vertical door seam — right of center, dark
  ctx.fillStyle = shellDark;
  ctx.fillRect(8, 6, 1, 11);
  ctx.fillRect(8, 18, 1, 11);

  // Upper door — small "DODO" badge (orange rectangle)
  ctx.fillStyle = accent;
  ctx.fillRect(3, 9, 4, 3);
  ctx.fillStyle = dark;
  // "D" pattern (very tiny — 4 pixels read as a tiny logo at game zoom)
  putPixel(ctx, 4, 10, dark);
  putPixel(ctx, 5, 10, dark);
  putPixel(ctx, 4, 11, dark);

  // Door handles — chrome vertical bars on the LEFT side of each door's
  // right edge (so they read as "pull these doors")
  // Upper handle
  ctx.fillStyle = chrome;
  ctx.fillRect(7, 10, 1, 5);
  ctx.fillStyle = chromeHi;
  ctx.fillRect(7, 11, 1, 1);
  // Lower handle
  ctx.fillStyle = chrome;
  ctx.fillRect(7, 22, 1, 5);
  ctx.fillStyle = chromeHi;
  ctx.fillRect(7, 23, 1, 1);

  // Lower door — vent grille at the bottom (3 little slats)
  ctx.fillStyle = shellDark;
  ctx.fillRect(3, 27, 10, 1);
  ctx.fillStyle = dark;
  ctx.fillRect(4, 28, 2, 1);
  ctx.fillRect(7, 28, 2, 1);
  ctx.fillRect(10, 28, 2, 1);

  // Floor shadow under the fridge
  ctx.fillStyle = '#2a1a08';
  ctx.fillRect(1, H - 1, W - 2, 1);

  registerSyntheticSprite('synthetic://fridge', c);
}

/**
 * Exit doorway — 16×32 (1×2 tile) wall-mounted exit. A wooden door at
 * the bottom + a glowing green ВЫХОД sign above. Reads as "this is the
 * way out" and gives the south-west corner a clear sense of egress.
 */
function buildExitDoor(): void {
  if (furnitureCanvases.has('synthetic://exit-door')) return;
  const W = 16;
  const H = 32;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;

  const dark = '#1a1208';
  const woodDark = '#5D3A18';
  const wood = '#8B5A2C';
  const woodHi = '#C8945C';
  const signGreen = '#1F9E47';
  const signGreenHi = '#62D26F';
  const cream = '#FFF7E6';

  // ── Sign (top tile, y 0..15) — green rectangle with cream "ВЫХОД" ─
  ctx.fillStyle = dark;
  ctx.fillRect(1, 2, W - 2, 8);
  ctx.fillStyle = signGreen;
  ctx.fillRect(2, 3, W - 4, 6);
  ctx.fillStyle = signGreenHi;
  ctx.fillRect(2, 3, W - 4, 1);

  // "ВЫХОД" — 5 letter blocks (1 px wide each, 2 px tall) in cream
  // arranged so it scans as text at game zoom even though individual
  // glyphs are basically just 1×3 vertical pegs.
  ctx.fillStyle = cream;
  // V (rounded blob)
  ctx.fillRect(3, 5, 1, 3);
  ctx.fillRect(4, 5, 1, 1);
  ctx.fillRect(4, 7, 1, 1);
  // Y
  ctx.fillRect(6, 5, 1, 3);
  // X
  ctx.fillRect(8, 5, 1, 1);
  ctx.fillRect(9, 6, 1, 1);
  ctx.fillRect(8, 7, 1, 1);
  // O
  ctx.fillRect(11, 5, 1, 3);
  ctx.fillRect(12, 5, 1, 1);
  ctx.fillRect(12, 7, 1, 1);
  // ▶ arrow
  ctx.fillRect(14, 6, 1, 1);

  // ── Door (bottom tile, y 16..31) — wooden door with frame ─────────
  // Frame
  ctx.fillStyle = dark;
  ctx.fillRect(1, 12, W - 2, H - 12);
  // Door panel
  ctx.fillStyle = woodDark;
  ctx.fillRect(2, 13, W - 4, H - 14);
  ctx.fillStyle = wood;
  ctx.fillRect(3, 14, W - 6, H - 16);
  // Door highlight (top + left edge)
  ctx.fillStyle = woodHi;
  ctx.fillRect(3, 14, W - 6, 1);
  ctx.fillRect(3, 14, 1, H - 16);
  // Inset rectangle (door panel detail)
  ctx.fillStyle = woodDark;
  ctx.fillRect(5, 18, W - 10, 8);
  ctx.fillStyle = wood;
  ctx.fillRect(6, 19, W - 12, 6);
  // Doorknob
  ctx.fillStyle = '#FFD23F';
  ctx.fillRect(W - 5, 22, 1, 2);
  ctx.fillStyle = '#B38A1A';
  ctx.fillRect(W - 4, 23, 1, 1);

  // Floor mat just below the threshold (single dark line)
  ctx.fillStyle = dark;
  ctx.fillRect(1, H - 1, W - 2, 1);

  registerSyntheticSprite('synthetic://exit-door', c);
}

/**
 * Small empty 2-person table — 32×32 (2×2 tile) bistro-style square
 * table. Wood top, single central pedestal, perfect for a quiet "no one
 * sitting here yet" spot in the lower-mid of the dining room.
 */
function buildSmallEmptyTable(): void {
  if (furnitureCanvases.has('synthetic://small-empty-table')) return;
  const W = 32;
  const H = 32;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;

  const wood = '#C8945C';
  const woodHi = '#E0B07A';
  const woodMid = '#A87038';
  const woodDark = '#5D3A18';
  const apron = '#8B5A2C';
  const apronShadow = '#3A2308';

  // Surface (top tile, y 8..23) — square with rounded look via 1px notches
  ctx.fillStyle = apronShadow;
  ctx.fillRect(2, 8, W - 4, 1);
  ctx.fillStyle = woodMid;
  ctx.fillRect(2, 9, W - 4, 2);
  ctx.fillStyle = woodHi;
  ctx.fillRect(2, 11, W - 4, 1);
  ctx.fillStyle = wood;
  ctx.fillRect(2, 12, W - 4, 11);
  // Front-edge highlight before apron
  ctx.fillStyle = woodHi;
  ctx.fillRect(2, 22, W - 4, 1);
  // Apron
  ctx.fillStyle = apron;
  ctx.fillRect(2, 23, W - 4, 3);
  ctx.fillStyle = apronShadow;
  ctx.fillRect(2, 26, W - 4, 1);

  // Single central pedestal leg
  ctx.fillStyle = woodDark;
  ctx.fillRect(W / 2 - 2, 26, 4, 5);
  // Splayed foot
  ctx.fillStyle = woodDark;
  ctx.fillRect(W / 2 - 5, 30, 10, 1);
  ctx.fillStyle = apronShadow;
  ctx.fillRect(W / 2 - 5, 31, 10, 1);

  registerSyntheticSprite('synthetic://small-empty-table', c);
}

function putPixel(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 1, 1);
}

function drawPixelOval(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  color: string,
): void {
  ctx.fillStyle = color;
  for (let y = -ry; y <= ry; y++) {
    for (let x = -rx; x <= rx; x++) {
      const v = (x * x) / (rx * rx) + (y * y) / (ry * ry);
      if (v <= 1) ctx.fillRect(cx + x, cy + y, 1, 1);
    }
  }
}

export function setAssetsReady(): void {
  assetsReady = true;
}

export function isAssetsReady(): boolean {
  return assetsReady;
}
