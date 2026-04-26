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
}

export interface PlacedFurniture {
  uid: string;
  defId: string;
  col: number;
  row: number;
  /** Optional render-time horizontal flip */
  mirror?: boolean;
}

export interface Interactable {
  /** Stable id, matches station id for stations */
  id: string;
  /** Tile the player must stand adjacent to in order to interact */
  col: number;
  row: number;
  /** Optional label shown on the prompt (defaults to "Изучить") */
  label?: string;
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
}
