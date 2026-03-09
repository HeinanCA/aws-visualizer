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
        'rounded-xl border-2 transition-all duration-150 overflow-visible',
        style.borderColor,
        style.bodyBg,
        selected && 'ring-2 ring-blue-400/50 shadow-[0_0_20px_rgba(59,130,246,0.15)]',
        isVpc && 'border-[2.5px]',
        isSyntheticGroup && 'border-dashed',
      )}
      style={{ minWidth, minHeight }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-slate-500 !border-slate-700 !w-1.5 !h-1.5 !min-w-0 !min-h-0"
      />

      {/* Container header bar */}
      <div className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-t-[9px] border-b',
        style.headerBg,
        style.borderColor,
        isSyntheticGroup && 'border-dashed',
      )}>
        {Icon && <Icon className={cn('w-4 h-4', style.headerText)} strokeWidth={2} />}
        <span className={cn('text-xs font-bold uppercase tracking-wide', style.headerText)}>
          {isSyntheticGroup ? resource.name : (meta?.label ?? resource.type)}
        </span>
        {!isSyntheticGroup && (
          <span className="text-xs text-slate-400 truncate">
            {resource.name}
          </span>
        )}
        {typeof resource.metadata?.cidrBlock === 'string' && (
          <span className="text-[10px] font-mono text-slate-500 ml-auto">
            {resource.metadata.cidrBlock}
          </span>
        )}
        {isSubnet && (
          <span className={cn(
            'text-[10px] font-bold px-1.5 py-0.5 rounded ml-auto',
            isPublic
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-amber-500/20 text-amber-400',
          )}>
            {isPublic ? 'PUBLIC' : 'PRIVATE'}
          </span>
        )}
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
