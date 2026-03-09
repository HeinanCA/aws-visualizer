import { useEffect, useRef, useCallback } from 'react';
import type { ScanRequest } from '@aws-visualizer/shared';
import { useGraphStore } from '../store/graph-store';

type ServerMessage = {
  type: string;
  payload?: unknown;
  scanId?: string;
  error?: string;
};

const MAX_RECONNECT_DELAY_MS = 30_000;
const BASE_RECONNECT_DELAY_MS = 1_000;

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const retriesRef = useRef(0);
  const { setGraph, updateScanProgress } = useGraphStore();

  const connect = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      retriesRef.current = 0;
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data as string) as ServerMessage;
        handleMessage(message);
      } catch {
        // ignore malformed messages
      }
    };

    ws.onclose = () => {
      scheduleReconnect();
    };

    ws.onerror = () => {
      ws.close();
    };
  }, []);

  const handleMessage = useCallback(
    (message: ServerMessage) => {
      switch (message.type) {
        case 'scan:progress':
          updateScanProgress(message.payload as Parameters<typeof updateScanProgress>[0]);
          break;
        case 'scan:complete': {
          const result = message.payload as { graph: Parameters<typeof setGraph>[0] };
          setGraph(result.graph);
          updateScanProgress(null);
          break;
        }
        case 'scan:error':
          updateScanProgress(null);
          break;
        case 'ping':
          wsRef.current?.send(JSON.stringify({ type: 'pong' }));
          break;
      }
    },
    [setGraph, updateScanProgress],
  );

  const scheduleReconnect = useCallback(() => {
    retriesRef.current += 1;
    const delay = Math.min(
      BASE_RECONNECT_DELAY_MS * Math.pow(2, retriesRef.current),
      MAX_RECONNECT_DELAY_MS,
    );
    setTimeout(connect, delay);
  }, [connect]);

  const startScan = useCallback((request: ScanRequest) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({ type: 'scan:start', payload: request }),
      );
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
    };
  }, [connect]);

  return { startScan };
}
