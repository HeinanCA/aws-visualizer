import { describe, it, expect } from 'vitest';
import { extractTags, buildArn, createEdge } from '../scanners/scanner-utils.js';
import { RelationshipType } from '@aws-visualizer/shared';

describe('extractTags', () => {
  it('returns empty object when tags is undefined', () => {
    expect(extractTags(undefined)).toEqual({});
  });

  it('returns empty object when tags is empty array', () => {
    expect(extractTags([])).toEqual({});
  });

  it('extracts key-value pairs from tags', () => {
    const tags = [
      { Key: 'Name', Value: 'my-vpc' },
      { Key: 'Environment', Value: 'production' },
    ];
    expect(extractTags(tags)).toEqual({
      Name: 'my-vpc',
      Environment: 'production',
    });
  });

  it('skips tags with missing Key', () => {
    const tags = [
      { Key: 'Name', Value: 'my-vpc' },
      { Value: 'orphan' },
    ];
    expect(extractTags(tags)).toEqual({ Name: 'my-vpc' });
  });

  it('skips tags with missing Value', () => {
    const tags = [
      { Key: 'Name', Value: 'my-vpc' },
      { Key: 'Empty' },
    ];
    expect(extractTags(tags)).toEqual({ Name: 'my-vpc' });
  });
});

describe('buildArn', () => {
  it('builds a standard ARN', () => {
    expect(buildArn('ec2', 'vpc/vpc-123', 'us-east-1', '123456789012')).toBe(
      'arn:aws:ec2:us-east-1:123456789012:vpc/vpc-123',
    );
  });

  it('uses empty string for missing accountId', () => {
    expect(buildArn('s3', 'my-bucket', 'us-west-2')).toBe(
      'arn:aws:s3:us-west-2::my-bucket',
    );
  });
});

describe('createEdge', () => {
  it('creates an edge with generated id', () => {
    const edge = createEdge('source-1', 'target-1', RelationshipType.CONTAINS);
    expect(edge.source).toBe('source-1');
    expect(edge.target).toBe('target-1');
    expect(edge.relationship).toBe(RelationshipType.CONTAINS);
    expect(edge.id).toMatch(/^edge-/);
  });

  it('uses relationship as default label', () => {
    const edge = createEdge('a', 'b', RelationshipType.ROUTES_TO);
    expect(edge.label).toBe(RelationshipType.ROUTES_TO);
  });

  it('uses custom label when provided', () => {
    const edge = createEdge('a', 'b', RelationshipType.ROUTES_TO, '10.0.0.0/16');
    expect(edge.label).toBe('10.0.0.0/16');
  });

  it('generates unique ids', () => {
    const edge1 = createEdge('a', 'b', RelationshipType.CONTAINS);
    const edge2 = createEdge('a', 'b', RelationshipType.CONTAINS);
    expect(edge1.id).not.toBe(edge2.id);
  });
});
