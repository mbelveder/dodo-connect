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
