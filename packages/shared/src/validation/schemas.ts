import { z } from 'zod';
import { ResourceType } from '../constants/resource-types.js';
import type { ResourceType as ResourceTypeT } from '../constants/resource-types.js';

const resourceTypeValues = Object.values(ResourceType) as [string, ...string[]];

const resourceTypeEnum = z.enum(resourceTypeValues) as z.ZodType<ResourceTypeT>;

export const scanRequestSchema = z.object({
  regions: z.array(z.string().regex(/^[a-z]{2}-[a-z]+-\d+$/)).min(1),
  resourceTypes: z.array(resourceTypeEnum).optional(),
});

export const scanCancelSchema = z.object({
  scanId: z.string().min(1),
});

export const resourceIdSchema = z.string().min(1);

export const graphQuerySchema = z.object({
  types: z
    .string()
    .transform((s) => s.split(','))
    .pipe(z.array(resourceTypeEnum))
    .optional(),
  regions: z
    .string()
    .transform((s) => s.split(','))
    .pipe(z.array(z.string()))
    .optional(),
  vpcIds: z
    .string()
    .transform((s) => s.split(','))
    .pipe(z.array(z.string()))
    .optional(),
  search: z.string().optional(),
});

export type ScanRequestInput = z.infer<typeof scanRequestSchema>;
export type GraphQueryInput = z.infer<typeof graphQuerySchema>;
