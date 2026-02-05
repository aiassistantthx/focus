import { getBlockingConfig } from '../lib/blocklist';

const BLOCK_RULE_ID_OFFSET = 1000;
const ALLOW_RULE_ID_OFFSET = 5000;

export async function enableBlocking(activeTaskIds?: string[] | null): Promise<void> {
  const config = await getBlockingConfig(activeTaskIds);
  console.log('[Focus] enableBlocking called, domains to block:', config.blockedDomains.length,
    'excluded subdomains:', config.excludedSubdomains,
    'allowed paths:', config.allowedUrlFilters);

  // Always remove old rules first
  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const removeRuleIds = existingRules.map((r) => r.id);

  if (config.blockedDomains.length === 0) {
    // No domains to block — just clear existing rules
    if (removeRuleIds.length > 0) {
      await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds, addRules: [] });
    }
    return;
  }

  const redirectUrl = chrome.runtime.getURL('blocked/blocked.html');

  // Block rules for each domain, with subdomain exclusions
  const blockRules: chrome.declarativeNetRequest.Rule[] = config.blockedDomains.map((domain, i) => {
    const condition: chrome.declarativeNetRequest.RuleCondition = {
      requestDomains: [domain],
      resourceTypes: [chrome.declarativeNetRequest.ResourceType.MAIN_FRAME],
    };
    if (config.excludedSubdomains.length > 0) {
      condition.excludedRequestDomains = config.excludedSubdomains;
    }
    return {
      id: BLOCK_RULE_ID_OFFSET + i,
      priority: 1,
      action: {
        type: chrome.declarativeNetRequest.RuleActionType.REDIRECT as chrome.declarativeNetRequest.RuleActionType,
        redirect: { url: `${redirectUrl}?url=${encodeURIComponent(domain)}` },
      },
      condition,
    };
  });

  // ALLOW rules for path-based exceptions (higher priority)
  const allowRules: chrome.declarativeNetRequest.Rule[] = config.allowedUrlFilters.map((filter, i) => ({
    id: ALLOW_RULE_ID_OFFSET + i,
    priority: 2,
    action: {
      type: chrome.declarativeNetRequest.RuleActionType.ALLOW as chrome.declarativeNetRequest.RuleActionType,
    },
    condition: {
      urlFilter: filter,
      resourceTypes: [chrome.declarativeNetRequest.ResourceType.MAIN_FRAME],
    },
  }));

  const addRules = [...blockRules, ...allowRules];

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
