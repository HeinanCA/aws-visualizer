import { nanoid } from "nanoid";
import type { GraphEdge, RelationshipType } from "@aws-visualizer/shared";

export function extractTags(
  tags?: ReadonlyArray<{ Key?: string; Value?: string }>,
): Record<string, string> {
  if (!tags) return {};
  const result: Record<string, string> = {};
  for (const tag of tags) {
    if (tag.Key && tag.Value) {
      result[tag.Key] = tag.Value;
    }
  }
  return result;
}

export function buildArn(
  service: string,
  resource: string,
  region: string,
  accountId = "",
): string {
  return `arn:aws:${service}:${region}:${accountId}:${resource}`;
}

export function createEdge(
  source: string,
  target: string,
  relationship: RelationshipType,
  label?: string,
): GraphEdge {
  return {
    id: `edge-${nanoid()}`,
    source,
    target,
    relationship,
    label: label ?? relationship,
  };
}
