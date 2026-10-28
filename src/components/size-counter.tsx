import { Minus, Plus } from "lucide-react";

export function SizeCounter({
  label,
  value,
  onChange,
  canAdd,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  canAdd: boolean;
}) {
  const btn =
    "grid h-12 w-12 shrink-0 place-items-center rounded-full border border-border bg-card text-foreground transition-colors active:bg-secondary disabled:opacity-35";
  return (
    <div className="grid grid-cols-[3rem_minmax(0,1fr)] items-center gap-3 py-1.5">
      <span className="font-display text-lg font-semibold">{label}</span>
      <div className="flex items-center justify-end gap-3">
        <button type="button" className={btn} onClick={() => onChange(value - 1)} disabled={value <= 0} aria-label={`Menos ${label}`}>
          <Minus className="h-5 w-5" />
        </button>
        <span className="w-10 text-center text-xl font-semibold tabular-nums" aria-live="polite">{value}</span>
        <button type="button" className={btn} onClick={() => onChange(value + 1)} disabled={!canAdd} aria-label={`Mais ${label}`}>
          <Plus className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
