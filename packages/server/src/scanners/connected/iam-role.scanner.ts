import {
  ListRolesCommand,
  type Role,
} from '@aws-sdk/client-iam';
import {
  ResourceType,
  type GraphNode,
  createResource,
} from '@aws-visualizer/shared';
import { handleAwsError } from '../../aws/error-handler.js';
import type { ScanContext, Scanner, ScannerOutput } from '../scanner.interface.js';

const SCANNER_ID = 'connected:iam-role';

export const iamRoleScanner: Scanner = {
  id: SCANNER_ID,
  resourceType: ResourceType.IAM_ROLE,
  tier: 0,

  async scan(context: ScanContext): Promise<ScannerOutput> {
    const iam = context.clientFactory.getIAM(context.region);

    try {
      const roles: Role[] = [];
      let marker: string | undefined;

      do {
        const resp = await iam.send(
          new ListRolesCommand({ Marker: marker }),
        );
        roles.push(...(resp.Roles ?? []));
        marker = resp.Marker;
      } while (marker);

      const nodes: GraphNode[] = roles.map((role) =>
        mapRoleToNode(role, context.region),
      );

      context.onProgress(nodes.length);
      return { nodes, edges: [] };
    } catch (error) {
      throw handleAwsError(error, SCANNER_ID, ResourceType.IAM_ROLE);
    }
  },
};

function mapRoleToNode(role: Role, region: string): GraphNode {
  const tags: Record<string, string> = {};
  for (const tag of role.Tags ?? []) {
    if (tag.Key && tag.Value) {
      tags[tag.Key] = tag.Value;
    }
  }

  return {
    id: role.Arn ?? '',
    isGroup: false,
    resource: createResource({
      id: role.Arn ?? '',
      arn: role.Arn ?? '',
      type: ResourceType.IAM_ROLE,
      name: role.RoleName,
      region: 'global',
      accountId: '',
      tags,
      metadata: {
        roleName: role.RoleName,
        path: role.Path,
        createDate: role.CreateDate?.toISOString(),
        description: role.Description,
        maxSessionDuration: role.MaxSessionDuration,
      },
    }),
  };
}
