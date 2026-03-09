import type { ResourceType } from '@aws-visualizer/shared';

export class ScannerError extends Error {
  constructor(
    readonly scannerId: string,
    readonly resourceType: ResourceType,
    message: string,
    readonly awsErrorCode?: string,
  ) {
    super(message);
    this.name = 'ScannerError';
  }

  toScanError() {
    return {
      scannerId: this.scannerId,
      resourceType: this.resourceType,
      message: this.message,
      code: this.awsErrorCode,
    };
  }
}

export function isAccessDenied(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.name === 'AccessDeniedException' ||
      error.name === 'UnauthorizedAccess' ||
      error.message.includes('Access Denied') ||
      error.message.includes('is not authorized')
    );
  }
  return false;
}
