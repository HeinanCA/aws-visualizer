import { useEffect, useMemo } from 'react';
import { useGraphStore } from '@/store/graph-store';
import { RESOURCE_TYPE_METADATA } from '@aws-visualizer/shared';
import { RESOURCE_ICONS, getResourceColors } from '@/lib/aws-icons';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    transition: { 
      type: 'spring', 
      damping: 25, 
      stiffness: 300,
      staggerChildren: 0.01
    }
  },
  exit: { opacity: 0, scale: 1.05, transition: { duration: 0.2 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

export function FolderModal() {
  const { graph, activeFolderId, setActiveFolder, selectNode } = useGraphStore();

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
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-md cursor-pointer"
        onClick={() => setActiveFolder(null)}
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="relative w-[90%] max-w-5xl h-[70vh] bg-[#1c1c1e]/80 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col"
      >
        {/* Floating Close Button */}
        <button
          onClick={() => setActiveFolder(null)}
          className="absolute top-8 right-8 z-50 p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/40 hover:text-white transition-all active:scale-90"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Static Header Section */}
        <div className="pt-12 pb-6 px-16 text-center">
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {folderInfo.type === 'empty_subnets' ? 'Empty Subnets' : `${meta?.label ?? folderInfo.type}s`}
          </h2>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mt-1">
            {children.length} Resources in {folderInfo.vpcId}
          </p>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-16 pb-16 custom-scrollbar">
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-x-8 gap-y-10">
            {children.map((node) => (
              <motion.div
                key={node.id}
                variants={itemVariants}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveFolder(null);
                  selectNode(node.id);
                }}
                className="flex flex-col items-center group cursor-pointer"
              >
                <div className={cn(
                  'w-16 h-16 rounded-2xl flex items-center justify-center relative transition-all duration-300',
                  'bg-white/5 border border-white/5 shadow-lg group-hover:bg-white/10 group-hover:border-white/20',
                  colors.iconBg
                )}>
                  {Icon && <Icon className={cn('w-8 h-8 drop-shadow-lg', colors.text)} strokeWidth={2} />}
                </div>
                <div className="mt-3 w-full text-center">
                  <div className="text-[11px] font-semibold text-white/70 group-hover:text-white transition-colors truncate px-1">
                    {node.resource.name?.includes('.ec2') ? node.id.split('-').pop() : (node.resource.name || node.id.split('-').pop())}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
