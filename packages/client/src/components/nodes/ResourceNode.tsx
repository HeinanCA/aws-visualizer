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
        'flex flex-col items-center gap-3 px-4 py-4 rounded-2xl transition-all duration-300 cursor-pointer group ambient-glow',
        selected ? 'bg-white/10 ring-4 ring-blue-500/30 scale-110 z-50' : 'hover:scale-105 hover:bg-white/5',
      )}
      style={{ width: 140 }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-slate-500 !border-slate-950 !w-2.5 !h-2.5 !-top-1.25 shadow-md"
      />

      {/* Icon box - increased size and better depth */}
      <div className={cn(
        'relative w-18 h-18 rounded-2xl flex items-center justify-center border-2 transition-all duration-500',
        colors.border,
        colors.iconBg,
        selected ? 'shadow-[0_0_30px_rgba(255,255,255,0.15)] bg-white/10' : 'shadow-lg',
      )}>
        {Icon && <Icon className={cn('w-9 h-9', colors.text)} strokeWidth={2} />}
        {/* Status indicator - larger and clearer */}
        <div className={cn(
          'absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-[3px] border-slate-950 shadow-sm',
          status.dot,
        )} />
      </div>

      {/* Label - cleaner typography, truncated noise */}
      <div className="text-center w-full px-1">
        <div className={cn('text-[10px] font-black uppercase tracking-[0.15em] leading-none opacity-80 mb-1.5', colors.text)}>
          {meta?.label ?? resource.type}
        </div>
        <div className="text-xs font-bold text-slate-100 truncate w-full" title={resource.name}>
          {resource.name?.includes('.ec2.internal') ? resource.id : resource.name}
        </div>
        <div className="text-[10px] font-medium text-slate-500 mt-1 truncate opacity-60">
          {resource.id}
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
