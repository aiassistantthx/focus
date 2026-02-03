import { getEffectiveBlockedDomains } from '../lib/blocklist';

const RULE_ID_OFFSET = 1000;

export async function enableBlocking(activeTaskIds?: string[] | null): Promise<void> {
  const domains = await getEffectiveBlockedDomains(activeTaskIds);
  console.log('[Focus] enableBlocking called, domains to block:', domains.length, domains.slice(0, 5));
  if (domains.length === 0) {
    console.log('[Focus] No domains to block!');
    return;
  }

  const redirectUrl = chrome.runtime.getURL('blocked/blocked.html');

  const addRules: chrome.declarativeNetRequest.Rule[] = domains.map((domain, i) => ({
    id: RULE_ID_OFFSET + i,
    priority: 1,
    action: {
      type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
      redirect: { url: `${redirectUrl}?url=${encodeURIComponent(domain)}` },
    },
    condition: {
      requestDomains: [domain],
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
  console.log('[Focus] Blocking rules applied:', addRules.length);
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
