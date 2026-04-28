# Dodo Connect

An 8-bit pixel-art pizzeria built around Dodo's slogan
**"Есть то, что нас объединяет"** — a short interactive piece illustrating
how Dodo Pizza connects different Russian regions. The player picks Саша
or Вика, walks around an open dining hall, and explores **four** data stations
on a big communal table where six guests from different federal districts
share a meal.

This repository is a fork of the original
[dodo-game](https://github.com/mbelveder/dodo-game) hackathon project,
re-themed and rebuilt around the regional-unity concept.

## Run

```bash
npm install
npm run dev
```

Open the URL Vite prints (default `http://localhost:5173`).

## Controls

- **WASD / Arrow keys** — walk
- **Click** — walk to that tile; click a **table station** hotspot (the
  coloured puck) to walk to its approach tile and open it on arrival, or click
  again when you are already in range to open immediately

## Game flow

1. **Start screen** — slogan, the regional cast lined up across the
   bottom, a hero pick (Саша or Вика), and a sound toggle that is **off
   by default**. Sound preference is persisted to `localStorage`.
2. **Play** — open dining hall with the big table at the center. Six
   regional guests are seated around it; the Dodo identics + slogan
   placeholder is printed on the table surface. **Four** interactive data
   stations sit on the table as colourful pucks (the cash area and exit door
   are decorative only).
3. **Ending** — once all four stations are answered, the two-page closing
   sequence runs (friends line, then credits).

## Stations

| id | Label | Sketch position |
|---|---|---|
| `capitals` | Москва и Петербург | South-west on table |
| `regions` | Карта России | North-east on table |
| `tile_map` | Карты регионов | North on table |
| `holidays` | Праздники | South-east on table |

The cash counter (кассир NPC + register props) and the **ВЫХОД** door are
scene dressing only — they do not open a station modal.

## Project layout

```
src/
  engine/      Game engine: tile map, BFS pathfinding, character state
               machine, sprite cache, renderer, game loop, NPC chatter,
               sound preference (audio.ts).
  scene/       Pizzeria layout (tile grid + furniture + characters +
               interactables) and the furniture catalog.
  content/     Stations (infographics + quizzes) and the ending story.
  ui/          React components: boot screen, StartScreen (slogan +
               hero pick + sound toggle), in-world HUD, infographic +
               quiz modal, ending screen, and a custom canvas-based
               pixel chart.
public/
  characters/  6 character sprite sheets (112×96, 16×32 frames).
  furniture/   Furniture sprites (TABLE_FRONT, SOFA, PC, etc).
  fonts/       Pixel Sans Unicode (covers Cyrillic).
  infographics/ Drop-in folder for hand-authored infographic images.
  sound/       Modal sound effect (gated by the sound toggle).
```

## Replacing the placeholder Dodo identics

The Dodo logo + slogan currently rendered on the table is a procedural
pixel-art placeholder built in
[`src/engine/sprites.ts`](src/engine/sprites.ts) (`buildDodoTableDecal`).
When real SVG identics are available, drop them into `public/img/brand/`
and render them as an HTML `<img>` overlay positioned over the table
tiles using tile-to-screen coordinate conversion (camera state is
available via the renderer).

## How to add or change a station

Stations live in [`src/content/stations.ts`](src/content/stations.ts) and
their **id** must match the corresponding `Interactable` placed in
[`src/scene/pizzeriaLayout.ts`](src/scene/pizzeriaLayout.ts).

Each station has two halves: an **infographic** and a **quiz**.

### Infographic — image (default)

Drop a PNG or SVG into `public/infographics/` and reference it:

```ts
infographic: {
  kind: 'image',
  src: '/infographics/orders-by-hour.png',
  caption: 'Заказы по часам',
  alt: 'Линейный график',
}
```

### Infographic — pixel chart (built from raw data)

If you only have raw data, use the built-in `PixelChart` in `bar`, `hbar`,
`line`, or `pie` mode. It renders blocky pixel art in the Dodo palette:

```ts
infographic: {
  kind: 'pixelChart',
  caption: 'Топ-5 пицц',
  chart: {
    type: 'hbar',
    data: [
      { label: 'Пепперони', value: 1240 },
      { label: 'Маргарита', value: 980 },
    ],
    unit: 'шт',
  },
}
```

### Quiz

```ts
quiz: {
  question: 'Какая пицца самая популярная?',
  options: ['Маргарита', 'Пепперони', 'Гавайская', 'Четыре сыра'],
  correctIndex: 1,
  explain: 'Пепперони — лидер. Она опережает Маргариту почти на треть.',
}
```

The player gets immediate feedback. Whether the answer was right or
wrong is recorded for the ending score line.

## Adding or moving regional guests

The seated cast lives in `SEATED_CAST` inside
[`src/scene/pizzeriaLayout.ts`](src/scene/pizzeriaLayout.ts). Each entry
sets the palette (0–5 from `public/characters/char_*.png`), seat tile,
facing direction, and display name. Make sure the seat tile sits on a
sofa or chair so the seated character sprite reads correctly.

## How to change the ending story

[`src/content/ending.ts`](src/content/ending.ts) exports
`ENDING_BEFORE_CREDITS` — the first ending card (no title). The second
card is credits only; flow is in
[`src/ui/EndingStory.tsx`](src/ui/EndingStory.tsx).

## Engine notes

The core engine (renderer, character state machine, BFS pathfinding) is
intentionally small (under ~500 LoC). Tile size is **16 px** with a
fixed **3× zoom**. NPC ambient chatter lives in
`src/engine/npcChatter.ts`. Sound effects route through
[`src/engine/audio.ts`](src/engine/audio.ts) so the start-screen toggle
mutes everything when off.

## License

Character and furniture sprites are reused from the MIT-licensed
[pixel-agents](https://github.com/pablodelucca/pixel-agents) project,
which in turn credits
[JIK-A-4 / Metro City](https://jik-a-4.itch.io/metrocity-free-topdown-character-pack)
for the character pack.
