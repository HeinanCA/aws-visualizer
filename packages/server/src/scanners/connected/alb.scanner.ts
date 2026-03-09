import {
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeTargetHealthCommand,
  type LoadBalancer,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  ResourceType,
  RelationshipType,
  type GraphNode,
  type GraphEdge,
  createResource,
} from '@aws-visualizer/shared';
import { handleAwsError } from '../../aws/error-handler.js';
import type { ScanContext, Scanner, ScannerOutput } from '../scanner.interface.js';

const SCANNER_ID = 'connected:alb';

export const albScanner: Scanner = {
  id: SCANNER_ID,
  resourceType: ResourceType.ALB,
  tier: 2,

  async scan(context: ScanContext): Promise<ScannerOutput> {
    const elbv2 = context.clientFactory.getELBv2(context.region);

    try {
      const lbResp = await elbv2.send(
        new DescribeLoadBalancersCommand({}),
      );
      const loadBalancers = (lbResp.LoadBalancers ?? []).filter(
        (lb) => lb.Type === 'application',
      );

      const nodes: GraphNode[] = loadBalancers.map((lb) =>
        mapAlbToNode(lb, context.region),
      );

      const edges: GraphEdge[] = loadBalancers.flatMap((lb) =>
        buildAlbEdges(lb),
      );

      const targetEdges = await buildTargetEdges(elbv2, loadBalancers);
      edges.push(...targetEdges);

      context.onProgress(nodes.length);
      return { nodes, edges };
    } catch (error) {
      throw handleAwsError(error, SCANNER_ID, ResourceType.ALB);
    }
  },
};

function buildAlbEdges(lb: LoadBalancer): GraphEdge[] {
  const edges: GraphEdge[] = [];
  const lbArn = lb.LoadBalancerArn ?? '';

  if (lb.VpcId) {
    edges.push({
      id: `${lb.VpcId}-contains-${lbArn}`,
      source: lb.VpcId,
      target: lbArn,
      relationship: RelationshipType.CONTAINS,
    });
  }

  for (const sg of lb.SecurityGroups ?? []) {
    edges.push({
      id: `${lbArn}-sg-${sg}`,
      source: lbArn,
      target: sg,
      relationship: RelationshipType.MEMBER_OF,
    });
  }

  return edges;
}

async function buildTargetEdges(
  elbv2: ReturnType<typeof import('../../aws/client-factory.js').AWSClientFactory.prototype.getELBv2>,
  loadBalancers: LoadBalancer[],
): Promise<GraphEdge[]> {
  const edges: GraphEdge[] = [];

  for (const lb of loadBalancers) {
    try {
      const tgResp = await elbv2.send(
        new DescribeTargetGroupsCommand({
          LoadBalancerArn: lb.LoadBalancerArn,
        }),
      );

      for (const tg of tgResp.TargetGroups ?? []) {
        const healthResp = await elbv2.send(
          new DescribeTargetHealthCommand({
            TargetGroupArn: tg.TargetGroupArn,
          }),
        );

        for (const target of healthResp.TargetHealthDescriptions ?? []) {
          if (target.Target?.Id) {
            edges.push({
              id: `${lb.LoadBalancerArn}-targets-${target.Target.Id}`,
              source: lb.LoadBalancerArn!,
              target: target.Target.Id,
              relationship: RelationshipType.TARGETS,
              label: `port ${target.Target.Port}`,
            });
          }
        }
      }
    } catch {
      // Target group details are best-effort
    }
  }

  return edges;
}

function mapAlbToNode(lb: LoadBalancer, region: string): GraphNode {
  return {
    id: lb.LoadBalancerArn ?? '',
    isGroup: false,
    resource: createResource({
      id: lb.LoadBalancerArn ?? '',
      arn: lb.LoadBalancerArn ?? '',
      type: ResourceType.ALB,
      name: lb.LoadBalancerName,
      region,
      accountId: '',
      tags: {},
      metadata: {
        dnsName: lb.DNSName,
        scheme: lb.Scheme,
        vpcId: lb.VpcId,
        state: lb.State?.Code,
        type: lb.Type,
        availabilityZones: lb.AvailabilityZones?.map((az) => az.ZoneName),
      },
    }),
  };
}
