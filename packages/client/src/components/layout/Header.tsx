import { useState, useMemo } from 'react';
import { useWebSocket } from '@/hooks/use-websocket';
import { useGraphStore } from '@/store/graph-store';
import { Button } from '@/components/ui/button';
import { Radar, Cloud, ChevronRight } from 'lucide-react';

const AWS_REGIONS = [
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'eu-west-1',
  'eu-west-2',
  'eu-central-1',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-northeast-1',
  'ap-northeast-2',
  'ap-south-1',
  'sa-east-1',
] as const;

export function Header() {
  const { startScan } = useWebSocket();
  const { graph, scanProgress, activeVpcId, setActiveVpc } = useGraphStore();
  const [region, setRegion] = useState('us-east-1');

  const isScanning = scanProgress !== null;

  const activeVpcName = useMemo(() => {
    if (!graph || !activeVpcId) return null;
    const vpc = graph.nodes.find((n) => n.id === activeVpcId);
    return vpc?.resource.name ?? activeVpcId;
  }, [graph, activeVpcId]);

  const handleScan = () => {
    startScan({ regions: [region] });
  };

  return (
    <header className="flex items-center justify-between px-6 h-14 border-b border-slate-700/60 bg-slate-900/90 backdrop-blur-md flex-shrink-0">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Cloud className="w-5 h-5 text-blue-400" />
          <h1 className="text-base font-bold text-white tracking-tight">
            AWS Visualizer
          </h1>
        </div>

        {/* Breadcrumb */}
        {graph && (
          <div className="flex items-center gap-1.5 text-sm text-slate-400">
            <ChevronRight className="w-3.5 h-3.5" />
            {activeVpcId ? (
              <>
                <button
                  onClick={() => setActiveVpc(null)}
                  className="hover:text-white transition-colors"
                >
                  Overview
                </button>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-emerald-400 font-medium">{activeVpcName}</span>
              </>
            ) : (
              <span className="text-slate-300 font-medium">Overview</span>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="h-9 px-3 rounded-lg border border-slate-600 bg-slate-800 text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {AWS_REGIONS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <Button
          onClick={handleScan}
          disabled={isScanning}
          className="h-9 px-4 text-sm font-semibold gap-2"
        >
          <Radar className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
          {isScanning ? 'Scanning...' : 'Scan'}
        </Button>
      </div>
    </header>
  );
}
