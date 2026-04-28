import { createCharacter } from '../engine/character';
import { createGameState, type GameState } from '../engine/gameState';
import {
  Direction,
  TileType,
  type Interactable,
  type PlacedFurniture,
} from '../engine/types';

/**
 * Pizzeria layout — communal table with six seated guests (three calm north
 * faces, three animated south), side sofas east/west of the table, two
 * mirrored two-person booths (SW + SE), and a cash nook NW. Guided stations:
 * register + dispatch use NPC bubbles; the four data stations are colourful
 * pucks on the table — they brighten when the player is on the walk tile
 * or within a few tiles of the glowing puck (the puck sits on blocked cells).
 *
 * Tile codes: '#' wall, ',' dining floor, 'C' counter (non-walkable),
 *             ' ' void.
 */

const ROWS = [
  '#####################', // 0  wall
  '#,,,,,,,,,,,,,,,,,,,#', // 1  N décor / register top
  '#,,,,,,,,,,,,,,,,,,,#', // 2  CASH
  '#,,,,,,,,,,,,,,,,,,,#', // 3  PC at register
  '#CCCCC,,,,,,,,,,,,,,#', // 4  counter divider (cols 1..5)
  '#,,,,,,,,,,,,,,,,,,,#', // 5  N sofa row (cols 5..14)
  '#,,,,,,,,,,,,,,,,,,,#', // 6  table top decorative (walkable)
  '#,,,,,,,,,,,,,,,,,,,#', // 7  table mid + decal + side bench tops
  '#,,,,,,,,,,,,,,,,,,,#', // 8  table mid + decal + side bench bottoms
  '#,,,,,,,,,,,,,,,,,,,#', // 9  table front + food
  '#,,,,,,,,,,,,,,,,,,,#', // 10 S chair top decorative
  '#,,,,,,,,,,,,,,,,,,,#', // 11 S chair back / S NPCs
  '#,,,,,,,,,,,,,,,,,,,#', // 12 S aisle (free for walking)
  '#,,,,,,,,,,,,,,,,,,,#', // 13 booth N seat (SW + SE)
  '#,,,,,,,,,,,,,,,,,,,#', // 14 booth small table top
  '#,,,,,,,,,,,,,,,,,,,#', // 15 booth small table bottom
  '#,,,,,,,,,,,,,,,,,,,#', // 16 booth S seat / dispatch / exit wall strip
  '#####################', // 17 wall
];

