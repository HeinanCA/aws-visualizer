import {
  ListQueuesCommand,
  GetQueueAttributesCommand,
  QueueAttributeName,
} from '@aws-sdk/client-sqs';
import {
  ResourceType,
  RelationshipType,
  type GraphNode,
  type GraphEdge,
  createResource,
  parseArn,
} from '@aws-visualizer/shared';
import { handleAwsError } from '../../aws/error-handler.js';
import type { ScanContext, Scanner, ScannerOutput } from '../scanner.interface.js';

const SCANNER_ID = 'messaging:sqs-queue';

export const sqsQueueScanner: Scanner = {
  id: SCANNER_ID,
  resourceType: ResourceType.SQS_QUEUE,
  tier: 2,

  async scan(context: ScanContext): Promise<ScannerOutput> {
    const sqs = context.clientFactory.getSQS(context.region);

    try {
      const listResp = await sqs.send(new ListQueuesCommand({}));
      const queueUrls = listResp.QueueUrls ?? [];

      const queues = await Promise.all(
        queueUrls.map(async (url) => {
          const attrResp = await sqs.send(
            new GetQueueAttributesCommand({
              QueueUrl: url,
              AttributeNames: [QueueAttributeName.All],
            }),
          );
          return { url, attributes: attrResp.Attributes ?? {} };
        }),
      );

      const nodes: GraphNode[] = queues.map((q) =>
        mapQueueToNode(q.url, q.attributes, context.region),
      );

      const edges: GraphEdge[] = queues.flatMap((q) =>
        buildDlqEdges(q.attributes),
      );

      context.onProgress(nodes.length);
      return { nodes, edges };
    } catch (error) {
      throw handleAwsError(error, SCANNER_ID, ResourceType.SQS_QUEUE);
    }
  },
};

function buildDlqEdges(
  attributes: Record<string, string>,
): GraphEdge[] {
  const redrivePolicy = attributes['RedrivePolicy'];
  if (!redrivePolicy) return [];

  try {
    const parsed = JSON.parse(redrivePolicy) as {
      deadLetterTargetArn?: string;
    };
    if (!parsed.deadLetterTargetArn) return [];

    const queueArn = attributes['QueueArn'] ?? '';
    return [
      {
        id: `${queueArn}-dlq-${parsed.deadLetterTargetArn}`,
        source: queueArn,
        target: parsed.deadLetterTargetArn,
        relationship: RelationshipType.ROUTES_TO,
        label: 'DLQ',
      },
    ];
  } catch {
    return [];
  }
}

function mapQueueToNode(
  url: string,
  attributes: Record<string, string>,
  region: string,
): GraphNode {
  const arn = attributes['QueueArn'] ?? '';
  const parsed = parseArn(arn);
  const queueName = url.split('/').pop() ?? url;

  return {
    id: arn,
    isGroup: false,
    resource: createResource({
      id: arn,
      arn,
      type: ResourceType.SQS_QUEUE,
      name: queueName,
      region,
      accountId: parsed?.accountId ?? '',
      tags: {},
      metadata: {
        url,
        messageRetentionPeriod: attributes['MessageRetentionPeriod'],
        visibilityTimeout: attributes['VisibilityTimeout'],
        approximateMessages: attributes['ApproximateNumberOfMessages'],
        approximateMessagesDelayed:
          attributes['ApproximateNumberOfMessagesDelayed'],
        approximateMessagesNotVisible:
          attributes['ApproximateNumberOfMessagesNotVisible'],
        hasDlq: !!attributes['RedrivePolicy'],
      },
    }),
  };
}
