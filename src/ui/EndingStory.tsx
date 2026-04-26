import { useState } from 'react';

import { getVerdict } from '../content/ending';

interface EndingStoryProps {
  score: number;
  total: number;
  onRestart: () => void;
}

export function EndingStory({ score, total, onRestart }: EndingStoryProps) {
  const verdict = getVerdict(score, total);
  const [page, setPage] = useState<1 | 2>(1);

  if (page === 1) {
    return (
      <div className="endingScreen">
        <div className="endingCard">
          <div className="endingTitle">Конец смены</div>
          <div className="endingOutro">
            <p>
              Когда мы начали изучать данные, то думали ограничиться Москвой. Ведь именно на ней
              фокусируют своё внимание многие бизнесы в России. Но чем больше мы разбирались, тем
              больше понимали: стратегия Додо — другая.
            </p>
            <p>
              Филиалы Додо есть в большинстве регионов страны — и их роль далеко не вторична.
              Начать с того, что именно из регионов начинался путь сети (первый филиал открылся в
              Сыктывкаре) и закончить теми инсайтами, которые мы получили в нашем проекте.
            </p>
            <p>
              Посыл нашего проекта легко отражает один из слоганов Додо: «Есть то, что нас
              объединяет». Нас, россиян, и правда много что объединяет. И не всегда Москва — это
              главное, что можно найти в бизнесовых данных.
            </p>
          </div>
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
        <div className="endingScore">
          Правильных ответов: <b>{score}</b> из {total}
        </div>
        <div className="endingVerdict">
          <div className="endingSpeaker">{verdict.speaker}:</div>
          <div className="endingText">{verdict.text}</div>
        </div>
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
        <div className="endingAttributions">
          <div>
            Использованы открытые проекты:{' '}
            <a href="https://github.com/pablodelucca/pixel-agents" target="_blank" rel="noopener noreferrer">
              pixel-agents
            </a>{' '}
            и{' '}
            <a href="https://github.com/quillcraft/tilemap-russia" target="_blank" rel="noopener noreferrer">
              tilemap-russia
            </a>{' '}
            (проект{' '}
            <a href="https://t.me/antonmizinov" target="_blank" rel="noopener noreferrer">
              Антона Мизинова
            </a>
            ).
          </div>
        </div>
        <div className="endingFooter">
          Хакатон по дата-журналистике · Данные Dodo Pizza
        </div>
      </div>
    </div>
  );
}
