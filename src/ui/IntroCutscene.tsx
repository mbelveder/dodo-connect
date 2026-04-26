import { useState } from 'react';

import { INTRO_DIALOGUE } from '../content/intro';
import { DialogueBox } from './DialogueBox';
import { IntroScene } from './IntroScene';

interface IntroCutsceneProps {
  onFinish: () => void;
}

/** Per-step visibility map. Index = INTRO_DIALOGUE index.
 *
 * Sasha appears immediately on the very first narrator beat. Vika joins on
 * the second beat (the one that introduces her). They both stay on stage
 * for the rest of the cutscene. When a character speaks the line is shown
 * as a speech bubble above their head; narrator lines collapse to the
 * dialogue box at the bottom only. */
function visibility(step: number): { sasha: boolean; vika: boolean } {
  return { sasha: true, vika: step >= 1 };
}

export function IntroCutscene({ onFinish }: IntroCutsceneProps) {
  const [step, setStep] = useState(0);
  const line = INTRO_DIALOGUE[step];
  const isLast = step === INTRO_DIALOGUE.length - 1;
  const vis = visibility(step);
  const sashaBubble = line.speaker === 'Саша' ? line.text : null;
  const vikaBubble = line.speaker === 'Вика' ? line.text : null;

  return (
    <div className="introScreen">
      <div className="introTitle">
        <div className="introBrand">DODO</div>
        <div className="introSub">Восьмибитная пиццерия</div>
      </div>
      <IntroScene
        showSasha={vis.sasha}
        showVika={vis.vika}
        sashaBubble={sashaBubble}
        vikaBubble={vikaBubble}
      />
      <DialogueBox
        speaker={line.speaker}
        text={line.text}
        showSkip
        onSkip={onFinish}
        onNext={() => {
          if (isLast) onFinish();
          else setStep((s) => s + 1);
        }}
        nextLabel={isLast ? 'Начать смену ▸' : 'Дальше ▸'}
        textInBubble={line.speaker !== 'narrator'}
      />
    </div>
  );
}
