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
  for (const r of requests) {
    const req: FurnitureImageRequest = typeof r === 'string' ? { src: r } : r;
    if (furnitureImgs.has(req.src) || furnitureCanvases.has(req.src)) continue;
    if (req.src.startsWith('synthetic://')) continue;
    const img = await loadImage(req.src);
    if (req.tint === 'orange') {
      furnitureCanvases.set(req.src, tintImageOrange(img));
    } else {
      furnitureImgs.set(req.src, img);
    }
  }
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
  buildCash();
  buildBurrito();
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
