import { describe, it, expect } from 'vitest';
import { createResource, getResourceDisplayName, parseArn } from '../models/resource.js';
import { ResourceType } from '../constants/resource-types.js';

describe('createResource', () => {
  it('uses Name tag when name not provided', () => {
    const resource = createResource({
      id: 'vpc-123',
      arn: 'arn:aws:ec2:us-east-1:123456:vpc/vpc-123',
      type: ResourceType.VPC,
      region: 'us-east-1',
      accountId: '123456',
      tags: { Name: 'My VPC' },
      metadata: {},
    });

    expect(resource.name).toBe('My VPC');
  });

  it('falls back to id when no name or Name tag', () => {
    const resource = createResource({
      id: 'vpc-123',
      arn: 'arn:aws:ec2:us-east-1:123456:vpc/vpc-123',
      type: ResourceType.VPC,
      region: 'us-east-1',
      accountId: '123456',
      tags: {},
      metadata: {},
    });

    expect(resource.name).toBe('vpc-123');
  });

  it('uses explicit name when provided', () => {
    const resource = createResource({
      id: 'vpc-123',
      arn: 'arn:aws:ec2:us-east-1:123456:vpc/vpc-123',
      type: ResourceType.VPC,
      name: 'Explicit Name',
      region: 'us-east-1',
      accountId: '123456',
      tags: { Name: 'Tag Name' },
      metadata: {},
    });

    expect(resource.name).toBe('Explicit Name');
  });
});

describe('getResourceDisplayName', () => {
  it('shows name and id when different', () => {
    const resource = createResource({
      id: 'vpc-123',
      arn: 'arn:aws:ec2:us-east-1:123456:vpc/vpc-123',
      type: ResourceType.VPC,
      name: 'My VPC',
      region: 'us-east-1',
      accountId: '123456',
      tags: {},
      metadata: {},
    });

    expect(getResourceDisplayName(resource)).toBe('My VPC (vpc-123)');
  });

  it('shows only id when name equals id', () => {
    const resource = createResource({
      id: 'vpc-123',
      arn: 'arn:aws:ec2:us-east-1:123456:vpc/vpc-123',
      type: ResourceType.VPC,
      region: 'us-east-1',
      accountId: '123456',
      tags: {},
      metadata: {},
    });

    expect(getResourceDisplayName(resource)).toBe('vpc-123');
  });
});

describe('parseArn', () => {
  it('parses a standard ARN', () => {
    const result = parseArn('arn:aws:ec2:us-east-1:123456789012:vpc/vpc-123');
    expect(result).toEqual({
      partition: 'aws',
      service: 'ec2',
      region: 'us-east-1',
      accountId: '123456789012',
      resourceType: 'vpc',
      resourceId: 'vpc-123',
    });
  });

  it('handles ARNs without resource type', () => {
    const result = parseArn('arn:aws:s3:::my-bucket');
    expect(result).not.toBeNull();
    expect(result!.service).toBe('s3');
    expect(result!.resourceId).toBe('my-bucket');
  });

  it('returns null for invalid ARNs', () => {
    expect(parseArn('not-an-arn')).toBeNull();
  });
});
