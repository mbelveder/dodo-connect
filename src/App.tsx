import { useCallback, useEffect, useMemo, useState } from 'react';

import { STATIONS, type Station } from './content/stations';
import { showBubble } from './engine/character';
import {
  buildSyntheticSprites,
  loadCharacterSheets,
  loadFurnitureImages,
  setAssetsReady,
} from './engine/sprites';
import { type GameState } from './engine/gameState';
import { getAllFurnitureRequests } from './scene/furnitureCatalog';
import { buildPizzeriaState } from './scene/pizzeriaLayout';
import { EndingStory } from './ui/EndingStory';
import { GameCanvas } from './ui/GameCanvas';
import { HUD } from './ui/HUD';
import { InfographicModal } from './ui/InfographicModal';
import { WelcomeFlow, type PlayerChoice } from './ui/StartScreen';
import './ui/ui.css';

type Stage = 'boot' | 'disclaimer' | 'play' | 'ending';

interface CompletedRecord {
  stationId: string;
  correct: boolean;
  chosenIndex: number;
}

export default function App() {
  const [stage, setStage] = useState<Stage>('boot');
  const [openStation, setOpenStation] = useState<Station | null>(null);
  const [completed, setCompleted] = useState<CompletedRecord[]>([]);
  const [stateKey, setStateKey] = useState(0);
  const [playerChoice, setPlayerChoice] = useState<PlayerChoice>('sasha');

  // Build pizzeria state once per game run; rebuilding bumps stateKey to remount canvas.
  const gameState = useMemo<GameState>(
    () => buildPizzeriaState({ playerChoice }),
    [stateKey, playerChoice],
  );

  // Asset boot
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadCharacterSheets();
        buildSyntheticSprites();
        await loadFurnitureImages(getAllFurnitureRequests());
        setAssetsReady();
        if (!cancelled) setStage('disclaimer');
      } catch (err) {
        console.error('Asset load failed', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const completedIds = useMemo(() => new Set(completed.map((c) => c.stationId)), [completed]);

  // Mirror completed ids onto the engine state so the renderer can paint
  // green rings/ticks on completed stations.
  useEffect(() => {
    gameState.completedStationIds = completedIds;
  }, [gameState, completedIds]);


  const handleInteract = useCallback(
    (id: string) => {
      const station = STATIONS.find((s) => s.id === id);
      if (!station) return;
      if (completedIds.has(id)) {
        showBubble(gameState.player, 'Тут я уже всё изучила.', 2.4);
        return;
      }
      setOpenStation(station);
    },
    [completedIds, gameState.player],
  );

  const handleAnswer = useCallback(
    (chosenIndex: number, correct: boolean) => {
      if (!openStation) return;
      setCompleted((prev) => [
        ...prev,
        { stationId: openStation.id, chosenIndex, correct },
      ]);
    },
    [openStation],
  );

  const handleCloseModal = useCallback(() => {
    setOpenStation(null);
    // Auto-advance to ending once every unique station has been answered.
    setTimeout(() => {
      setCompleted((latest) => {
        const doneIds = new Set(latest.map((c) => c.stationId));
        if (doneIds.size >= STATIONS.length) {
          setStage('ending');
        }
        return latest;
      });
    }, 0);
  }, []);

  const handleRestart = useCallback(() => {
    setCompleted([]);
    setOpenStation(null);
    setStateKey((k) => k + 1);
    setStage('disclaimer');
  }, []);

  if (stage === 'boot') {
    return (
      <div className="bootScreen">
        <div className="bootBrand">DODO</div>
        <div className="bootStatus">Загрузка пиццерии…</div>
      </div>
    );
  }

  if (stage === 'disclaimer') {
    return (
      <WelcomeFlow
        onStart={({ playerId }) => {
          setPlayerChoice(playerId);
          setStage('play');
        }}
      />
    );
  }

  if (stage === 'ending') {
    const score = completed.filter((c) => c.correct).length;
    return <EndingStory score={score} total={STATIONS.length} onRestart={handleRestart} />;
  }

  return (
    <div className="playScreen">
      <GameCanvas
        key={stateKey}
        state={gameState}
        onActivePromptChange={() => {}}
        onInteract={handleInteract}
      />
      <HUD
        completed={completedIds.size}
        total={STATIONS.length}
        promptLabel={null}
      />
      {openStation && (
        <InfographicModal
          station={openStation}
          onAnswer={handleAnswer}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
