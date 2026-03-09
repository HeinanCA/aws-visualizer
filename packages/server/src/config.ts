import { z } from 'zod';

const configSchema = z.object({
  port: z.coerce.number().int().min(1).max(65535).default(3000),
  host: z.string().default('0.0.0.0'),
  awsRegion: z.string().default('us-east-1'),
  awsProfile: z.string().optional(),
  nodeEnv: z
    .enum(['development', 'production', 'test'])
    .default('development'),
});

export type AppConfig = z.infer<typeof configSchema>;

export function loadConfig(): AppConfig {
  const result = configSchema.safeParse({
    port: process.env['PORT'],
    host: process.env['HOST'],
    awsRegion: process.env['AWS_REGION'],
    awsProfile: process.env['AWS_PROFILE'],
    nodeEnv: process.env['NODE_ENV'],
  });

  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    throw new Error(`Invalid configuration: ${JSON.stringify(errors)}`);
  }

  return result.data;
}
