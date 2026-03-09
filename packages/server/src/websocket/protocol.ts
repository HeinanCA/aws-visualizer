import type { ScanProgress, ScanRequest, ScanResult } from '@aws-visualizer/shared';

export type ServerMessage =
  | { readonly type: 'scan:started'; readonly scanId: string }
  | { readonly type: 'scan:progress'; readonly payload: ScanProgress }
  | { readonly type: 'scan:complete'; readonly payload: ScanResult }
  | { readonly type: 'scan:error'; readonly error: string }
  | { readonly type: 'ping' };

export type ClientMessage =
  | { readonly type: 'scan:start'; readonly payload: ScanRequest }
  | { readonly type: 'scan:cancel'; readonly scanId: string }
  | { readonly type: 'pong' };

export function serializeServerMessage(message: ServerMessage): string {
  return JSON.stringify(message);
}

export function parseClientMessage(data: string): ClientMessage | null {
  try {
    const parsed = JSON.parse(data) as Record<string, unknown>;
    if (typeof parsed.type !== 'string') return null;

    switch (parsed.type) {
      case 'scan:start':
        if (parsed.payload && typeof parsed.payload === 'object') {
          return parsed as unknown as ClientMessage;
        }
        return null;
      case 'scan:cancel':
        if (typeof parsed.scanId === 'string') {
          return parsed as unknown as ClientMessage;
        }
        return null;
      case 'pong':
        return { type: 'pong' };
      default:
        return null;
    }
  } catch {
    return null;
  }
}
