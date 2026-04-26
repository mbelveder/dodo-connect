interface HUDProps {
  completed: number;
  total: number;
  promptLabel: string | null;
}

export function HUD({ completed, total, promptLabel }: HUDProps) {
  return (
    <>
      <div className="hudTop">
        <div className="hudBadge">
          <PixelPizzaIcon />
          <span>
            Станций изучено: {completed} / {total}
          </span>
        </div>
        <div className="hudHint">WASD — ходить · Клик — идти к точке · E — взаимодействовать</div>
      </div>
      {promptLabel && (
        <div className="hudPrompt">
          <span className="hudPromptKey">E</span>
          <span>Изучить: {promptLabel}</span>
        </div>
      )}
    </>
  );
}

function PixelPizzaIcon() {
  // Inline 8x8 pixel "pizza slice" via SVG rects
  const px = 4;
  const pixels: Array<[number, number, string]> = [
    [3, 0, '#FFD23F'],
    [4, 0, '#FFD23F'],
    [2, 1, '#FFD23F'],
    [3, 1, '#FFF7E6'],
    [4, 1, '#FFD23F'],
    [5, 1, '#FFD23F'],
    [1, 2, '#FFD23F'],
    [2, 2, '#FFD23F'],
    [3, 2, '#FFD23F'],
    [4, 2, '#E2231A'],
    [5, 2, '#FFD23F'],
    [6, 2, '#FFD23F'],
    [0, 3, '#FFD23F'],
    [1, 3, '#FFD23F'],
    [2, 3, '#E2231A'],
    [3, 3, '#FFD23F'],
    [4, 3, '#FFD23F'],
    [5, 3, '#FFD23F'],
    [6, 3, '#FFD23F'],
    [7, 3, '#FFD23F'],
    [0, 4, '#A01510'],
    [1, 4, '#A01510'],
    [2, 4, '#A01510'],
    [3, 4, '#A01510'],
    [4, 4, '#A01510'],
    [5, 4, '#A01510'],
    [6, 4, '#993F00'],
    [7, 4, '#A01510'],
  ];
  return (
    <svg width={8 * px} height={8 * px} style={{ imageRendering: 'pixelated' }}>
      {pixels.map(([x, y, c], i) => (
        <rect key={i} x={x * px} y={y * px} width={px} height={px} fill={c} />
      ))}
    </svg>
  );
}
