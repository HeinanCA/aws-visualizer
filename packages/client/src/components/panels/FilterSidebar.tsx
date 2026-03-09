import { useMemo } from 'react';
import { useGraphStore } from '@/store/graph-store';
import {
  ResourceType,
  RESOURCE_TYPE_METADATA,
} from '@aws-visualizer/shared';
import { RESOURCE_ICONS } from '@/lib/aws-icons';
import { cn } from '@/lib/utils';
import { ArrowLeft, Network, Globe, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function FilterSidebar() {
  const { graph, activeVpcId, setActiveVpc, searchQuery, setSearchQuery, selectNode } = useGraphStore();

  const activeVpc = useMemo(() => {
    if (!graph || !activeVpcId) return null;
    return graph.nodes.find((n) => n.id === activeVpcId) ?? null;
  }, [graph, activeVpcId]);

  // Resources in the active VPC, grouped by type
  const vpcResources = useMemo(() => {
    if (!graph || !activeVpcId) return [];

    const vpcNodeIds = new Set<string>();
    vpcNodeIds.add(activeVpcId);
    for (const n of graph.nodes) {
      if (n.resource.parentId === activeVpcId) vpcNodeIds.add(n.id);
    }
    for (const n of graph.nodes) {
      if (n.resource.parentId && vpcNodeIds.has(n.resource.parentId)) {
        vpcNodeIds.add(n.id);
      }
    }

    const nodes = graph.nodes.filter(
      (n) => vpcNodeIds.has(n.id) && n.id !== activeVpcId,
    );

    const byType: Record<string, typeof nodes> = {};
    for (const n of nodes) {
      const arr = byType[n.resource.type] ?? [];
      arr.push(n);
      byType[n.resource.type] = arr;
    }

    return Object.entries(byType)
      .sort(([, a], [, b]) => b.length - a.length);
  }, [graph, activeVpcId]);

  // Filter resources by search
  const filteredResources = useMemo(() => {
    if (!searchQuery) return vpcResources;
    const q = searchQuery.toLowerCase();
    return vpcResources
      .map(([type, nodes]) => [
        type,
        nodes.filter(
          (n) =>
            n.resource.name.toLowerCase().includes(q) ||
            n.resource.id.toLowerCase().includes(q),
        ),
      ] as const)
      .filter(([, nodes]) => nodes.length > 0);
  }, [vpcResources, searchQuery]);

  if (!graph || !activeVpcId || !activeVpc) return null;

  const vpcName = activeVpc.resource.name;
  const cidr = typeof activeVpc.resource.metadata?.cidrBlock === 'string'
    ? activeVpc.resource.metadata.cidrBlock
    : null;

  return (
    <div className="w-[280px] h-full bg-slate-900/95 backdrop-blur-md border-r-2 border-slate-700/50 overflow-y-auto flex-shrink-0 flex flex-col">
      {/* Back button + VPC header */}
      <div className="px-4 py-3 border-b border-slate-700/50 flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setActiveVpc(null)}
          className="text-xs text-slate-400 hover:text-white h-7 px-2 -ml-2 mb-2 gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          All VPCs
        </Button>
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-emerald-500/15">
            <Network className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="text-sm font-bold text-white truncate">{vpcName}</div>
            {cidr && (
              <div className="text-xs font-mono text-slate-500">{cidr}</div>
            )}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-3 border-b border-slate-700/50 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Find resource..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8 pl-8 pr-3 rounded-lg border border-slate-700 bg-slate-800/60 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Resource list grouped by type */}
      <div className="flex-1 overflow-y-auto">
        {filteredResources.map(([type, nodes]) => {
          const meta = (RESOURCE_TYPE_METADATA as Record<string, { label: string }>)[type];
          const Icon = (RESOURCE_ICONS as Record<string, typeof Globe>)[type] ?? Globe;

          return (
            <div key={type} className="border-b border-slate-800/80">
              <div className="px-4 py-2 bg-slate-800/30 flex items-center gap-2">
                <Icon className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                  {meta?.label ?? type}
                </span>
                <span className="text-xs text-slate-600 ml-auto">{nodes.length}</span>
              </div>
              <div className="px-2 py-1">
                {nodes.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => selectNode(n.id)}
                    className="w-full text-left px-2 py-1.5 rounded-md text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors truncate"
                    title={`${n.resource.name} (${n.resource.id})`}
                  >
                    {n.resource.name}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
