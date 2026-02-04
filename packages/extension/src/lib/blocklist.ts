import { DEFAULT_BLOCKED_SITES, DEFAULT_ALLOWED_SUBDOMAINS, DEFAULT_ALLOWED_PATHS } from './constants';
import { getSettings, getTask } from './storage';

export interface BlockingConfig {
  blockedDomains: string[];
  excludedSubdomains: string[];
  allowedUrlFilters: string[];
}

export async function getBlockingConfig(activeTaskIds?: string[] | null): Promise<BlockingConfig> {
  const settings = await getSettings();
  if (!settings.blockingEnabled) {
    return { blockedDomains: [], excludedSubdomains: [], allowedUrlFilters: [] };
  }

  // Collect all allowed entries from global settings + task exceptions
  const allAllowed: string[] = [
    ...settings.allowedSites.map((s) => s.toLowerCase()),
  ];

  if (activeTaskIds && activeTaskIds.length > 0) {
    for (const taskId of activeTaskIds) {
      const task = await getTask(taskId);
      if (task?.siteExceptions) {
        for (const site of task.siteExceptions) {
          allAllowed.push(site.toLowerCase());
        }
      }
    }
  }

  // Build the full blocked domains list
  const allBlocked = [...DEFAULT_BLOCKED_SITES, ...settings.blockedSites];
  const blockedSet = new Set(allBlocked.map((s) => s.toLowerCase()));

  // Separate allowed entries into categories:
  // 1. Exact domain matches → remove from blocked list
  // 2. Subdomains of blocked domains → excludedRequestDomains
  // 3. Paths (contain '/') → ALLOW rules with urlFilter
  const exactAllowed = new Set<string>();
  const subdomainExclusions = new Set<string>(DEFAULT_ALLOWED_SUBDOMAINS.map((s) => s.toLowerCase()));
  const pathExclusions = new Set<string>(DEFAULT_ALLOWED_PATHS.map((s) => s.toLowerCase()));

  for (const entry of allAllowed) {
    if (entry.includes('/')) {
      // Path-based exception (e.g. x.com/i/grok)
      pathExclusions.add(entry);
    } else if (isSubdomainOfBlocked(entry, blockedSet)) {
      // Subdomain of a blocked domain (e.g. music.youtube.com)
      subdomainExclusions.add(entry);
    } else {
      // Exact domain match
      exactAllowed.add(entry);
      const bare = entry.replace(/^www\./, '');
      exactAllowed.add(bare);
      exactAllowed.add('www.' + bare);
    }
  }

  // Filter blocked domains by exact allowed entries
  const blockedDomains = [...blockedSet].filter((domain) => !exactAllowed.has(domain));

  return {
    blockedDomains,
    excludedSubdomains: [...subdomainExclusions],
    allowedUrlFilters: [...pathExclusions].map((p) => `||${p}`),
  };
}

function isSubdomainOfBlocked(domain: string, blockedSet: Set<string>): boolean {
  const parts = domain.split('.');
  for (let i = 1; i < parts.length; i++) {
    const parent = parts.slice(i).join('.');
    if (blockedSet.has(parent)) {
      return true;
    }
  }
  return false;
}

// Backwards-compatible wrapper used by existing code
export async function getEffectiveBlockedDomains(activeTaskIds?: string[] | null): Promise<string[]> {
  const config = await getBlockingConfig(activeTaskIds);
  return config.blockedDomains;
}
