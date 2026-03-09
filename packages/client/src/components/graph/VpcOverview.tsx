import { useMemo } from 'react';
import { useGraphStore } from '@/store/graph-store';
import {
  ResourceType,
  RESOURCE_TYPE_METADATA,
  getGraphStats,
} from '@aws-visualizer/shared';
import { RESOURCE_ICONS, CATEGORY_COLORS } from '@/lib/aws-icons';
import { cn } from '@/lib/utils';
import {
  Network,
  Layers,
  Server,
  ArrowRight,
  Globe,
} from 'lucide-react';

export function VpcOverview() {
  const { graph, setActiveVpc } = useGraphStore();

  const vpcs = useMemo(() => {
    if (!graph) return [];
    return graph.nodes
      .filter((n) => n.resource.type === ResourceType.VPC)
      .map((vpc) => {
        const childNodes = graph.nodes.filter(
          (n) => n.resource.parentId === vpc.id,
        );
        const subnets = childNodes.filter(
          (n) => n.resource.type === ResourceType.SUBNET,
        );
        // Count all descendants (children of children too)
        const subnetIds = new Set(subnets.map((s) => s.id));
        const grandchildren = graph.nodes.filter(
          (n) => n.resource.parentId && subnetIds.has(n.resource.parentId),
        );
        const totalResources = childNodes.length + grandchildren.length;

        return {
          id: vpc.id,
          name: vpc.resource.name,
          cidr: typeof vpc.resource.metadata?.cidrBlock === 'string'
            ? vpc.resource.metadata.cidrBlock
            : undefined,
          isDefault: vpc.resource.metadata?.isDefault === true,
          state: typeof vpc.resource.metadata?.state === 'string'
            ? vpc.resource.metadata.state
            : undefined,
          subnetCount: subnets.length,
          totalResources,
        };
      });
  }, [graph]);

  const externalStats = useMemo(() => {
    if (!graph) return { count: 0, byType: {} as Record<string, number> };
    const external = graph.nodes.filter(
      (n) =>
        !n.resource.parentId ||
        !graph.nodes.some((p) => p.id === n.resource.parentId),
    );
    // Exclude VPCs themselves from external count
    const nonVpc = external.filter(
      (n) => n.resource.type !== ResourceType.VPC,
    );
    const byType: Record<string, number> = {};
    for (const n of nonVpc) {
      byType[n.resource.type] = (byType[n.resource.type] ?? 0) + 1;
    }
    return { count: nonVpc.length, byType };
  }, [graph]);

  const totalStats = useMemo(
    () => (graph ? getGraphStats(graph) : null),
    [graph],
  );

  if (!graph) return null;

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="max-w-5xl mx-auto">
        {/* Title */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">
            Infrastructure Overview
          </h2>
          <p className="text-slate-400 text-sm">
            {graph.nodes.length} resources discovered across {vpcs.length} VPCs
            &middot; Scanned {new Date(graph.scannedAt).toLocaleString()}
          </p>
        </div>

        {/* VPC Cards */}
        <div className="mb-8">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4">
            Virtual Private Clouds
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {vpcs.map((vpc) => (
              <button
                key={vpc.id}
                onClick={() => setActiveVpc(vpc.id)}
                className="group text-left bg-slate-800/60 hover:bg-slate-800 border-2 border-emerald-500/40 hover:border-emerald-400/70 rounded-xl p-5 transition-all duration-200 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                      <Network className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-lg font-black text-white group-hover:text-emerald-300 transition-colors tracking-tight">
                        {vpc.name}
                      </div>
                      {vpc.cidr && (
                        <div className="text-xs font-mono text-slate-500 mt-0.5">
                          {vpc.cidr}
                        </div>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="w-6 h-6 text-slate-700 group-hover:text-emerald-400 transition-all transform group-hover:translate-x-1 mt-1" />
                </div>

                <div className="flex items-center gap-5 text-sm">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Layers className="w-4 h-4 text-slate-500" />
                    <span><strong className="text-slate-100 font-bold">{vpc.subnetCount}</strong> subnets</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Server className="w-4 h-4 text-slate-500" />
                    <span><strong className="text-slate-100 font-bold">{vpc.totalResources}</strong> resources</span>
                  </div>
                </div>

                {vpc.isDefault && (
                  <div className="mt-4 text-[11px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-md w-fit shadow-sm">
                    Default VPC
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Global / External Resources */}
        {externalStats.count > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4">
              Global Resources ({externalStats.count})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {Object.entries(externalStats.byType)
                .sort(([, a], [, b]) => b - a)
                .map(([type, count]) => {
                  const meta = (RESOURCE_TYPE_METADATA as Record<string, { label: string; category: string }>)[type];
                  const colors = CATEGORY_COLORS[meta?.category ?? ''];
                  const Icon = (RESOURCE_ICONS as Record<string, typeof Globe>)[type] ?? Globe;
                  return (
                    <div
                      key={type}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-lg border',
                        colors?.bg ?? 'bg-slate-800/40',
                        colors?.border ?? 'border-slate-700/50',
                      )}
                    >
                      <Icon className={cn('w-4 h-4', colors?.text ?? 'text-slate-400')} />
                      <div>
                        <div className="text-sm font-medium text-slate-200">
                          {meta?.label ?? type}
                        </div>
                        <div className="text-xs text-slate-500">{count}</div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Overall stats */}
        {totalStats && (
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4">
              Summary
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Total Resources" value={totalStats.totalNodes} />
              <StatCard label="Connections" value={totalStats.totalEdges} />
              <StatCard label="VPCs" value={vpcs.length} />
              <StatCard
                label="Resource Types"
                value={Object.keys(totalStats.byType).length}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { readonly label: string; readonly value: number }) {
  return (
    <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl px-5 py-4">
      <div className="text-2xl font-bold text-white">{value.toLocaleString()}</div>
      <div className="text-xs text-slate-500 mt-1">{label}</div>
    </div>
  );
}
