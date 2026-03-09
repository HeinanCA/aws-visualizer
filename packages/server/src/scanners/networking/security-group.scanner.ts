import {
  type SecurityGroup,
  paginateDescribeSecurityGroups,
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

const SCANNER_ID = "networking:security-group";

export const securityGroupScanner: Scanner = {
  id: SCANNER_ID,
  resourceType: ResourceType.SECURITY_GROUP,
  tier: 1,

  async scan(context: ScanContext): Promise<ScannerOutput> {
    const ec2 = context.clientFactory.getEC2(context.region);

    try {
      const sgs = await collectPages(
        () => paginateDescribeSecurityGroups({ client: ec2 }, {}),
        (page) => page.SecurityGroups,
      );

      const nodes: GraphNode[] = sgs.map((sg) =>
        mapSgToNode(sg, context.region),
      );

      const edges: GraphEdge[] = [
        ...buildVpcEdges(sgs),
        ...buildSgReferenceEdges(sgs),
      ];

      context.onProgress(nodes.length);
      return { nodes, edges };
    } catch (error) {
      throw handleAwsError(error, SCANNER_ID, ResourceType.SECURITY_GROUP);
    }
  },
};

function buildVpcEdges(sgs: readonly SecurityGroup[]): GraphEdge[] {
  return sgs
    .filter((sg) => sg.VpcId && sg.GroupId)
    .map((sg) => ({
      id: `${sg.VpcId}-contains-${sg.GroupId}`,
      source: sg.VpcId!,
      target: sg.GroupId!,
      relationship: RelationshipType.CONTAINS,
    }));
}

function buildSgReferenceEdges(sgs: readonly SecurityGroup[]): GraphEdge[] {
  const sgIds = new Set(sgs.map((sg) => sg.GroupId));

  return sgs.flatMap((sg) => {
    const ingressRefs = (sg.IpPermissions ?? []).flatMap((perm) =>
      (perm.UserIdGroupPairs ?? [])
        .filter((pair) => pair.GroupId && sgIds.has(pair.GroupId))
        .map((pair) => ({
          id: `${pair.GroupId}-allows-${sg.GroupId}`,
          source: pair.GroupId!,
          target: sg.GroupId!,
          relationship: RelationshipType.MEMBER_OF,
          label: `port ${perm.FromPort ?? "*"}`,
        })),
    );
    return ingressRefs;
  });
}

function mapSgToNode(sg: SecurityGroup, region: string): GraphNode {
  const tags = extractTags(sg.Tags);
  const accountId = sg.OwnerId ?? "";

  return {
    id: sg.GroupId ?? "",
    isGroup: false,
    resource: createResource({
      id: sg.GroupId ?? "",
      arn: `arn:aws:ec2:${region}:${accountId}:security-group/${sg.GroupId}`,
      type: ResourceType.SECURITY_GROUP,
      name: sg.GroupName,
      region,
      accountId,
      tags,
      parentId: sg.VpcId,
      metadata: {
        groupName: sg.GroupName,
        description: sg.Description,
        vpcId: sg.VpcId,
        ingressRuleCount: sg.IpPermissions?.length ?? 0,
        egressRuleCount: sg.IpPermissionsEgress?.length ?? 0,
      },
    }),
  };
}
