import { getBlockingConfig } from '../lib/blocklist';

const BLOCK_RULE_ID_OFFSET = 1000;
const ALLOW_RULE_ID_OFFSET = 5000;

export async function enableBlocking(activeTaskIds?: string[] | null): Promise<void> {
  const config = await getBlockingConfig(activeTaskIds);
  console.log('[Focus] enableBlocking called, domains to block:', config.blockedDomains.length,
    'excluded subdomains:', config.excludedSubdomains,
    'allowed paths:', config.allowedUrlFilters);

  if (config.blockedDomains.length === 0) {
    console.log('[Focus] No domains to block!');
    return;
  }

  const redirectUrl = chrome.runtime.getURL('blocked/blocked.html');

  // Block rules for each domain, with subdomain exclusions
  const blockRules: chrome.declarativeNetRequest.Rule[] = config.blockedDomains.map((domain, i) => ({
    id: BLOCK_RULE_ID_OFFSET + i,
    priority: 1,
    action: {
      type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
      redirect: { url: `${redirectUrl}?url=${encodeURIComponent(domain)}` },
    },
    condition: {
      requestDomains: [domain],
      excludedRequestDomains: config.excludedSubdomains.length > 0 ? config.excludedSubdomains : undefined,
      resourceTypes: [chrome.declarativeNetRequest.ResourceType.MAIN_FRAME],
    },
  }));

  // ALLOW rules for path-based exceptions (higher priority)
  const allowRules: chrome.declarativeNetRequest.Rule[] = config.allowedUrlFilters.map((filter, i) => ({
    id: ALLOW_RULE_ID_OFFSET + i,
    priority: 2,
    action: {
      type: chrome.declarativeNetRequest.RuleActionType.ALLOW,
    },
    condition: {
      urlFilter: filter,
      resourceTypes: [chrome.declarativeNetRequest.ResourceType.MAIN_FRAME],
    },
  }));

  const addRules = [...blockRules, ...allowRules];

  // Remove old rules first
  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const removeRuleIds = existingRules.map((r) => r.id);

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds,
    addRules,
  });
  console.log('[Focus] Blocking rules applied:', blockRules.length, 'block +', allowRules.length, 'allow');
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
