# Dodo Connect

An 8-bit pixel-art pizzeria built around Dodo's slogan
**"Есть то, что нас объединяет"** — a short interactive piece illustrating
how Dodo Pizza connects different Russian regions. The player picks Саша
or Вика, walks around an open dining hall, and explores six data stations
arranged around a big communal table where six guests from different
federal districts share a meal.

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
- **Click** — walk to that tile (or click directly on a station to walk
  there and auto-open it on arrival)
- **E** — interact with a station while standing next to its yellow ring

## Game flow

1. **Start screen** — slogan, the regional cast lined up across the
   bottom, a hero pick (Саша or Вика), and a sound toggle that is **off
   by default**. Sound preference is persisted to `localStorage`.
2. **Play** — open dining hall with the big table at the center. Six
   regional guests are seated around it; the Dodo identics + slogan
   placeholder is printed on the table surface. Six stations frame the
   table.
3. **Ending** — once all six stations are answered, Вика's verdict
   plays based on the player's score.

## Stations

| id | Label | Sketch position |
|---|---|---|
| `tile_map` | Карты регионов | West (left of table) |
| `regions` | Карта России | North-east (above table) |
| `capitals` | Москва и Петербург | South (below table) |
| `holidays` | Праздники | South-east (right of table) |
| `register` | Касса | Top-left corner |
| `dispatch` | Доставка | Bottom-left corner |

The four sketch-positioned stations are the highlighted ones; `register`
and `dispatch` are tucked into back corners.

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
wrong is recorded and influences Вика's verdict in the ending.

## Adding or moving regional guests

The seated cast lives in `SEATED_CAST` inside
[`src/scene/pizzeriaLayout.ts`](src/scene/pizzeriaLayout.ts). Each entry
sets the palette (0–5 from `public/characters/char_*.png`), seat tile,
facing direction, and display name. Make sure the seat tile sits on a
sofa or chair so the seated character sprite reads correctly.

## How to change the ending story

`src/content/ending.ts` — list of `StoryBeat` objects, each with a `text`
and optionally a `chart`. The `getVerdict(score, total)` function returns
Вика's final line based on the player's score.

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
