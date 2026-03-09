import {
  RESOURCE_TYPE_METADATA,
  type ResourceCategory,
  type ResourceType,
} from '../constants/resource-types.js';
import type { FilterCriteria } from '../models/filter.js';
import type { Graph, GraphEdge, GraphNode } from '../models/graph.js';

export function filterGraph(graph: Graph, criteria: FilterCriteria): Graph {
  const filteredNodes = graph.nodes.filter((node) =>
    matchesFilter(node, criteria),
  );
  const nodeIds = new Set(filteredNodes.map((n) => n.id));
  const filteredEdges = graph.edges.filter(
    (edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target),
  );

  return {
    ...graph,
    nodes: filteredNodes,
    edges: filteredEdges,
  };
}

function matchesFilter(node: GraphNode, criteria: FilterCriteria): boolean {
  const { resource } = node;

  if (criteria.resourceTypes?.length) {
    if (!criteria.resourceTypes.includes(resource.type)) return false;
  }

  if (criteria.categories?.length) {
    const meta = RESOURCE_TYPE_METADATA[resource.type];
    if (!criteria.categories.includes(meta.category)) return false;
  }

  if (criteria.regions?.length) {
    if (!criteria.regions.includes(resource.region)) return false;
  }

  if (criteria.vpcIds?.length) {
    const vpcId = resource.parentId ?? resource.id;
    if (!criteria.vpcIds.includes(vpcId)) return false;
  }

  if (criteria.searchQuery) {
    if (!matchesSearch(node, criteria.searchQuery)) return false;
  }

  return true;
}

function matchesSearch(node: GraphNode, query: string): boolean {
  const lowerQuery = query.toLowerCase();
  const { resource } = node;

  return (
    resource.id.toLowerCase().includes(lowerQuery) ||
    resource.name.toLowerCase().includes(lowerQuery) ||
    resource.arn.toLowerCase().includes(lowerQuery) ||
    Object.values(resource.tags).some((v) =>
      v.toLowerCase().includes(lowerQuery),
    )
  );
}

export function getNodesByType(
  graph: Graph,
  type: ResourceType,
): readonly GraphNode[] {
  return graph.nodes.filter((n) => n.resource.type === type);
}

export function getNodesByCategory(
  graph: Graph,
  category: ResourceCategory,
): readonly GraphNode[] {
  return graph.nodes.filter(
    (n) => RESOURCE_TYPE_METADATA[n.resource.type].category === category,
  );
}

export function getConnectedEdges(
  graph: Graph,
  nodeId: string,
): readonly GraphEdge[] {
  return graph.edges.filter(
    (e) => e.source === nodeId || e.target === nodeId,
  );
}

export function getChildNodes(
  graph: Graph,
  parentId: string,
): readonly GraphNode[] {
  return graph.nodes.filter((n) => n.resource.parentId === parentId);
}

export function getGraphStats(graph: Graph): {
  readonly totalNodes: number;
  readonly totalEdges: number;
  readonly byType: Readonly<Record<string, number>>;
  readonly byCategory: Readonly<Record<string, number>>;
} {
  const byType: Record<string, number> = {};
  const byCategory: Record<string, number> = {};

  for (const node of graph.nodes) {
    const type = node.resource.type;
    byType[type] = (byType[type] ?? 0) + 1;

    const category = RESOURCE_TYPE_METADATA[type].category;
    byCategory[category] = (byCategory[category] ?? 0) + 1;
  }

  return {
    totalNodes: graph.nodes.length,
    totalEdges: graph.edges.length,
    byType,
    byCategory,
  };
}
