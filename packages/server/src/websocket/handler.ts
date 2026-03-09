import type { FastifyInstance } from 'fastify';
import { scanRequestSchema } from '@aws-visualizer/shared';
import type { ScanOrchestrator } from '../scanners/scan-orchestrator.js';
import type { GraphStore } from '../store/graph-store.interface.js';
import {
  parseClientMessage,
  serializeServerMessage,
  type ServerMessage,
} from './protocol.js';

const PING_INTERVAL_MS = 30_000;
const WS_OPEN = 1;

interface SocketLike {
  readyState: number;
  send(data: string): void;
  on(event: string, listener: (...args: unknown[]) => void): void;
}

export function registerWebSocketHandler(
  app: FastifyInstance,
  orchestrator: ScanOrchestrator,
  store: GraphStore,
): void {
  app.get('/ws', { websocket: true }, (socket) => {
    const ws = socket as unknown as SocketLike;

    const pingTimer = setInterval(() => {
      if (ws.readyState === WS_OPEN) {
        send(ws, { type: 'ping' });
      }
    }, PING_INTERVAL_MS);

    ws.on('message', (raw: unknown) => {
      const message = parseClientMessage(String(raw));
      if (!message) return;

      switch (message.type) {
        case 'scan:start':
          handleScanStart(ws, orchestrator, store, message.payload);
          break;
        case 'pong':
          break;
      }
    });

    ws.on('close', () => {
      clearInterval(pingTimer);
    });

    ws.on('error', () => {
      clearInterval(pingTimer);
    });
  });
}

async function handleScanStart(
  socket: SocketLike,
  orchestrator: ScanOrchestrator,
  store: GraphStore,
  payload: unknown,
): Promise<void> {
  const parsed = scanRequestSchema.safeParse(payload);
  if (!parsed.success) {
    send(socket, {
      type: 'scan:error',
      error: `Invalid scan request: ${parsed.error.message}`,
    });
    return;
  }

  try {
    const result = await orchestrator.execute(parsed.data, (progress) => {
      send(socket, { type: 'scan:progress', payload: progress });
    });

    store.saveScanResult(result);
    send(socket, { type: 'scan:complete', payload: result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown scan error';
    send(socket, { type: 'scan:error', error: message });
  }
}

function send(socket: SocketLike, message: ServerMessage): void {
  if (socket.readyState === WS_OPEN) {
    socket.send(serializeServerMessage(message));
  }
}
