import { setPath } from './character';
import { findNearestWalkable, isWalkable } from './tileMap';
import { Direction, type Character, type TileType } from './types';

export interface KeyState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
}

export function attachKeyHandlers(keys: KeyState): () => void {
  const onDown = (e: KeyboardEvent) => {
    switch (e.code) {
      case 'ArrowUp':
      case 'KeyW':
        keys.up = true;
        break;
      case 'ArrowDown':
      case 'KeyS':
        keys.down = true;
        break;
      case 'ArrowLeft':
      case 'KeyA':
        keys.left = true;
        break;
      case 'ArrowRight':
      case 'KeyD':
        keys.right = true;
        break;
    }
  };
  const onUp = (e: KeyboardEvent) => {
    switch (e.code) {
      case 'ArrowUp':
      case 'KeyW':
        keys.up = false;
        break;
      case 'ArrowDown':
      case 'KeyS':
        keys.down = false;
        break;
      case 'ArrowLeft':
      case 'KeyA':
        keys.left = false;
        break;
      case 'ArrowRight':
      case 'KeyD':
        keys.right = false;
        break;
    }
  };
  window.addEventListener('keydown', onDown);
  window.addEventListener('keyup', onUp);
  return () => {
    window.removeEventListener('keydown', onDown);
    window.removeEventListener('keyup', onUp);
  };
}

/** If the player has no path and a movement key is held, attempt to step one tile */
export function tryStepFromKeys(
  player: Character,
  keys: KeyState,
  tileMap: TileType[][],
  blocked: Set<string>,
): void {
  if (player.path.length > 0) return;
  let dCol = 0;
  let dRow = 0;
  let dir: Direction | null = null;
  if (keys.up) {
    dRow = -1;
    dir = Direction.UP;
  } else if (keys.down) {
    dRow = 1;
    dir = Direction.DOWN;
  } else if (keys.left) {
    dCol = -1;
    dir = Direction.LEFT;
  } else if (keys.right) {
    dCol = 1;
    dir = Direction.RIGHT;
  }
  if (dir === null) return;
  const tc = player.tileCol + dCol;
  const tr = player.tileRow + dRow;
  if (isWalkable(tc, tr, tileMap, blocked)) {
    setPath(player, tc, tr, tileMap, blocked);
  } else {
    player.dir = dir;
  }
}

/** Click-to-move: walk player to the tile (or nearest walkable next to it). */
export function clickToMove(
  player: Character,
  targetCol: number,
  targetRow: number,
  tileMap: TileType[][],
  blocked: Set<string>,
): void {
  const dest = findNearestWalkable(targetCol, targetRow, tileMap, blocked);
  if (!dest) return;
  setPath(player, dest.col, dest.row, tileMap, blocked);
}
