import {
  TYPE_FRAME_DURATION_SEC,
  WALK_FRAME_DURATION_SEC,
  WALK_SPEED_PX_PER_SEC,
} from './constants';
import { findPath } from './tileMap';
import {
  CharacterState,
  Direction,
  TILE_SIZE,
  type Character,
  type TileType,
  type Vec2,
} from './types';

export function tileCenter(col: number, row: number): { x: number; y: number } {
  return {
    x: col * TILE_SIZE + TILE_SIZE / 2,
    y: row * TILE_SIZE + TILE_SIZE / 2,
  };
}

function dirBetween(fromCol: number, fromRow: number, toCol: number, toRow: number): Direction {
  const dc = toCol - fromCol;
  const dr = toRow - fromRow;
  if (dc > 0) return Direction.RIGHT;
  if (dc < 0) return Direction.LEFT;
  if (dr > 0) return Direction.DOWN;
  return Direction.UP;
}

export interface CreateCharacterOpts {
  id: string;
  paletteIndex: number;
  col: number;
  row: number;
  dir?: Direction;
  isPlayer?: boolean;
  wanders?: boolean;
  wanderRadius?: number;
  name?: string;
  seated?: boolean;
  hasBackpack?: boolean;
}

export function createCharacter(opts: CreateCharacterOpts): Character {
  const c = tileCenter(opts.col, opts.row);
  // Seated diners run the "type" animation (alternating frames 3 and 4 in
  // the spritesheet) which reads as gentle hand motion — the closest thing
  // we have to an "eating at a table" pose without new sprites.
  const initialState = opts.seated ? CharacterState.TYPE : CharacterState.IDLE;
  return {
    id: opts.id,
    paletteIndex: opts.paletteIndex,
    state: initialState,
    dir: opts.dir ?? Direction.DOWN,
    x: c.x,
    y: c.y,
    tileCol: opts.col,
    tileRow: opts.row,
    path: [],
    moveProgress: 0,
    frame: 0,
    frameTimer: 0,
    wanderTimer: 1 + Math.random() * 2,
    wanders: opts.wanders ?? false,
    wanderHome: opts.wanders ? { col: opts.col, row: opts.row } : null,
    wanderRadius: opts.wanderRadius ?? 5,
    bubble: null,
    isPlayer: opts.isPlayer ?? false,
    name: opts.name,
    seated: opts.seated ?? false,
    hasBackpack: opts.hasBackpack ?? false,
  };
}

export function setPath(
  ch: Character,
  targetCol: number,
  targetRow: number,
  tileMap: TileType[][],
  blocked: Set<string>,
): boolean {
  const path = findPath(ch.tileCol, ch.tileRow, targetCol, targetRow, tileMap, blocked);
  if (path.length === 0) return false;
  ch.path = path;
  ch.moveProgress = 0;
  ch.state = CharacterState.WALK;
  ch.frame = 0;
  ch.frameTimer = 0;
  return true;
}

export function faceDirection(ch: Character, dir: Direction): void {
  ch.dir = dir;
  if (ch.state === CharacterState.WALK) return;
  ch.state = CharacterState.IDLE;
}

export function showBubble(ch: Character, text: string, ttl = 4.5): void {
  ch.bubble = { text, ttl, remaining: ttl };
}

function pickWanderTarget(ch: Character, walkable: Vec2[]): Vec2 | null {
  if (!ch.wanderHome) {
    return walkable[Math.floor(Math.random() * walkable.length)];
  }
  const home = ch.wanderHome;
  const radius = ch.wanderRadius;
  // Try up to 8 times to find a tile within radius of home
  for (let attempt = 0; attempt < 8; attempt++) {
    const t = walkable[Math.floor(Math.random() * walkable.length)];
    if (Math.abs(t.col - home.col) + Math.abs(t.row - home.row) <= radius) {
      return t;
    }
  }
  return null;
}

export function updateCharacter(
  ch: Character,
  dt: number,
  tileMap: TileType[][],
  blocked: Set<string>,
  walkable: Vec2[],
): void {
  ch.frameTimer += dt;

  if (ch.bubble) {
    ch.bubble.remaining -= dt;
    if (ch.bubble.remaining <= 0) ch.bubble = null;
  }

  switch (ch.state) {
    case CharacterState.WALK: {
      if (ch.frameTimer >= WALK_FRAME_DURATION_SEC) {
        ch.frameTimer -= WALK_FRAME_DURATION_SEC;
        ch.frame = (ch.frame + 1) % 4;
      }

      if (ch.path.length === 0) {
        const c = tileCenter(ch.tileCol, ch.tileRow);
        ch.x = c.x;
        ch.y = c.y;
        ch.state = CharacterState.IDLE;
        ch.frame = 0;
        ch.frameTimer = 0;
        break;
      }

      const next = ch.path[0];
      ch.dir = dirBetween(ch.tileCol, ch.tileRow, next.col, next.row);
      ch.moveProgress += (WALK_SPEED_PX_PER_SEC / TILE_SIZE) * dt;

      const from = tileCenter(ch.tileCol, ch.tileRow);
      const to = tileCenter(next.col, next.row);
      const t = Math.min(ch.moveProgress, 1);
      ch.x = from.x + (to.x - from.x) * t;
      ch.y = from.y + (to.y - from.y) * t;

      if (ch.moveProgress >= 1) {
        ch.tileCol = next.col;
        ch.tileRow = next.row;
        ch.x = to.x;
        ch.y = to.y;
        ch.path.shift();
        ch.moveProgress = 0;
      }
      break;
    }

    case CharacterState.IDLE: {
      ch.frame = 0;
      if (!ch.wanders) break;
      ch.wanderTimer -= dt;
      if (ch.wanderTimer <= 0 && walkable.length > 0) {
        const target = pickWanderTarget(ch, walkable);
        if (target) setPath(ch, target.col, target.row, tileMap, blocked);
        ch.wanderTimer = 1.5 + Math.random() * 3;
      }
      break;
    }

    case CharacterState.TYPE: {
      if (ch.frameTimer >= TYPE_FRAME_DURATION_SEC) {
        ch.frameTimer -= TYPE_FRAME_DURATION_SEC;
        ch.frame = (ch.frame + 1) % 2;
      }
      break;
    }
  }
}
