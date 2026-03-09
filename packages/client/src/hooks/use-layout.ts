import { useCallback, useEffect, useState } from 'react';
import type { Node, Edge } from '@xyflow/react';
import type { Graph, GraphNode, GraphEdge } from '@aws-visualizer/shared';
import { RESOURCE_TYPE_METADATA } from '@aws-visualizer/shared';

// ── Dimensions ──────────────────────────────────────────────
const RESOURCE_W = 160;
const RESOURCE_H = 140;
const RESOURCE_GAP = 40; // Massive gap for architectural clarity

const SUMMARY_W = 200;
const SUMMARY_H = 120;

const SUBNET_HEADER = 80; // Taller header for new GroupNode style
const SUBNET_PAD = 48;    // Massive internal padding
const SUBNET_GAP = 80;    // Massive gap between subnets
const SUBNET_COLS = 2;    // Fewer cols = more vertical (cleaner) flow

const VPC_HEADER = 100;
const VPC_PAD = 80;
const SUMMARY_GAP = 60;

const SUMMARY_PREFIX = '__summary_';
const SUMMARY_DELIMITER = ':::';
const COLLAPSE_THRESHOLD = 5; // Reduced threshold to make folders more common and useful

export function useLayout(graph: Graph | null) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isLayouting, setIsLayouting] = useState(false);

  const computeLayout = useCallback((g: Graph) => {
    setIsLayouting(true);
    try {
      const result = computeManualLayout(g);
      setNodes(result.nodes);
      setEdges(result.edges);
    } catch (error) {
      console.error('Layout failed:', error);
      setNodes(buildFallbackNodes(g));
      setEdges(buildFlowEdges(g.edges));
    } finally {
      setIsLayouting(false);
    }
  }, []);

  useEffect(() => {
    if (graph && graph.nodes.length > 0) {
      computeLayout(graph);
    } else {
      setNodes([]);
      setEdges([]);
    }
  }, [graph, computeLayout]);

  return { nodes, edges, isLayouting };
}

// ── Manual grid layout ──────────────────────────────────────

interface LayoutResult {
  readonly nodes: Node[];
  readonly edges: Edge[];
}

