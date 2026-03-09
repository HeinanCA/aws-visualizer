export const RelationshipType = {
  CONTAINS: 'contains',
  ROUTES_TO: 'routes_to',
  ATTACHED_TO: 'attached_to',
  TARGETS: 'targets',
  PUBLISHES_TO: 'publishes_to',
  TRIGGERS: 'triggers',
  ASSUMES: 'assumes',
  MONITORS: 'monitors',
  PEERS_WITH: 'peers_with',
  MEMBER_OF: 'member_of',
  LOGS_TO: 'logs_to',
} as const;

export type RelationshipType =
  (typeof RelationshipType)[keyof typeof RelationshipType];

export interface RelationshipTypeMetadata {
  readonly label: string;
  readonly directed: boolean;
}

export const RELATIONSHIP_TYPE_METADATA: Readonly<
  Record<RelationshipType, RelationshipTypeMetadata>
> = {
  [RelationshipType.CONTAINS]: { label: 'Contains', directed: true },
  [RelationshipType.ROUTES_TO]: { label: 'Routes to', directed: true },
  [RelationshipType.ATTACHED_TO]: { label: 'Attached to', directed: true },
  [RelationshipType.TARGETS]: { label: 'Targets', directed: true },
  [RelationshipType.PUBLISHES_TO]: { label: 'Publishes to', directed: true },
  [RelationshipType.TRIGGERS]: { label: 'Triggers', directed: true },
  [RelationshipType.ASSUMES]: { label: 'Assumes', directed: true },
  [RelationshipType.MONITORS]: { label: 'Monitors', directed: true },
  [RelationshipType.PEERS_WITH]: { label: 'Peers with', directed: false },
  [RelationshipType.MEMBER_OF]: { label: 'Member of', directed: true },
  [RelationshipType.LOGS_TO]: { label: 'Logs to', directed: true },
};
