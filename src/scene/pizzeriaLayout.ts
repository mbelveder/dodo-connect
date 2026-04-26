import { createCharacter } from '../engine/character';
import { createGameState, type GameState } from '../engine/gameState';
import {
  Direction,
  TileType,
  type Interactable,
  type PlacedFurniture,
} from '../engine/types';

/**
 * Pizzeria layout. 17 cols × 20 rows, single open room with floor-color zones.
 *
 * Tile codes:
 *   '#' wall, '.' kitchen floor, ',' dining floor, ':' counter (dark), '~' carpet (red welcome mat), ' ' void
 *
 * Zones:
 *   Top-left: open dining / decor (kitchen prep stations removed)
 *   Middle band (row 9): counter + cash register
 *   Right: dining hall with tables (narrower east wall)
 *   Bottom-left: dispatch corner with whiteboard
 */

// Cash booth: walls surround cols 8–13 rows 1–8; south edge meets the
// counter band on row 9. The narrow east strip (col 15) stays open for
// walking past the inner wall (col 14).
// 17×20 map: five interior columns removed from the west (left).
const ROWS = [
  '#################', // 0
  '#,,,,,,#,,,,,,#,#', // 1
  '#,,,,,,#,,,,,,#,#', // 2
  '#,,,,,,#,,,,,,#,#', // 3
  '#,,,,,,#,,,,,,#,#', // 4
  '#,,,,,,#,,,,,,#,#', // 5
  '#,,,,,,#,,,,,,#,#', // 6
  '#,,,,,,#,,,,,,#,#', // 7
  '#,,,,,,#,,,,,,#,#', // 8
  '#,,,,,,:#####:###', // 9
  '#,,,,,,,,,,,,,,,#', // 10
  '#,,,,,,,,,,,,,,,#', // 11
  '#,,,,,,,,,,,,,,,#', // 12
  '#,,,,,,,,,,,,,,,#', // 13
  '#,,,,,,,,,,,,,,,#', // 14
  '#,,,,,,,,,,,,,,,#', // 15
  '#,,,,,,,,,,,,,,,#', // 16
  '#,,,,,,,,,,,,,,,#', // 17
  '#,,,,,,,,,,,,,,,#', // 18
  '#################', // 19
];

function decode(rows: string[]): TileType[][] {
  return rows.map((rowStr) =>
    rowStr.split('').map((ch) => {
      switch (ch) {
        case '#':
          return TileType.WALL;
        case '.':
          return TileType.KITCHEN;
        case ',':
          return TileType.DINING;
        case ':':
          return TileType.COUNTER;
        case '~':
          return TileType.CARPET;
        case ' ':
          return TileType.VOID;
        default:
          return TileType.DINING;
      }
    }),
  );
}

const tileMap = decode(ROWS);
const COLS = ROWS[0].length;
const NROWS = ROWS.length;

// ── Furniture ──────────────────────────────────────────────────

let nextUid = 1;
function place(defId: string, col: number, row: number, mirror = false): PlacedFurniture {
  return { uid: `f${nextUid++}`, defId, col, row, mirror };
}