function computeManualLayout(graph: Graph): LayoutResult {
  const nodeById = new Map(graph.nodes.map((n) => [n.id, n]));

  // Build parent→children map
  const childrenOf = new Map<string, GraphNode[]>();
  for (const n of graph.nodes) {
    if (n.resource.parentId && nodeById.has(n.resource.parentId)) {
      const siblings = childrenOf.get(n.resource.parentId) ?? [];
      siblings.push(n);
      childrenOf.set(n.resource.parentId, siblings);
    }
  }

  const flowNodes: Node[] = [];
  const removedIds = new Set<string>();

  // Find VPC nodes
  const vpcs = graph.nodes.filter((n) => n.resource.type === 'vpc');

  for (const vpc of vpcs) {
    const vpcChildren = childrenOf.get(vpc.id) ?? [];

    // Categorize VPC children
    const subnetsWithContent: GraphNode[] = [];
    const emptySubnets: GraphNode[] = [];
    const leafByType = new Map<string, GraphNode[]>();

    for (const child of vpcChildren) {
      const grandchildren = childrenOf.get(child.id) ?? [];
      if (child.resource.type === 'subnet') {
        if (grandchildren.length > 0) {
          subnetsWithContent.push(child);
        } else {
          emptySubnets.push(child);
        }
      } else if (grandchildren.length === 0) {
        const arr = leafByType.get(child.resource.type) ?? [];
        arr.push(child);
        leafByType.set(child.resource.type, arr);
      } else {
        // Non-subnet container (rare) — treat as subnet-like
        subnetsWithContent.push(child);
      }
    }

    // Create summary cards for collapsed groups
    const summaryCards: GraphNode[] = [];

    // Collapse leaf types with >= COLLAPSE_THRESHOLD
    for (const [type, members] of leafByType) {
      if (members.length >= COLLAPSE_THRESHOLD) {
        const meta = (RESOURCE_TYPE_METADATA as Record<string, { label: string }>)[type];
        const summaryId = `${SUMMARY_PREFIX}${vpc.id}${SUMMARY_DELIMITER}${type}`;
        summaryCards.push({
          id: summaryId,
          resource: {
            id: summaryId,
            type: type as import('@aws-visualizer/shared').ResourceType,
            name: meta?.label ?? type,
            arn: '', region: '', accountId: '',
            parentId: vpc.id,
            metadata: { isSummaryCard: true, memberCount: members.length },
            tags: {},
          },
          isGroup: false,
        });
        for (const m of members) removedIds.add(m.id);
      }
    }

    // Collapse empty subnets into summary
    if (emptySubnets.length > 0) {
      const summaryId = `${SUMMARY_PREFIX}${vpc.id}${SUMMARY_DELIMITER}empty_subnets`;
      summaryCards.push({
        id: summaryId,
        resource: {
          id: summaryId,
          type: 'subnet' as import('@aws-visualizer/shared').ResourceType,
          name: 'Empty Subnets',
          arn: '', region: '', accountId: '',
          parentId: vpc.id,
          metadata: { isSummaryCard: true, memberCount: emptySubnets.length },
          tags: {},
        },
        isGroup: false,
      });
      for (const s of emptySubnets) removedIds.add(s.id);
    }

    // Keep individual leaves that are below threshold
    const keptLeaves: GraphNode[] = [];
    for (const [, members] of leafByType) {
      if (members.length < COLLAPSE_THRESHOLD) {
        keptLeaves.push(...members);
      }
    }

    // ── Compute subnet sizes ──────────────────────────────
    const subnetSizes = new Map<string, { w: number; h: number; childCols: number }>();
    for (const subnet of subnetsWithContent) {
      const children = childrenOf.get(subnet.id) ?? [];
      const count = children.length;
      const cols = Math.min(count, 4); // max 4 resources per row inside subnet
      const rows = Math.ceil(count / cols);
      const w = SUBNET_PAD * 2 + cols * RESOURCE_W + Math.max(0, cols - 1) * RESOURCE_GAP;
      const h = SUBNET_HEADER + SUBNET_PAD + rows * RESOURCE_H + Math.max(0, rows - 1) * RESOURCE_GAP + SUBNET_PAD;
      subnetSizes.set(subnet.id, { w, h, childCols: cols });
    }

    // ── Arrange subnets in grid ───────────────────────────
    // Sort subnets: largest first for better packing
    const sortedSubnets = [...subnetsWithContent].sort((a, b) => {
      const sa = subnetSizes.get(a.id)!;
      const sb = subnetSizes.get(b.id)!;
      return (sb.w * sb.h) - (sa.w * sa.h);
    });

    const cols = Math.min(sortedSubnets.length, SUBNET_COLS);
    const colWidths: number[] = new Array(cols).fill(0);
    const subnetPositions = new Map<string, { x: number; y: number }>();

    // Assign subnets to columns (shortest column first)
    const colHeights: number[] = new Array(cols).fill(0);
    const colAssignments: GraphNode[][] = new Array(cols).fill(null).map(() => []);

    for (const subnet of sortedSubnets) {
      // Find shortest column
      let minCol = 0;
      for (let c = 1; c < cols; c++) {
        if (colHeights[c] < colHeights[minCol]) minCol = c;
      }
      colAssignments[minCol].push(subnet);
      const size = subnetSizes.get(subnet.id)!;
      colWidths[minCol] = Math.max(colWidths[minCol], size.w);
      colHeights[minCol] += size.h + SUBNET_GAP;
    }

    // Calculate x offsets for each column
    const colX: number[] = [];
    let cx = VPC_PAD;
    for (let c = 0; c < cols; c++) {
      colX.push(cx);
      cx += colWidths[c] + SUBNET_GAP;
    }

    // Position subnets within their columns
    for (let c = 0; c < cols; c++) {
      let cy = VPC_HEADER + VPC_PAD;
      for (const subnet of colAssignments[c]) {
        subnetPositions.set(subnet.id, { x: colX[c], y: cy });
        const size = subnetSizes.get(subnet.id)!;
        cy += size.h + SUBNET_GAP;
      }
    }

    const subnetsHeight = Math.max(...colHeights) + VPC_HEADER + VPC_PAD;
    const subnetsWidth = cx - SUBNET_GAP + VPC_PAD;

    // ── Arrange summary cards + kept leaves in a row ──────
    const bottomItems = [...summaryCards, ...keptLeaves];
    let bx = VPC_PAD;
    const by = subnetsHeight + SUMMARY_GAP;
    const bottomPositions = new Map<string, { x: number; y: number }>();

    for (const item of bottomItems) {
      const w = summaryCards.includes(item) ? SUMMARY_W : RESOURCE_W;
      bottomPositions.set(item.id, { x: bx, y: by });
      bx += w + SUMMARY_GAP;
    }

    const bottomWidth = bx - SUMMARY_GAP + VPC_PAD;
    const bottomHeight = bottomItems.length > 0 ? SUMMARY_H + VPC_PAD : 0;

    // ── VPC container size ────────────────────────────────
    const vpcW = Math.max(subnetsWidth, bottomWidth, 400);
    const vpcH = subnetsHeight + (bottomItems.length > 0 ? SUMMARY_GAP + bottomHeight : 0) + VPC_PAD;

    // ── Create flow nodes ─────────────────────────────────

    // VPC node
    flowNodes.push({
      id: vpc.id,
      position: { x: 0, y: 0 },
      data: { resource: vpc.resource, isGroup: true },
      type: 'groupNode',
      style: { width: vpcW, height: vpcH },
    });

    // Subnet containers
    for (const subnet of subnetsWithContent) {
      const pos = subnetPositions.get(subnet.id)!;
      const size = subnetSizes.get(subnet.id)!;
      flowNodes.push({
        id: subnet.id,
        position: pos,
        data: { resource: subnet.resource, isGroup: true },
        type: 'groupNode',
        parentId: vpc.id,
        extent: 'parent' as const,
        style: { width: size.w, height: size.h },
      });

      // Resources inside subnet
      const children = childrenOf.get(subnet.id) ?? [];
      children.forEach((child, i) => {
        const col = i % size.childCols;
        const row = Math.floor(i / size.childCols);
        flowNodes.push({
          id: child.id,
          position: {
            x: SUBNET_PAD + col * (RESOURCE_W + RESOURCE_GAP),
            y: SUBNET_HEADER + SUBNET_PAD + row * (RESOURCE_H + RESOURCE_GAP),
          },
          data: { resource: child.resource, isGroup: false },
          type: 'resourceNode',
          parentId: subnet.id,
          extent: 'parent' as const,
        });
      });
    }

    // Summary cards
    for (const card of summaryCards) {
      const pos = bottomPositions.get(card.id)!;
      flowNodes.push({
        id: card.id,
        position: pos,
        data: { resource: card.resource, isSummaryCard: true },
        type: 'summaryNode',
        parentId: vpc.id,
        extent: 'parent' as const,
      });
    }

    // Kept individual leaves
    for (const leaf of keptLeaves) {
      const pos = bottomPositions.get(leaf.id)!;
      flowNodes.push({
        id: leaf.id,
        position: pos,
        data: { resource: leaf.resource, isGroup: false },
        type: 'resourceNode',
        parentId: vpc.id,
        extent: 'parent' as const,
      });
    }
  }

  // Handle orphan nodes (no VPC parent) — shouldn't happen in VPC drill-in
  const vpcIds = new Set(vpcs.map((v) => v.id));
  const handledIds = new Set(flowNodes.map((n) => n.id));
  const orphans = graph.nodes.filter(
    (n) => !handledIds.has(n.id) && !removedIds.has(n.id) && !vpcIds.has(n.resource.parentId ?? ''),
  );
  let ox = 0;
  for (const orphan of orphans) {
    flowNodes.push({
      id: orphan.id,
      position: { x: ox, y: -100 },
      data: { resource: orphan.resource, isGroup: false },
      type: 'resourceNode',
    });
    ox += RESOURCE_W + RESOURCE_GAP;
  }

  // Sort: parents before children (React Flow requirement)
  const parentOrder = new Map<string, number>();
  flowNodes.forEach((n, i) => {
    if (!n.parentId) parentOrder.set(n.id, 0);
  });
  flowNodes.forEach((n) => {
    if (n.parentId && parentOrder.has(n.parentId)) {
      parentOrder.set(n.id, (parentOrder.get(n.parentId) ?? 0) + 1);
    }
  });
  flowNodes.forEach((n) => {
    if (n.parentId && !parentOrder.has(n.id)) {
      parentOrder.set(n.id, (parentOrder.get(n.parentId ?? '') ?? 0) + 1);
    }
  });
  flowNodes.sort((a, b) => (parentOrder.get(a.id) ?? 99) - (parentOrder.get(b.id) ?? 99));

  // Build edges, excluding removed nodes
  const validEdges = graph.edges.filter(
    (e) => !removedIds.has(e.source) && !removedIds.has(e.target),
  );

  return { nodes: flowNodes, edges: buildFlowEdges(validEdges) };
}

function buildFlowEdges(graphEdges: readonly GraphEdge[]): Edge[] {
  return graphEdges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    type: 'animated',
    // Remove static arrows for a cleaner admin view
    data: {
      relationship: e.label,
      animated: true,
    },
  }));
}

function buildFallbackNodes(graph: Graph): Node[] {
  const cols = Math.ceil(Math.sqrt(graph.nodes.length));
  return graph.nodes.map((gn, i) => ({
    id: gn.id,
    position: { x: (i % cols) * 120, y: Math.floor(i / cols) * 100 },
    data: { resource: gn.resource, isGroup: gn.isGroup },
    type: gn.isGroup ? 'groupNode' : 'resourceNode',
  }));
}
