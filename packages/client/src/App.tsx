import { ReactFlowProvider } from '@xyflow/react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Header } from '@/components/layout/Header';
import { VpcOverview } from '@/components/graph/VpcOverview';
import { GraphCanvas } from '@/components/graph/GraphCanvas';
import { FilterSidebar } from '@/components/panels/FilterSidebar';
import { ScanProgressPanel } from '@/components/panels/ScanProgressPanel';
import { ResourceDetailPanel } from '@/components/panels/ResourceDetailPanel';
import { useGraphStore } from '@/store/graph-store';
import { getConnectedEdges } from '@aws-visualizer/shared';
import { useMemo } from 'react';

export function App() {
  const { graph, selectedNodeId, scanProgress, selectNode, activeVpcId } = useGraphStore();

  const selectedNode = useMemo(
    () =>
      graph && selectedNodeId
        ? graph.nodes.find((n) => n.id === selectedNodeId) ?? null
        : null,
    [graph, selectedNodeId],
  );

  const selectedEdges = useMemo(
    () =>
      graph && selectedNodeId
        ? getConnectedEdges(graph, selectedNodeId)
        : [],
    [graph, selectedNodeId],
  );

  const isVpcView = graph && activeVpcId;

  return (
    <ErrorBoundary>
      <TooltipProvider delayDuration={200}>
        <ReactFlowProvider>
          <div className="flex flex-col h-screen bg-gradient-to-b from-slate-900 to-slate-950">
            <Header />
            <div className="flex flex-1 overflow-hidden">
              {/* Sidebar only shown in VPC drill-down view */}
              {isVpcView && <FilterSidebar />}

              <div className="flex-1 relative">
                {/* Two views: overview or VPC graph */}
                {!graph && (
                  <div className="flex flex-col items-center justify-center h-full gap-5">
                    <div className="text-center">
                      <p className="text-slate-300 text-lg font-semibold">
                        Start a scan to visualize your AWS resources
                      </p>
                      <p className="text-slate-500 text-sm mt-2">
                        Select a region and click Scan to discover resources
                      </p>
                    </div>
                  </div>
                )}

                {graph && !activeVpcId && <VpcOverview />}

                {isVpcView && <GraphCanvas />}

                {scanProgress && <ScanProgressPanel progress={scanProgress} />}

                {selectedNode && (
                  <ResourceDetailPanel
                    node={selectedNode}
                    edges={selectedEdges}
                    onClose={() => selectNode(null)}
                  />
                )}
              </div>
            </div>
          </div>
        </ReactFlowProvider>
      </TooltipProvider>
    </ErrorBoundary>
  );
}
