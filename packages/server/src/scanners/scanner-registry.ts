import type { ResourceType } from '@aws-visualizer/shared';
import type { Scanner } from './scanner.interface.js';

export class ScannerRegistry {
  private readonly scanners = new Map<string, Scanner>();

  register(scanner: Scanner): void {
    if (this.scanners.has(scanner.id)) {
      throw new Error(`Scanner already registered: ${scanner.id}`);
    }
    this.scanners.set(scanner.id, scanner);
  }

  getAll(): readonly Scanner[] {
    return [...this.scanners.values()];
  }

  getByTier(tier: number): readonly Scanner[] {
    return [...this.scanners.values()].filter((s) => s.tier === tier);
  }

  getByResourceType(type: ResourceType): Scanner | undefined {
    return [...this.scanners.values()].find((s) => s.resourceType === type);
  }

  getTiers(): readonly number[] {
    const tiers = new Set([...this.scanners.values()].map((s) => s.tier));
    return [...tiers].sort((a, b) => a - b);
  }

  filterByTypes(types: readonly ResourceType[]): readonly Scanner[] {
    const typeSet = new Set(types);
    return [...this.scanners.values()].filter((s) =>
      typeSet.has(s.resourceType),
    );
  }
}
