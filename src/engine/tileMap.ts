import { TileType, type Vec2 } from './types';

export function isWalkable(
  col: number,
  row: number,
  tileMap: TileType[][],
  blocked: Set<string>,
): boolean {
  const rows = tileMap.length;
  const cols = rows > 0 ? tileMap[0].length : 0;
  if (row < 0 || row >= rows || col < 0 || col >= cols) return false;
  const t = tileMap[row][col];
  if (t === TileType.WALL || t === TileType.VOID) return false;
  if (blocked.has(`${col},${row}`)) return false;
  return true;
}

export function getWalkableTiles(
  tileMap: TileType[][],
  blocked: Set<string>,
): Vec2[] {
  const rows = tileMap.length;
  const cols = rows > 0 ? tileMap[0].length : 0;
  const out: Vec2[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (isWalkable(c, r, tileMap, blocked)) out.push({ col: c, row: r });
    }
  }
  return out;
}

/** BFS pathfinding on 4-connected grid. Returns path excluding start, including end. */
export function findPath(
  startCol: number,
  startRow: number,
  endCol: number,
  endRow: number,
  tileMap: TileType[][],
  blocked: Set<string>,
): Vec2[] {
  if (startCol === endCol && startRow === endRow) return [];
  if (!isWalkable(endCol, endRow, tileMap, blocked)) return [];

  const key = (c: number, r: number) => `${c},${r}`;
  const startKey = key(startCol, startRow);
  const endKey = key(endCol, endRow);

  const visited = new Set<string>([startKey]);
  const parent = new Map<string, string>();
  const queue: Vec2[] = [{ col: startCol, row: startRow }];

  const dirs = [
    { dc: 0, dr: -1 },
    { dc: 0, dr: 1 },
    { dc: -1, dr: 0 },
    { dc: 1, dr: 0 },
  ];

  while (queue.length > 0) {
    const curr = queue.shift()!;
    const currKey = key(curr.col, curr.row);
    if (currKey === endKey) {
      const path: Vec2[] = [];
      let k = endKey;
      while (k !== startKey) {
        const [c, r] = k.split(',').map(Number);
        path.unshift({ col: c, row: r });
        k = parent.get(k)!;
      }
      return path;
    }
    for (const d of dirs) {
      const nc = curr.col + d.dc;
      const nr = curr.row + d.dr;
      const nk = key(nc, nr);
      if (visited.has(nk)) continue;
      if (!isWalkable(nc, nr, tileMap, blocked)) continue;
      visited.add(nk);
      parent.set(nk, currKey);
      queue.push({ col: nc, row: nr });
    }
  }
  return [];
}

/** BFS outward from (targetCol, targetRow) until a walkable tile is found.
 *  Returns null if nothing is found within `maxRadius`. Used to redirect a
 *  click on a blocked tile (e.g. the middle of a big table) to the nearest
 *  reachable spot. */
export function findNearestWalkable(
  targetCol: number,
  targetRow: number,
  tileMap: TileType[][],
  blocked: Set<string>,
  maxRadius = 4,
): Vec2 | null {
  if (isWalkable(targetCol, targetRow, tileMap, blocked)) {
    return { col: targetCol, row: targetRow };
  }
  const visited = new Set<string>([`${targetCol},${targetRow}`]);
  const queue: Array<{ col: number; row: number; dist: number }> = [
    { col: targetCol, row: targetRow, dist: 0 },
  ];
  const dirs = [
    { dc: 0, dr: -1 },
    { dc: 0, dr: 1 },
    { dc: -1, dr: 0 },
    { dc: 1, dr: 0 },
  ];
  while (queue.length > 0) {
    const cur = queue.shift()!;
    if (cur.dist >= maxRadius) continue;
    for (const d of dirs) {
      const nc = cur.col + d.dc;
      const nr = cur.row + d.dr;
      const key = `${nc},${nr}`;
      if (visited.has(key)) continue;
      visited.add(key);
      if (isWalkable(nc, nr, tileMap, blocked)) return { col: nc, row: nr };
      queue.push({ col: nc, row: nr, dist: cur.dist + 1 });
    }
  }
  return null;
}
