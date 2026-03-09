import type { FastifyInstance } from 'fastify';
import { scanRequestSchema } from '@aws-visualizer/shared';
import type { ScanOrchestrator } from '../scanners/scan-orchestrator.js';
import type { GraphStore } from '../store/graph-store.interface.js';
import { NotFoundError, ValidationError } from '../errors/app-error.js';

export function registerScanRoutes(
  app: FastifyInstance,
  orchestrator: ScanOrchestrator,
  store: GraphStore,
): void {
  app.post('/api/scan', async (request, reply) => {
    const parsed = scanRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.message);
    }

    const result = await orchestrator.execute(parsed.data, () => {});
    store.saveScanResult(result);

    reply.code(201);
    return { scanId: result.scanId, status: 'completed' };
  });

  app.get<{ Params: { id: string } }>(
    '/api/scan/:id',
    async (request) => {
      const result = store.getScanResult(request.params.id);
      if (!result) {
        throw new NotFoundError('Scan', request.params.id);
      }
      return result;
    },
  );
}
