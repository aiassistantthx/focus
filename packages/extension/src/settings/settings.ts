import { getSettings, saveSettings } from '../lib/storage';
import { Settings } from '../lib/types';
import { DEFAULT_BLOCKED_SITES } from '../lib/constants';

let settings: Settings;

async function init(): Promise<void> {
  settings = await getSettings();
  populateForm();
  attachListeners();
  renderSiteLists();
}

function populateForm(): void {
  (document.getElementById('work-duration') as HTMLInputElement).value = String(settings.workDurationMin);
  (document.getElementById('break-duration') as HTMLInputElement).value = String(settings.breakDurationMin);
  (document.getElementById('sound-enabled') as HTMLInputElement).checked = settings.soundEnabled;
  (document.getElementById('sound-volume') as HTMLInputElement).value = String(settings.soundVolume);
  (document.getElementById('blocking-enabled') as HTMLInputElement).checked = settings.blockingEnabled;
}

function attachListeners(): void {
  // Auto-save on change
  const autoSaveFields = ['work-duration', 'break-duration', 'sound-enabled', 'sound-volume', 'blocking-enabled'];
  autoSaveFields.forEach((id) => {
    document.getElementById(id)?.addEventListener('change', () => {
      readFormValues();
      save();
    });
  });

  // Add blocked site
  (document.getElementById('add-blocked-form') as HTMLFormElement).addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('blocked-site-input') as HTMLInputElement;
    const domain = normalizeDomain(input.value);
    if (domain && !settings.blockedSites.includes(domain)) {
      settings.blockedSites.push(domain);
      input.value = '';
      save();
      renderSiteLists();
    }
  });

  // Add allowed site
  (document.getElementById('add-allowed-form') as HTMLFormElement).addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('allowed-site-input') as HTMLInputElement;
    const domain = normalizeDomain(input.value);
    if (domain && !settings.allowedSites.includes(domain)) {
      settings.allowedSites.push(domain);
      input.value = '';
      save();
      renderSiteLists();
    }
  });

  // Toggle default sites visibility
  document.getElementById('toggle-defaults')?.addEventListener('click', () => {
    const list = document.getElementById('default-sites-list')!;
    const btn = document.getElementById('toggle-defaults')!;
    list.classList.toggle('hidden');
    btn.textContent = list.classList.contains('hidden') ? 'Show default blocked sites' : 'Hide default blocked sites';
  });
}

function readFormValues(): void {
  settings.workDurationMin = parseInt((document.getElementById('work-duration') as HTMLInputElement).value) || 50;
  settings.breakDurationMin = parseInt((document.getElementById('break-duration') as HTMLInputElement).value) || 10;
  settings.soundEnabled = (document.getElementById('sound-enabled') as HTMLInputElement).checked;
  settings.soundVolume = parseInt((document.getElementById('sound-volume') as HTMLInputElement).value) || 80;
  settings.blockingEnabled = (document.getElementById('blocking-enabled') as HTMLInputElement).checked;
}

async function save(): Promise<void> {
  await saveSettings(settings);
  const status = document.getElementById('save-status')!;
  status.classList.remove('hidden');
  setTimeout(() => status.classList.add('hidden'), 1500);
}

function renderSiteLists(): void {
  // Custom blocked
  const blockedList = document.getElementById('blocked-sites-list')!;
  blockedList.innerHTML = settings.blockedSites
    .map(
      (site) => `
    <div class="site-tag">
      <span>${escapeHtml(site)}</span>
      <button data-action="remove-blocked" data-site="${escapeHtml(site)}">&times;</button>
    </div>
  `,
    )
    .join('');

  blockedList.querySelectorAll('[data-action="remove-blocked"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const site = (btn as HTMLElement).dataset.site!;
      settings.blockedSites = settings.blockedSites.filter((s) => s !== site);
      save();
      renderSiteLists();
    });
  });

  // Allowed (exceptions)
  const allowedList = document.getElementById('allowed-sites-list')!;
  allowedList.innerHTML = settings.allowedSites
    .map(
      (site) => `
    <div class="site-tag">
      <span>${escapeHtml(site)}</span>
      <button data-action="remove-allowed" data-site="${escapeHtml(site)}">&times;</button>
    </div>
  `,
    )
    .join('');

  allowedList.querySelectorAll('[data-action="remove-allowed"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const site = (btn as HTMLElement).dataset.site!;
      settings.allowedSites = settings.allowedSites.filter((s) => s !== site);
      save();
      renderSiteLists();
    });
  });

  // Default blocked (read-only)
  const defaultList = document.getElementById('default-sites-list')!;
  const uniqueDefaults = [...new Set(DEFAULT_BLOCKED_SITES.map((s) => s.replace(/^www\./, '')))];
  defaultList.innerHTML = uniqueDefaults
    .map((site) => `<div class="site-tag"><span>${escapeHtml(site)}</span></div>`)
    .join('');
}

function normalizeDomain(input: string): string {
  let domain = input.trim().toLowerCase();
  domain = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  return domain;
}

function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

init();
