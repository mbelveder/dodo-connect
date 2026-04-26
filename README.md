# Dodo: Смена Саши

An 8-bit pixel-art pizzeria simulator made for a data-journalism hackathon
about Dodo Pizza. The player walks around as Саша (Sasha), interacts with
work stations, sees a pixel-style infographic, answers a short quiz, and
unlocks a final data-driven story narrated by his manager Вика.

## Run

```bash
cd dodo-game
npm install
npm run dev
```

Open the URL Vite prints (default `http://localhost:5173`).

## Controls

- **WASD / Arrow keys** — walk
- **Click** — walk to that tile (or click directly on a station to walk there
  and auto-open it on arrival)
- **E** — interact with a station while standing next to its yellow ring

## Project layout

```
src/
  engine/      Game engine: tile map, BFS pathfinding, character state
               machine, sprite cache, renderer, game loop, NPC chatter.
  scene/       Pizzeria layout (tile grid + furniture + characters +
               interactables) and a small furniture catalog.
  content/     Stuff teammates touch most: intro dialogue, stations
               (infographics + quizzes), and the ending story beats.
  ui/          React components for boot screen, intro cutscene,
               in-world HUD, infographic + quiz modal, ending screen,
               and a custom canvas-based pixel chart.
public/
  characters/  6 character sprite sheets (112×96, 16×32 frames).
  furniture/   Furniture sprites + manifests (TABLE_FRONT, PC, etc).
  fonts/       Pixel Sans Unicode (covers Cyrillic).
  infographics/ Drop-in folder for hand-authored infographic images.
```

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

The player gets immediate feedback. Whether the answer was right or wrong
is recorded and influences Вика's verdict in the ending.

## How to change the ending story

`src/content/ending.ts` — list of `StoryBeat` objects, each with a `text`
and optionally a `chart`. The `getVerdict(score, total)` function returns
Вика's final line based on the player's score.

## Engine notes

The core engine (renderer, character state machine, BFS pathfinding) is
intentionally small (under ~500 LoC) and inspired by, but independent of,
the `pixel-agents` reference project at the repo root. Tile size is
**16 px** with a fixed **3× zoom**.

NPCs wander within a configurable radius (`wanderRadius`) of their initial
tile, so each character "belongs" to a part of the pizzeria. NPC ambient
chatter lives in `src/engine/npcChatter.ts`.

## License

Character and furniture sprites are reused from the MIT-licensed
[pixel-agents](https://github.com/pablodelucca/pixel-agents) project,
which in turn credits [JIK-A-4 / Metro City](https://jik-a-4.itch.io/metrocity-free-topdown-character-pack)
for the character pack.
