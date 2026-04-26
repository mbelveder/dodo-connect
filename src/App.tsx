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
import { IntroCutscene } from './ui/IntroCutscene';
import './ui/ui.css';

type Stage = 'boot' | 'disclaimer' | 'intro' | 'play' | 'ending';

interface CompletedRecord {
  stationId: string;
  correct: boolean;
  chosenIndex: number;
}

export default function App() {
  const [stage, setStage] = useState<Stage>('boot');
  const [openStation, setOpenStation] = useState<Station | null>(null);
  const [completed, setCompleted] = useState<CompletedRecord[]>([]);
  const [activePromptId, setActivePromptId] = useState<string | null>(null);
  const [stateKey, setStateKey] = useState(0);

  // Build pizzeria state once per game run; rebuilding bumps stateKey to remount canvas.
  const gameState = useMemo<GameState>(() => buildPizzeriaState(), [stateKey]);

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

  const currentPromptStation = activePromptId
    ? STATIONS.find((s) => s.id === activePromptId)
    : null;

  const handleInteract = useCallback(
    (id: string) => {
      const station = STATIONS.find((s) => s.id === id);
      if (!station) return;
      if (completedIds.has(id)) {
        showBubble(gameState.player, 'Тут я уже всё изучил.', 2.4);
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
    // Auto-advance to ending if all stations completed (unique ids, not raw rows)
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
    setActivePromptId(null);
    setStateKey((k) => k + 1);
    setStage('intro');
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
      <div className="disclaimerScreen">
        <div className="disclaimerCard">
          <div className="disclaimerGreeting">Привет!</div>
          <div className="disclaimerBody">
            То, что вы увидите на этом сайте, было создано в рамках хакатона ВШЭ
            по журналистике данных 18–19 апреля 2026 года. На основе
            предоставленного датасета нужно было найти и рассказать историю о
            компании и её потребителях. Разработка и реализация концепции были
            выполнены за 30 часов командой из пяти человек (авторы указаны в
            титрах).
          </div>
          <div className="disclaimerWish">Желаем удачной игры!</div>
          <button className="btn btnPrimary" onClick={() => setStage('intro')}>
            Начать ▸
          </button>
        </div>
      </div>
    );
  }

  if (stage === 'intro') {
    return <IntroCutscene onFinish={() => setStage('play')} />;
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
        onActivePromptChange={setActivePromptId}
        onInteract={handleInteract}
      />
      <HUD
        completed={completedIds.size}
        total={STATIONS.length}
        promptLabel={
          currentPromptStation
            ? completedIds.has(currentPromptStation.id)
              ? `${currentPromptStation.label} (изучено)`
              : currentPromptStation.label
            : null
        }
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
