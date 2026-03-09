import { describe, it, expect } from 'vitest';
import { scanRequestSchema, graphQuerySchema } from '../validation/schemas.js';

describe('scanRequestSchema', () => {
  it('validates a valid scan request', () => {
    const result = scanRequestSchema.safeParse({
      regions: ['us-east-1'],
    });
    expect(result.success).toBe(true);
  });

  it('validates scan request with resource types', () => {
    const result = scanRequestSchema.safeParse({
      regions: ['us-east-1'],
      resourceTypes: ['vpc', 'subnet'],
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty regions', () => {
    const result = scanRequestSchema.safeParse({
      regions: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid region format', () => {
    const result = scanRequestSchema.safeParse({
      regions: ['invalid'],
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid resource type', () => {
    const result = scanRequestSchema.safeParse({
      regions: ['us-east-1'],
      resourceTypes: ['not_a_type'],
    });
    expect(result.success).toBe(false);
  });
});

describe('graphQuerySchema', () => {
  it('parses types from comma-separated string', () => {
    const result = graphQuerySchema.safeParse({
      types: 'vpc,subnet',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.types).toEqual(['vpc', 'subnet']);
    }
  });

  it('accepts empty query', () => {
    const result = graphQuerySchema.safeParse({});
    expect(result.success).toBe(true);
  });
});
