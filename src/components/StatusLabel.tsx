import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import type { WaterStatus } from '../types/water';

interface StatusLabelProps {
  status: WaterStatus | 'Normal';
  label?: string;
  compact?: boolean;
}

export function StatusLabel({ status, label, compact = false }: StatusLabelProps) {
  const normalized = status === 'Normal' ? 'Safe' : status;
  const displayText = label ?? (status === 'Normal' ? 'Normal' : normalized);

  if (normalized === 'Critical') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-medium text-red-700 ${
          compact ? 'text-xs' : 'text-sm'
        }`}
      >
        <XCircle className="w-4 h-4 shrink-0 text-red-600" aria-hidden="true" />
        <span className="whitespace-nowrap">{displayText}</span>
      </span>
    );
  }

  if (normalized === 'Warning') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-medium text-amber-700 ${
          compact ? 'text-xs' : 'text-sm'
        }`}
      >
        <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" aria-hidden="true" />
        <span className="whitespace-nowrap">{displayText}</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium text-emerald-700 ${
        compact ? 'text-xs' : 'text-sm'
      }`}
    >
      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" aria-hidden="true" />
      <span className="whitespace-nowrap">{displayText}</span>
    </span>
  );
}
