import type { ResourceType } from '../constants/resource-types.js';

export interface AWSResource {
  readonly id: string;
  readonly arn: string;
  readonly type: ResourceType;
  readonly name: string;
  readonly region: string;
  readonly accountId: string;
  readonly tags: Readonly<Record<string, string>>;
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly parentId?: string;
}

export function createResource(
  params: Omit<AWSResource, 'name'> & { name?: string },
): AWSResource {
  return {
    ...params,
    name: params.name ?? params.tags['Name'] ?? params.id,
  };
}

export function getResourceDisplayName(resource: AWSResource): string {
  return resource.name !== resource.id
    ? `${resource.name} (${resource.id})`
    : resource.id;
}

export function parseArn(arn: string): {
  readonly partition: string;
  readonly service: string;
  readonly region: string;
  readonly accountId: string;
  readonly resourceType: string;
  readonly resourceId: string;
} | null {
  const parts = arn.split(':');
  if (parts.length < 6) return null;

  const [, partition, service, region, accountId, ...rest] = parts;
  const resourcePart = rest.join(':');
  const slashIndex = resourcePart.indexOf('/');

  if (slashIndex === -1) {
    return {
      partition: partition ?? '',
      service: service ?? '',
      region: region ?? '',
      accountId: accountId ?? '',
      resourceType: '',
      resourceId: resourcePart,
    };
  }

  return {
    partition: partition ?? '',
    service: service ?? '',
    region: region ?? '',
    accountId: accountId ?? '',
    resourceType: resourcePart.slice(0, slashIndex),
    resourceId: resourcePart.slice(slashIndex + 1),
  };
}
