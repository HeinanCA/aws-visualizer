import {
  type Instance,
  type Reservation,
  paginateDescribeInstances,
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

const SCANNER_ID = "connected:ec2-instance";

export const ec2InstanceScanner: Scanner = {
  id: SCANNER_ID,
  resourceType: ResourceType.EC2_INSTANCE,
  tier: 2,

  async scan(context: ScanContext): Promise<ScannerOutput> {
    const ec2 = context.clientFactory.getEC2(context.region);

    try {
      const reservations = await collectPages(
        () => paginateDescribeInstances({ client: ec2 }, {}),
        (page) => page.Reservations,
      );

      const instances = reservations.flatMap(
        (r: Reservation) => r.Instances ?? [],
      );

      const running = instances.filter((i) => i.State?.Name !== "terminated");

      const nodes: GraphNode[] = running.map((i) =>
        mapInstanceToNode(i, context.region),
      );

      const edges: GraphEdge[] = running.flatMap((i) => buildInstanceEdges(i));

      context.onProgress(nodes.length);
      return { nodes, edges };
    } catch (error) {
      throw handleAwsError(error, SCANNER_ID, ResourceType.EC2_INSTANCE);
    }
  },
};

function buildInstanceEdges(instance: Instance): GraphEdge[] {
  const edges: GraphEdge[] = [];
  const instanceId = instance.InstanceId ?? "";

  if (instance.SubnetId) {
    edges.push({
      id: `${instance.SubnetId}-contains-${instanceId}`,
      source: instance.SubnetId,
      target: instanceId,
      relationship: RelationshipType.CONTAINS,
    });
  }

  for (const sg of instance.SecurityGroups ?? []) {
    if (sg.GroupId) {
      edges.push({
        id: `${instanceId}-sg-${sg.GroupId}`,
        source: instanceId,
        target: sg.GroupId,
        relationship: RelationshipType.MEMBER_OF,
      });
    }
  }

  return edges;
}

function mapInstanceToNode(instance: Instance, region: string): GraphNode {
  const tags = extractTags(instance.Tags);

  return {
    id: instance.InstanceId ?? "",
    isGroup: false,
    resource: createResource({
      id: instance.InstanceId ?? "",
      arn: `arn:aws:ec2:${region}::instance/${instance.InstanceId}`,
      type: ResourceType.EC2_INSTANCE,
      region,
      accountId: "",
      tags,
      parentId: instance.SubnetId,
      metadata: {
        instanceType: instance.InstanceType,
        state: instance.State?.Name,
        privateIp: instance.PrivateIpAddress,
        publicIp: instance.PublicIpAddress,
        launchTime: instance.LaunchTime?.toISOString(),
        platform: instance.Platform,
        architecture: instance.Architecture,
      },
    }),
  };
}
