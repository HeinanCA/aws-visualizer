import {
  ListSubscriptionsCommand,
  type Subscription,
} from '@aws-sdk/client-sns';
import {
  ResourceType,
  RelationshipType,
  type GraphNode,
  type GraphEdge,
  createResource,
} from '@aws-visualizer/shared';
import { handleAwsError } from '../../aws/error-handler.js';
import type { ScanContext, Scanner, ScannerOutput } from '../scanner.interface.js';

const SCANNER_ID = 'messaging:sns-subscription';

export const snsSubscriptionScanner: Scanner = {
  id: SCANNER_ID,
  resourceType: ResourceType.SNS_SUBSCRIPTION,
  tier: 3,

  async scan(context: ScanContext): Promise<ScannerOutput> {
    const sns = context.clientFactory.getSNS(context.region);

    try {
      const subscriptions: Subscription[] = [];
      let nextToken: string | undefined;

      do {
        const resp = await sns.send(
          new ListSubscriptionsCommand({ NextToken: nextToken }),
        );
        subscriptions.push(...(resp.Subscriptions ?? []));
        nextToken = resp.NextToken;
      } while (nextToken);

      const confirmed = subscriptions.filter(
        (s) => s.SubscriptionArn && s.SubscriptionArn !== 'PendingConfirmation',
      );

      const nodes: GraphNode[] = confirmed.map((s) =>
        mapSubscriptionToNode(s, context.region),
      );

      const edges: GraphEdge[] = confirmed.flatMap((s) =>
        buildSubscriptionEdges(s),
      );

      context.onProgress(nodes.length);
      return { nodes, edges };
    } catch (error) {
      throw handleAwsError(
        error,
        SCANNER_ID,
        ResourceType.SNS_SUBSCRIPTION,
      );
    }
  },
};

function buildSubscriptionEdges(sub: Subscription): GraphEdge[] {
  const edges: GraphEdge[] = [];
  const subArn = sub.SubscriptionArn ?? '';

  if (sub.TopicArn) {
    edges.push({
      id: `${sub.TopicArn}-publishes-${subArn}`,
      source: sub.TopicArn,
      target: subArn,
      relationship: RelationshipType.PUBLISHES_TO,
      label: sub.Protocol,
    });
  }

  if (sub.Endpoint && sub.Protocol === 'sqs') {
    edges.push({
      id: `${subArn}-targets-${sub.Endpoint}`,
      source: subArn,
      target: sub.Endpoint,
      relationship: RelationshipType.TARGETS,
    });
  }

  if (sub.Endpoint && sub.Protocol === 'lambda') {
    edges.push({
      id: `${subArn}-triggers-${sub.Endpoint}`,
      source: subArn,
      target: sub.Endpoint,
      relationship: RelationshipType.TRIGGERS,
    });
  }

  return edges;
}

function mapSubscriptionToNode(
  sub: Subscription,
  region: string,
): GraphNode {
  const arn = sub.SubscriptionArn ?? '';

  return {
    id: arn,
    isGroup: false,
    resource: createResource({
      id: arn,
      arn,
      type: ResourceType.SNS_SUBSCRIPTION,
      name: `${sub.Protocol}→${(sub.Endpoint ?? '').split(':').pop()}`,
      region,
      accountId: sub.Owner ?? '',
      tags: {},
      metadata: {
        topicArn: sub.TopicArn,
        protocol: sub.Protocol,
        endpoint: sub.Endpoint,
      },
    }),
  };
}
