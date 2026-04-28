export const TILE_SIZE = 16;

export const Direction = {
  DOWN: 0,
  LEFT: 1,
  RIGHT: 2,
  UP: 3,
} as const;
export type Direction = (typeof Direction)[keyof typeof Direction];

export const TileType = {
  WALL: 0,
  FLOOR: 1,
  KITCHEN: 2,
  DINING: 3,
  COUNTER: 4,
  CARPET: 5,
  VOID: 255,
} as const;
export type TileType = (typeof TileType)[keyof typeof TileType];

export const CharacterState = {
  IDLE: 'idle',
  WALK: 'walk',
  TYPE: 'type',
} as const;
export type CharacterState = (typeof CharacterState)[keyof typeof CharacterState];

export interface Vec2 {
  col: number;
  row: number;
}

export interface FurnitureDef {
  id: string;
  /** PNG path under /furniture/ — full src for Image.src */
  src: string;
  /** Sprite pixel width */
  w: number;
  /** Sprite pixel height */
  h: number;
  /** Footprint in tiles */
  footprintW: number;
  footprintH: number;
  /** Top N rows of the footprint don't block walking (decorative top of tall sprite) */
  backgroundTiles?: number;
  /** True for items that sit on top of a desk/table — they are z-sorted to draw
   *  in front of furniture on the same tiles, so a pizza on a table still shows. */
  surface?: boolean;
  /** True for "front/side" sofas + chairs: their zY is capped to the first
   *  row's bottom so a seated character renders in front of them.
   *  Mirrors the chair-z-sort logic from pixel-agents. */
  seatLow?: boolean;
  /** Optional post-load color tint applied to the sprite. */
  tint?: 'orange';
  /** Optional render-time vertical offset (in sprite pixels). Positive
   *  values push the sprite down. Useful for nudging a sofa to visually
   *  hug the table below it. */
  yOffsetPx?: number;
  /** Optional render-time horizontal offset (in sprite pixels). Positive
   *  values push the sprite right. Used to centre items whose w is
   *  smaller than `footprintW * TILE_SIZE`. */
  xOffsetPx?: number;
  /** True for "floor" sprites (e.g. a rug). They are z-sorted to a
   *  very low zY so every other drawable (table, character, prop) draws
   *  on top. Mutually exclusive with `surface`. */
  flat?: boolean;
  /** Enable canvas image smoothing for this sprite — needed for high-res
   *  source images (e.g. webp items at 1500×1500) so they don't alias to
   *  garbage when nearest-neighbor downscaled. */
  smooth?: boolean;
  /** Fit sprite inside (w × h) while preserving source aspect ratio.
   *  Useful for externally-provided art whose dimensions may vary. */
  preserveAspect?: boolean;
}

export interface PlacedFurniture {
  uid: string;
  defId: string;
  col: number;
  row: number;
  /** Optional render-time horizontal flip */
  mirror?: boolean;
  /** Optional rotation in degrees around the sprite centre (clockwise) */
  rotation?: number;
}

export interface Interactable {
  /** Stable id, matches station id for stations */
  id: string;
  /** Fallback tile. When npcId is set, the live position is the NPC's
   *  current tile; col/row here are only used as a default before the
   *  NPC resolves (or for static interactables that aren't tied to a
   *  visitor). */
  col: number;
  row: number;
  /** Shown in the HUD when the player is in range (station title). */
  label?: string;
  /** Optional id of the NPC this interactable is "spoken" by. When set,
   *  the station bubble follows the NPC and the proximity check uses the
   *  NPC tile unless `glowCol`/`glowRow` override the anchor. */
  npcId?: string;
  /** Visitor-style line for the guided station bubble (defaults to label). */
  bubbleText?: string;
  /** Surface tile for table stations: top-left of the on-table item that
   *  acts as the click hotspot + hover glow + completion tick. */
  glowCol?: number;
  glowRow?: number;
  /** Footprint of the glow zone in tiles (defaults to 1×1). For a 2×2
   *  pizza on the table, set to 2 so any of its 4 tiles registers a hit. */
  glowFootprintW?: number;
  glowFootprintH?: number;
}

export interface Bubble {
  text: string;
  /** Total lifetime in seconds; bubble fades out over the last 0.4s */
  ttl: number;
  /** Seconds remaining */
  remaining: number;
}

export interface Character {
  id: string;
  /** Index into character PNG sprite sheet (0..5) */
  paletteIndex: number;
  state: CharacterState;
  dir: Direction;
  /** Pixel position (center) */
  x: number;
  y: number;
  tileCol: number;
  tileRow: number;
  path: Vec2[];
  /** 0..1 lerp between current and next tile */
  moveProgress: number;
  /** Animation frame index */
  frame: number;
  /** Time accumulator for animation */
  frameTimer: number;
  /** Wander pause timer for NPCs */
  wanderTimer: number;
  /** True for NPCs that should wander randomly when idle */
  wanders: boolean;
  /** Anchor tile for restricted wandering; NPC stays within wanderRadius of this */
  wanderHome: Vec2 | null;
  /** Manhattan distance from wanderHome the NPC may roam (default 5) */
  wanderRadius: number;
  /** Optional speech bubble */
  bubble: Bubble | null;
  /** True if this character is the player (Sasha) */
  isPlayer: boolean;
  /** Optional display name (for debug / future features) */
  name?: string;
  /** When true, the character is drawn slightly lower so they appear to be
   *  seated in their tile's sofa/chair. */
  seated: boolean;
  /** When true, a small pixel-art backpack is drawn behind the character. */
  hasBackpack: boolean;
  /** Seated guest with no hand-motion loop — calm "still" pose at the table. */
  stillSeated?: boolean;
  /** Optional hat drawn on top of the character.
   *    'orange'      = procedural Dodo orange cap (standard size)
   *    'orangeLarge' = same cap, slightly larger and lower (courier)
   *    'party'       = pixel-art party hat */
  hatType?: 'orange' | 'orangeLarge' | 'party';
}
