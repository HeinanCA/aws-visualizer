import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { AWSResource } from '@aws-visualizer/shared';
import { RESOURCE_TYPE_METADATA } from '@aws-visualizer/shared';
import { RESOURCE_ICONS, getResourceColors, getStatusClasses } from '@/lib/aws-icons';
import { cn } from '@/lib/utils';

interface ResourceNodeData {
  readonly resource: AWSResource;
  readonly isGroup: boolean;
}

export const ResourceNode = memo(function ResourceNode({
  data,
  selected,
}: NodeProps & { data: ResourceNodeData }) {
  const { resource } = data;
  const meta = RESOURCE_TYPE_METADATA[resource.type];
  const colors = getResourceColors(resource.type);
  const status = getStatusClasses(resource.metadata?.state as string | undefined);
  const Icon = RESOURCE_ICONS[resource.type];

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-1 px-2 py-2 rounded-lg transition-all duration-150 cursor-pointer',
        'hover:bg-white/5',
        selected && 'bg-white/10 ring-2 ring-blue-400/60 shadow-[0_0_12px_rgba(59,130,246,0.25)]',
      )}
      style={{ width: 100 }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-slate-500 !border-slate-700 !w-1.5 !h-1.5 !min-w-0 !min-h-0"
      />

      {/* Icon box */}
      <div className={cn(
        'relative w-11 h-11 rounded-lg flex items-center justify-center border-2',
        colors.border,
        colors.iconBg,
      )}>
        {Icon && <Icon className={cn('w-5 h-5', colors.text)} strokeWidth={2} />}
        {/* Status indicator */}
        <div className={cn(
          'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900',
          status.dot,
        )} />
      </div>

      {/* Label */}
      <div className="text-center w-full">
        <div className={cn('text-[10px] font-bold uppercase tracking-wide leading-tight', colors.text)}>
          {meta?.label ?? resource.type}
        </div>
        <div className="text-[9px] text-slate-400 truncate leading-tight mt-0.5" title={resource.name}>
          {resource.name}
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
