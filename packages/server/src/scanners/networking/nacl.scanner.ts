import {
  type NetworkAcl,
  paginateDescribeNetworkAcls,
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

const SCANNER_ID = "networking:nacl";

export const naclScanner: Scanner = {
  id: SCANNER_ID,
  resourceType: ResourceType.NACL,
  tier: 1,

  async scan(context: ScanContext): Promise<ScannerOutput> {
    const ec2 = context.clientFactory.getEC2(context.region);

    try {
      const nacls = await collectPages(
        () => paginateDescribeNetworkAcls({ client: ec2 }, {}),
        (page) => page.NetworkAcls,
      );

      const nodes: GraphNode[] = nacls.map((n) =>
        mapNaclToNode(n, context.region),
      );

      const edges: GraphEdge[] = nacls.flatMap((nacl) => {
        const result: GraphEdge[] = [];
        if (nacl.VpcId) {
          result.push({
            id: `${nacl.VpcId}-contains-${nacl.NetworkAclId}`,
            source: nacl.VpcId,
            target: nacl.NetworkAclId!,
            relationship: RelationshipType.CONTAINS,
          });
        }
        for (const assoc of nacl.Associations ?? []) {
          if (assoc.SubnetId) {
            result.push({
              id: `${nacl.NetworkAclId}-attached-${assoc.SubnetId}`,
              source: nacl.NetworkAclId!,
              target: assoc.SubnetId,
              relationship: RelationshipType.ATTACHED_TO,
            });
          }
        }
        return result;
      });

      context.onProgress(nodes.length);
      return { nodes, edges };
    } catch (error) {
      throw handleAwsError(error, SCANNER_ID, ResourceType.NACL);
    }
  },
};

function mapNaclToNode(nacl: NetworkAcl, region: string): GraphNode {
  const tags = extractTags(nacl.Tags);
  const accountId = nacl.OwnerId ?? "";

  return {
    id: nacl.NetworkAclId ?? "",
    isGroup: false,
    resource: createResource({
      id: nacl.NetworkAclId ?? "",
      arn: `arn:aws:ec2:${region}:${accountId}:network-acl/${nacl.NetworkAclId}`,
      type: ResourceType.NACL,
      region,
      accountId,
      tags,
      parentId: nacl.VpcId,
      metadata: {
        isDefault: nacl.IsDefault,
        vpcId: nacl.VpcId,
        entryCount: nacl.Entries?.length ?? 0,
      },
    }),
  };
}
