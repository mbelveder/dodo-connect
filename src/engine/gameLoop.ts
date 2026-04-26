import { CAMERA_FOLLOW_LERP } from './constants';
import { updateCharacter } from './character';
import { findActiveInteractable, type GameState } from './gameState';
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

    tryStepFromKeys(state.player, keys, state.tileMap, state.blocked);

    for (const ch of state.characters) {
      updateCharacter(ch, dt, state.tileMap, state.blocked, state.walkable);
    }

    updateNpcChatter(chatter, state.characters, dt);

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