const furniture: PlacedFurniture[] = [
  // Counter row (row 9): cash register PC at counter. Pixel-art cash
  // sits ABOVE the monitor (row 7) — the cashier's till.
  place('PC_FRONT', 12, 8),
  place('CASH', 12, 7),

  // Big table in the cash area (replaces the two small tables that used
  // to live here). The white-haired host (Andrey) sits at it on the
  // north sofa; east/west sofas complete the booth seating like the
  // communal table.
  place('SOFA_FRONT', 11, 1),
  place('SOFA_SIDE', 10, 3),        // cash west sofa
  place('SOFA_SIDE', 12, 3, true),  // cash east sofa (mirrored)
  place('TABLE_FRONT', 11, 2),

  // ── Big communal table (center, rows 11-14) ───────────────────────
  // SOFA_FRONT spans 2 tiles north of the table; SOFA_SIDE flanks east
  // and west. The side sofas are mirrored so their back-rest faces AWAY
  // from the table (so a seated diner faces inward toward the food).
  place('SOFA_FRONT', 11, 10),
  place('SOFA_SIDE', 10, 12),       // west sofa: back faces west (away)
  place('SOFA_SIDE', 14, 12, true), // east sofa: back faces east (away — mirrored)
  place('TABLE_FRONT', 11, 11),
  place('PIZZA', 11, 13),       // classic red pizza, middle-left
  place('PIZZA_GREEN', 12, 12), // pesto/green pizza, top-right (off the
                                // south edge of the table)
  place('BURRITO', 13, 13),     // foil-wrapped burrito on the communal table

  // ── Dining tables ────────────────────────────────────────────────
  // Each small table has chairs on BOTH north and south sides — full
  // 4-person seating. South chairs use WOODEN_CHAIR_FRONT (we see the
  // chair's seat side); north chairs use WOODEN_CHAIR_BACK (we see the
  // chair's back, which reads as "person facing south at the table").
  //
  // Lower dining (south of the big communal table): three small tables
  // spaced across the hall (west / mid / east).
  place('SMALL_TABLE_FRONT', 3, 16),
  place('WOODEN_CHAIR_BACK', 3, 15),
  place('WOODEN_CHAIR_BACK', 4, 15),
  place('WOODEN_CHAIR_FRONT', 3, 17),
  place('WOODEN_CHAIR_FRONT', 4, 17),

  place('SMALL_TABLE_FRONT', 7, 16),
  place('WOODEN_CHAIR_BACK', 7, 15),
  place('WOODEN_CHAIR_BACK', 8, 15),
  place('WOODEN_CHAIR_FRONT', 7, 17),
  place('WOODEN_CHAIR_FRONT', 8, 17),

  place('SMALL_TABLE_FRONT', 14, 16),
  place('WOODEN_CHAIR_BACK', 14, 15),
  place('WOODEN_CHAIR_BACK', 15, 15),
  place('WOODEN_CHAIR_FRONT', 14, 17),
  place('WOODEN_CHAIR_FRONT', 15, 17),

  // Upper-left open dining: two small tables + chairs and a few plants
  // (kitchen prep removed — fills the visual gap without blocking the
  // west corridor to the counter).
  place('SMALL_TABLE_FRONT', 2, 3),
  place('WOODEN_CHAIR_BACK', 2, 2),
  place('WOODEN_CHAIR_BACK', 3, 2),
  place('WOODEN_CHAIR_FRONT', 2, 4),
  place('WOODEN_CHAIR_FRONT', 3, 4),

  place('SMALL_TABLE_FRONT', 5, 7),
  place('WOODEN_CHAIR_BACK', 5, 6),
  place('WOODEN_CHAIR_BACK', 6, 6),
  place('WOODEN_CHAIR_FRONT', 5, 8),
  place('WOODEN_CHAIR_FRONT', 6, 8),

  place('PLANT', 1, 2),
  place('PLANT', 4, 1),
  place('PLANT', 6, 4),

  // Dispatch corner (bottom-left) — whiteboard with delivery info
  place('WHITEBOARD', 1, 16),

  // Decor — plants scattered to make the room feel lived-in. Plant
  // behind the tie guy (north of him on the counter band) so it reads
  // as standing decoration behind the diner without crowding him.
  place('PLANT', 12, 9),  // behind tie guy on the counter band
  place('PLANT', 15, 17), // bottom-right corner (tight room)
  place('PLANT', 1, 11),  // left wall by big table
  place('PLANT', 15, 4),  // upper-right by east wall
  place('PLANT', 14, 5),  // upper-mid open area
  place('PLANT', 6, 17),  // bottom-left dispatch area (clear of courier home)
  place('CACTUS', 13, 11), // by the open central walkway
  place('BIN', 15, 18),
  place('COFFEE', 10, 2),
];

// ── Interactables (stations) ──────────────────────────────────────

