import { DescribeAddressesCommand, type Address } from "@aws-sdk/client-ec2";
import {
  ResourceType,
  RelationshipType,
  type GraphNode,
  type GraphEdge,
  createResource,
} from "@aws-visualizer/shared";
import { handleAwsError } from "../../aws/error-handler.js";
import { extractTags } from "../scanner-utils.js";
import type {
  ScanContext,
  Scanner,
  ScannerOutput,
} from "../scanner.interface.js";

const SCANNER_ID = "networking:elastic-ip";

export const elasticIpScanner: Scanner = {
  id: SCANNER_ID,
  resourceType: ResourceType.ELASTIC_IP,
  tier: 1,

  async scan(context: ScanContext): Promise<ScannerOutput> {
    const ec2 = context.clientFactory.getEC2(context.region);

    try {
      const response = await ec2.send(new DescribeAddressesCommand({}));
      const addresses = response.Addresses ?? [];

      const nodes: GraphNode[] = addresses.map((a) =>
        mapEipToNode(a, context.region),
      );

      const edges: GraphEdge[] = addresses
        .filter((a) => a.InstanceId)
        .map((a) => ({
          id: `${a.AllocationId}-attached-${a.InstanceId}`,
          source: a.AllocationId!,
          target: a.InstanceId!,
          relationship: RelationshipType.ATTACHED_TO,
        }));

      context.onProgress(nodes.length);
      return { nodes, edges };
    } catch (error) {
      throw handleAwsError(error, SCANNER_ID, ResourceType.ELASTIC_IP);
    }
  },
};

function mapEipToNode(address: Address, region: string): GraphNode {
  const tags = extractTags(address.Tags);

  return {
    id: address.AllocationId ?? "",
    isGroup: false,
    resource: createResource({
      id: address.AllocationId ?? "",
      arn: `arn:aws:ec2:${region}::elastic-ip/${address.AllocationId}`,
      type: ResourceType.ELASTIC_IP,
      region,
      accountId: "",
      tags,
      metadata: {
        publicIp: address.PublicIp,
        instanceId: address.InstanceId,
        networkInterfaceId: address.NetworkInterfaceId,
        domain: address.Domain,
      },
    }),
  };
}
