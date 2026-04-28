import type { FurnitureDef } from '../engine/types';

/**
 * Hand-curated catalog of furniture used in the pizzeria.
 * Sprites are loaded directly from /furniture/<FOLDER>/<FILE>.png.
 */
const CATALOG: Record<string, FurnitureDef> = {
  TABLE_FRONT: {
    id: 'TABLE_FRONT',
    src: '/furniture/TABLE_FRONT/TABLE_FRONT.png',
    w: 48,
    h: 64,
    footprintW: 3,
    footprintH: 4,
    backgroundTiles: 1,
  },
  SMALL_TABLE_FRONT: {
    id: 'SMALL_TABLE_FRONT',
    src: '/furniture/SMALL_TABLE/SMALL_TABLE_FRONT.png',
    w: 32,
    h: 32,
    footprintW: 2,
    footprintH: 2,
    backgroundTiles: 1,
  },
  WOODEN_CHAIR_FRONT: {
    id: 'WOODEN_CHAIR_FRONT',
    src: '/furniture/WOODEN_CHAIR/WOODEN_CHAIR_FRONT.png',
    w: 16,
    h: 32,
    footprintW: 1,
    footprintH: 2,
    backgroundTiles: 1,
  },
  WOODEN_CHAIR_BACK: {
    id: 'WOODEN_CHAIR_BACK',
    src: '/furniture/WOODEN_CHAIR/WOODEN_CHAIR_BACK.png',
    w: 16,
    h: 32,
    footprintW: 1,
    footprintH: 2,
    backgroundTiles: 1,
  },
  WOODEN_CHAIR_SIDE: {
    id: 'WOODEN_CHAIR_SIDE',
    src: '/furniture/WOODEN_CHAIR/WOODEN_CHAIR_SIDE.png',
    w: 16,
    h: 32,
    footprintW: 1,
    footprintH: 2,
    backgroundTiles: 1,
  },
  CUSHIONED_CHAIR_FRONT: {
    id: 'CUSHIONED_CHAIR_FRONT',
    src: '/furniture/CUSHIONED_CHAIR/CUSHIONED_CHAIR_FRONT.png',
    w: 16,
    h: 16,
    footprintW: 1,
    footprintH: 1,
  },
  CUSHIONED_CHAIR_BACK: {
    id: 'CUSHIONED_CHAIR_BACK',
    src: '/furniture/CUSHIONED_CHAIR/CUSHIONED_CHAIR_BACK.png',
    w: 16,
    h: 16,
    footprintW: 1,
    footprintH: 1,
  },
  PC_FRONT: {
    id: 'PC_FRONT',
    src: '/furniture/PC/PC_FRONT_ON_1.png',
    w: 16,
    h: 32,
    footprintW: 1,
    footprintH: 2,
    backgroundTiles: 1,
  },
  PC_SIDE: {
    id: 'PC_SIDE',
    src: '/furniture/PC/PC_SIDE.png',
    w: 16,
    h: 32,
    footprintW: 1,
    footprintH: 2,
    backgroundTiles: 1,
  },
  WHITEBOARD: {
    id: 'WHITEBOARD',
    src: '/furniture/WHITEBOARD/WHITEBOARD.png',
    w: 32,
    h: 32,
    footprintW: 2,
    footprintH: 2,
    backgroundTiles: 2,
  },
  PLANT: {
    id: 'PLANT',
    src: '/furniture/PLANT/PLANT.png',
    w: 16,
    h: 32,
    footprintW: 1,
    footprintH: 2,
    backgroundTiles: 1,
  },
  CACTUS: {
    id: 'CACTUS',
    src: '/furniture/CACTUS/CACTUS.png',
    w: 16,
    h: 32,
    footprintW: 1,
    footprintH: 2,
    backgroundTiles: 1,
  },
  CLOCK: {
    id: 'CLOCK',
    src: '/furniture/CLOCK/CLOCK.png',
    w: 16,
    h: 32,
    footprintW: 1,
    footprintH: 2,
    backgroundTiles: 2,
  },
  COFFEE: {
    id: 'COFFEE',
    src: '/furniture/COFFEE/COFFEE.png',
    w: 16,
    h: 16,
    footprintW: 1,
    footprintH: 1,
  },
  BIN: {
    id: 'BIN',
    src: '/furniture/BIN/BIN.png',
    w: 16,
    h: 16,
    footprintW: 1,
    footprintH: 1,
  },
  PIZZA: {
    id: 'PIZZA',
    src: 'synthetic://pizza',
    w: 32,
    h: 16,
    footprintW: 2,
    footprintH: 1,
    surface: true,
  },
  // Pesto/green pizza variant — same shape as PIZZA, different palette
  // so two pizzas on the same table read as two distinct pies.
  PIZZA_GREEN: {
    id: 'PIZZA_GREEN',
    src: 'synthetic://pizza-green',
    w: 32,
    h: 16,
    footprintW: 2,
    footprintH: 1,
    surface: true,
  },
  // Pixel-art cash that fills the register tile. Walkable
  // (backgroundTiles=1) so the player can still stand on the register
  // square; surface=true so it draws on top of the floor.
  CASH: {
    id: 'CASH',
    src: 'synthetic://cash',
    w: 16,
    h: 16,
    footprintW: 1,
    footprintH: 1,
    backgroundTiles: 1,
    surface: true,
  },
  // Placeholder Dodo identics + slogan decal printed on the long
  // communal table. 5 tiles wide × 2 tall, doesn't block walking
  // (backgroundTiles matches footprintH), draws on top of the table
  // surface so the slogan is always legible above the wood grain.
  DODO_TABLE_DECAL: {
    id: 'DODO_TABLE_DECAL',
    src: 'synthetic://dodo-table-decal',
    w: 80,
    h: 32,
    footprintW: 5,
    footprintH: 2,
    backgroundTiles: 2,
    surface: true,
  },
  // Communal banquet table — 8 tiles wide × 4 tall. The top tile
  // (backgroundTiles=1) is decorative back-rim and walkable, the
  // bottom 3 rows block. Four guests sit along the north sofa, four
  // along the south chairs, with the slogan engraved into the wood
  // (no separate decal — see buildBigTable in sprites.ts).
  BIG_TABLE: {
    id: 'BIG_TABLE',
    src: 'synthetic://big-table',
    w: 128,
    h: 80,
    footprintW: 8,
    footprintH: 5,
    backgroundTiles: 1,
  },
  // Decorative rug under the communal table — 12 tiles wide × 6 tall
  // (192×96 px). flat=true sorts it to the very back so the table,
  // sofas, characters, and decor all draw on top. Doesn't block walking
  // (backgroundTiles=footprintH).
  RUG: {
    id: 'RUG',
    src: 'synthetic://rug',
    w: 192,
    h: 96,
    footprintW: 12,
    footprintH: 6,
    backgroundTiles: 6,
    flat: true,
  },
  // Wall-mounted dusk window. 1×2 tile sprite that reads as a small
  // window with warm orange glass — used on interior walls to give the
  // pizzeria a "dinner-time, lights are on" vibe.
  WINDOW: {
    id: 'WINDOW',
    src: 'synthetic://window',
    w: 16,
    h: 32,
    footprintW: 1,
    footprintH: 2,
    backgroundTiles: 2,
  },
  // 1×1 framed onion-dome painting — wall art for the pizzeria.
  PAINTING: {
    id: 'PAINTING',
    src: 'synthetic://painting',
    w: 16,
    h: 16,
    footprintW: 1,
    footprintH: 1,
    backgroundTiles: 1,
  },
  // Variant pizza #3 — quattro formaggi (cream + golden cheese flecks).
  PIZZA_WHITE: {
    id: 'PIZZA_WHITE',
    src: 'synthetic://pizza-white',
    w: 32,
    h: 16,
    footprintW: 2,
    footprintH: 1,
    surface: true,
  },
  // Bread basket — small surface prop on the communal table.
  BREAD: {
    id: 'BREAD',
    src: 'synthetic://bread',
    w: 16,
    h: 16,
    footprintW: 1,
    footprintH: 1,
    backgroundTiles: 1,
    surface: true,
  },
  // Russian samovar — 1×2 tall hot-tea urn that anchors the communal
  // meal symbolism. Sits on the table surface (surface=true) and
  // doesn't block walking.
  SAMOVAR: {
    id: 'SAMOVAR',
    src: 'synthetic://samovar',
    w: 16,
    h: 32,
    footprintW: 1,
    footprintH: 2,
    backgroundTiles: 2,
    surface: true,
  },
  // Dodster mascot — Dodo's chick mascot rendered from
  // /image/dodster.png (1800×1200 source, 3:2 aspect). Sits on the
  // table as a small 24×16 prop (half the previous size) so it doesn't
  // dominate the table. footprintW=2 leaves room for the 72-pixel-wide
  // sprite to render without bleeding past its tile box; backgroundTiles=1
  // keeps both tiles walkable (visual prop only); surface=true draws it
  // on top of the table wood.
  DODSTER: {
    id: 'DODSTER',
    src: '/image/dodster.png',
    w: 24,
    h: 16,
    footprintW: 2,
    footprintH: 1,
    backgroundTiles: 1,
    surface: true,
    preserveAspect: true,
  },
  // Pixel-art dodster wrap — /items/dodster.webp. Used as the clickable
  // surface item for the 'capitals' station (dodster consumption data).
  // 26×18 rendered at 2×1 tile footprint; smooth=true for the webp source.
  DODSTER_WRAP: {
    id: 'DODSTER_WRAP',
    src: '/items/dodster.webp',
    w: 26,
    h: 18,
    footprintW: 2,
    footprintH: 1,
    backgroundTiles: 1,
    surface: true,
    smooth: true,
    preserveAspect: true,
    xOffsetPx: 3,
  },
  // Pixel burrito half-wrapped in foil — table prop on the communal table.
  BURRITO: {
    id: 'BURRITO',
    src: 'synthetic://burrito',
    w: 16,
    h: 16,
    footprintW: 1,
    footprintH: 1,
    backgroundTiles: 1,
    surface: true,
  },
  // Sofas around the big communal table. SOFA_FRONT shows the back-rest at
  // the top (used when characters sit south of the back-rest, facing south).
  // SOFA_SIDE is a side-profile (used for east/west seating, mirrored for the
  // opposite side via the `mirror` flag in PlacedFurniture).
  // All sofa variants are tinted to Dodo orange and use the chair z-sort
  // ("seatLow") so seated characters render in front of them, like in
  // pixel-agents.
  SOFA_FRONT: {
    id: 'SOFA_FRONT',
    src: '/furniture/SOFA/SOFA_FRONT.png',
    w: 32,
    h: 16,
    footprintW: 2,
    footprintH: 1,
    seatLow: true,
    tint: 'orange',
    // Push the north sofa down 8 px so it visually overlaps the table's
    // decorative top edge — eliminates the "floating away" gap.
    yOffsetPx: 8,
  },
  SOFA_BACK: {
    id: 'SOFA_BACK',
    src: '/furniture/SOFA/SOFA_BACK.png',
    w: 32,
    h: 16,
    footprintW: 2,
    footprintH: 1,
    seatLow: true,
    tint: 'orange',
  },
  SOFA_SIDE: {
    id: 'SOFA_SIDE',
    src: '/furniture/SOFA/SOFA_SIDE.png',
    w: 16,
    h: 32,
    footprintW: 1,
    footprintH: 2,
    backgroundTiles: 1,
    seatLow: true,
    tint: 'orange',
  },
  // Six coloured "station" pucks on the communal table (one per guided step).
  STATION_DISC_0: {
    id: 'STATION_DISC_0',
    src: 'synthetic://station-disc-0',
    w: 16,
    h: 16,
    footprintW: 1,
    footprintH: 1,
    surface: true,
  },
  STATION_DISC_1: {
    id: 'STATION_DISC_1',
    src: 'synthetic://station-disc-1',
    w: 16,
    h: 16,
    footprintW: 1,
    footprintH: 1,
    surface: true,
  },
  STATION_DISC_2: {
    id: 'STATION_DISC_2',
    src: 'synthetic://station-disc-2',
    w: 16,
    h: 16,
    footprintW: 1,
    footprintH: 1,
    surface: true,
  },
  STATION_DISC_3: {
    id: 'STATION_DISC_3',
    src: 'synthetic://station-disc-3',
    w: 16,
    h: 16,
    footprintW: 1,
    footprintH: 1,
    surface: true,
  },
  STATION_DISC_4: {
    id: 'STATION_DISC_4',
    src: 'synthetic://station-disc-4',
    w: 16,
    h: 16,
    footprintW: 1,
    footprintH: 1,
    surface: true,
  },
  STATION_DISC_5: {
    id: 'STATION_DISC_5',
    src: 'synthetic://station-disc-5',
    w: 16,
    h: 16,
    footprintW: 1,
    footprintH: 1,
    surface: true,
  },
  // Tall double-door commercial fridge for the cash-register area.
  FRIDGE: {
    id: 'FRIDGE',
    src: 'synthetic://fridge',
    w: 16,
    h: 32,
    footprintW: 1,
    footprintH: 2,
    backgroundTiles: 1,
  },
  // Wall-mounted ВЫХОД exit — a green sign over a wooden door.
  EXIT_DOOR: {
    id: 'EXIT_DOOR',
    src: 'synthetic://exit-door',
    w: 16,
    h: 32,
    footprintW: 1,
    footprintH: 2,
    backgroundTiles: 2,
  },
  // Empty bistro-style 2-person table — square top, single pedestal.
  // Used in the lower-mid as an "open seat waiting for guests" beat.
  SMALL_EMPTY_TABLE: {
    id: 'SMALL_EMPTY_TABLE',
    src: 'synthetic://small-empty-table',
    w: 32,
    h: 32,
    footprintW: 2,
    footprintH: 2,
    backgroundTiles: 1,
  },
  // ── Station items on the communal table (clickable hotspots) ──────
  // Each one is a hand-drawn pixel-art webp tied to a single station.
  // 32×32 source rendered as 2×2 tiles (96×96 css px). `smooth: true`
  // because the webp source is much higher than 32×32 and nearest-
  // neighbour downscaling shreds the art.
  PEPERONI_PIZZA: {
    id: 'PEPERONI_PIZZA',
    src: '/items/peperoni_pizza.webp',
    // 26×26 — 20% smaller than the 32×32 footprint, centred via xOffsetPx
    w: 26,
    h: 26,
    footprintW: 2,
    footprintH: 2,
    backgroundTiles: 2,
    surface: true,
    smooth: true,
    xOffsetPx: 3,
  },
  RANCH_PIZZA: {
    id: 'RANCH_PIZZA',
    src: '/items/ranch_pizza.webp',
    w: 26,
    h: 26,
    footprintW: 2,
    footprintH: 2,
    backgroundTiles: 2,
    surface: true,
    smooth: true,
    xOffsetPx: 3,
  },
  VEGGIE_PIZZA: {
    id: 'VEGGIE_PIZZA',
    src: '/items/veggie_pizza.webp',
    w: 26,
    h: 26,
    footprintW: 2,
    footprintH: 2,
    backgroundTiles: 2,
    surface: true,
    smooth: true,
    xOffsetPx: 3,
  },
  // Muffin sized 4× smaller than the 32-px pizzas — 8×8 source rendered
  // 24 css px on a single tile. Acts as a clickable holidays station.
  MUFFIN: {
    id: 'MUFFIN',
    src: '/items/muffin.webp',
    w: 12,
    h: 12,
    footprintW: 1,
    footprintH: 1,
    backgroundTiles: 1,
    surface: true,
    smooth: true,
    xOffsetPx: 2,
  },
  // Open pizza box — decorative surface prop on the upper-right corner.
  PIZZA_BOX: {
    id: 'PIZZA_BOX',
    src: '/items/pizza_box.webp',
    w: 22,
    h: 22,
    footprintW: 1,
    footprintH: 1,
    backgroundTiles: 1,
    surface: true,
    smooth: true,
    xOffsetPx: 1,
  },
  // ── Pure table decorations (non-clickable) ──────────────────────
  TABLE_DODO: {
    id: 'TABLE_DODO',
    src: '/items/dodo.webp',
    w: 16,
    h: 18,
    footprintW: 1,
    footprintH: 1,
    backgroundTiles: 1,
    surface: true,
    smooth: true,
  },
  MILKSHAKE: {
    id: 'MILKSHAKE',
    src: '/items/milkshake.webp',
    w: 9,
    h: 12,
    footprintW: 1,
    footprintH: 1,
    backgroundTiles: 1,
    surface: true,
    smooth: true,
    xOffsetPx: 3,
    yOffsetPx: -12,
  },
  COFFEE_CUP: {
    id: 'COFFEE_CUP',
    src: '/items/coffee.webp',
    w: 9,
    h: 12,
    footprintW: 1,
    footprintH: 1,
    backgroundTiles: 1,
    surface: true,
    smooth: true,
    xOffsetPx: 3,
    yOffsetPx: -12,
  },
  FRENCH_FRIES: {
    id: 'FRENCH_FRIES',
    src: '/items/french_fries.webp',
    w: 12,
    h: 14,
    footprintW: 1,
    footprintH: 1,
    backgroundTiles: 1,
    surface: true,
    smooth: true,
    xOffsetPx: 2,
    yOffsetPx: 5,
  },
  CHICKEN_LEGS: {
    id: 'CHICKEN_LEGS',
    src: '/items/chicken_legs.webp',
    w: 14,
    h: 12,
    footprintW: 1,
    footprintH: 1,
    backgroundTiles: 1,
    surface: true,
    smooth: true,
    xOffsetPx: 1,
    yOffsetPx: 5,
  },
  // Party hat drawn over a character's head — never placed as furniture,
  // listed here purely so the asset preloads alongside the rest.
  PARTY_HAT: {
    id: 'PARTY_HAT',
    src: '/items/hat.webp',
    w: 12,
    h: 14,
    footprintW: 1,
    footprintH: 1,
    smooth: true,
  },
  // Floor decorations near the big table.
  GIFTS: {
    id: 'GIFTS',
    src: '/items/gifts.webp',
    w: 16,
    h: 16,
    footprintW: 1,
    footprintH: 1,
    backgroundTiles: 1,
    smooth: true,
  },
  BALLS: {
    id: 'BALLS',
    src: '/items/balls.webp',
    w: 24,
    h: 48,
    footprintW: 1,
    footprintH: 2,
    backgroundTiles: 2,
    smooth: true,
  },
};

export function getFurnitureDef(id: string): FurnitureDef | undefined {
  return CATALOG[id];
}

export function getAllFurnitureSrcs(): string[] {
  return Object.values(CATALOG).map((d) => d.src);
}

export function getAllFurnitureRequests(): Array<{ src: string; tint?: 'orange' }> {
  return Object.values(CATALOG).map((d) => ({ src: d.src, tint: d.tint }));
}
