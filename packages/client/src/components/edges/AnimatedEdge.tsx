import { memo } from 'react';
import {
  BaseEdge,
  getSmoothStepPath,
  type EdgeProps,
} from '@xyflow/react';
import { cn } from '@/lib/utils';

interface AnimatedEdgeData {
  readonly relationship?: string;
  readonly animated?: boolean;
}

export const AnimatedEdge = memo(function AnimatedEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps & { data?: AnimatedEdgeData }) {
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  });

  const isAnimated = data?.animated ?? false;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        className={cn(
          'transition-colors duration-150',
          selected ? '!stroke-blue-400' : '!stroke-slate-600/60',
        )}
        style={{
          strokeWidth: selected ? 2 : 1,
          strokeDasharray: isAnimated ? '6 4' : undefined,
        }}
      />
      {isAnimated && (
        <BaseEdge
          id={`${id}-flow`}
          path={edgePath}
          className="!stroke-blue-400/40 animate-edge-flow"
          style={{ strokeWidth: 1, strokeDasharray: '6 4' }}
        />
      )}
    </>
  );
});
