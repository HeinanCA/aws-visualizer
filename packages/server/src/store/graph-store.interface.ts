import type { Graph, ScanResult } from '@aws-visualizer/shared';

export interface GraphStore {
  getLatestGraph(): Graph | null;
  getScanResult(scanId: string): ScanResult | null;
  saveScanResult(result: ScanResult): void;
}
