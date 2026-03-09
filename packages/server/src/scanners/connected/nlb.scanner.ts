import {
  DescribeLoadBalancersCommand,
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

const SCANNER_ID = 'connected:nlb';

export const nlbScanner: Scanner = {
  id: SCANNER_ID,
  resourceType: ResourceType.NLB,
  tier: 2,

  async scan(context: ScanContext): Promise<ScannerOutput> {
    const elbv2 = context.clientFactory.getELBv2(context.region);

    try {
      const resp = await elbv2.send(new DescribeLoadBalancersCommand({}));
      const nlbs = (resp.LoadBalancers ?? []).filter(
        (lb) => lb.Type === 'network',
      );

      const nodes: GraphNode[] = nlbs.map((lb) =>
        mapNlbToNode(lb, context.region),
      );

      const edges: GraphEdge[] = nlbs
        .filter((lb) => lb.VpcId)
        .map((lb) => ({
          id: `${lb.VpcId}-contains-${lb.LoadBalancerArn}`,
          source: lb.VpcId!,
          target: lb.LoadBalancerArn!,
          relationship: RelationshipType.CONTAINS,
        }));

      context.onProgress(nodes.length);
      return { nodes, edges };
    } catch (error) {
      throw handleAwsError(error, SCANNER_ID, ResourceType.NLB);
    }
  },
};

function mapNlbToNode(lb: LoadBalancer, region: string): GraphNode {
  return {
    id: lb.LoadBalancerArn ?? '',
    isGroup: false,
    resource: createResource({
      id: lb.LoadBalancerArn ?? '',
      arn: lb.LoadBalancerArn ?? '',
      type: ResourceType.NLB,
      name: lb.LoadBalancerName,
      region,
      accountId: '',
      tags: {},
      metadata: {
        dnsName: lb.DNSName,
        scheme: lb.Scheme,
        vpcId: lb.VpcId,
        state: lb.State?.Code,
      },
    }),
  };
}
