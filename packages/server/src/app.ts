import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import type { AppConfig } from './config.js';
import { AppError } from './errors/app-error.js';
import { AWSClientFactory } from './aws/client-factory.js';
import { ScannerRegistry } from './scanners/scanner-registry.js';
import { ScanOrchestrator } from './scanners/scan-orchestrator.js';
import { InMemoryGraphStore } from './store/in-memory-graph-store.js';
import { registerHealthRoutes } from './routes/health.routes.js';
import { registerScanRoutes } from './routes/scan.routes.js';
import { registerGraphRoutes } from './routes/graph.routes.js';
import { registerWebSocketHandler } from './websocket/handler.js';
import { registerAllScanners } from './scanners/register-all.js';

export async function buildApp(config: AppConfig) {
  const app = Fastify({
    logger: {
      level: config.nodeEnv === 'production' ? 'info' : 'debug',
    },
  });

  await app.register(cors, {
    origin: config.nodeEnv === 'development' ? true : false,
  });
  await app.register(websocket);

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof AppError) {
      reply.code(error.statusCode).send({
        error: error.code,
        message: error.message,
      });
      return;
    }

    app.log.error(error);
    reply.code(500).send({
      error: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    });
  });

  const clientFactory = new AWSClientFactory({
    profile: config.awsProfile,
  });

  const registry = new ScannerRegistry();
  registerAllScanners(registry);

  const orchestrator = new ScanOrchestrator(registry, clientFactory);
  const store = new InMemoryGraphStore();

  registerHealthRoutes(app);
  registerScanRoutes(app, orchestrator, store);
  registerGraphRoutes(app, store);
  registerWebSocketHandler(app, orchestrator, store);

  app.addHook('onClose', () => {
    clientFactory.destroy();
  });

  return app;
}
