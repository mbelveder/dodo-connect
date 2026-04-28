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
 * IMPORTANT: each station **id** must match a table `Interactable` in
 * `scene/pizzeriaLayout.ts` (puck `glowCol`/`glowRow`). All stations are on
 * the communal table.
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
      'Средний чек в Додо меняется в зависимости от региона и сезона. Посмотри, как предпраздничные недели отражаются на размере заказа.',
    infographic: {
      kind: 'image',
      src: '/img/bill.png',
      caption: 'Средний чек: динамика перед праздниками',
      alt: 'Инфографика среднего чека в предпраздничные недели',
    },
    quiz: {
      question: 'В какой из предпраздничных недель средний чек выше?',
      options: [
        'Перед 23 февраля',
        'Перед 8 марта',
        'Одинаковый в обе недели',
        'Зависит только от региона',
      ],
      correctIndex: 1,
      explain:
        'Перед 8 марта средний чек заметно выше — гости чаще берут большие наборы и праздничные позиции.',
    },
  },
  {
    id: 'dispatch',
    label: 'Доставка',
    intro:
      'Доставка против зала — старый спор. В предпраздничные дни этот баланс смещается. Как ты думаешь, кто побеждает?',
    infographic: {
      kind: 'image',
      src: '/img/delivery.png',
      caption: 'Доля доставки vs зала в предпраздничные дни',
      alt: 'Инфографика соотношения доставки и зала',
    },
    quiz: {
      question: 'Что происходит с долей доставки в дни накануне 8 марта?',
      options: [
        'Снижается — все едут в пиццерию',
        'Остаётся неизменной',
        'Резко растёт',
        'Сначала растёт, потом падает',
      ],
      correctIndex: 2,
      explain:
        'Накануне 8 марта доля доставки резко растёт: гости заказывают на дом, чтобы отметить праздник без очередей.',
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
