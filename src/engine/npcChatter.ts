import { showBubble } from './character';
import type { Character } from './types';

/** Big-table diners can chat before the first station is visited. */
const BIG_TABLE_NPC_IDS = new Set([
  'diner_far_east', 'diner_siberia', 'diner_ural', 'diner_volga', 'diner_northwest',
]);
/** North-side diners (facing camera from across the table) only speak when
 *  the player is in the southern half of the map, so they feel "distant". */
const NORTH_TABLE_NPC_IDS = new Set(['diner_far_east', 'diner_siberia', 'diner_ural']);
/** Row threshold — player is "in the south" when tileRow >= this. */
const SOUTH_ROW = 9;

/** Pool of ambient one-liners per NPC id. Phrases match each character's
 *  home region as introduced on the welcome screen. */
const CHATTER: Record<string, string[]> = {
  // Артём — Дальний Восток
  diner_far_east: [
    'У нас во Владивостоке тоже Додо!',
    'Дальневосточные гребешки — сила!',
    'Дальний Восток — ближе, чем кажется.',
  ],
  // Амина — Южный округ
  diner_siberia: [
    'На юге нужно пробовать хычины!',
    'Краснодарский край знает толк в еде.',
  ],
  // Матвей — Урал
  diner_ural: [
    'У нас на Урале любят острую.',
    'Пицца — это тоже инженерия.',
    'Урал — сила!',
  ],
  // Саша — Центральная Россия
  diner_volga: [
    'Привет из Центральной России!',
    'В Москве пиццерий — не сосчитать.',
    'Центр страны — центр вкуса.',
  ],
  // Давид — Поволжье
  diner_northwest: [
    'Стартер — это младший брат эчпочмака!',
    'В Поволжье каждый второй знает Додо.',
  ],
  host_reg: ['Сегодня чеки особенно интересные.', 'Можно оплатить картой или наличными.'],
  host_disp: ['Курьеры уже на линии.', 'Сегодня доставка идёт без задержек.'],
  booth_se: ['У окна приятнее.', 'Ждём пиццу…'],
};

interface ChatterState {
  /** Time until next bubble can fire (per character) */
  nextAt: Map<string, number>;
}

export function createChatterState(): ChatterState {
  return { nextAt: new Map() };
}

export function updateNpcChatter(
  state: ChatterState,
  characters: Character[],
  dt: number,
  /** NPC id currently hosting the guided station bubble — no random chatter. */
  activeStationNpcId: string | null,
  /** Number of stations completed so far. */
  completedStationCount: number,
  /** Player's current tile row (for north-table distance gate). */
  playerRow: number,
): void {
  for (const ch of characters) {
    if (ch.isPlayer) continue;
    if (activeStationNpcId && ch.id === activeStationNpcId) continue;
    const isBigTable = BIG_TABLE_NPC_IDS.has(ch.id);
    // Non-table NPCs stay quiet until the player has explored the first station.
    if (!isBigTable && completedStationCount === 0) continue;
    // North-table visitors only speak when the player is on the south side.
    if (NORTH_TABLE_NPC_IDS.has(ch.id) && playerRow < SOUTH_ROW) continue;
    const pool = CHATTER[ch.id];
    if (!pool || pool.length === 0) continue;
    const next = state.nextAt.get(ch.id);
    if (next === undefined) {
      state.nextAt.set(ch.id, 22 + Math.random() * 28);
      continue;
    }
    const nextNew = next - dt;
    if (nextNew <= 0 && !ch.bubble) {
      const line = pool[Math.floor(Math.random() * pool.length)];
      showBubble(ch, line, 2.6);
      state.nextAt.set(ch.id, 38 + Math.random() * 45);
    } else {
      state.nextAt.set(ch.id, nextNew);
    }
  }
}
