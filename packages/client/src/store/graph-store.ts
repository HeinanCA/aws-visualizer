import { create } from 'zustand';
import type {
  Graph,
  FilterCriteria,
  ScanProgress,
} from '@aws-visualizer/shared';

interface GraphState {
  readonly graph: Graph | null;
  readonly selectedNodeId: string | null;
  readonly activeFolderId: string | null;
  readonly filters: FilterCriteria;
  readonly searchQuery: string;
  readonly scanProgress: ScanProgress | null;
  readonly activeVpcId: string | null;

  setGraph: (graph: Graph) => void;
  selectNode: (id: string | null) => void;
  setActiveFolder: (id: string | null) => void;
  updateFilters: (filters: FilterCriteria) => void;
  setSearchQuery: (query: string) => void;
  updateScanProgress: (progress: ScanProgress | null) => void;
  setActiveVpc: (vpcId: string | null) => void;
}

export const useGraphStore = create<GraphState>((set) => ({
  graph: null,
  selectedNodeId: null,
  activeFolderId: null,
  filters: {},
  searchQuery: '',
  scanProgress: null,
  activeVpcId: null,

  setGraph: (graph) => set({ graph }),

  selectNode: (id) => set({ selectedNodeId: id, activeFolderId: null }),
  
  setActiveFolder: (id) => set({ activeFolderId: id, selectedNodeId: id }),

  updateFilters: (filters) => set({ filters }),

  setSearchQuery: (query) =>
    set((state) => ({
      searchQuery: query,
      filters: { ...state.filters, searchQuery: query },
    })),

  updateScanProgress: (progress) => set({ scanProgress: progress }),

  setActiveVpc: (vpcId) => set({ activeVpcId: vpcId, selectedNodeId: null, activeFolderId: null }),
}));
