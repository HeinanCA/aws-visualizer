const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

export async function collectPages<TPage, TItem>(
  paginate: () => AsyncIterable<TPage>,
  extractItems: (page: TPage) => TItem[] | undefined,
): Promise<readonly TItem[]> {
  const items: TItem[] = [];
  let retries = 0;

  try {
    for await (const page of paginate()) {
      const pageItems = extractItems(page);
      if (pageItems) {
        items.push(...pageItems);
      }
    }
  } catch (error) {
    if (isThrottlingError(error) && retries < MAX_RETRIES) {
      retries++;
      const delay = BASE_DELAY_MS * Math.pow(2, retries);
      await sleep(delay);
      return collectPages(paginate, extractItems);
    }
    throw error;
  }

  return items;
}

function isThrottlingError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.name === 'ThrottlingException' ||
      error.name === 'Throttling' ||
      error.name === 'TooManyRequestsException' ||
      error.name === 'RequestLimitExceeded'
    );
  }
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
