import type { Graph, ScanResult } from '@aws-visualizer/shared';
import type { GraphStore } from './graph-store.interface.js';

const MAX_STORED_SCANS = 10;

export class InMemoryGraphStore implements GraphStore {
  private scans: readonly ScanResult[] = [];

  getLatestGraph(): Graph | null {
    const latest = this.scans.at(-1);
    return latest?.graph ?? null;
  }

  getScanResult(scanId: string): ScanResult | null {
    return this.scans.find((s) => s.scanId === scanId) ?? null;
  }

  saveScanResult(result: ScanResult): void {
    const updated = [...this.scans, result];
    this.scans =
      updated.length > MAX_STORED_SCANS
        ? updated.slice(updated.length - MAX_STORED_SCANS)
        : updated;
  }
}
