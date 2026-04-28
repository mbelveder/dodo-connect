import { useEffect, useRef, useState } from 'react';

import { setSoundEnabled } from '../engine/audio';
import { DODO_PALETTE } from '../engine/constants';
import {
  CHAR_H,
  CHAR_W,
  getCharacterSheet,
  getCharFrameRect,
  walkFrameIdx,
} from '../engine/sprites';
import { Direction } from '../engine/types';
import { withBase } from './Infographic';

export type PlayerChoice = 'sasha' | 'vika';

interface WelcomeFlowProps {
  onStart: (opts: { playerId: PlayerChoice; soundOn: boolean }) => void;
}

const REGIONAL_CAST = [
  { name: 'Артём', region: 'Дальний\nВосток', palette: 0, isPlayer: false },
  { name: 'Саша', region: 'Центральная\nРоссия', palette: 2, isPlayer: false },
  { name: 'Матвей', region: 'Урал', palette: 3, isPlayer: false },
  { name: 'Амина', region: 'Южный\nокруг', palette: 5, isPlayer: false },
  { name: 'Давид', region: 'Поволжье', palette: 4, isPlayer: false },
  { name: 'Настя', region: 'Сибирь', palette: 1, isPlayer: true },
];

type PageState = 'p1' | 'p1-out' | 'p2';

