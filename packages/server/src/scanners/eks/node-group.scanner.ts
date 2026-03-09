import {
  ListClustersCommand,
  ListNodegroupsCommand,
  DescribeNodegroupCommand,
  type Nodegroup,
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

const SCANNER_ID = 'eks:node-group';

export const eksNodeGroupScanner: Scanner = {
  id: SCANNER_ID,
  resourceType: ResourceType.EKS_NODE_GROUP,
  tier: 3,

  async scan(context: ScanContext): Promise<ScannerOutput> {
    const eks = context.clientFactory.getEKS(context.region);

    try {
      const listResp = await eks.send(new ListClustersCommand({}));
      const clusterNames = listResp.clusters ?? [];

      const allNodeGroups: Array<{ cluster: string; nodegroup: Nodegroup }> =
        [];

      for (const clusterName of clusterNames) {
        const ngResp = await eks.send(
          new ListNodegroupsCommand({ clusterName }),
        );

        const nodegroups = await Promise.all(
          (ngResp.nodegroups ?? []).map(async (ngName) => {
            const resp = await eks.send(
              new DescribeNodegroupCommand({
                clusterName,
                nodegroupName: ngName,
              }),
            );
            return resp.nodegroup;
          }),
        );

        for (const ng of nodegroups) {
          if (ng) {
            allNodeGroups.push({ cluster: clusterName, nodegroup: ng });
          }
        }
      }

      const nodes: GraphNode[] = allNodeGroups.map(({ nodegroup }) =>
        mapNodeGroupToNode(nodegroup, context.region),
      );

      const edges: GraphEdge[] = allNodeGroups.flatMap(
        ({ cluster, nodegroup }) =>
          buildNodeGroupEdges(cluster, nodegroup, context.region),
      );

      context.onProgress(nodes.length);
      return { nodes, edges };
    } catch (error) {
      throw handleAwsError(error, SCANNER_ID, ResourceType.EKS_NODE_GROUP);
    }
  },
};

function buildNodeGroupEdges(
  _clusterName: string,
  ng: Nodegroup,
  _region: string,
): GraphEdge[] {
  const edges: GraphEdge[] = [];
  const ngArn = ng.nodegroupArn ?? '';

  if (ng.clusterName) {
    edges.push({
      id: `${ngArn}-in-cluster`,
      source: ngArn,
      target: `arn:aws:eks:${_region}::cluster/${ng.clusterName}`,
      relationship: RelationshipType.MEMBER_OF,
    });
  }

  if (ng.nodeRole) {
    edges.push({
      id: `${ngArn}-assumes-${ng.nodeRole}`,
      source: ngArn,
      target: ng.nodeRole,
      relationship: RelationshipType.ASSUMES,
    });
  }

  for (const subnetId of ng.subnets ?? []) {
    edges.push({
      id: `${ngArn}-in-${subnetId}`,
      source: ngArn,
      target: subnetId,
      relationship: RelationshipType.MEMBER_OF,
    });
  }

  return edges;
}

function mapNodeGroupToNode(ng: Nodegroup, region: string): GraphNode {
  const tags = ng.tags ?? {};

  return {
    id: ng.nodegroupArn ?? '',
    isGroup: false,
    resource: createResource({
      id: ng.nodegroupArn ?? '',
      arn: ng.nodegroupArn ?? '',
      type: ResourceType.EKS_NODE_GROUP,
      name: ng.nodegroupName,
      region,
      accountId: '',
      tags,
      metadata: {
        clusterName: ng.clusterName,
        status: ng.status,
        scalingConfig: ng.scalingConfig,
        instanceTypes: ng.instanceTypes,
        amiType: ng.amiType,
        nodeRole: ng.nodeRole,
      },
    }),
  };
}
