import {
  type RouteTable,
  paginateDescribeRouteTables,
} from "@aws-sdk/client-ec2";
import {
  ResourceType,
  RelationshipType,
  type GraphNode,
  type GraphEdge,
  createResource,
} from "@aws-visualizer/shared";
import { collectPages } from "../../aws/paginator.js";
import { handleAwsError } from "../../aws/error-handler.js";
import { extractTags } from "../scanner-utils.js";
import type {
  ScanContext,
  Scanner,
  ScannerOutput,
} from "../scanner.interface.js";

const SCANNER_ID = "networking:route-table";

export const routeTableScanner: Scanner = {
  id: SCANNER_ID,
  resourceType: ResourceType.ROUTE_TABLE,
  tier: 1,

  async scan(context: ScanContext): Promise<ScannerOutput> {
    const ec2 = context.clientFactory.getEC2(context.region);

    try {
      const routeTables = await collectPages(
        () => paginateDescribeRouteTables({ client: ec2 }, {}),
        (page) => page.RouteTables,
      );

      const nodes: GraphNode[] = routeTables.map((rt) =>
        mapRouteTableToNode(rt, context.region),
      );

      const edges: GraphEdge[] = routeTables.flatMap((rt) => buildEdges(rt));

      context.onProgress(nodes.length);
      return { nodes, edges };
    } catch (error) {
      throw handleAwsError(error, SCANNER_ID, ResourceType.ROUTE_TABLE);
    }
  },
};

function buildEdges(rt: RouteTable): GraphEdge[] {
  const edges: GraphEdge[] = [];
  const rtId = rt.RouteTableId!;

  if (rt.VpcId) {
    edges.push({
      id: `${rt.VpcId}-contains-${rtId}`,
      source: rt.VpcId,
      target: rtId,
      relationship: RelationshipType.CONTAINS,
    });
  }

  for (const assoc of rt.Associations ?? []) {
    if (assoc.SubnetId) {
      edges.push({
        id: `${rtId}-attached-${assoc.SubnetId}`,
        source: rtId,
        target: assoc.SubnetId,
        relationship: RelationshipType.ATTACHED_TO,
      });
    }
  }

  for (const route of rt.Routes ?? []) {
    if (route.GatewayId && route.GatewayId !== "local") {
      edges.push({
        id: `${rtId}-routes-${route.GatewayId}`,
        source: rtId,
        target: route.GatewayId,
        relationship: RelationshipType.ROUTES_TO,
        label: route.DestinationCidrBlock,
      });
    }
    if (route.NatGatewayId) {
      edges.push({
        id: `${rtId}-routes-${route.NatGatewayId}`,
        source: rtId,
        target: route.NatGatewayId,
        relationship: RelationshipType.ROUTES_TO,
        label: route.DestinationCidrBlock,
      });
    }
  }

  return edges;
}

function mapRouteTableToNode(rt: RouteTable, region: string): GraphNode {
  const tags = extractTags(rt.Tags);
  const accountId = rt.OwnerId ?? "";

  return {
    id: rt.RouteTableId ?? "",
    isGroup: false,
    resource: createResource({
      id: rt.RouteTableId ?? "",
      arn: `arn:aws:ec2:${region}:${accountId}:route-table/${rt.RouteTableId}`,
      type: ResourceType.ROUTE_TABLE,
      region,
      accountId,
      tags,
      parentId: rt.VpcId,
      metadata: {
        vpcId: rt.VpcId,
        routeCount: rt.Routes?.length ?? 0,
        associationCount: rt.Associations?.length ?? 0,
      },
    }),
  };
}
