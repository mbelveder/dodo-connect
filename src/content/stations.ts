import type { PixelChartProps } from '../ui/PixelChart';

export type Infographic =
  | { kind: 'image'; src: string; caption?: string; alt?: string }
  | { kind: 'pixelChart'; chart: PixelChartProps; caption?: string };

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  /** Shown after the player answers, regardless of correctness */
  explain: string;
}

/** One infographic + quiz; used alone or as part of `Station.steps`. */
export interface StationStep {
  /** Extra lead-in for this step (shown under the main station intro when set). */
  intro?: string;
  infographic: Infographic;
  quiz: QuizQuestion;
}

export interface Station {
  id: string;
  label: string;
  /** Short pre-quiz hint shown at the top of the modal */
  intro: string;
  infographic: Infographic;
  quiz: QuizQuestion;
  /** When present, the modal runs these steps in order (overrides flat infographic/quiz). */
  steps?: StationStep[];
}

export function getStationSteps(station: Station): StationStep[] {
  if (station.steps && station.steps.length > 0) return station.steps;
  return [{ infographic: station.infographic, quiz: station.quiz }];
}

/**
 * IMPORTANT: station ids must match the `id` of interactables placed in
 * `scene/pizzeriaLayout.ts`. Currently: register, dispatch, capitals,
 * tile_map, regions, holidays.
 *
 * Teammates: drop your infographics into `public/infographics/` and reference
 * by `/infographics/<file>.png`, OR replace `kind: 'image'` with
 * `kind: 'pixelChart'` and supply chart data.
 */
export const STATIONS: Station[] = [
  {
    id: 'register',
    label: 'Касса',
    intro:
      'Касса — пульс пиццерии. Чек за чеком, регион за регионом. Изучи статистику средних чеков по стране.',
    infographic: {
      kind: 'image',
      src: '/img/bill.png',
      caption: 'Средний чек по федеральным округам и крупным городам',
      alt: 'Рейтинг регионов по среднему чеку Додо',
    },
    quiz: {
      question:
        'Какой субъект РФ занимает пятое место по размеру среднего чека?',
      options: [
        'Приволжский ФО',
        'Санкт-Петербург',
        'Центральный ФО',
        'Сибирский ФО',
      ],
      correctIndex: 3,
      explain:
        'Сибирский ФО уверенно держится в первой пятёрке.',
    },
  },
  {
    id: 'dispatch',
    label: 'Доставка',
    intro:
      'Десерты и напитки по-разному «весят» в чеке: в доставке и в зале картина не совпадает. Посмотри на инфографику.',
    infographic: {
      kind: 'image',
      src: '/img/delivery.png',
      caption:
        'Сравнение доли десертов и напитков в доставке и в ресторанах',
      alt: 'Сравнение доли десертов и напитков в доставке и в ресторанах',
    },
    quiz: {
      question:
        'Если объединить категории «десерты» + «напитки», где их суммарная доля выше?',
      options: ['В доставке', 'В ресторанах', 'Примерно одинаково'],
      correctIndex: 1,
      explain:
        'В зале гости чаще добавляют напитки и десерты к основному заказу; в доставке упор сильнее на «основу», поэтому суммарная доля этих категорий в ресторанах выше.',
    },
  },
  {
    id: 'capitals',
    label: 'Москва и Петербург',
    intro:
      'За одним столом — гости из Владивостока, Казани и Красноярска. А про Москву и Питер все забыли? Кто из этих двух городов потребляет больше додстеров?',
    infographic: {
      kind: 'image',
      src: '/img/dodster.png',
      caption: 'Покупки додстеров: Москва vs Санкт-Петербург',
      alt: 'График покупок додстеров в двух столицах',
    },
    quiz: {
      question:
        'Разница в потреблении додстеров между Москвой и Петербургом больше, чем в полтора раза?',
      options: ['Да', 'Нет'],
      correctIndex: 0,
      explain:
        'По любви к додстерам столицы отличаются заметно!',
    },
  },
  {
    id: 'regions',
    label: 'Карта России',
    intro: 'Средняя выручка на пиццерию по разным субъектам РФ.',
    infographic: {
      kind: 'pixelChart',
      caption: 'Средняя выручка на пиццерию по субъектам РФ, млн ₽ за период',
      chart: {
        type: 'hbar',
        // Sorted by value descending so the Far East surprise is visible at a glance.
        data: [
          { label: 'Дальневосточный ФО', value: 7.05 },
          { label: 'Уральский ФО', value: 5.69 },
          { label: 'Санкт-Петербург', value: 5.24 },
          { label: 'Северо-Западный ФО', value: 4.88 },
          { label: 'Москва', value: 4.85 },
          { label: 'Сибирский ФО', value: 4.64 },
          { label: 'Ленинградская область', value: 4.53 },
          { label: 'Приволжский ФО', value: 4.52 },
          { label: 'Московская область', value: 4.05 },
          { label: 'Южный ФО', value: 3.84 },
          { label: 'Центральный ФО', value: 3.28 },
          { label: 'Северо-Кавказский ФО', value: 2.79 },
        ],
        unit: 'млн ₽',
      },
    },
    quiz: {
      question: 'Какой регион приносит наибольший доход?',
      options: [
        'Москва',
        'Санкт-Петербург',
        'Дальневосточный ФО',
        'Не хватает данных',
      ],
      correctIndex: 3,
      explain:
        'Чтобы сравнивать доход, информации только о выручке недостаточно. Ещё нужно знать, сколько было затрат при производстве продукта.',
    },
  },
  {
    id: 'tile_map',
    label: 'Карты регионов',
    intro:
      '⚠️ Предупреждение системы! Часть данных на картах повреждена ⚠️\n\nНо на этот вопрос вы точно сможете ответить.',
    infographic: {
      kind: 'image',
      src: '/img/tile_map.png',
      caption: 'Фрагмент тайловой карты присутствия пиццерий',
      alt: 'Карта регионов с тайлами',
    },
    quiz: {
      question: 'В каком из этих регионов вообще нет пиццерий Додо?',
      options: [
        'МАГ (Магаданская область)',
        'ЧУК (Чукотский автономный округ)',
        'ПСК (Псковская область)',
        'Я-Н (Ямало-ненецкий автономный округ)',
      ],
      correctIndex: 1,
      explain:
        'Чукотский автономный округ — крайний северо-восток с очень малой плотностью сети; на его территории нет точек Додо (данные команды).',
    },
  },
  {
    id: 'holidays',
    label: 'Праздники',
    intro:
      'Весна в данных Додо — это не только графики, но и два «главных» весенних заказа: 23 февраля и 8 марта. Посмотри, как меняется баланс спроса.',
    infographic: {
      kind: 'image',
      src: '/img/holidays.png',
      caption: 'Заказы к 8 марта и 23 февраля: динамика перед праздниками',
      alt: 'Инфографика заказов к 8 марта и 23 февраля',
    },
    quiz: {
      question:
        'За сколько дней до праздника заказы к 8 марта начинают превышать заказы к 23 февраля?',
      options: [
        'За 5 дней',
        'За 3 дня',
        'За 2 дня',
        'Только в день праздника',
      ],
      correctIndex: 2,
      explain:
        'За 2 дня до 8 марта кривая заказов обгоняет «февральскую» — гости заранее заказывают столы и подарки.',
    },
  },
];
