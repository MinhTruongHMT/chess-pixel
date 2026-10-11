export type IconName = 'sword' | 'people' | 'gear' | 'book' | 'arrow' | 'undo' | 'save' | 'load' | 'restart' | 'volume' | 'flip' | 'close' | 'flag';
const PATHS: Record<IconName, string> = {
  sword: 'M14 2h6v6h-2v2h-2v2h-2v2h-2v2h2v2h-4v4H6v-4H2v-4h2v-2h2v2h2v-2h2v-2h2V8h2V6h2V4h-2z',
  people: 'M4 3h6v2h2v6h-2v2H4v-2H2V5h2zM14 5h5v2h2v5h-2v2h-5v-2h-1V7h1zM4 15h6v2h2v5H2v-5h2zM15 16h4v2h2v4h-7v-5h1z',
  gear: 'M9 2h6v3h3V3h3v6h-3v6h3v6h-3v-2h-3v3H9v-3H6v2H3v-6h3V9H3V3h3v2h3zM9 9v6h6V9z',
  book: 'M2 3h9v2h2V3h9v17h-9v2h-2v-2H2zM5 6v11h5V6zM14 6v11h5V6z',
  arrow: 'M10 3v4H6v3H2v4h4v3h4v4h3v-7h9v-4h-9V3z',
  undo: 'M7 2v5h10v2h3v3h2v7h-4v-5h-2v-3H7v5H4v-3H1V7h3V4h3z',
  save: 'M3 2h16v3h3v17H2V2zM6 4v6h11V4zM6 14v6h12v-6zM13 4h3v5h-3z',
  load: 'M2 5h8V3h5v2h7v15H2zM4 8v9h16V8zM10 10h4v3h3l-5 4-5-4h3z',
  restart: 'M8 2h10v3h3v3h2v5h-4V9h-2V7H9v3H5V6H2V2h6zM5 12v5h2v2h8v-3h4v4h3v3h-7v-2H5v-3H2v-6z',
  volume: 'M2 8h5V6h3V3h3v18h-3v-3H7v-2H2zM16 7h3v10h-3zM20 4h3v16h-3z',
  flip: 'M3 4h13V1h3v3h3v4h-3v3h-3V8H3zM21 16H8v-3H5v3H2v4h3v3h3v-3h13z',
  close: 'M4 2h3v3h3v3h4V5h3V2h3v5h-3v3h-3v4h3v3h3v5h-3v-3h-3v-3h-4v3H7v3H4v-5h3v-3h3v-4H7V7H4z',
  flag: 'M3 2h3v2h14v9H6v9H3zM6 7v3h11V7z',
};
export default function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" shapeRendering="crispEdges"><path d={PATHS[name]} fillRule="evenodd" /></svg>;
}
