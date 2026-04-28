import { CAMERA_FOLLOW_LERP } from './constants';
import { updateCharacter } from './character';
import {
  findActiveInteractable,
  getActiveStationNpcIdForChatter,
  getQueuedInteractable,
  type GameState,
} from './gameState';
import { createChatterState, updateNpcChatter } from './npcChatter';
import { renderFrame, type Camera } from './renderer';
import { tryStepFromKeys, type KeyState } from './playerControl';

export interface LoopHandle {
  stop: () => void;
}

export function startGameLoop(
  canvas: HTMLCanvasElement,
  state: GameState,
  keys: KeyState,
  onActivePromptChange: (id: string | null) => void,
): LoopHandle {
  const ctx = canvas.getContext('2d')!;
  let last = performance.now();
  let raf = 0;
  const camera: Camera = { x: state.player.x, y: state.player.y };
  let prevPromptId: string | null = null;
  const chatter = createChatterState();

  const tick = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    state.introElapsed += dt;

    tryStepFromKeys(state.player, keys, state.tileMap, state.blocked);

    for (const ch of state.characters) {
      updateCharacter(ch, dt, state.tileMap, state.blocked, state.walkable);
    }

    // NPC-only queued stations (register, dispatch): short-lived bubbles that
    // repeat after a cooldown — same rhythm as ambient chatter, and hidden
    // until the first station is completed.
    {
      const queued = getQueuedInteractable(state);
      const unlocked = state.completedStationIds.size > 0;
      if (!unlocked || !queued) {
        state.stationNpcGuideBubble = null;
        state.stationNpcGuideBubbleCooldown = 0;
      } else {
        const hasTableGlow = queued.glowCol != null && queued.glowRow != null;
        const isNpcStation = Boolean(queued.npcId) && !hasTableGlow;
        if (!isNpcStation) {
          state.stationNpcGuideBubble = null;
          state.stationNpcGuideBubbleCooldown = 0;
        } else if (
          state.stationNpcGuideBubble &&
          state.stationNpcGuideBubble.stationId !== queued.id
        ) {
          state.stationNpcGuideBubble = null;
          state.stationNpcGuideBubbleCooldown = 0.9;
        } else if (state.stationNpcGuideBubble) {
          state.stationNpcGuideBubble.remaining -= dt;
          if (state.stationNpcGuideBubble.remaining <= 0) {
            state.stationNpcGuideBubble = null;
            state.stationNpcGuideBubbleCooldown = 22 + Math.random() * 26;
          }
        } else {
          state.stationNpcGuideBubbleCooldown -= dt;
          if (state.stationNpcGuideBubbleCooldown <= 0) {
            state.stationNpcGuideBubble = { stationId: queued.id, remaining: 2.8 };
          }
        }
      }
    }

    updateNpcChatter(
      chatter,
      state.characters,
      dt,
      getActiveStationNpcIdForChatter(state),
      state.completedStationIds.size,
      state.player.tileRow,
    );

    const active = findActiveInteractable(state);
    state.activePromptId = active ? active.id : null;
    if (state.activePromptId !== prevPromptId) {
      prevPromptId = state.activePromptId;
      onActivePromptChange(state.activePromptId);
    }

    camera.x += (state.player.x - camera.x) * CAMERA_FOLLOW_LERP;
    camera.y += (state.player.y - camera.y) * CAMERA_FOLLOW_LERP;

    // Use logical (CSS) pixel dimensions; canvas.getContext was set up with
    // a dpr transform so drawing operations expect logical coords.
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    renderFrame(ctx, state, camera, w, h);

    raf = requestAnimationFrame(tick);
  };

  raf = requestAnimationFrame(tick);

  return {
    stop: () => cancelAnimationFrame(raf),
  };
}
