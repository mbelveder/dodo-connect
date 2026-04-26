import './ui.css';

interface DialogueBoxProps {
  speaker: 'narrator' | 'Саша' | 'Вика';
  text: string;
  onNext: () => void;
  onSkip?: () => void;
  showSkip?: boolean;
  /** Whether the next button shows "Дальше" or final-step label */
  nextLabel?: string;
  /** When true, the body text is hidden — used in the intro when the line is
   *  already shown as a speech bubble above the speaker, to avoid showing the
   *  same text twice. The speaker tag and Next button still render. */
  textInBubble?: boolean;
}

const SPEAKER_COLORS: Record<DialogueBoxProps['speaker'], string> = {
  narrator: '#5C4232',
  Саша: '#9C7A00',
  Вика: '#A01510',
};

export function DialogueBox({
  speaker,
  text,
  onNext,
  onSkip,
  showSkip,
  nextLabel = 'Дальше ▸',
  textInBubble = false,
}: DialogueBoxProps) {
  return (
    <div className="dialogueWrap">
      <div className={`dialogueBox${textInBubble ? ' dialogueBoxCompact' : ''}`}>
        <div className="dialogueSpeaker" style={{ color: SPEAKER_COLORS[speaker] }}>
          {speaker === 'narrator' ? '— Рассказчик —' : `${speaker} говорит…`}
        </div>
        {!textInBubble && <div className="dialogueText">{text}</div>}
        <div className="dialogueActions">
          {showSkip && onSkip && (
            <button className="btn btnGhost" onClick={onSkip}>
              Пропустить
            </button>
          )}
          <button className="btn btnPrimary" onClick={onNext}>
            {nextLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
