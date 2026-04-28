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
  /** Seconds since the play stage started. Drives the intro reveal
   *  animation: slogan engraving fades out, then food fades in. */
  introElapsed: number;
  /** Current mouse hover tile (CSS-space, updated from mousemove). */
  hoveredTile: { col: number; row: number } | null;
}

export function buildBlockedSet(furniture: PlacedFurniture[]): Set<string> {
  const blocked = new Set<string>();
  for (const item of furniture) {
    const def = getFurnitureDef(item.defId);
    if (!def) continue;
    const bgRaw = def.backgroundTiles ?? 0;
    // If backgroundTiles >= footprint height, every row would be skipped and
    // the piece would not block walking (e.g. SOFA_FRONT was H=1 with bg=1).
    const bgRows = Math.min(bgRaw, Math.max(0, def.footprintH - 1));
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
    introElapsed: 0,
    hoveredTile: null,
  };
}

/** Resolve the live tile coords of an interactable. Tied-to-NPC
 *  interactables follow the NPC, so the prompt + proximity move with the
 *  visitor as they wander. Static interactables fall back to col/row. */
export function getInteractablePosition(
  it: Interactable,
  state: GameState,
): { col: number; row: number } {
  if (it.npcId) {
    const npc = state.characters.find((c) => c.id === it.npcId);
    if (npc) return { col: npc.tileCol, row: npc.tileRow };
  }
  return { col: it.col, row: it.row };
}

/** Tile used for green completion ticks and table proximity. Table stations
 *  set `glowCol`/`glowRow` on the surface puck; others use the walk/NPC tile. */
export function getInteractableAnchorTile(
  it: Interactable,
  state: GameState,
): { col: number; row: number } {
  if (it.glowCol != null && it.glowRow != null) {
    return { col: it.glowCol, row: it.glowRow };
  }
  return getInteractablePosition(it, state);
}

/** Player must be within this Manhattan distance to trigger an interactable.
 *  Matches dodo-game's INTERACT_RADIUS=2 — generous enough that big-footprint
 *  furniture and seated NPCs are still reachable from neighbouring tiles. */
const INTERACT_RADIUS = 2;

/** Returns the closest interactable within INTERACT_RADIUS of the player —
 *  scans ALL interactables. Drives `activePromptId` / HUD when near a station
 *  walk tile; opening the modal is click-based on table pucks.
 */
export function findActiveInteractable(state: GameState): Interactable | null {
  const px = state.player.tileCol;
  const py = state.player.tileRow;
  let best: { it: Interactable; dist: number } | null = null;
  for (const it of state.interactables) {
    const pos = getInteractablePosition(it, state);
    const dist = Math.abs(pos.col - px) + Math.abs(pos.row - py);
    if (dist <= INTERACT_RADIUS) {
      if (!best || dist < best.dist) best = { it, dist };
    }
  }
  return best ? best.it : null;
}
