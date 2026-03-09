import {
  type VpcPeeringConnection,
  paginateDescribeVpcPeeringConnections,
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

const SCANNER_ID = "networking:vpc-peering";

export const vpcPeeringScanner: Scanner = {
  id: SCANNER_ID,
  resourceType: ResourceType.VPC_PEERING,
  tier: 1,

  async scan(context: ScanContext): Promise<ScannerOutput> {
    const ec2 = context.clientFactory.getEC2(context.region);

    try {
      const peerings = await collectPages(
        () => paginateDescribeVpcPeeringConnections({ client: ec2 }, {}),
        (page) => page.VpcPeeringConnections,
      );

      const active = peerings.filter((p) => p.Status?.Code === "active");

      const nodes: GraphNode[] = active.map((p) =>
        mapPeeringToNode(p, context.region),
      );

      const edges: GraphEdge[] = active.flatMap((p) => {
        const result: GraphEdge[] = [];
        if (p.RequesterVpcInfo?.VpcId) {
          result.push({
            id: `${p.VpcPeeringConnectionId}-peers-${p.RequesterVpcInfo.VpcId}`,
            source: p.VpcPeeringConnectionId!,
            target: p.RequesterVpcInfo.VpcId,
            relationship: RelationshipType.PEERS_WITH,
          });
        }
        if (p.AccepterVpcInfo?.VpcId) {
          result.push({
            id: `${p.VpcPeeringConnectionId}-peers-${p.AccepterVpcInfo.VpcId}`,
            source: p.VpcPeeringConnectionId!,
            target: p.AccepterVpcInfo.VpcId,
            relationship: RelationshipType.PEERS_WITH,
          });
        }
        return result;
      });

      context.onProgress(nodes.length);
      return { nodes, edges };
    } catch (error) {
      throw handleAwsError(error, SCANNER_ID, ResourceType.VPC_PEERING);
    }
  },
};

function mapPeeringToNode(p: VpcPeeringConnection, region: string): GraphNode {
  const tags = extractTags(p.Tags);

  return {
    id: p.VpcPeeringConnectionId ?? "",
    isGroup: false,
    resource: createResource({
      id: p.VpcPeeringConnectionId ?? "",
      arn: `arn:aws:ec2:${region}::vpc-peering-connection/${p.VpcPeeringConnectionId}`,
      type: ResourceType.VPC_PEERING,
      region,
      accountId: "",
      tags,
      metadata: {
        requesterVpcId: p.RequesterVpcInfo?.VpcId,
        requesterCidr: p.RequesterVpcInfo?.CidrBlock,
        accepterVpcId: p.AccepterVpcInfo?.VpcId,
        accepterCidr: p.AccepterVpcInfo?.CidrBlock,
        status: p.Status?.Code,
      },
    }),
  };
}
