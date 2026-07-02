import { cn } from '@/lib/utils';

interface Option {
  id: string;
  name?: string;
  label?: string;
  hex?: string;
}

export function ChipSelect({
  options,
  selected,
  onToggle,
}: {
  options: Option[];
  selected: Set<string>;
  onToggle: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const isOn = selected.has(o.id);
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onToggle(o.id)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors',
              isOn
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-background hover:bg-secondary',
            )}
          >
            {o.hex && <span className="h-3 w-3 rounded-full border border-black/10" style={{ background: o.hex }} />}
            {o.name ?? o.label}
          </button>
        );
      })}
    </div>
  );
}
