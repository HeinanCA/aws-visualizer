import {
  DescribeAlarmsCommand,
  type MetricAlarm,
} from '@aws-sdk/client-cloudwatch';
import {
  ResourceType,
  RelationshipType,
  type GraphNode,
  type GraphEdge,
  createResource,
} from '@aws-visualizer/shared';
import { handleAwsError } from '../../aws/error-handler.js';
import type { ScanContext, Scanner, ScannerOutput } from '../scanner.interface.js';

const SCANNER_ID = 'connected:cloudwatch-alarm';

export const cloudwatchAlarmScanner: Scanner = {
  id: SCANNER_ID,
  resourceType: ResourceType.CLOUDWATCH_ALARM,
  tier: 2,

  async scan(context: ScanContext): Promise<ScannerOutput> {
    const cw = context.clientFactory.getCloudWatch(context.region);

    try {
      const alarms: MetricAlarm[] = [];
      let nextToken: string | undefined;

      do {
        const resp = await cw.send(
          new DescribeAlarmsCommand({ NextToken: nextToken }),
        );
        alarms.push(...(resp.MetricAlarms ?? []));
        nextToken = resp.NextToken;
      } while (nextToken);

      const nodes: GraphNode[] = alarms.map((a) =>
        mapAlarmToNode(a, context.region),
      );

      const edges: GraphEdge[] = alarms.flatMap((a) =>
        buildAlarmEdges(a),
      );

      context.onProgress(nodes.length);
      return { nodes, edges };
    } catch (error) {
      throw handleAwsError(
        error,
        SCANNER_ID,
        ResourceType.CLOUDWATCH_ALARM,
      );
    }
  },
};

function buildAlarmEdges(alarm: MetricAlarm): GraphEdge[] {
  const edges: GraphEdge[] = [];
  const alarmArn = alarm.AlarmArn ?? '';

  for (const action of alarm.AlarmActions ?? []) {
    if (action.includes(':sns:')) {
      edges.push({
        id: `${alarmArn}-notifies-${action}`,
        source: alarmArn,
        target: action,
        relationship: RelationshipType.PUBLISHES_TO,
        label: 'ALARM',
      });
    }
  }

  return edges;
}

function mapAlarmToNode(alarm: MetricAlarm, region: string): GraphNode {
  return {
    id: alarm.AlarmArn ?? '',
    isGroup: false,
    resource: createResource({
      id: alarm.AlarmArn ?? '',
      arn: alarm.AlarmArn ?? '',
      type: ResourceType.CLOUDWATCH_ALARM,
      name: alarm.AlarmName,
      region,
      accountId: '',
      tags: {},
      metadata: {
        namespace: alarm.Namespace,
        metricName: alarm.MetricName,
        statistic: alarm.Statistic,
        period: alarm.Period,
        threshold: alarm.Threshold,
        comparisonOperator: alarm.ComparisonOperator,
        state: alarm.StateValue,
        dimensions: alarm.Dimensions?.map((d) => ({
          name: d.Name,
          value: d.Value,
        })),
      },
    }),
  };
}
