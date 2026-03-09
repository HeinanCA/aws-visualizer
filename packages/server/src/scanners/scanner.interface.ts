import type {
  GraphEdge,
  GraphNode,
  ResourceType,
} from "@aws-visualizer/shared";
import type { AWSClientFactory } from "../aws/client-factory.js";

export interface ScanContext {
  readonly region: string;
  readonly clientFactory: AWSClientFactory;
  readonly signal: globalThis.AbortSignal;
  readonly onProgress: (count: number) => void;
}

export interface ScannerOutput {
  readonly nodes: readonly GraphNode[];
  readonly edges: readonly GraphEdge[];
}

export interface Scanner {
  readonly id: string;
  readonly resourceType: ResourceType;
  readonly tier: number;
  scan(context: ScanContext): Promise<ScannerOutput>;
}
