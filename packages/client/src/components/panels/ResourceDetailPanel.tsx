import { RESOURCE_TYPE_METADATA } from '@aws-visualizer/shared';
import type { GraphNode, GraphEdge } from '@aws-visualizer/shared';
import { RESOURCE_ICONS, getResourceColors, getStatusClasses } from '@/lib/aws-icons';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { X, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  readonly node: GraphNode;
  readonly edges: readonly GraphEdge[];
  readonly onClose: () => void;
}

export function ResourceDetailPanel({ node, edges, onClose }: Props) {
  const { resource } = node;
  const meta = RESOURCE_TYPE_METADATA[resource.type];
  const colors = getResourceColors(resource.type);
  const status = getStatusClasses(resource.metadata?.state as string | undefined);
  const Icon = RESOURCE_ICONS[resource.type];

  return (
    <motion.div 
      initial={{ x: 400, opacity: 0, scale: 0.95 }}
      animate={{ x: 0, opacity: 1, scale: 1 }}
      exit={{ x: 400, opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute right-6 top-6 bottom-6 w-[420px] rounded-3xl bg-slate-900/60 backdrop-blur-2xl border border-white/10 ring-1 ring-inset ring-white/5 z-50 shadow-[0_0_80px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col"
    >
      <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            {Icon && (
              <div className={cn('p-3 rounded-2xl border border-white/10 shadow-inner bg-black/20', colors.iconBg)}>
                <Icon className={cn('w-7 h-7', colors.text)} strokeWidth={2} />
              </div>
            )}
            <div className="flex flex-col">
              <span className={cn(
                'text-[10px] font-black uppercase tracking-[0.2em] leading-none mb-1.5 opacity-80',
                colors.text,
              )}>
                {meta?.label ?? resource.type}
              </span>
              <h3 className="text-xl font-bold text-white leading-tight break-words pr-2">
                {resource.name}
              </h3>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-10 w-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 hover:text-white transition-all">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <p className="text-xs text-slate-400 mb-6 font-mono break-all bg-black/20 p-3 rounded-xl border border-white/5">
          {resource.id}
        </p>

        {/* Status */}
        {typeof resource.metadata?.state === 'string' && (
          <div className="flex items-center gap-3 mb-6 bg-black/20 px-4 py-3 rounded-2xl border border-white/5">
            <div className={cn('w-3.5 h-3.5 rounded-full border-2 border-slate-900 shadow-sm', status.dot)} />
            <span className={cn('text-sm font-bold', status.text)}>
              {status.label}
            </span>
          </div>
        )}

        {/* Details section */}
        <Section title="Details">
          <DetailRow label="Region" value={resource.region} />
          {resource.arn && <DetailRow label="ARN" value={resource.arn} />}
        </Section>

        {/* Metadata section */}
        {Object.keys(resource.metadata ?? {}).length > 0 && (
          <Section title="Metadata">
            {Object.entries(resource.metadata).map(([key, value]) => (
              <DetailRow key={key} label={key} value={String(value)} />
            ))}
          </Section>
        )}

        {/* Tags section */}
        {Object.keys(resource.tags).length > 0 && (
          <Section title="Tags">
            {Object.entries(resource.tags).map(([key, value]) => (
              <DetailRow key={key} label={key} value={value} />
            ))}
          </Section>
        )}

        {/* Connections section */}
        {edges.length > 0 && (
          <Section title={`Connections (${edges.length})`}>
            {edges.map((edge) => (
              <div
                key={edge.id}
                className="flex items-center gap-3 text-sm py-3 border-b border-white/5 last:border-0"
              >
                <ArrowRight className="w-4 h-4 text-slate-500 flex-shrink-0" />
                <span className="text-slate-400 font-semibold">{edge.relationship}</span>
                <span className="text-slate-200 truncate font-mono text-xs bg-black/20 px-2 py-1 rounded-md border border-white/5 ml-auto max-w-[180px]">
                  {edge.source === node.id ? edge.target : edge.source}
                </span>
              </div>
            ))}
          </Section>
        )}
      </div>
    </motion.div>
  );
}

function Section({
  title,
  children,
}: {
  readonly title: string;
  readonly children: React.ReactNode;
}) {
  return (
    <div className="mb-6 bg-white/[0.02] border border-white/5 rounded-2xl p-4">
      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4 pl-1">
        {title}
      </h4>
      <div className="flex flex-col gap-1">
        {children}
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string;
}) {
  return (
    <div className="flex justify-between items-start gap-4 text-sm py-1.5 px-1">
      <span className="text-slate-400 flex-shrink-0 font-medium">{label}</span>
      <span
        className="text-slate-200 text-right truncate max-w-[220px] font-medium"
        title={value}
      >
        {value}
      </span>
    </div>
  );
}
