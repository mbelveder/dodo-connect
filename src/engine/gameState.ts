import { getWalkableTiles } from './tileMap';
import {
  type Character,
  type Interactable,
  type PlacedFurniture,
  type TileType,
  type Vec2,
} from './types';
import { getFurnitureDef } from '../scene/furnitureCatalog';

export interface GameState {
  cols: number;
  rows: number;
  tileMap: TileType[][];
  furniture: PlacedFurniture[];
  blocked: Set<string>;
  walkable: Vec2[];
  characters: Character[];
  player: Character;
  interactables: Interactable[];
  /** id of the interactable currently within range of the player, or null */
  activePromptId: string | null;
  /** Set of station ids the player has already completed. Mutated by App. */
  completedStationIds: Set<string>;
}

export function buildBlockedSet(furniture: PlacedFurniture[]): Set<string> {
  const blocked = new Set<string>();
  for (const item of furniture) {
    const def = getFurnitureDef(item.defId);
    if (!def) continue;
    const bgRows = def.backgroundTiles ?? 0;
    for (let dr = 0; dr < def.footprintH; dr++) {
      if (dr < bgRows) continue;
      for (let dc = 0; dc < def.footprintW; dc++) {
        blocked.add(`${item.col + dc},${item.row + dr}`);
      }
    }
  }
  return blocked;
}

export function createGameState(opts: {
  cols: number;
  rows: number;
  tileMap: TileType[][];
  furniture: PlacedFurniture[];
  characters: Character[];
  interactables: Interactable[];
}): GameState {
  const blocked = buildBlockedSet(opts.furniture);
  const walkable = getWalkableTiles(opts.tileMap, blocked);
  const player = opts.characters.find((c) => c.isPlayer);
  if (!player) throw new Error('No player character provided');
  return {
    cols: opts.cols,
    rows: opts.rows,
    tileMap: opts.tileMap,
    furniture: opts.furniture,
    blocked,
    walkable,
    characters: opts.characters,
    player,
    interactables: opts.interactables,
    activePromptId: null,
    completedStationIds: new Set(),
  };
}

/** Player must be within this Manhattan distance to trigger an interactable.
 *  Set to 2 so big-footprint furniture (like the communal table) can still
 *  be reached when the tiles immediately around the interactable are blocked. */
const INTERACT_RADIUS = 2;

export function findActiveInteractable(state: GameState): Interactable | null {
  const px = state.player.tileCol;
  const py = state.player.tileRow;
  let best: { i: Interactable; dist: number } | null = null;
  for (const it of state.interactables) {
    const dist = Math.abs(it.col - px) + Math.abs(it.row - py);
    if (dist <= INTERACT_RADIUS) {
      if (!best || dist < best.dist) best = { i: it, dist };
    }
  }
  return best ? best.i : null;
}
