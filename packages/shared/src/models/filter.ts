import type { ResourceCategory, ResourceType } from '../constants/resource-types.js';

export interface FilterCriteria {
  readonly resourceTypes?: readonly ResourceType[];
  readonly categories?: readonly ResourceCategory[];
  readonly regions?: readonly string[];
  readonly searchQuery?: string;
  readonly vpcIds?: readonly string[];
}

export function isEmptyFilter(filter: FilterCriteria): boolean {
  return (
    !filter.resourceTypes?.length &&
    !filter.categories?.length &&
    !filter.regions?.length &&
    !filter.searchQuery &&
    !filter.vpcIds?.length
  );
}
