import { getSettings, saveSettings, getProjects, createProject, deleteProject, getTags, createTag, deleteTag } from '../lib/storage';
import { Settings, Project, Tag } from '../lib/types';
import { DEFAULT_BLOCKED_SITES, ENTITY_COLORS } from '../lib/constants';

let settings: Settings;
let projects: Project[] = [];
let tags: Tag[] = [];
let selectedProjectColor = ENTITY_COLORS[0];
let selectedTagColor = ENTITY_COLORS[0];

async function init(): Promise<void> {
  settings = await getSettings();
  projects = await getProjects();
  tags = await getTags();
  populateForm();
  attachListeners();
  renderSiteLists();
  renderColorPickers();
  renderProjectsList();
  renderTagsList();
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

  // Add project
  (document.getElementById('add-project-form') as HTMLFormElement).addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('project-name-input') as HTMLInputElement;
    const name = input.value.trim();
    if (!name) return;
    await createProject(name, selectedProjectColor);
    projects = await getProjects();
    input.value = '';
    renderProjectsList();
    showSaveStatus();
  });

  // Add tag
  (document.getElementById('add-tag-form') as HTMLFormElement).addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('tag-name-input') as HTMLInputElement;
    const name = input.value.trim();
    if (!name) return;
    await createTag(name, selectedTagColor);
    tags = await getTags();
    input.value = '';
    renderTagsList();
    showSaveStatus();
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

function showSaveStatus(): void {
  const status = document.getElementById('save-status')!;
  status.classList.remove('hidden');
  setTimeout(() => status.classList.add('hidden'), 1500);
}

function renderColorPickers(): void {
  // Project color picker
  const projectPicker = document.getElementById('project-color-picker')!;
  projectPicker.innerHTML = ENTITY_COLORS.map((color, i) => `
    <button type="button" class="color-dot${i === 0 ? ' selected' : ''}" data-color="${color}" data-picker="project" style="background-color: ${color}"></button>
  `).join('');

  projectPicker.querySelectorAll('.color-dot').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const target = e.currentTarget as HTMLElement;
      selectedProjectColor = target.dataset.color!;
      projectPicker.querySelectorAll('.color-dot').forEach((b) => b.classList.remove('selected'));
      target.classList.add('selected');
    });
  });

  // Tag color picker
  const tagPicker = document.getElementById('tag-color-picker')!;
  tagPicker.innerHTML = ENTITY_COLORS.map((color, i) => `
    <button type="button" class="color-dot${i === 0 ? ' selected' : ''}" data-color="${color}" data-picker="tag" style="background-color: ${color}"></button>
  `).join('');

  tagPicker.querySelectorAll('.color-dot').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const target = e.currentTarget as HTMLElement;
      selectedTagColor = target.dataset.color!;
      tagPicker.querySelectorAll('.color-dot').forEach((b) => b.classList.remove('selected'));
      target.classList.add('selected');
    });
  });
}

function renderProjectsList(): void {
  const list = document.getElementById('projects-list')!;
  if (projects.length === 0) {
    list.innerHTML = '<p class="text-xs text-white/30">No projects yet</p>';
    return;
  }

  list.innerHTML = projects.map((project) => `
    <div class="entity-item">
      <span class="entity-color" style="background-color: ${project.color}"></span>
      <span class="entity-name">${escapeHtml(project.name)}</span>
      <button class="entity-delete" data-id="${project.id}" data-type="project">&times;</button>
    </div>
  `).join('');

  list.querySelectorAll('.entity-delete[data-type="project"]').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const target = e.currentTarget as HTMLElement;
      const id = target.dataset.id!;
      await deleteProject(id);
      projects = await getProjects();
      renderProjectsList();
      showSaveStatus();
    });
  });
}

function renderTagsList(): void {
  const list = document.getElementById('tags-list')!;
  if (tags.length === 0) {
    list.innerHTML = '<p class="text-xs text-white/30">No tags yet</p>';
    return;
  }

  list.innerHTML = tags.map((tag) => `
    <div class="entity-item">
      <span class="entity-color" style="background-color: ${tag.color}"></span>
      <span class="entity-name">${escapeHtml(tag.name)}</span>
      <button class="entity-delete" data-id="${tag.id}" data-type="tag">&times;</button>
    </div>
  `).join('');

  list.querySelectorAll('.entity-delete[data-type="tag"]').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const target = e.currentTarget as HTMLElement;
      const id = target.dataset.id!;
      await deleteTag(id);
      tags = await getTags();
      renderTagsList();
      showSaveStatus();
    });
  });
}

init();
