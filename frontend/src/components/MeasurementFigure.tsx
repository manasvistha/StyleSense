/** Simple, friendly SVG illustration of where to measure on the body. */
export function MeasurementFigure({ highlight }: { highlight: 'bust' | 'waist' | 'hip' | 'shoulder' }) {
  const active = (k: string) => (highlight === k ? 'hsl(var(--primary))' : 'hsl(var(--border))');
  const activeW = (k: string) => (highlight === k ? 3 : 2);
  return (
    <svg viewBox="0 0 160 280" className="h-64 w-auto">
      {/* Body silhouette */}
      <path
        d="M80 18c10 0 16 8 16 18 0 7-3 12-6 15 14 4 22 14 24 30l6 44c1 8-9 11-11 3l-6-34-2 40c3 30 6 56 6 70 0 8-12 8-13 0l-4-58-4 58c-1 8-13 8-13 0 0-14 3-40 6-70l-2-40-6 34c-2 8-12 5-11-3l6-44c2-16 10-26 24-30-3-3-6-8-6-15 0-10 6-18 16-18z"
        fill="hsl(var(--muted))"
        stroke="hsl(var(--border))"
      />
      {/* Shoulder line */}
      <line x1="48" y1="70" x2="112" y2="70" stroke={active('shoulder')} strokeWidth={activeW('shoulder')} strokeDasharray="4 3" />
      {/* Bust line */}
      <line x1="44" y1="92" x2="116" y2="92" stroke={active('bust')} strokeWidth={activeW('bust')} strokeDasharray="4 3" />
      {/* Waist line */}
      <line x1="52" y1="120" x2="108" y2="120" stroke={active('waist')} strokeWidth={activeW('waist')} strokeDasharray="4 3" />
      {/* Hip line */}
      <line x1="44" y1="150" x2="116" y2="150" stroke={active('hip')} strokeWidth={activeW('hip')} strokeDasharray="4 3" />
      <g fontSize="9" fill="hsl(var(--muted-foreground))">
        <text x="120" y="73">Shoulder</text>
        <text x="120" y="95">Bust</text>
        <text x="112" y="123">Waist</text>
        <text x="120" y="153">Hip</text>
      </g>
    </svg>
  );
}
