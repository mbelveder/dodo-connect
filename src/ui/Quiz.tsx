import { useState } from 'react';

import type { QuizQuestion } from '../content/stations';

interface QuizProps {
  question: QuizQuestion;
  onAnswer: (chosenIndex: number, correct: boolean) => void;
  onClose: () => void;
}

export function Quiz({ question, onAnswer, onClose }: QuizProps) {
  const [chosen, setChosen] = useState<number | null>(null);
  const answered = chosen !== null;
  const isCorrect = chosen === question.correctIndex;

  const handlePick = (i: number) => {
    if (answered) return;
    setChosen(i);
    onAnswer(i, i === question.correctIndex);
  };

  return (
    <div className="quizPanel">
      <div className="quizQuestion">{question.question}</div>
      <div className="quizOptions">
        {question.options.map((opt, i) => {
          const cls = ['quizOption'];
          if (answered) {
            if (i === question.correctIndex) cls.push('quizOptionCorrect');
            else if (i === chosen) cls.push('quizOptionWrong');
            else cls.push('quizOptionDim');
          }
          return (
            <button
              key={i}
              className={cls.join(' ')}
              onClick={() => handlePick(i)}
              disabled={answered}
            >
              <span className="quizOptionLetter">{String.fromCharCode(65 + i)}</span>
              <span>{opt}</span>
            </button>
          );
        })}
      </div>
      {answered && (
        <div className={`quizFeedback ${isCorrect ? 'good' : 'bad'}`}>
          <div className="quizFeedbackTitle">
            {isCorrect ? '✓ Правильно!' : '× Не совсем…'}
          </div>
          <div className="quizFeedbackText">{question.explain}</div>
          <button className="btn btnPrimary" onClick={onClose}>
            Дальше ▸
          </button>
        </div>
      )}
    </div>
  );
}
