import { memo, useCallback } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useGraphStore } from '@/store/graph-store';
import type { AWSResource } from '@aws-visualizer/shared';
import { RESOURCE_TYPE_METADATA } from '@aws-visualizer/shared';
import { RESOURCE_ICONS, getResourceColors } from '@/lib/aws-icons';
import { cn } from '@/lib/utils';

interface SummaryNodeData {
  readonly resource: AWSResource;
  readonly isSummaryCard: boolean;
}

export const SummaryNode = memo(function SummaryNode({
  id,
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

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    useGraphStore.getState().setActiveFolder(id);
  }, [id]);

  return (
    <div
      onClick={handleClick}
      className={cn(
        'flex items-center gap-5 px-5 py-4 rounded-[2rem] border border-dashed transition-all duration-300 cursor-pointer',
        'bg-slate-900/60 backdrop-blur-xl ring-1 ring-inset ring-white/5',
        'nopan nodrag',
        colors.border,
        'hover:bg-white/10 hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.1)] group',
        selected && 'ring-2 ring-blue-400/60 shadow-[0_0_40px_rgba(59,130,246,0.3)]',
      )}
      style={{ width: 200, height: 120 }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-slate-500 !border-slate-800 !w-2.5 !h-2.5 !-top-1.5 !min-w-0 !min-h-0"
      />

      {/* Folder Icon Stack effect */}
      <div className="relative flex-shrink-0 w-14 h-14">
        {/* Fake background cards for folder look */}
        <div className="absolute inset-0 bg-white/5 rounded-2xl transform rotate-12 translate-x-1.5 translate-y-1 scale-95 border border-white/10" />
        <div className="absolute inset-0 bg-white/10 rounded-2xl transform -rotate-6 -translate-x-1 -translate-y-0.5 scale-100 border border-white/10" />
        
        <div className={cn(
          'relative w-full h-full rounded-2xl flex items-center justify-center border-2 bg-black/60 backdrop-blur-sm shadow-xl',
          colors.border,
          colors.iconBg,
        )}>
          {Icon && <Icon className={cn('w-7 h-7', colors.text)} strokeWidth={2.5} />}
        </div>
      </div>

      {/* Label + count */}
      <div className="min-w-0 flex-1 flex flex-col justify-center">
        <div className={cn('text-[10px] font-black uppercase tracking-[0.2em] leading-tight truncate opacity-80 mb-1', colors.text)}>
          {meta?.label ?? resource.type}
        </div>
        <div className="text-3xl font-black text-white leading-none tracking-tighter">
          {count}
        </div>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight mt-1">
          Items
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
