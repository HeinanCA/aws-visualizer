import {
  type InternetGateway,
  paginateDescribeInternetGateways,
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

const SCANNER_ID = "networking:igw";

export const internetGatewayScanner: Scanner = {
  id: SCANNER_ID,
  resourceType: ResourceType.INTERNET_GATEWAY,
  tier: 1,

  async scan(context: ScanContext): Promise<ScannerOutput> {
    const ec2 = context.clientFactory.getEC2(context.region);

    try {
      const igws = await collectPages(
        () => paginateDescribeInternetGateways({ client: ec2 }, {}),
        (page) => page.InternetGateways,
      );

      const nodes: GraphNode[] = igws.map((igw) =>
        mapIgwToNode(igw, context.region),
      );

      const edges: GraphEdge[] = igws.flatMap((igw) =>
        (igw.Attachments ?? [])
          .filter((a) => a.VpcId && String(a.State) === "available")
          .map((a) => ({
            id: `${igw.InternetGatewayId}-attached-${a.VpcId}`,
            source: igw.InternetGatewayId!,
            target: a.VpcId!,
            relationship: RelationshipType.ATTACHED_TO,
          })),
      );

      context.onProgress(nodes.length);
      return { nodes, edges };
    } catch (error) {
      throw handleAwsError(error, SCANNER_ID, ResourceType.INTERNET_GATEWAY);
    }
  },
};

function mapIgwToNode(igw: InternetGateway, region: string): GraphNode {
  const tags = extractTags(igw.Tags);
  const accountId = igw.OwnerId ?? "";

  return {
    id: igw.InternetGatewayId ?? "",
    isGroup: false,
    resource: createResource({
      id: igw.InternetGatewayId ?? "",
      arn: `arn:aws:ec2:${region}:${accountId}:internet-gateway/${igw.InternetGatewayId}`,
      type: ResourceType.INTERNET_GATEWAY,
      region,
      accountId,
      tags,
      metadata: {
        attachments: igw.Attachments?.map((a) => ({
          vpcId: a.VpcId,
          state: a.State,
        })),
      },
    }),
  };
}
