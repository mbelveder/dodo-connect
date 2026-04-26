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
  ],
  diner_siberia: [
    'В Сибири без горячей пиццы — никак.',
    'Привет из Красноярска!',
    'Зимой ваша доставка спасает.',
  ],
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
): void {
  for (const ch of characters) {
    if (ch.isPlayer) continue;
    const pool = CHATTER[ch.id];
    if (!pool || pool.length === 0) continue;
    const next = state.nextAt.get(ch.id);
    if (next === undefined) {
      state.nextAt.set(ch.id, 5 + Math.random() * 12);
      continue;
    }
    const nextNew = next - dt;
    if (nextNew <= 0 && !ch.bubble) {
      const line = pool[Math.floor(Math.random() * pool.length)];
      showBubble(ch, line, 3.5);
      state.nextAt.set(ch.id, 14 + Math.random() * 18);
    } else {
      state.nextAt.set(ch.id, nextNew);
    }
  }
}