function decode(rows: string[]): TileType[][] {
  return rows.map((rowStr) =>
    rowStr.split('').map((ch) => {
      switch (ch) {
        case '#':
          return TileType.WALL;
        case ',':
          return TileType.DINING;
        case 'C':
          return TileType.COUNTER;
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

let nextUid = 1;
function place(defId: string, col: number, row: number, mirror = false, rotation?: number): PlacedFurniture {
  return { uid: `f${nextUid++}`, defId, col, row, mirror, rotation };
}

/** Each entry maps an on-table pixel-art item (top-left tile + def-id) to
 *  its station. Items are scattered across the table surface (cols 7–14,
 *  rows 7–10) to look naturally placed rather than lined up in a row.
 *  The player walks to the south-aisle tile (row 11) under each item. */
const TABLE_STATIONS = [
  // Dodster wrap — represents dodster consumption ('capitals' station).
  // Sits at the west end of the table, near the west-sofa diner.
  {
    glowCol: 7,
    glowRow: 8,
    glowW: 2,
    glowH: 1,
    defId: 'DODSTER_WRAP',
    stationId: 'capitals',
    label: 'Москва и Петербург',
  },
  {
    glowCol: 9,
    glowRow: 6,
    glowW: 2,
    glowH: 2,
    defId: 'RANCH_PIZZA',
    stationId: 'regions',
    label: 'Карта России',
  },
  {
    glowCol: 12,
    glowRow: 6,
    glowW: 2,
    glowH: 2,
    defId: 'VEGGIE_PIZZA',
    stationId: 'tile_map',
    label: 'Карты регионов',
  },
  // Muffin is the 1×1 holiday icon — sits near the east-sofa diner.
  {
    glowCol: 14,
    glowRow: 7,
    glowW: 1,
    glowH: 1,
    defId: 'MUFFIN',
    stationId: 'holidays',
    label: 'Праздники',
  },
] as const;

const interactables: Interactable[] = [
  {
    id: 'register',
    col: 3,
    row: 5,
    label: 'Касса',
    npcId: 'host_reg',
    bubbleText: 'У кассы свежая статистика чеков — подойди, покажу.',
  },
  {
    id: 'dispatch',
    col: 3,
    row: 14,
    label: 'Доставка',
    npcId: 'host_disp',
    bubbleText: 'Про доставку и зал спорят каждый день — есть что показать.',
  },
  ...TABLE_STATIONS.map((t) => ({
    id: t.stationId,
    // Items in the upper half (glowRow ≤ 6) are approached from the tile
    // north of the north SOFA_FRONT row (row 4): row 5 is the sofa footprint
    // and is blocked for collision. Others use the south aisle (row 11).
    col: t.glowW > 1 ? t.glowCol + 1 : t.glowCol,
    row: t.glowRow <= 6 ? 4 : 11,
    label: t.label,
    glowCol: t.glowCol,
    glowRow: t.glowRow,
    glowFootprintW: t.glowW,
    glowFootprintH: t.glowH,
  })),
];

interface NpcDef {
  id: string;
  paletteIndex: number;
  col: number;
  row: number;
  dir: Direction;
  name: string;
  seated: boolean;
  wanders: boolean;
  stillSeated?: boolean;
  hatType?: 'orange' | 'orangeLarge' | 'party';
  hasBackpack?: boolean;
  wanderRadius?: number;
}

const NPC_DEFS: NpcDef[] = [
  // Cashier — white-haired NPC standing behind the register, facing the
  // customer. Wears the Dodo orange cap. Stays put.
  {
    id: 'host_reg',
    paletteIndex: 3,
    col: 3,
    row: 3,
    dir: Direction.DOWN,
    name: 'Кассир',
    seated: false,
    wanders: false,
    hatType: 'orange',
  },
  {
    id: 'host_disp',
    paletteIndex: 3,
    col: 3,
    row: 14,
    dir: Direction.RIGHT,
    name: 'Курьер',
    seated: false,
    hatType: 'orangeLarge',
    hasBackpack: true,
    wanders: true,
    wanderRadius: 2,
  },
  {
    id: 'diner_far_east',
    paletteIndex: 0,
    col: 8,
    row: 5,
    dir: Direction.DOWN,
    name: 'Артём (Дальний Восток)',
    seated: true,
    wanders: false,
  },
  {
    id: 'diner_siberia',
    paletteIndex: 5,
    col: 10,
    row: 5,
    dir: Direction.DOWN,
    name: 'Амина (Южный округ)',
    seated: true,
    wanders: false,
  },
  {
    id: 'diner_ural',
    paletteIndex: 3,
    col: 12,
    row: 5,
    dir: Direction.DOWN,
    name: 'Матвей (Урал)',
    seated: true,
    wanders: false,
  },
  // West sofa (SOFA_SIDE at col 6, row 7 — seat tile is row 8).
  {
    id: 'diner_volga',
    paletteIndex: 2,
    col: 6,
    row: 8,
    dir: Direction.RIGHT,
    name: 'Саша (Центральная Россия)',
    seated: true,
    wanders: false,
  },
  // East sofa (SOFA_SIDE at col 15, row 7 — seat tile is row 8).
  {
    id: 'diner_northwest',
    paletteIndex: 4,
    col: 15,
    row: 8,
    dir: Direction.LEFT,
    name: 'Давид (Поволжье)',
    seated: true,
    wanders: false,
  },
  {
    id: 'booth_se',
    paletteIndex: 0,
    col: 18,
    row: 15,
    dir: Direction.UP,
    name: 'Гость',
    seated: true,
    stillSeated: true,
    wanders: false,
  },
];

interface BuildOpts {
  /** Which playable hero is at the wheel. Determines spawn palette + name. */
  playerChoice?: 'sasha' | 'vika';
}

const PLAYER_PROFILES: Record<'sasha' | 'vika', { paletteIndex: number; name: string }> = {
  sasha: { paletteIndex: 4, name: 'Саша' },
  vika: { paletteIndex: 1, name: 'Настя' },
};

// Per-pizza rotation angles (degrees, clockwise). Non-pizza station items
// and decorative pizzas get their own angles for a natural scattered look.
const PIZZA_ROTATIONS: Partial<Record<string, number>> = {
  RANCH_PIZZA: 12,
  VEGGIE_PIZZA: -8,
  PEPERONI_PIZZA: 20,
};

function buildFurnitureList(): PlacedFurniture[] {
  nextUid = 1;
  // Station items — scattered across the table surface (rows 7–10, cols 7–14)
  // rather than aligned in a single row, for a naturally "set table" look.
  const stationItems = TABLE_STATIONS.map((t) =>
    place(t.defId, t.glowCol, t.glowRow, false, PIZZA_ROTATIONS[t.defId]),
  );

  return [
    place('BIG_TABLE', 7, 6),
    ...stationItems,
    // ── Decorative non-station pizza (cols 13–14, rows 8–9) ────────────
    place('PEPERONI_PIZZA', 13, 8, false, PIZZA_ROTATIONS.PEPERONI_PIZZA),
    // ── Pure table decorations (non-clickable) ─────────────────────────
    place('TABLE_DODO', 11, 8),
    place('COFFEE_CUP', 8, 7),
    place('MILKSHAKE', 11, 7),
    // ── Sofas around the big table ─────────────────────────────────────
    place('SOFA_SIDE', 6, 7, false),
    place('SOFA_SIDE', 15, 7, true),
    place('SOFA_FRONT', 7, 5),
    place('SOFA_FRONT', 9, 5),
    place('SOFA_FRONT', 11, 5),
    place('SOFA_FRONT', 13, 5),
    // ── Cash register area (cash sign removed; cashier NPC stands here) ─
    place('PC_FRONT', 4, 3),
    place('FRIDGE', 5, 2),
    place('EXIT_DOOR', 1, 15),
    // ── Lower-left booth — moved 2 squares east to clear the entrance ──
    place('SOFA_FRONT', 4, 12),
    place('SMALL_TABLE_FRONT', 4, 13),
    place('SOFA_BACK', 4, 15),
    // ── Upper-right booth ──
    place('SOFA_FRONT', 17, 2),
    place('SMALL_TABLE_FRONT', 17, 3),
    place('SOFA_BACK', 17, 5),
    // ── Lower-right booth + small surface props on the table ──
    place('SOFA_FRONT', 17, 12),
    place('SMALL_TABLE_FRONT', 17, 13),
    place('SOFA_BACK', 17, 15),
    place('FRENCH_FRIES', 17, 13),
    place('CHICKEN_LEGS', 18, 13),
    // ── Floor decorations near the big table ──
    place('GIFTS', 6, 9),
    place('BALLS', 15, 10),
    // ── Plants ──
    place('PLANT', 1, 1),
    place('PLANT', 19, 1),
    // place('PLANT', 5, 15),
    // place('PLANT', 16, 15),
    // place('PLANT', 10, 1),
    place('PLANT', 14, 1),
    place('PLANT', 3, 10),
    place('PLANT', 18, 10),
  ];
}

export function buildPizzeriaState(opts: BuildOpts = {}): GameState {
  const choice = opts.playerChoice ?? 'sasha';
  const profile = PLAYER_PROFILES[choice];
  const furniture = buildFurnitureList();

  const player = createCharacter({
    id: choice,
    paletteIndex: profile.paletteIndex,
    col: 10,
    row: 12,
    isPlayer: true,
    name: profile.name,
    dir: Direction.UP,
  });

  const characters = [
    player,
    ...NPC_DEFS.map((c) =>
      createCharacter({
        id: c.id,
        paletteIndex: c.paletteIndex,
        col: c.col,
        row: c.row,
        dir: c.dir,
        name: c.name,
        seated: c.seated,
        stillSeated: c.stillSeated,
        wanders: c.wanders,
        wanderRadius: c.wanders ? 2 : 5,
        hatType: c.hatType,
        hasBackpack: c.hasBackpack,
      }),
    ),
  ];

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
