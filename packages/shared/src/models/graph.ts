import type { RelationshipType } from '../constants/relationship-types.js';
import type { AWSResource } from './resource.js';

export interface GraphNode {
  readonly id: string;
  readonly resource: AWSResource;
  readonly isGroup: boolean;
}

export interface GraphEdge {
  readonly id: string;
  readonly source: string;
  readonly target: string;
  readonly relationship: RelationshipType;
  readonly label?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface Graph {
  readonly nodes: readonly GraphNode[];
  readonly edges: readonly GraphEdge[];
  readonly scannedAt: string;
  readonly regions: readonly string[];
  readonly scanDurationMs: number;
}

export function createEmptyGraph(regions: readonly string[]): Graph {
  return {
    nodes: [],
    edges: [],
    scannedAt: new Date().toISOString(),
    regions,
    scanDurationMs: 0,
  };
}

export function mergeGraphs(a: Graph, b: Graph): Graph {
  const existingNodeIds = new Set(a.nodes.map((n) => n.id));
  const existingEdgeIds = new Set(a.edges.map((e) => e.id));

  const newNodes = b.nodes.filter((n) => !existingNodeIds.has(n.id));
  const newEdges = b.edges.filter((e) => !existingEdgeIds.has(e.id));

  return {
    nodes: [...a.nodes, ...newNodes],
    edges: [...a.edges, ...newEdges],
    scannedAt: a.scannedAt,
    regions: [...new Set([...a.regions, ...b.regions])],
    scanDurationMs: Math.max(a.scanDurationMs, b.scanDurationMs),
  };
}
