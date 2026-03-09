import { describe, it, expect } from 'vitest';
import type { ScanResult } from '@aws-visualizer/shared';
import { createEmptyGraph } from '@aws-visualizer/shared';
import { InMemoryGraphStore } from '../store/in-memory-graph-store.js';

function makeScanResult(scanId: string): ScanResult {
  return {
    scanId,
    graph: createEmptyGraph(['us-east-1']),
    errors: [],
  };
}

describe('InMemoryGraphStore', () => {
  it('returns null when no scans exist', () => {
    const store = new InMemoryGraphStore();
    expect(store.getLatestGraph()).toBeNull();
    expect(store.getScanResult('nonexistent')).toBeNull();
  });

  it('stores and retrieves scan results', () => {
    const store = new InMemoryGraphStore();
    const result = makeScanResult('scan-1');
    store.saveScanResult(result);

    expect(store.getScanResult('scan-1')).toBe(result);
    expect(store.getLatestGraph()).toBe(result.graph);
  });

  it('returns the latest graph', () => {
    const store = new InMemoryGraphStore();
    store.saveScanResult(makeScanResult('scan-1'));
    store.saveScanResult(makeScanResult('scan-2'));

    expect(store.getLatestGraph()).toBe(
      store.getScanResult('scan-2')!.graph,
    );
  });

  it('limits stored scans to 10', () => {
    const store = new InMemoryGraphStore();
    for (let i = 0; i < 15; i++) {
      store.saveScanResult(makeScanResult(`scan-${i}`));
    }

    expect(store.getScanResult('scan-0')).toBeNull();
    expect(store.getScanResult('scan-14')).not.toBeNull();
  });
});
