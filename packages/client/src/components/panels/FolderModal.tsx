import { useEffect, useMemo } from 'react';
import { useGraphStore } from '@/store/graph-store';
import { RESOURCE_TYPE_METADATA } from '@aws-visualizer/shared';
import { RESOURCE_ICONS, getResourceColors } from '@/lib/aws-icons';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';

export function FolderModal() {
  const { graph, activeFolderId, setActiveFolder, selectNode } = useGraphStore();

  // PARSE THE ID DIRECTLY (Since this is a synthetic node not in the real graph)
  const folderInfo = useMemo(() => {
    if (!activeFolderId) return null;
    const [header, type] = activeFolderId.split(':::');
    if (!header || !type) return null;
    const vpcId = header.replace('__summary_', '');
    return { vpcId, type };
  }, [activeFolderId]);

  const children = useMemo(() => {
    if (!graph || !folderInfo) return [];
    
    return graph.nodes.filter((n) => {
      if (folderInfo.type === 'empty_subnets') {
        const isSubnet = n.resource.type === 'subnet';
        const isChildOfVpc = n.resource.parentId === folderInfo.vpcId;
        const hasNoChildren = !graph.nodes.some(child => child.resource.parentId === n.id);
        return isSubnet && isChildOfVpc && hasNoChildren;
      }
      return n.resource.type === folderInfo.type && n.resource.parentId === folderInfo.vpcId;
    });
  }, [graph, folderInfo]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveFolder(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActiveFolder]);

  if (!folderInfo) return null;

  // Use metadata for the type we extracted from the ID
  const displayType = folderInfo.type === 'empty_subnets' ? 'subnet' : folderInfo.type;
  const meta = (RESOURCE_TYPE_METADATA as any)[displayType];
  const colors = getResourceColors(displayType);
  const Icon = RESOURCE_ICONS[displayType];

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-auto">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md cursor-pointer"
        onClick={() => setActiveFolder(null)}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-[800px] max-h-[80vh] flex flex-col bg-slate-900/60 backdrop-blur-3xl rounded-[3rem] border border-white/10 ring-1 ring-inset ring-white/10 shadow-[0_0_120px_rgba(0,0,0,0.8)] overflow-hidden"
      >
        <div className="flex items-center justify-between p-10 pb-6">
          <div className="flex items-center gap-5">
            <div className={cn('p-4 rounded-2xl bg-black/40 border border-white/10 shadow-2xl', colors.iconBg)}>
              {Icon && <Icon className={cn('w-9 h-9', colors.text)} strokeWidth={2.5} />}
            </div>
            <div>
              <h2 className="text-3xl font-black text-white tracking-tighter leading-none mb-1">
                {folderInfo.type === 'empty_subnets' ? 'Empty Subnets' : `${meta?.label ?? folderInfo.type}s`}
              </h2>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest opacity-60">
                Inventory &middot; {children.length} Items
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveFolder(null)}
            className="p-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition-all cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-10 pt-0 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-3 gap-6 pb-10">
            {children.map((node) => (
              <div
                key={node.id}
                onClick={() => {
                  selectNode(node.id);
                  setActiveFolder(null);
                }}
                className={cn(
                  'flex flex-col items-center gap-4 p-6 rounded-[2rem] cursor-pointer transition-all duration-300 group',
                  'bg-white/[0.03] border border-white/5 hover:bg-white/10 hover:scale-105 hover:border-white/20',
                  'hover:shadow-[0_0_40px_rgba(255,255,255,0.05)]'
                )}
              >
                <div className={cn(
                  'w-16 h-16 rounded-2xl flex items-center justify-center border-2 border-white/5 bg-black/40 shadow-inner',
                  colors.iconBg
                )}>
                  {Icon && <Icon className={cn('w-8 h-8', colors.text)} strokeWidth={2} />}
                </div>
                <div className="text-center w-full">
                  <div className="text-sm font-black text-slate-100 truncate px-2" title={node.resource.name}>
                    {node.resource.name?.includes('.ec2') ? node.id : node.resource.name}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono tracking-tighter truncate mt-1 opacity-60">
                    {node.id}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
