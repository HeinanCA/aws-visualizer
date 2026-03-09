import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { AWSResource } from '@aws-visualizer/shared';
import { RESOURCE_TYPE_METADATA } from '@aws-visualizer/shared';
import { RESOURCE_ICONS, getResourceColors } from '@/lib/aws-icons';
import { cn } from '@/lib/utils';

interface SummaryNodeData {
  readonly resource: AWSResource;
  readonly isSummaryCard: boolean;
}

export const SummaryNode = memo(function SummaryNode({
  data,
  selected,
}: NodeProps & { data: SummaryNodeData }) {
  const { resource } = data;
  const meta = RESOURCE_TYPE_METADATA[resource.type];
  const colors = getResourceColors(resource.type);
  const Icon = RESOURCE_ICONS[resource.type];
  const count = typeof resource.metadata?.memberCount === 'number'
    ? resource.metadata.memberCount
    : 0;

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-xl border-2 border-dashed transition-all duration-150 cursor-pointer',
        colors.border,
        colors.bg,
        'hover:brightness-125',
        selected && 'ring-2 ring-blue-400/60 shadow-[0_0_16px_rgba(59,130,246,0.3)]',
      )}
      style={{ width: 160, height: 80 }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-slate-500 !border-slate-700 !w-1.5 !h-1.5 !min-w-0 !min-h-0"
      />

      {/* Icon */}
      <div className={cn(
        'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center border',
        colors.border,
        colors.iconBg,
      )}>
        {Icon && <Icon className={cn('w-5 h-5', colors.text)} strokeWidth={2} />}
      </div>

      {/* Label + count */}
      <div className="min-w-0 flex-1">
        <div className={cn('text-xs font-bold leading-tight truncate', colors.text)}>
          {meta?.label ?? resource.type}
        </div>
        <div className="text-lg font-bold text-white leading-tight">
          {count}
        </div>
        <div className="text-[9px] text-slate-500 leading-tight">
          resources
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-slate-500 !border-slate-700 !w-1.5 !h-1.5 !min-w-0 !min-h-0"
      />
    </div>
  );
});
