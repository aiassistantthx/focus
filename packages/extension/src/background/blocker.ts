import { getEffectiveBlockedDomains } from '../lib/blocklist';

const RULE_ID_OFFSET = 1000;

export async function enableBlocking(activeTaskId?: string | null): Promise<void> {
  const domains = await getEffectiveBlockedDomains(activeTaskId);
  if (domains.length === 0) return;

  const redirectUrl = chrome.runtime.getURL('blocked/blocked.html');

  const addRules: chrome.declarativeNetRequest.Rule[] = domains.map((domain, i) => ({
    id: RULE_ID_OFFSET + i,
    priority: 1,
    action: {
      type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
      redirect: { url: `${redirectUrl}?url=${encodeURIComponent(domain)}` },
    },
    condition: {
      urlFilter: `||${domain}`,
      resourceTypes: [chrome.declarativeNetRequest.ResourceType.MAIN_FRAME],
    },
  }));

  // Remove old rules first
  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const removeRuleIds = existingRules.map((r) => r.id);

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds,
    addRules,
  });
}

export async function disableBlocking(): Promise<void> {
  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const removeRuleIds = existingRules.map((r) => r.id);
  if (removeRuleIds.length > 0) {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds,
      addRules: [],
    });
  }
}
