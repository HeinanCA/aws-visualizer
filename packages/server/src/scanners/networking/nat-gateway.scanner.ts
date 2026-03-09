import {
  type NatGateway,
  paginateDescribeNatGateways,
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

const SCANNER_ID = "networking:nat-gw";

export const natGatewayScanner: Scanner = {
  id: SCANNER_ID,
  resourceType: ResourceType.NAT_GATEWAY,
  tier: 1,

  async scan(context: ScanContext): Promise<ScannerOutput> {
    const ec2 = context.clientFactory.getEC2(context.region);

    try {
      const natGws = await collectPages(
        () => paginateDescribeNatGateways({ client: ec2 }, {}),
        (page) => page.NatGateways,
      );

      const nodes: GraphNode[] = natGws.map((gw) =>
        mapNatGwToNode(gw, context.region),
      );

      const edges: GraphEdge[] = natGws
        .filter((gw) => gw.SubnetId)
        .map((gw) => ({
          id: `${gw.SubnetId}-contains-${gw.NatGatewayId}`,
          source: gw.SubnetId!,
          target: gw.NatGatewayId!,
          relationship: RelationshipType.CONTAINS,
        }));

      context.onProgress(nodes.length);
      return { nodes, edges };
    } catch (error) {
      throw handleAwsError(error, SCANNER_ID, ResourceType.NAT_GATEWAY);
    }
  },
};

function mapNatGwToNode(gw: NatGateway, region: string): GraphNode {
  const tags = extractTags(gw.Tags);

  return {
    id: gw.NatGatewayId ?? "",
    isGroup: false,
    resource: createResource({
      id: gw.NatGatewayId ?? "",
      arn: `arn:aws:ec2:${region}::natgateway/${gw.NatGatewayId}`,
      type: ResourceType.NAT_GATEWAY,
      region,
      accountId: "",
      tags,
      parentId: gw.SubnetId,
      metadata: {
        state: gw.State,
        connectivityType: gw.ConnectivityType,
        publicIp: gw.NatGatewayAddresses?.[0]?.PublicIp,
        subnetId: gw.SubnetId,
        vpcId: gw.VpcId,
      },
    }),
  };
}