const interactables: Interactable[] = [
  { id: 'register', col: 12, row: 7, label: 'Касса' },
  // Courier-style station near the whiteboard — covers delivery time +
  // 60-minute promise.
  { id: 'dispatch', col: 2, row: 18, label: 'Доставка' },
  // Stations south of the big communal table (table at col 11 row 11):
  // west / center / east floor tiles.
  { id: 'capitals', col: 10, row: 15, label: 'Москва и Петербург' },
  { id: 'tile_map', col: 12, row: 15, label: 'Карты регионов' },
  { id: 'regions', col: 14, row: 15, label: 'Карта России' },
  // Holiday ordering quiz — east dining strip below the counter band.
  { id: 'holidays', col: 14, row: 10, label: 'Праздники' },
];

// ── Characters ─────────────────────────────────────────────────────

// Palette index → character sprite sheet:
//   0 boy with tie     1 blonde with apron     2 person with afro (orange)
//   3 older with white hair (suit)     4 boy without tie     5 person with red dress
// Six unique palettes for six characters.
const characters = [
  // Sasha (player) — palette 4 (the guy without a tie). Spawns south of
  // the moved-up table in the open dining area so he can see the whole
  // pizzeria at the start.
  createCharacter({
    id: 'sasha',
    paletteIndex: 4,
    col: 13,
    row: 16,
    isPlayer: true,
    name: 'Саша',
    dir: Direction.UP,
  }),
  // Vika (manager) — palette 1 (blonde girl). East of the cash booth;
  // room was narrowed, so she stays near the east wall tables area.
  createCharacter({
    id: 'vika',
    paletteIndex: 1,
    col: 14,
    row: 4,
    name: 'Вика',
    dir: Direction.DOWN,
    wanders: true,
    wanderRadius: 3,
  }),
  // Andrey (white-haired host) — palette 3. With the kitchen area gone,
  // he no longer roams the prep stations; he's posted behind the big
  // table by the cash register, sitting on the north sofa.
  createCharacter({
    id: 'pizzaiolo_1',
    paletteIndex: 3,
    col: 12,
    row: 1,
    name: 'Андрей',
    dir: Direction.DOWN,
    wanders: false,
    seated: true,
  }),

  // ── Three diners seated on sofas around the big communal table ────
  // The big table is at cols 11–13, rows 15–18 (south side closest to
  // viewer is empty). Each diner is from a different federal district
  // and is placed sitting on a sofa.

  // Diner positions track the moved table (table now at rows 11-14).

  // North side — Far East (Дальневосточный ФО)
  createCharacter({
    id: 'diner_far_east',
    paletteIndex: 0,
    col: 12,
    row: 10,
    name: 'Гость из Владивостока',
    dir: Direction.DOWN,
    wanders: false,
    seated: true,
  }),
  // West side — Volga (Приволжский ФО) — palette 2 (afro orange)
  createCharacter({
    id: 'diner_volga',
    paletteIndex: 2,
    col: 10,
    row: 12,
    name: 'Гость из Казани',
    dir: Direction.RIGHT,
    wanders: false,
    seated: true,
  }),
  // East side — Siberia (Сибирский ФО)
  createCharacter({
    id: 'diner_siberia',
    paletteIndex: 5,
    col: 14,
    row: 12,
    name: 'Гость из Красноярска',
    dir: Direction.LEFT,
    wanders: false,
    seated: true,
  }),

  // Courier — palette 1 (blonde with apron-like uniform), with a big
  // delivery backpack. Stationed in the dispatch corner near the
  // whiteboard. Volga diner shares the palette but they're far apart.
  createCharacter({
    id: 'courier',
    paletteIndex: 1,
    col: 4,
    row: 17,
    name: 'Дима-курьер',
    dir: Direction.DOWN,
    wanders: true,
    wanderRadius: 2,
    hasBackpack: true,
  }),
];

export function buildPizzeriaState(): GameState {
  return createGameState({
    cols: COLS,
    rows: NROWS,
    tileMap,
    furniture,
    characters,
    interactables,
  });
}

export const PIZZERIA_DIMENSIONS = { cols: COLS, rows: NROWS };
