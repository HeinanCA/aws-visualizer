import {
  type Graph,
  type ScanError,
  type ScanProgress,
  type ScanResult,
  type ScannerProgress,
  type ScanRequest,
  ScanStatus,
  createEmptyGraph,
  mergeGraphs,
} from "@aws-visualizer/shared";
import { nanoid } from "nanoid";
import type { AWSClientFactory } from "../aws/client-factory.js";
import { handleAwsError } from "../aws/error-handler.js";
import type { ScannerError } from "../errors/scanner-error.js";
import type { ScannerRegistry } from "./scanner-registry.js";
import type {
  ScanContext,
  Scanner,
  ScannerOutput,
} from "./scanner.interface.js";

export type ProgressCallback = (progress: ScanProgress) => void;

export class ScanOrchestrator {
  constructor(
    private readonly registry: ScannerRegistry,
    private readonly clientFactory: AWSClientFactory,
  ) {}

  async execute(
    request: ScanRequest,
    onProgress: ProgressCallback,
  ): Promise<ScanResult> {
    const scanId = nanoid(12);
    const startTime = Date.now();
    const abortController = new globalThis.AbortController();

    const scanners = request.resourceTypes?.length
      ? this.registry.filterByTypes(request.resourceTypes)
      : this.registry.getAll();

    const tiers = this.groupByTier(scanners);
    let graph = createEmptyGraph(request.regions);
    const errors: ScanError[] = [];
    const scannerStates = new Map<string, ScannerProgress>();

    for (const scanner of scanners) {
      scannerStates.set(scanner.id, {
        scannerId: scanner.id,
        resourceType: scanner.resourceType,
        status: ScanStatus.PENDING,
        discovered: 0,
      });
    }

    const emitProgress = () => {
      onProgress({
        scanId,
        status: ScanStatus.SCANNING,
        scanners: [...scannerStates.values()],
        totalDiscovered: graph.nodes.length,
        elapsedMs: Date.now() - startTime,
      });
    };

    emitProgress();

    for (const tier of tiers) {
      const tierResults = await Promise.allSettled(
        tier.flatMap((scanner) =>
          request.regions.map((region) =>
            this.runScanner(
              scanner,
              region,
              abortController.signal,
              (count) => {
                scannerStates.set(scanner.id, {
                  ...scannerStates.get(scanner.id)!,
                  status: ScanStatus.SCANNING,
                  discovered: count,
                });
                emitProgress();
              },
            ),
          ),
        ),
      );

      for (let i = 0; i < tierResults.length; i++) {
        const result = tierResults[i]!;
        const scannerIndex = Math.floor(i / request.regions.length);
        const scanner = tier[scannerIndex]!;

        if (result.status === "fulfilled") {
          graph = mergeGraphs(graph, {
            ...createEmptyGraph(request.regions),
            nodes: result.value.nodes,
            edges: result.value.edges,
          });

          scannerStates.set(scanner.id, {
            ...scannerStates.get(scanner.id)!,
            status: ScanStatus.COMPLETED,
            discovered: result.value.nodes.length,
          });
        } else {
          const scannerError =
            result.reason instanceof Error
              ? handleAwsError(result.reason, scanner.id, scanner.resourceType)
              : handleAwsError(
                  new Error("Unknown error"),
                  scanner.id,
                  scanner.resourceType,
                );

          errors.push((scannerError as ScannerError).toScanError());

          scannerStates.set(scanner.id, {
            ...scannerStates.get(scanner.id)!,
            status: ScanStatus.FAILED,
            error: scannerError.message,
          });
        }

        emitProgress();
      }
    }

    const finalStatus =
      errors.length === 0
        ? ScanStatus.COMPLETED
        : errors.length === scanners.length
          ? ScanStatus.FAILED
          : ScanStatus.PARTIAL;

    const finalGraph: Graph = {
      ...graph,
      scanDurationMs: Date.now() - startTime,
    };

    onProgress({
      scanId,
      status: finalStatus,
      scanners: [...scannerStates.values()],
      totalDiscovered: finalGraph.nodes.length,
      elapsedMs: finalGraph.scanDurationMs,
    });

    return { scanId, graph: finalGraph, errors };
  }

  private groupByTier(
    scanners: readonly Scanner[],
  ): readonly (readonly Scanner[])[] {
    const tierMap = new Map<number, Scanner[]>();

    for (const scanner of scanners) {
      const existing = tierMap.get(scanner.tier) ?? [];
      tierMap.set(scanner.tier, [...existing, scanner]);
    }

    return [...tierMap.entries()].sort(([a], [b]) => a - b).map(([, s]) => s);
  }

  private async runScanner(
    scanner: Scanner,
    region: string,
    signal: globalThis.AbortSignal,
    onProgress: (count: number) => void,
  ): Promise<ScannerOutput> {
    const context: ScanContext = {
      region,
      clientFactory: this.clientFactory,
      signal,
      onProgress,
    };

    return scanner.scan(context);
  }
}
