import { ListBucketsCommand } from '@aws-sdk/client-s3';
import {
  ResourceType,
  type GraphNode,
  createResource,
} from '@aws-visualizer/shared';
import { handleAwsError } from '../../aws/error-handler.js';
import type { ScanContext, Scanner, ScannerOutput } from '../scanner.interface.js';

const SCANNER_ID = 'connected:s3-bucket';

export const s3BucketScanner: Scanner = {
  id: SCANNER_ID,
  resourceType: ResourceType.S3_BUCKET,
  tier: 0,

  async scan(context: ScanContext): Promise<ScannerOutput> {
    const s3 = context.clientFactory.getS3(context.region);

    try {
      const resp = await s3.send(new ListBucketsCommand({}));
      const buckets = resp.Buckets ?? [];

      const nodes: GraphNode[] = buckets.map((b) => ({
        id: `arn:aws:s3:::${b.Name}`,
        isGroup: false,
        resource: createResource({
          id: `arn:aws:s3:::${b.Name}`,
          arn: `arn:aws:s3:::${b.Name}`,
          type: ResourceType.S3_BUCKET,
          name: b.Name,
          region: 'global',
          accountId: '',
          tags: {},
          metadata: {
            creationDate: b.CreationDate?.toISOString(),
          },
        }),
      }));

      context.onProgress(nodes.length);
      return { nodes, edges: [] };
    } catch (error) {
      throw handleAwsError(error, SCANNER_ID, ResourceType.S3_BUCKET);
    }
  },
};
