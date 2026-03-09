import { ListTopicsCommand, type Topic } from '@aws-sdk/client-sns';
import {
  ResourceType,
  type GraphNode,
  createResource,
  parseArn,
} from '@aws-visualizer/shared';
import { handleAwsError } from '../../aws/error-handler.js';
import type { ScanContext, Scanner, ScannerOutput } from '../scanner.interface.js';

const SCANNER_ID = 'messaging:sns-topic';

export const snsTopicScanner: Scanner = {
  id: SCANNER_ID,
  resourceType: ResourceType.SNS_TOPIC,
  tier: 2,

  async scan(context: ScanContext): Promise<ScannerOutput> {
    const sns = context.clientFactory.getSNS(context.region);

    try {
      const topics: Topic[] = [];
      let nextToken: string | undefined;

      do {
        const resp = await sns.send(
          new ListTopicsCommand({ NextToken: nextToken }),
        );
        topics.push(...(resp.Topics ?? []));
        nextToken = resp.NextToken;
      } while (nextToken);

      const nodes: GraphNode[] = topics
        .filter((t) => t.TopicArn)
        .map((t) => mapTopicToNode(t, context.region));

      context.onProgress(nodes.length);
      return { nodes, edges: [] };
    } catch (error) {
      throw handleAwsError(error, SCANNER_ID, ResourceType.SNS_TOPIC);
    }
  },
};

function mapTopicToNode(topic: Topic, region: string): GraphNode {
  const arn = topic.TopicArn ?? '';
  const parsed = parseArn(arn);
  const topicName = arn.split(':').pop() ?? arn;

  return {
    id: arn,
    isGroup: false,
    resource: createResource({
      id: arn,
      arn,
      type: ResourceType.SNS_TOPIC,
      name: topicName,
      region,
      accountId: parsed?.accountId ?? '',
      tags: {},
      metadata: {},
    }),
  };
}
