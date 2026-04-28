import { showBubble } from './character';
import type { Character } from './types';

/** Pool of ambient one-liners per NPC id. */
const CHATTER: Record<string, string[]> = {
  vika: [
    'Исследуй нашу диджитал-пиццерию!',
    'Кстати — мы готовим пиццы без перчаток, чистыми руками!',
    'Ну как, всё запомнил?',
  ],
  pizzaiolo_1: [
    'Кто-то заказал ИИ-пиццу!',
    'Две Масалы без лука!',
    'Сегодня заказов больше обычного…',
    'Сегодня зал полон — держим марку!'
  ],
  diner_far_east: [
    'У нас во Владивостоке тоже Додо!',
    'А я скучаю по томатному супу!',
    'На Дальнем Востоке заказы — самые крупные.',
  ],
  diner_volga: [
    'Привет из Казани!',
    'Дома такая же Пепперони.',
    'У нас в Приволжье каждый второй знает Додо.',
    'Из Казани с любовью!',
    'Поволжье — наш вкус.',
  ],
  diner_siberia: [
    'В Сибири без горячей пиццы — никак.',
    'Привет из Красноярска!',
    'Зимой ваша доставка спасает.',
  ],
  diner_central: ['Из Москвы приехал!', 'Люблю тонкое тесто.'],
  diner_south: ['С нами вся страна за одним столом.', 'Ещё воды, пожалуйста.'],
  host_reg: ['Сегодня чеки особенно интересные.', 'Можно оплатить картой или наличными.'],
  host_disp: ['Курьеры уже на линии.', 'Сегодня доставка идёт без задержек.'],
  diner_ural: ['У нас на Урале любят острую.', 'Пицца — это тоже инженерия.'],
  booth_ne: ['Тут тихо, удобно.', 'Можно ещё кофе?'],
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
): void {
  for (const ch of characters) {
    if (ch.isPlayer) continue;
    if (activeStationNpcId && ch.id === activeStationNpcId) continue;
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
