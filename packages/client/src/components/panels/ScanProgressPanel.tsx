import type { ScanProgress } from '@aws-visualizer/shared';
import { RESOURCE_TYPE_METADATA } from '@aws-visualizer/shared';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface Props {
  readonly progress: ScanProgress;
}

const STATUS_CONFIG = {
  completed: { icon: CheckCircle2, className: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/30' },
  failed: { icon: XCircle, className: 'text-red-400', bg: 'bg-red-500/15 border-red-500/30' },
  scanning: { icon: Loader2, className: 'text-blue-400 animate-spin', bg: 'bg-blue-500/15 border-blue-500/30' },
  pending: { icon: Clock, className: 'text-slate-500', bg: 'bg-slate-500/10 border-slate-600/30' },
} as const;

export function ScanProgressPanel({ progress }: Props) {
  const completed = progress.scanners.filter(
    (s) => s.status === 'completed',
  ).length;
  const total = progress.scanners.length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 min-w-[420px] max-w-[560px] bg-slate-900/95 backdrop-blur-md border-2 border-slate-600/60 rounded-2xl shadow-2xl">
      <div className="px-6 pt-5 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
            <span className="font-bold text-base text-white">
              Scanning... {percent}%
            </span>
          </div>
          <span className="text-sm text-slate-300 font-medium">
            {progress.totalDiscovered} resources found
          </span>
        </div>

        <Progress value={percent} className="mb-4 h-2" />

        <div className="flex flex-wrap gap-2">
          {progress.scanners.map((s) => {
            const meta = RESOURCE_TYPE_METADATA[s.resourceType];
            const config = STATUS_CONFIG[s.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending;
            const StatusIcon = config.icon;

            return (
              <div
                key={s.scannerId}
                className={cn(
                  'flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border',
                  config.bg,
                )}
                title={s.error ?? undefined}
              >
                <StatusIcon className={cn('w-3.5 h-3.5', config.className)} />
                <span className="text-slate-200">
                  {meta?.label ?? s.resourceType}
                </span>
                <span className="text-slate-500">({s.discovered})</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
