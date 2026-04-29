import { useEffect, useRef } from 'react';

import { playSound } from '../engine/audio';
import { startGameLoop } from '../engine/gameLoop';
import { type GameState } from '../engine/gameState';
import { attachKeyHandlers, clickToMove, type KeyState } from '../engine/playerControl';
import { hitTestInteractable, screenToTile } from '../engine/renderer';
import type { Camera } from '../engine/renderer';

interface GameCanvasProps {
  state: GameState;
  onActivePromptChange: (id: string | null) => void;
  /** Fired when the player opens a station (click on hotspot, in range or after walking there). */
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

    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cssW = rect.width;
      const cssH = rect.height;
      // Table station hotspots (puck tiles) — walk to the approach tile and
      // open the modal on arrival, or open immediately if already in range.
      const it = hitTestInteractable(state, cameraRef.current, cssW, cssH, x, y);
      if (it) {
        if (it.clickOnly) {
          // clickOnly stations open immediately when in range; ignore if far away.
          if (state.activePromptId === it.id) onInteract(it.id);
        } else {
          clickToMove(state.player, it.col, it.row, state.tileMap, state.blocked);
          if (state.activePromptId === it.id) {
            onInteract(it.id);
          } else {
            pendingInteract = it.id;
          }
        }
        return;
      }
      pendingInteract = null;
      const tile = screenToTile(cameraRef.current, cssW, cssH, x, y);
      // Play dodo sound when clicking the mascot on the table
      const dodoItem = state.furniture.find((f) => f.defId === 'TABLE_DODO');
      if (
        dodoItem &&
        tile.col >= dodoItem.col &&
        tile.col < dodoItem.col + 1 &&
        tile.row >= dodoItem.row &&
        tile.row < dodoItem.row + 1
      ) {
        playSound('/sound/dodo_sound.mp3', 0.5);
        return;
      }
      clickToMove(state.player, tile.col, tile.row, state.tileMap, state.blocked);
    };
    canvas.addEventListener('click', onClick);

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      state.hoveredTile = screenToTile(cameraRef.current, rect.width, rect.height, x, y);
    };
    const onMouseLeave = () => {
      state.hoveredTile = null;
    };
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseleave', onMouseLeave);

    const handle = startGameLoop(
      canvas,
      state,
      keys,
      onActivePromptChange,
      (activeId) => {
        if (activeId && pendingInteract === activeId) {
          pendingInteract = null;
          onInteract(activeId);
        }
      },
    );

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
      canvas.removeEventListener('click', onClick);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseleave', onMouseLeave);
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
