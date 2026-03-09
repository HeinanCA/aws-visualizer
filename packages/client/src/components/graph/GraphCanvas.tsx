import { useCallback, useMemo } from "react";
import {
  ReactFlow,
  Controls,
  MiniMap,
  type NodeTypes,
  type EdgeTypes,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useGraphStore } from "@/store/graph-store";
import { useLayout } from "@/hooks/use-layout";
import type { Graph } from "@aws-visualizer/shared";
import { ResourceNode } from "@/components/nodes/ResourceNode";
import { GroupNode } from "@/components/nodes/GroupNode";
import { SummaryNode } from "@/components/nodes/SummaryNode";
import { AnimatedEdge } from "@/components/edges/AnimatedEdge";
import { Loader2 } from "lucide-react";

const nodeTypes: NodeTypes = {
  resourceNode: ResourceNode as unknown as NodeTypes["resourceNode"],
  groupNode: GroupNode as unknown as NodeTypes["groupNode"],
  summaryNode: SummaryNode as unknown as NodeTypes["summaryNode"],
};

const edgeTypes: EdgeTypes = {
  animated: AnimatedEdge as unknown as EdgeTypes["animated"],
};

export function GraphCanvas() {
  const { graph, selectNode, selectedNodeId, activeVpcId, setActiveFolder } = useGraphStore();

  // Build a subgraph for just the active VPC
  const vpcGraph = useMemo((): Graph | null => {
    if (!graph || !activeVpcId) return null;

    // Collect all node IDs that belong to this VPC (recursive children)
    const vpcNodeIds = new Set<string>();
    vpcNodeIds.add(activeVpcId);

    // Find direct children of VPC
    for (const n of graph.nodes) {
      if (n.resource.parentId === activeVpcId) {
        vpcNodeIds.add(n.id);
      }
    }

    // Find grandchildren (e.g. EC2 inside subnets)
    for (const n of graph.nodes) {
      if (n.resource.parentId && vpcNodeIds.has(n.resource.parentId)) {
        vpcNodeIds.add(n.id);
      }
    }

    const nodes = graph.nodes.filter((n) => vpcNodeIds.has(n.id));
    const edges = graph.edges.filter(
      (e) => vpcNodeIds.has(e.source) && vpcNodeIds.has(e.target),
    );

    return { ...graph, nodes, edges };
  }, [graph, activeVpcId]);

  const { nodes, edges, isLayouting } = useLayout(vpcGraph);

  // Show edges only for selected node when there are many
  const visibleEdges = useMemo(() => {
    if (!selectedNodeId || edges.length < 100) return edges;
    return edges.filter(
      (e) => e.source === selectedNodeId || e.target === selectedNodeId,
    );
  }, [edges, selectedNodeId]);

  const handleNodeClick = useCallback(
    (_: unknown, node: Node) => {
      if (node.type === 'summaryNode') {
        setActiveFolder(node.id);
      } else {
        selectNode(node.id);
      }
    },
    [selectNode, setActiveFolder],
  );

  const handlePaneClick = useCallback(() => {
    selectNode(null);
    setActiveFolder(null);
  }, [selectNode, setActiveFolder]);


  if (!vpcGraph) return null;

  if (isLayouting) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
        <p className="text-slate-300 text-base font-medium">
          Laying out {vpcGraph.nodes.length} resources...
        </p>
      </div>
    );
  }

  return (
    <ReactFlow
      nodes={nodes}
      edges={visibleEdges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onNodeClick={handleNodeClick}
      onPaneClick={handlePaneClick}
      fitView
      fitViewOptions={{ padding: 0.15, maxZoom: 1.2 }}
      minZoom={0.05}
      maxZoom={3}
      proOptions={{ hideAttribution: true }}
    >
      <Controls
        className="!bg-slate-800 !border-slate-600 !rounded-xl !shadow-xl"
        showInteractive={false}
      />
      <MiniMap
        nodeColor={(node) => {
          const data = node.data as { resource?: { type?: string } };
          const type = data.resource?.type;
          if (type === "vpc") return "#10b981";
          if (type === "subnet") return "#3b82f6";
          return "#64748b";
        }}
        maskColor="rgba(15, 23, 42, 0.7)"
        className="!bg-slate-800 !border-2 !border-slate-600 !rounded-xl"
        pannable
        zoomable
      />
    </ReactFlow>
  );
}
