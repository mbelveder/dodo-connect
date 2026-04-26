import type { Infographic as InfographicData } from '../content/stations';
import { PixelChart } from './PixelChart';

interface InfographicProps {
  data: InfographicData;
}

/** Prefix Vite's BASE_URL to absolute-rooted paths so infographics resolve
 *  correctly under GitHub Pages' subfolder. Leaves http(s):// URLs alone. */
export function withBase(src: string): string {
  if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) {
    return src;
  }
  const base = import.meta.env.BASE_URL || '/';
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  const trimmed = src.startsWith('/') ? src.slice(1) : src;
  return `${cleanBase}${trimmed}`;
}

export function Infographic({ data }: InfographicProps) {
  if (data.kind === 'image') {
    return (
      <figure className="infoFigure">
        <img className="infoImage" src={withBase(data.src)} alt={data.alt ?? ''} />
        {data.caption && <figcaption className="infoCaption">{data.caption}</figcaption>}
      </figure>
    );
  }
  return (
    <figure className="infoFigure">
      <PixelChart {...data.chart} />
      {data.caption && <figcaption className="infoCaption">{data.caption}</figcaption>}
    </figure>
  );
}
