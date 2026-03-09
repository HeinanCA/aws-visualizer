import { RESOURCE_TYPE_METADATA } from '@aws-visualizer/shared';
import type { GraphNode, GraphEdge } from '@aws-visualizer/shared';
import { RESOURCE_ICONS, getResourceColors, getStatusClasses } from '@/lib/aws-icons';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { X, ArrowRight } from 'lucide-react';

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
    <div className="absolute right-0 top-0 bottom-0 w-[420px] bg-slate-900/95 backdrop-blur-md border-l-2 border-slate-600/60 z-10 shadow-2xl overflow-y-auto">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className={cn('p-2 rounded-xl', colors.iconBg)}>
                <Icon className={cn('w-6 h-6', colors.text)} strokeWidth={2.5} />
              </div>
            )}
            <div>
              <span className={cn(
                'inline-block text-xs font-bold px-2.5 py-1 rounded-md mb-1',
                colors.bg, colors.text, 'border', colors.border,
              )}>
                {meta?.label ?? resource.type}
              </span>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-9 w-9 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Name & ID */}
        <h3 className="text-lg font-bold text-white mb-1 break-words leading-tight">
          {resource.name}
        </h3>
        <p className="text-sm text-slate-400 mb-5 font-mono break-all">
          {resource.id}
        </p>

        {/* Status */}
        {typeof resource.metadata?.state === 'string' && (
          <div className="flex items-center gap-2.5 mb-5 bg-slate-800/60 px-4 py-2.5 rounded-xl border border-slate-700/50">
            <div className={cn('w-3 h-3 rounded-full', status.dot)} />
            <span className={cn('text-sm font-semibold', status.text)}>
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
                className="flex items-center gap-2.5 text-sm py-2.5 border-b border-slate-700/40 last:border-0"
              >
                <ArrowRight className="w-4 h-4 text-slate-500 flex-shrink-0" />
                <span className="text-slate-400 font-medium">{edge.relationship}</span>
                <span className="text-slate-200 truncate font-mono text-xs">
                  {edge.source === node.id ? edge.target : edge.source}
                </span>
              </div>
            ))}
          </Section>
        )}
      </div>
    </div>
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
    <div className="mb-6">
      <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
        {title}
      </h4>
      {children}
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
    <div className="flex justify-between items-start gap-4 text-sm py-1.5">
      <span className="text-slate-400 flex-shrink-0 font-medium">{label}</span>
      <span
        className="text-slate-200 text-right truncate max-w-[240px]"
        title={value}
      >
        {value}
      </span>
    </div>
  );
}
