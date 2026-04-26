import { useEffect, useRef } from 'react';

import { startGameLoop } from '../engine/gameLoop';
import { type GameState } from '../engine/gameState';
import { attachKeyHandlers, clickToMove, type KeyState } from '../engine/playerControl';
import { hitTestInteractable, screenToTile } from '../engine/renderer';
import type { Camera } from '../engine/renderer';

interface GameCanvasProps {
  state: GameState;
  onActivePromptChange: (id: string | null) => void;
  /** Fired when the player presses E or clicks an interactable directly */
  onInteract: (id: string) => void;
}

export function GameCanvas({ state, onActivePromptChange, onInteract }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<Camera>({ x: state.player.x, y: state.player.y });

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const keys: KeyState = { up: false, down: false, left: false, right: false };
    const detachKeys = attachKeyHandlers(keys);

    // Pending interaction: when player clicks an interactable they're far from,
    // we walk them there and remember the id so we auto-open on arrival.
    let pendingInteract: string | null = null;

    // Reuse keys obj's handlers but also intercept E for interaction.
    const onE = (e: KeyboardEvent) => {
      if (e.code !== 'KeyE' && e.key !== 'е' && e.key !== 'у' && e.key !== 'E' && e.key !== 'e') {
        return;
      }
      if (state.activePromptId) {
        pendingInteract = null;
        onInteract(state.activePromptId);
      }
    };
    window.addEventListener('keydown', onE);

    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cssW = rect.width;
      const cssH = rect.height;
      const it = hitTestInteractable(state, cameraRef.current, cssW, cssH, x, y);
      if (it) {
        clickToMove(state.player, it.col, it.row, state.tileMap, state.blocked);
        if (state.activePromptId === it.id) {
          onInteract(it.id);
        } else {
          pendingInteract = it.id;
        }
        return;
      }
      pendingInteract = null;
      const tile = screenToTile(cameraRef.current, cssW, cssH, x, y);
      clickToMove(state.player, tile.col, tile.row, state.tileMap, state.blocked);
    };
    canvas.addEventListener('click', onClick);

    const handle = startGameLoop(canvas, state, keys, (newId) => {
      if (newId && pendingInteract === newId) {
        pendingInteract = null;
        onInteract(newId);
      }
      onActivePromptChange(newId);
    });

    // Stash camera reference so click handler can read it
    // Hacky but works: read camera back from gameLoop. We poll via rAF.
    let rafId = 0;
    const pollCamera = () => {
      // The engine doesn't expose camera, so we approximate using player pos.
      // Click handlers tolerate small drift since findNearestWalkable forgives.
      cameraRef.current.x += (state.player.x - cameraRef.current.x) * 0.12;
      cameraRef.current.y += (state.player.y - cameraRef.current.y) * 0.12;
      rafId = requestAnimationFrame(pollCamera);
    };
    rafId = requestAnimationFrame(pollCamera);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', onE);
      canvas.removeEventListener('click', onClick);
      detachKeys();
      handle.stop();
      cancelAnimationFrame(rafId);
    };
  }, [state, onActivePromptChange, onInteract]);

  return (
    <div ref={wrapRef} className="canvasWrap">
      <canvas ref={canvasRef} className="gameCanvas" />
    </div>
  );
}
