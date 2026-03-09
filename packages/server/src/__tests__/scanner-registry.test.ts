import { describe, it, expect } from 'vitest';
import { ResourceType } from '@aws-visualizer/shared';
import { ScannerRegistry } from '../scanners/scanner-registry.js';
import type { Scanner, ScannerOutput } from '../scanners/scanner.interface.js';

function makeScanner(id: string, type: string, tier: number): Scanner {
  return {
    id,
    resourceType: type as any,
    tier,
    async scan(): Promise<ScannerOutput> {
      return { nodes: [], edges: [] };
    },
  };
}

describe('ScannerRegistry', () => {
  it('registers and retrieves scanners', () => {
    const registry = new ScannerRegistry();
    const scanner = makeScanner('test:vpc', ResourceType.VPC, 0);
    registry.register(scanner);

    expect(registry.getAll()).toHaveLength(1);
    expect(registry.getByResourceType(ResourceType.VPC)).toBe(scanner);
  });

  it('throws on duplicate registration', () => {
    const registry = new ScannerRegistry();
    const scanner = makeScanner('test:vpc', ResourceType.VPC, 0);
    registry.register(scanner);

    expect(() => registry.register(scanner)).toThrow(
      'Scanner already registered',
    );
  });

  it('groups scanners by tier', () => {
    const registry = new ScannerRegistry();
    registry.register(makeScanner('a', ResourceType.VPC, 0));
    registry.register(makeScanner('b', ResourceType.SUBNET, 1));
    registry.register(makeScanner('c', ResourceType.EC2_INSTANCE, 2));
    registry.register(makeScanner('d', ResourceType.IAM_ROLE, 0));

    expect(registry.getByTier(0)).toHaveLength(2);
    expect(registry.getByTier(1)).toHaveLength(1);
    expect(registry.getTiers()).toEqual([0, 1, 2]);
  });

  it('filters by resource types', () => {
    const registry = new ScannerRegistry();
    registry.register(makeScanner('a', ResourceType.VPC, 0));
    registry.register(makeScanner('b', ResourceType.SUBNET, 1));
    registry.register(makeScanner('c', ResourceType.EC2_INSTANCE, 2));

    const filtered = registry.filterByTypes([
      ResourceType.VPC,
      ResourceType.EC2_INSTANCE,
    ]);
    expect(filtered).toHaveLength(2);
  });
});
