import { useEffect, useMemo, useState } from 'react';

import { getStationSteps, type Station } from '../content/stations';
import { Infographic, withBase } from './Infographic';
import { Quiz } from './Quiz';

interface InfographicModalProps {
  station: Station;
  onAnswer: (chosenIndex: number, correct: boolean) => void;
  onClose: () => void;
}

export function InfographicModal({ station, onAnswer, onClose }: InfographicModalProps) {
  const steps = useMemo(() => getStationSteps(station), [station]);
  const [stepIndex, setStepIndex] = useState(0);
  const [prevCorrect, setPrevCorrect] = useState<boolean[]>([]);

  useEffect(() => {
    setStepIndex(0);
    setPrevCorrect([]);
  }, [station.id]);

  useEffect(() => {
    const url = withBase('/sound/dodo_sound.mp3');
    const audio = new Audio(url);
    audio.volume = 0.5;
    void audio.play().catch(() => {
      // Autoplay policy or missing file — ignore silently.
    });
    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [station.id]);

  const step = steps[stepIndex]!;
  const isLast = stepIndex >= steps.length - 1;

  // Multi-step: each question can set `StationStep.intro`; otherwise fall back to `station.intro`.
  const introBlock =
    steps.length > 1 ? (step.intro ?? station.intro) : station.intro;

  const handleQuizAnswer = (chosenIndex: number, correct: boolean) => {
    if (isLast) {
      const allCorrect = [...prevCorrect, correct].every(Boolean);
      onAnswer(chosenIndex, allCorrect);
    } else {
      setPrevCorrect((p) => [...p, correct]);
    }
  };

  const handleQuizClose = () => {
    if (!isLast) {
      setStepIndex((i) => i + 1);
    } else {
      onClose();
    }
  };

  return (
    <div className="modalScrim" onClick={onClose}>
      <div className="modalCard" onClick={(e) => e.stopPropagation()}>
        <div className="modalHeader">
          <div className="modalTag">
            Станция{steps.length > 1 ? ` · вопрос ${stepIndex + 1}/${steps.length}` : ''}
          </div>
          <div className="modalTitle">{station.label}</div>
          <button className="modalClose" onClick={onClose} aria-label="Закрыть">
            ×
          </button>
        </div>
        <div className="modalIntro">{introBlock}</div>
        <div className="modalGrid">
          <div className="modalChartSlot">
            <Infographic key={stepIndex} data={step.infographic} />
          </div>
          <div className="modalQuizSlot">
            <Quiz
              key={`${station.id}-${stepIndex}`}
              question={step.quiz}
              onAnswer={handleQuizAnswer}
              onClose={handleQuizClose}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