export function WelcomeFlow({ onStart }: WelcomeFlowProps) {
  const [pageState, setPageState] = useState<PageState>('p1');
  const [soundOn, setSoundOn] = useState<boolean>(false);

  const goNext = () => {
    setPageState('p1-out');
    setTimeout(() => setPageState('p2'), 320);
  };

  const handleStart = () => {
    setSoundEnabled(soundOn);
    onStart({ playerId: 'vika', soundOn });
  };

  const contentClass =
    pageState === 'p1-out' ? 'welcomeContent welcomeContentOut' : 'welcomeContent welcomeContentIn';

  return (
    <div className="welcomeScreen">
      <div className="welcomeInner">
        <div className="welcomeTitle">Есть то, что&nbsp;нас объединяет</div>

        <div className={contentClass} key={pageState === 'p2' ? 'p2' : 'p1'}>
          {pageState !== 'p2' ? (
            <Page1 onNext={goNext} />
          ) : (
            <Page2
              soundOn={soundOn}
              onToggleSound={setSoundOn}
              onStart={handleStart}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Backwards-compat alias
export { WelcomeFlow as StartScreen };

function Page1({ onNext }: { onNext: () => void }) {
  return (
    <div className="p1Wrap">
      <div className="p1Layout">
        <img src={withBase('/items/dodo.webp')} alt="Додо" className="p1DodoImg" />
        <div className="p1TextCol">
          <p className="p1Body">
            На праздники в России принято собираться за общим столом. Шесть друзей,
            шесть жителей разных регионов России встретились в Додо, чтобы отметить
            день рождения Насти из Сибири. Предметы на их столе расскажут тебе, почему
            праздники в Додо — горячее время.
          </p>
          <button className="btn btnPrimary p1Btn" onClick={onNext}>
            Далее ▸
          </button>
        </div>
      </div>
    </div>
  );
}

interface Page2Props {
  soundOn: boolean;
  onToggleSound: (on: boolean) => void;
  onStart: () => void;
}

function Page2({ soundOn, onToggleSound, onStart }: Page2Props) {
  const npcCast = REGIONAL_CAST.filter((c) => !c.isPlayer);
  const player = REGIONAL_CAST.find((c) => c.isPlayer)!;

  return (
    <div className="p2Wrap">
      <div className="startCastRow">
        {npcCast.map((c) => (
          <div className="startCastItem" key={c.palette + c.name}>
            <CharacterPortrait palette={c.palette} size={1.6} />
            <div className="startCastName">{c.name}</div>
            <div className="startCastRegion">{c.region}</div>
          </div>
        ))}
      </div>

      <div className="startPlayerRow">
        <div className="startPlayerItem">
          <CharacterPortrait palette={player.palette} size={3.2} />
          <div className="startPlayerName">{player.name}</div>
          <div className="startPlayerRegion">{player.region}</div>
        </div>
      </div>

      <div className="startDataNote">
        <p>При создании игры использованы данные о продажах в пиццериях Додо по всей России в две предпразничные недели — перед 8 марта и 23 февраля.</p>
        <p>Данные с хакатона НИУ ВШЭ «Всем Дата».</p>
      </div>

      <label className="startSoundToggle">
        <input
          type="checkbox"
          checked={soundOn}
          onChange={(e) => onToggleSound(e.target.checked)}
        />
        <span className="startSoundLabel">Включить звук</span>
      </label>

      <button className="btn btnPrimary startStartBtn" onClick={onStart}>
        Начать ▸
      </button>
    </div>
  );
}

interface PortraitProps {
  palette: number;
  size: number;
  showHat?: boolean;
  animated?: boolean;
}

function CharacterPortrait({ palette, size, showHat, animated }: PortraitProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const w = Math.round(CHAR_W * size);
  const charH = Math.round(CHAR_H * size);
  // Extra headroom so the party hat draws fully above the hairline
  const extraTop = showHat ? Math.round(16 * size) : 0;
  const h = charH + extraTop;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const draw = (t: number) => {
      const sheet = getCharacterSheet(palette);
      ctx.clearRect(0, 0, w, h);
      if (sheet) {
        const frameIdx = animated ? walkFrameIdx(Math.floor(t * 1.6)) : 0;
        const f = getCharFrameRect(sheet, Direction.DOWN, frameIdx);
        ctx.drawImage(f.source, f.sx, f.sy, f.sw, f.sh, 0, extraTop, w, charH);
      } else {
        ctx.fillStyle = DODO_PALETTE.wall;
        ctx.fillRect(0, extraTop, w, charH);
      }

      if (showHat) {
        drawHatOnPortrait(ctx, w, h, size, extraTop);
      }
    };

    if (animated) {
      let raf = 0;
      const start = performance.now();
      const tick = () => {
        draw((performance.now() - start) / 1000);
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    } else {
      draw(0);
    }
  }, [palette, w, h, showHat, animated]);

  return <canvas ref={ref} className="startPortrait" />;
}

/** Draw a procedural party hat on a portrait canvas — mirrors the in-game
 *  drawPartyHat logic but scaled to portrait coordinates instead of ZOOM. */
function drawHatOnPortrait(
  ctx: CanvasRenderingContext2D,
  _w: number,
  _h: number,
  size: number,
  extraTop = 0,
): void {
  const px = size;
  const cx = Math.round(CHAR_W * size / 2);
  const rows = 12;
  // Apex positioned so the brim lands exactly at extraTop (the hairline)
  const top = extraTop - rows * px;
  const maxW = 13;

  for (let r = 0; r < rows; r++) {
    const w = Math.round(1 + r * (maxW - 1) / (rows - 1));
    const rx = Math.round(cx - (w * px) / 2);
    const ry = Math.round(top + r * px);
    ctx.fillStyle = r % 2 === 0 ? '#FF6900' : '#FFD23F';
    ctx.fillRect(rx, ry, Math.round(w * px), Math.round(px));
  }
  ctx.fillStyle = '#1A1A1A';
  for (let r = 0; r < rows; r++) {
    const w = Math.round(1 + r * (maxW - 1) / (rows - 1));
    const rx = Math.round(cx - (w * px) / 2);
    const ry = Math.round(top + r * px);
    ctx.fillRect(rx - Math.round(px), ry, Math.round(px), Math.round(px));
    ctx.fillRect(rx + Math.round(w * px), ry, Math.round(px), Math.round(px));
  }
  const pomX = cx;
  const pomPx = Math.round(px);
  ctx.fillStyle = '#1A1A1A';
  ctx.fillRect(pomX - pomPx, Math.round(top - 2 * px), pomPx * 2, pomPx * 2 + pomPx);
  ctx.fillStyle = '#FFF7E6';
  ctx.fillRect(pomX - pomPx, Math.round(top - 2 * px), pomPx * 2, pomPx * 2);
  const baseY = Math.round(top + rows * px);
  const bandX = Math.round(cx - (maxW * px) / 2);
  ctx.fillStyle = '#1A1A1A';
  ctx.fillRect(bandX - Math.round(px), baseY, Math.round(maxW * px) + 2 * Math.round(px), Math.round(px) * 2);
  ctx.fillStyle = '#993F00';
  ctx.fillRect(bandX, baseY, Math.round(maxW * px), Math.round(px));
}
