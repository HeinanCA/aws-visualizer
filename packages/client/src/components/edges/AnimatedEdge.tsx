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
    borderRadius: 32, // Maximum smoothness for next-gen look
  });

  const isAnimated = data?.animated ?? false;

  return (
    <>
      {/* Background Glow (Active when selected) */}
      {selected && (
        <BaseEdge
          id={`${id}-glow`}
          path={edgePath}
          className="!stroke-blue-400/10 blur-[6px]"
          style={{ strokeWidth: 12 }}
        />
      )}
      
      {/* The Logical Wire (Architectural Line) */}
      <BaseEdge
        id={id}
        path={edgePath}
        className={cn(
          'transition-all duration-500',
          selected ? '!stroke-blue-400/80' : '!stroke-slate-800/40',
        )}
        style={{
          strokeWidth: selected ? 2.5 : 1.5,
        }}
      />

      {/* The "Traffic Comet" Effect */}
      {isAnimated && (
        <BaseEdge
          id={`${id}-comet`}
          path={edgePath}
          className="!stroke-blue-400/90 animate-edge-flow"
          style={{ 
            strokeWidth: selected ? 3 : 2,
            strokeDasharray: '2 30', // A single "head" followed by a large gap
            strokeLinecap: 'round',
            filter: 'drop-shadow(0 0 4px rgba(96, 165, 250, 0.8))'
          }}
        />
      )}

      {/* Broad Interaction Area */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        className="cursor-pointer"
      />
    </>
  );
});
