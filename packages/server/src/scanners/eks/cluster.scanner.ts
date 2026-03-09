import {
  ListClustersCommand,
  DescribeClusterCommand,
  type Cluster,
} from '@aws-sdk/client-eks';
import {
  ResourceType,
  RelationshipType,
  type GraphNode,
  type GraphEdge,
  createResource,
} from '@aws-visualizer/shared';
import { handleAwsError } from '../../aws/error-handler.js';
import type { ScanContext, Scanner, ScannerOutput } from '../scanner.interface.js';

const SCANNER_ID = 'eks:cluster';

export const eksClusterScanner: Scanner = {
  id: SCANNER_ID,
  resourceType: ResourceType.EKS_CLUSTER,
  tier: 2,

  async scan(context: ScanContext): Promise<ScannerOutput> {
    const eks = context.clientFactory.getEKS(context.region);

    try {
      const listResp = await eks.send(new ListClustersCommand({}));
      const clusterNames = listResp.clusters ?? [];

      const clusters = await Promise.all(
        clusterNames.map(async (name) => {
          const resp = await eks.send(
            new DescribeClusterCommand({ name }),
          );
          return resp.cluster;
        }),
      );

      const validClusters = clusters.filter(
        (c): c is Cluster => c != null,
      );

      const nodes: GraphNode[] = validClusters.map((c) =>
        mapClusterToNode(c, context.region),
      );

      const edges: GraphEdge[] = validClusters.flatMap((c) =>
        buildClusterEdges(c),
      );

      context.onProgress(nodes.length);
      return { nodes, edges };
    } catch (error) {
      throw handleAwsError(error, SCANNER_ID, ResourceType.EKS_CLUSTER);
    }
  },
};

function buildClusterEdges(cluster: Cluster): GraphEdge[] {
  const edges: GraphEdge[] = [];
  const clusterArn = cluster.arn ?? '';

  const subnetIds =
    cluster.resourcesVpcConfig?.subnetIds ?? [];
  for (const subnetId of subnetIds) {
    edges.push({
      id: `${clusterArn}-in-${subnetId}`,
      source: clusterArn,
      target: subnetId,
      relationship: RelationshipType.MEMBER_OF,
    });
  }

  const sgIds =
    cluster.resourcesVpcConfig?.securityGroupIds ?? [];
  for (const sgId of sgIds) {
    edges.push({
      id: `${clusterArn}-sg-${sgId}`,
      source: clusterArn,
      target: sgId,
      relationship: RelationshipType.MEMBER_OF,
    });
  }

  if (cluster.roleArn) {
    edges.push({
      id: `${clusterArn}-assumes-${cluster.roleArn}`,
      source: clusterArn,
      target: cluster.roleArn,
      relationship: RelationshipType.ASSUMES,
    });
  }

  return edges;
}

function mapClusterToNode(cluster: Cluster, region: string): GraphNode {
  const tags = cluster.tags ?? {};

  return {
    id: cluster.arn ?? '',
    isGroup: true,
    resource: createResource({
      id: cluster.arn ?? '',
      arn: cluster.arn ?? '',
      type: ResourceType.EKS_CLUSTER,
      name: cluster.name,
      region,
      accountId: '',
      tags,
      metadata: {
        name: cluster.name,
        version: cluster.version,
        status: cluster.status,
        platformVersion: cluster.platformVersion,
        vpcId: cluster.resourcesVpcConfig?.vpcId,
        endpoint: cluster.endpoint,
        roleArn: cluster.roleArn,
      },
    }),
  };
}
