import { DEFAULT_BLOCKED_SITES } from './constants';
import { getSettings, getTask } from './storage';

export async function getEffectiveBlockedDomains(activeTaskIds?: string[] | null): Promise<string[]> {
  const settings = await getSettings();
  if (!settings.blockingEnabled) return [];

  const allowSet = new Set(settings.allowedSites.map((s) => s.toLowerCase()));

  // Add task-specific site exceptions from all active tasks
  if (activeTaskIds && activeTaskIds.length > 0) {
    for (const taskId of activeTaskIds) {
      const task = await getTask(taskId);
      if (task?.siteExceptions) {
        for (const site of task.siteExceptions) {
          allowSet.add(site.toLowerCase());
        }
      }
    }
  }

  const allBlocked = [...DEFAULT_BLOCKED_SITES, ...settings.blockedSites];
  const unique = [...new Set(allBlocked.map((s) => s.toLowerCase()))];

  return unique.filter((domain) => {
    const bare = domain.replace(/^www\./, '');
    return !allowSet.has(domain) && !allowSet.has(bare) && !allowSet.has('www.' + bare);
  });
}
