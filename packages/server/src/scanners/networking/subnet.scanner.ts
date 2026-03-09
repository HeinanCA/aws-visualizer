import { type Subnet, paginateDescribeSubnets } from "@aws-sdk/client-ec2";
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

const SCANNER_ID = "networking:subnet";

export const subnetScanner: Scanner = {
  id: SCANNER_ID,
  resourceType: ResourceType.SUBNET,
  tier: 1,

  async scan(context: ScanContext): Promise<ScannerOutput> {
    const ec2 = context.clientFactory.getEC2(context.region);

    try {
      const subnets = await collectPages(
        () => paginateDescribeSubnets({ client: ec2 }, {}),
        (page) => page.Subnets,
      );

      const nodes: GraphNode[] = subnets.map((s) =>
        mapSubnetToNode(s, context.region),
      );

      const edges: GraphEdge[] = subnets
        .filter((s) => s.VpcId)
        .map((s) => ({
          id: `${s.VpcId}-contains-${s.SubnetId}`,
          source: s.VpcId!,
          target: s.SubnetId!,
          relationship: RelationshipType.CONTAINS,
        }));

      context.onProgress(nodes.length);
      return { nodes, edges };
    } catch (error) {
      throw handleAwsError(error, SCANNER_ID, ResourceType.SUBNET);
    }
  },
};

function mapSubnetToNode(subnet: Subnet, region: string): GraphNode {
  const tags = extractTags(subnet.Tags);
  const accountId = subnet.OwnerId ?? "";
  const isPublic = subnet.MapPublicIpOnLaunch ?? false;

  return {
    id: subnet.SubnetId ?? "",
    isGroup: true,
    resource: createResource({
      id: subnet.SubnetId ?? "",
      arn: `arn:aws:ec2:${region}:${accountId}:subnet/${subnet.SubnetId}`,
      type: ResourceType.SUBNET,
      region,
      accountId,
      tags,
      parentId: subnet.VpcId,
      metadata: {
        cidrBlock: subnet.CidrBlock,
        availabilityZone: subnet.AvailabilityZone,
        isPublic,
        availableIpCount: subnet.AvailableIpAddressCount,
        state: subnet.State,
      },
    }),
  };
}
