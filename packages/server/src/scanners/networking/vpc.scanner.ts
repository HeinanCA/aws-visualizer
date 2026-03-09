import { type Vpc, paginateDescribeVpcs } from "@aws-sdk/client-ec2";
import {
  ResourceType,
  type GraphNode,
  createResource,
} from "@aws-visualizer/shared";
import { collectPages } from "../../aws/paginator.js";
import { extractTags } from "../scanner-utils.js";
import { handleAwsError } from "../../aws/error-handler.js";
import type {
  ScanContext,
  Scanner,
  ScannerOutput,
} from "../scanner.interface.js";

const SCANNER_ID = "networking:vpc";

export const vpcScanner: Scanner = {
  id: SCANNER_ID,
  resourceType: ResourceType.VPC,
  tier: 0,

  async scan(context: ScanContext): Promise<ScannerOutput> {
    const ec2 = context.clientFactory.getEC2(context.region);

    try {
      const vpcs = await collectPages(
        () => paginateDescribeVpcs({ client: ec2 }, {}),
        (page) => page.Vpcs,
      );

      const nodes: GraphNode[] = vpcs.map((vpc) =>
        mapVpcToNode(vpc, context.region),
      );
      context.onProgress(nodes.length);

      return { nodes, edges: [] };
    } catch (error) {
      throw handleAwsError(error, SCANNER_ID, ResourceType.VPC);
    }
  },
};

function mapVpcToNode(vpc: Vpc, region: string): GraphNode {
  const tags = extractTags(vpc.Tags);
  const accountId = vpc.OwnerId ?? "";

  return {
    id: vpc.VpcId ?? "",
    isGroup: true,
    resource: createResource({
      id: vpc.VpcId ?? "",
      arn: `arn:aws:ec2:${region}:${accountId}:vpc/${vpc.VpcId}`,
      type: ResourceType.VPC,
      region,
      accountId,
      tags,
      metadata: {
        cidrBlock: vpc.CidrBlock,
        isDefault: vpc.IsDefault,
        state: vpc.State,
        dhcpOptionsId: vpc.DhcpOptionsId,
      },
    }),
  };
}
