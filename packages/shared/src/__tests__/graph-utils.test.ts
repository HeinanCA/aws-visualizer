import { describe, it, expect } from 'vitest';
import { ResourceType } from '../constants/resource-types.js';
import { RelationshipType } from '../constants/relationship-types.js';
import type { Graph, GraphNode, GraphEdge } from '../models/graph.js';
import { createEmptyGraph, mergeGraphs } from '../models/graph.js';
import {
  filterGraph,
  getNodesByType,
  getConnectedEdges,
  getChildNodes,
  getGraphStats,
} from '../utils/graph-utils.js';
import { createResource } from '../models/resource.js';

function makeNode(
  id: string,
  type: string,
  opts: { parentId?: string; name?: string; isGroup?: boolean } = {},
): GraphNode {
  return {
    id,
    isGroup: opts.isGroup ?? false,
    resource: createResource({
      id,
      arn: `arn:aws:ec2:us-east-1:123456:${type}/${id}`,
      type: type as any,
      region: 'us-east-1',
      accountId: '123456',
      tags: { Name: opts.name ?? id },
      metadata: {},
      parentId: opts.parentId,
    }),
  };
}

function makeEdge(
  source: string,
  target: string,
  relationship: string,
): GraphEdge {
  return {
    id: `${source}-${relationship}-${target}`,
    source,
    target,
    relationship: relationship as any,
  };
}

function makeTestGraph(): Graph {
  return {
    nodes: [
      makeNode('vpc-1', ResourceType.VPC, { isGroup: true }),
      makeNode('subnet-1', ResourceType.SUBNET, {
        parentId: 'vpc-1',
        isGroup: true,
      }),
      makeNode('subnet-2', ResourceType.SUBNET, {
        parentId: 'vpc-1',
        isGroup: true,
      }),
      makeNode('i-1', ResourceType.EC2_INSTANCE, { parentId: 'subnet-1' }),
      makeNode('sg-1', ResourceType.SECURITY_GROUP, { parentId: 'vpc-1' }),
    ],
    edges: [
      makeEdge('vpc-1', 'subnet-1', RelationshipType.CONTAINS),
      makeEdge('vpc-1', 'subnet-2', RelationshipType.CONTAINS),
      makeEdge('subnet-1', 'i-1', RelationshipType.CONTAINS),
      makeEdge('i-1', 'sg-1', RelationshipType.MEMBER_OF),
    ],
    scannedAt: '2026-01-01T00:00:00Z',
    regions: ['us-east-1'],
    scanDurationMs: 1000,
  };
}

describe('createEmptyGraph', () => {
  it('creates a graph with no nodes or edges', () => {
    const graph = createEmptyGraph(['us-east-1']);
    expect(graph.nodes).toEqual([]);
    expect(graph.edges).toEqual([]);
    expect(graph.regions).toEqual(['us-east-1']);
  });
});

describe('mergeGraphs', () => {
  it('combines nodes and edges from two graphs', () => {
    const a: Graph = {
      nodes: [makeNode('vpc-1', ResourceType.VPC)],
      edges: [],
      scannedAt: '2026-01-01T00:00:00Z',
      regions: ['us-east-1'],
      scanDurationMs: 100,
    };

    const b: Graph = {
      nodes: [makeNode('subnet-1', ResourceType.SUBNET)],
      edges: [makeEdge('vpc-1', 'subnet-1', RelationshipType.CONTAINS)],
      scannedAt: '2026-01-01T00:00:00Z',
      regions: ['us-west-2'],
      scanDurationMs: 200,
    };

    const merged = mergeGraphs(a, b);
    expect(merged.nodes).toHaveLength(2);
    expect(merged.edges).toHaveLength(1);
    expect(merged.regions).toContain('us-east-1');
    expect(merged.regions).toContain('us-west-2');
  });

  it('does not duplicate nodes with the same id', () => {
    const a: Graph = {
      nodes: [makeNode('vpc-1', ResourceType.VPC)],
      edges: [],
      scannedAt: '2026-01-01T00:00:00Z',
      regions: ['us-east-1'],
      scanDurationMs: 100,
    };

    const merged = mergeGraphs(a, a);
    expect(merged.nodes).toHaveLength(1);
  });
});

describe('filterGraph', () => {
  it('filters by resource type', () => {
    const graph = makeTestGraph();
    const filtered = filterGraph(graph, {
      resourceTypes: [ResourceType.SUBNET],
    });

    expect(filtered.nodes).toHaveLength(2);
    expect(filtered.nodes.every((n) => n.resource.type === ResourceType.SUBNET)).toBe(true);
    expect(filtered.edges).toHaveLength(0);
  });

  it('filters by search query', () => {
    const graph = makeTestGraph();
    const filtered = filterGraph(graph, { searchQuery: 'vpc-1' });

    expect(filtered.nodes).toHaveLength(1);
    expect(filtered.nodes[0]!.id).toBe('vpc-1');
  });

  it('keeps edges only between filtered nodes', () => {
    const graph = makeTestGraph();
    const filtered = filterGraph(graph, {
      resourceTypes: [ResourceType.VPC, ResourceType.SUBNET],
    });

    expect(filtered.nodes).toHaveLength(3);
    expect(filtered.edges).toHaveLength(2);
  });

  it('returns all nodes when filter is empty', () => {
    const graph = makeTestGraph();
    const filtered = filterGraph(graph, {});
    expect(filtered.nodes).toHaveLength(graph.nodes.length);
  });
});

describe('getNodesByType', () => {
  it('returns only nodes of the specified type', () => {
    const graph = makeTestGraph();
    const subnets = getNodesByType(graph, ResourceType.SUBNET);
    expect(subnets).toHaveLength(2);
  });
});

describe('getConnectedEdges', () => {
  it('returns edges connected to the specified node', () => {
    const graph = makeTestGraph();
    const edges = getConnectedEdges(graph, 'i-1');
    expect(edges).toHaveLength(2);
  });
});

describe('getChildNodes', () => {
  it('returns child nodes of a parent', () => {
    const graph = makeTestGraph();
    const children = getChildNodes(graph, 'vpc-1');
    expect(children).toHaveLength(3);
  });
});

describe('getGraphStats', () => {
  it('computes correct statistics', () => {
    const graph = makeTestGraph();
    const stats = getGraphStats(graph);

    expect(stats.totalNodes).toBe(5);
    expect(stats.totalEdges).toBe(4);
    expect(stats.byType[ResourceType.SUBNET]).toBe(2);
    expect(stats.byType[ResourceType.VPC]).toBe(1);
  });
});
