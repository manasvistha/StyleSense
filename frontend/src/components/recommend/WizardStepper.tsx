import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  steps: { title: string }[];
  current: number;
  onJump?: (index: number) => void;
}

/** Horizontal progress indicator with labels below each node (collision-free). */
export function WizardStepper({ steps, current, onJump }: Props) {
  return (
    <div className="flex items-start">
      {steps.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={step.title} className="flex flex-1 flex-col items-center last:flex-none">
            <div className="flex w-full items-center">
              {/* left connector */}
              <span className={cn('h-px flex-1', i === 0 ? 'opacity-0' : done || active ? 'bg-primary' : 'bg-border')} />
              <button
                type="button"
                disabled={i > current}
                onClick={() => onJump?.(i)}
                className="mx-1 disabled:cursor-default"
                aria-current={active ? 'step' : undefined}
              >
                <span
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold transition-all duration-300',
                    done && 'border-primary bg-primary text-primary-foreground',
                    active && 'border-primary bg-primary/10 text-primary ring-4 ring-primary/10',
                    !done && !active && 'border-border bg-card text-muted-foreground',
                  )}
                >
                  {done ? <Check className="h-4 w-4" /> : i + 1}
                </span>
              </button>
              {/* right connector */}
              <span className={cn('h-px flex-1', i === steps.length - 1 ? 'opacity-0' : done ? 'bg-primary' : 'bg-border')} />
            </div>
            <span
              className={cn(
                'mt-2 hidden text-center text-xs font-medium leading-tight transition-colors sm:block',
                active ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              {step.title}
            </span>
          </div>
        );
      })}
    </div>
  );
}
