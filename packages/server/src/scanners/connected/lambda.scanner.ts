import {
  ListFunctionsCommand,
  ListEventSourceMappingsCommand,
  type FunctionConfiguration,
} from '@aws-sdk/client-lambda';
import {
  ResourceType,
  RelationshipType,
  type GraphNode,
  type GraphEdge,
  createResource,
} from '@aws-visualizer/shared';
import { handleAwsError } from '../../aws/error-handler.js';
import type { ScanContext, Scanner, ScannerOutput } from '../scanner.interface.js';

const SCANNER_ID = 'connected:lambda';

export const lambdaScanner: Scanner = {
  id: SCANNER_ID,
  resourceType: ResourceType.LAMBDA,
  tier: 2,

  async scan(context: ScanContext): Promise<ScannerOutput> {
    const lambda = context.clientFactory.getLambda(context.region);

    try {
      const functions: FunctionConfiguration[] = [];
      let marker: string | undefined;

      do {
        const resp = await lambda.send(
          new ListFunctionsCommand({ Marker: marker }),
        );
        functions.push(...(resp.Functions ?? []));
        marker = resp.NextMarker;
      } while (marker);

      const nodes: GraphNode[] = functions.map((fn) =>
        mapLambdaToNode(fn, context.region),
      );

      const edges: GraphEdge[] = functions.flatMap((fn) =>
        buildLambdaEdges(fn),
      );

      const eventEdges = await buildEventSourceEdges(lambda, functions);
      edges.push(...eventEdges);

      context.onProgress(nodes.length);
      return { nodes, edges };
    } catch (error) {
      throw handleAwsError(error, SCANNER_ID, ResourceType.LAMBDA);
    }
  },
};

function buildLambdaEdges(fn: FunctionConfiguration): GraphEdge[] {
  const edges: GraphEdge[] = [];
  const fnArn = fn.FunctionArn ?? '';

  if (fn.Role) {
    edges.push({
      id: `${fnArn}-assumes-${fn.Role}`,
      source: fnArn,
      target: fn.Role,
      relationship: RelationshipType.ASSUMES,
    });
  }

  if (fn.VpcConfig?.VpcId) {
    edges.push({
      id: `${fn.VpcConfig.VpcId}-contains-${fnArn}`,
      source: fn.VpcConfig.VpcId,
      target: fnArn,
      relationship: RelationshipType.CONTAINS,
    });
  }

  for (const sgId of fn.VpcConfig?.SecurityGroupIds ?? []) {
    edges.push({
      id: `${fnArn}-sg-${sgId}`,
      source: fnArn,
      target: sgId,
      relationship: RelationshipType.MEMBER_OF,
    });
  }

  return edges;
}

async function buildEventSourceEdges(
  lambda: ReturnType<typeof import('../../aws/client-factory.js').AWSClientFactory.prototype.getLambda>,
  functions: FunctionConfiguration[],
): Promise<GraphEdge[]> {
  const edges: GraphEdge[] = [];

  for (const fn of functions) {
    try {
      const resp = await lambda.send(
        new ListEventSourceMappingsCommand({
          FunctionName: fn.FunctionName,
        }),
      );

      for (const mapping of resp.EventSourceMappings ?? []) {
        if (mapping.EventSourceArn) {
          edges.push({
            id: `${mapping.EventSourceArn}-triggers-${fn.FunctionArn}`,
            source: mapping.EventSourceArn,
            target: fn.FunctionArn!,
            relationship: RelationshipType.TRIGGERS,
            label: `batch ${mapping.BatchSize ?? 1}`,
          });
        }
      }
    } catch {
      // Event source details are best-effort
    }
  }

  return edges;
}

function mapLambdaToNode(
  fn: FunctionConfiguration,
  region: string,
): GraphNode {
  return {
    id: fn.FunctionArn ?? '',
    isGroup: false,
    resource: createResource({
      id: fn.FunctionArn ?? '',
      arn: fn.FunctionArn ?? '',
      type: ResourceType.LAMBDA,
      name: fn.FunctionName,
      region,
      accountId: '',
      tags: {},
      metadata: {
        runtime: fn.Runtime,
        handler: fn.Handler,
        memorySize: fn.MemorySize,
        timeout: fn.Timeout,
        lastModified: fn.LastModified,
        codeSize: fn.CodeSize,
        state: fn.State,
      },
    }),
  };
}
