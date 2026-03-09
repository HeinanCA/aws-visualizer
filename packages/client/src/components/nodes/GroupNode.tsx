import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { AWSResource } from '@aws-visualizer/shared';
import { RESOURCE_TYPE_METADATA, ResourceType } from '@aws-visualizer/shared';
import { RESOURCE_ICONS, getResourceColors, CATEGORY_COLORS } from '@/lib/aws-icons';
import { cn } from '@/lib/utils';

interface GroupNodeData {
  readonly resource: AWSResource;
  readonly isGroup: boolean;
  readonly isSyntheticGroup?: boolean;
}

const CONTAINER_STYLES: Record<string, {
  borderColor: string;
  headerBg: string;
  headerText: string;
  bodyBg: string;
}> = {
  [ResourceType.VPC]: {
    borderColor: 'border-emerald-500/70',
    headerBg: 'bg-emerald-500/15',
    headerText: 'text-emerald-300',
    bodyBg: 'bg-emerald-950/20',
  },
  [ResourceType.SUBNET]: {
    borderColor: 'border-blue-500/60',
    headerBg: 'bg-blue-500/10',
    headerText: 'text-blue-300',
    bodyBg: 'bg-blue-950/15',
  },
};

const DEFAULT_STYLE = {
  borderColor: 'border-slate-500/50',
  headerBg: 'bg-slate-500/10',
  headerText: 'text-slate-300',
  bodyBg: 'bg-slate-900/30',
};

function getSyntheticGroupStyle(type: string) {
  const meta = (RESOURCE_TYPE_METADATA as Record<string, { category: string }>)[type];
  const category = meta?.category;
  const colors = category ? CATEGORY_COLORS[category] : undefined;
  if (!colors) return DEFAULT_STYLE;

  return {
    borderColor: colors.border,
    headerBg: colors.iconBg,
    headerText: colors.text,
    bodyBg: colors.bg,
  };
}

export const GroupNode = memo(function GroupNode({
  data,
  selected,
}: NodeProps & { data: GroupNodeData }) {
  const { resource, isSyntheticGroup } = data;
  const meta = RESOURCE_TYPE_METADATA[resource.type];
  const Icon = RESOURCE_ICONS[resource.type];

  const isVpc = resource.type === ResourceType.VPC;
  const isSubnet = resource.type === ResourceType.SUBNET;
  const isPublic = isSubnet && resource.metadata?.isPublic;

  // Synthetic groups use category-based colors; real containers use fixed styles
  const style = isSyntheticGroup
    ? getSyntheticGroupStyle(resource.type)
    : (CONTAINER_STYLES[resource.type] ?? DEFAULT_STYLE);

  const minWidth = isVpc ? 400 : isSyntheticGroup ? 180 : 200;
  const minHeight = isVpc ? 200 : isSyntheticGroup ? 100 : 120;

  return (
    <div
      className={cn(
        'rounded-[2.5rem] border-2 transition-all duration-500 overflow-visible backdrop-blur-2xl',
        style.borderColor,
        style.bodyBg,
        selected ? 'ring-4 ring-blue-500/30 shadow-[0_0_50px_rgba(59,130,246,0.15)] scale-[1.01] z-10' : 'shadow-2xl',
        isVpc ? 'border-[3px] bg-emerald-950/10' : 'bg-blue-950/10',
        isSyntheticGroup && 'border-dashed opacity-80',
      )}
      style={{ width: '100%', height: '100%', minWidth, minHeight }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-slate-500 !border-slate-950 !w-3 !h-3 !-top-1.5 !min-w-0 !min-h-0 shadow-lg"
      />

      {/* Container header bar */}
      <div className={cn(
        'flex items-center gap-4 px-6 py-4 rounded-t-[1.85rem] border-b-2 bg-gradient-to-r from-black/40 to-transparent',
        style.borderColor,
        isSyntheticGroup && 'border-dashed',
      )}>
        <div className={cn('p-2 rounded-xl bg-black/30 border border-white/5 shadow-inner', style.headerText)}>
          {Icon && <Icon className="w-5 h-5" strokeWidth={2.5} />}
        </div>
        <div className="flex flex-col">
          <span className={cn('text-[10px] font-black uppercase tracking-[0.2em] leading-none opacity-70', style.headerText)}>
            {isSyntheticGroup ? 'Group' : (meta?.label ?? resource.type)}
          </span>
          <span className={cn('text-sm font-bold tracking-tight mt-1 truncate max-w-[200px]', style.headerText)}>
             {isSyntheticGroup ? resource.name : (resource.name || resource.id)}
          </span>
        </div>
        
        <div className="ml-auto flex items-center gap-3">
          {typeof resource.metadata?.cidrBlock === 'string' && (
            <span className="text-[11px] font-mono text-slate-400 font-medium bg-black/40 px-3 py-1 rounded-full border border-white/5">
              {resource.metadata.cidrBlock}
            </span>
          )}
          {isSubnet && (
            <span className={cn(
              'text-[10px] font-black px-3 py-1 rounded-full tracking-widest shadow-sm border',
              isPublic
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20',
            )}>
              {isPublic ? 'PUBLIC' : 'PRIVATE'}
            </span>
          )}
        </div>
      </div>

      {/* Children are rendered inside this space by React Flow */}

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-slate-500 !border-slate-700 !w-1.5 !h-1.5 !min-w-0 !min-h-0"
      />
    </div>
  );
});
