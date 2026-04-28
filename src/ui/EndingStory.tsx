import { useState } from 'react';

import { ENDING_BEFORE_CREDITS } from '../content/ending';

interface EndingStoryProps {
  score: number;
  total: number;
  onRestart: () => void;
}

export function EndingStory({ score, total, onRestart }: EndingStoryProps) {
  const [page, setPage] = useState<1 | 2>(1);

  if (page === 1) {
    return (
      <div className="endingScreen">
        <div className="endingCard">
          <p className="endingClosingLead">{ENDING_BEFORE_CREDITS}</p>
          <div className="endingActions">
            <button className="btn btnPrimary" onClick={() => setPage(2)}>
              Дальше ▸
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="endingScreen">
      <div className="endingCard">
        <div className="endingCredits">
          <div className="endingCreditsNames">
            <div className="endingCreditsRow">
              <a href="https://t.me/m_belveder" target="_blank" rel="noopener noreferrer">Михаил Бельведерский</a>
              <a href="https://t.me/distant_notes" target="_blank" rel="noopener noreferrer">Тимофей Атнашев</a>
            </div>
            <div className="endingCreditsRow">
              <a href="https://t.me/xgerrr" target="_blank" rel="noopener noreferrer">Ромазан Самодинов</a>
              <a href="https://t.me/batiushkaa2" target="_blank" rel="noopener noreferrer">Илья Козицкий</a>
            </div>
            <div className="endingCreditsRow">
              <span>Андрей Караваев</span>
            </div>
          </div>
          <div className="endingCreditsTeam">Команда «Кермит»</div>
        </div>
        <div className="endingActions">
          <button className="btn btnPrimary" onClick={onRestart}>
            Попробовать снова ▸
          </button>
        </div>
        <div className="endingFooter">
          Данные Dodo Pizza с хакатона «Всем Дата»
        </div>
      </div>
    </div>
  );
}
