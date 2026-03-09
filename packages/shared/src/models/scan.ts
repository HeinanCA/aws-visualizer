import type { ResourceType } from '../constants/resource-types.js';
import type { Graph } from './graph.js';

export const ScanStatus = {
  PENDING: 'pending',
  SCANNING: 'scanning',
  COMPLETED: 'completed',
  FAILED: 'failed',
  PARTIAL: 'partial',
} as const;

export type ScanStatus = (typeof ScanStatus)[keyof typeof ScanStatus];

export interface ScanRequest {
  readonly regions: readonly string[];
  readonly resourceTypes?: readonly ResourceType[];
}

export interface ScannerProgress {
  readonly scannerId: string;
  readonly resourceType: ResourceType;
  readonly status: ScanStatus;
  readonly discovered: number;
  readonly error?: string;
}

export interface ScanProgress {
  readonly scanId: string;
  readonly status: ScanStatus;
  readonly scanners: readonly ScannerProgress[];
  readonly totalDiscovered: number;
  readonly elapsedMs: number;
}

export interface ScanError {
  readonly scannerId: string;
  readonly resourceType: ResourceType;
  readonly message: string;
  readonly code?: string;
}

export interface ScanResult {
  readonly scanId: string;
  readonly graph: Graph;
  readonly errors: readonly ScanError[];
}
