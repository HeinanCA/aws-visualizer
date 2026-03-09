import type { ResourceType } from '@aws-visualizer/shared';
import { ScannerError, isAccessDenied } from '../errors/scanner-error.js';

export function handleAwsError(
  error: unknown,
  scannerId: string,
  resourceType: ResourceType,
): ScannerError {
  if (error instanceof ScannerError) return error;

  if (error instanceof Error) {
    const awsErrorCode = isAccessDenied(error)
      ? 'ACCESS_DENIED'
      : (error.name ?? 'UNKNOWN');

    return new ScannerError(
      scannerId,
      resourceType,
      `Failed to scan ${resourceType}: ${error.message}`,
      awsErrorCode,
    );
  }

  return new ScannerError(
    scannerId,
    resourceType,
    `Failed to scan ${resourceType}: Unknown error`,
    'UNKNOWN',
  );
}
