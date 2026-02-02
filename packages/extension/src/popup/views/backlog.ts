import { Task } from '../../lib/types';
import { getTasks, createTask, deleteTask, addTaskToToday, updateTask, getDayPlan } from '../../lib/storage';
import { TASK_EXPIRY_DAYS, TASK_EXPIRY_WARNING_DAYS, MAX_DAILY_TASKS } from '../../lib/constants';
import { daysAgo } from '../../lib/utils';

export async function renderBacklog(container: HTMLElement, onRefresh: () => void): Promise<void> {
  const allTasks = await getTasks();
  const backlogTasks = allTasks
    .filter((t) => t.status === 'backlog')
    .sort((a, b) => b.lastInteractedAt - a.lastInteractedAt);

  const plan = await getDayPlan();
  const slotsLeft = MAX_DAILY_TASKS - plan.taskIds.length;

  const taskListHtml = backlogTasks.length > 0
    ? backlogTasks.map((t) => renderBacklogTask(t, slotsLeft > 0)).join('')
    : `<div class="empty-state py-6">
        <p class="text-sm text-white/40">Backlog is empty</p>
        <p class="text-xs text-white/30 mt-1">Add a task below</p>
      </div>`;

  container.innerHTML = `
    <div class="px-4 py-3">
      <div class="flex items-center justify-between mb-3">
        <p class="text-xs text-white/40 uppercase tracking-wide font-medium">Backlog</p>
        <span class="text-xs text-white/30">${backlogTasks.length} task${backlogTasks.length !== 1 ? 's' : ''}</span>
      </div>

      <form id="add-task-form" class="flex gap-2 mb-3">
        <input
          type="text"
          id="new-task-input"
          class="input-field flex-1"
          placeholder="Add a new task..."
          maxlength="200"
          autofocus
        />
        <button type="submit" class="btn-primary">Add</button>
      </form>

      <div id="backlog-list" class="space-y-2">
        ${taskListHtml}
      </div>
    </div>
  `;

  // Add task form
  const form = container.querySelector('#add-task-form') as HTMLFormElement;
  const input = container.querySelector('#new-task-input') as HTMLInputElement;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = input.value.trim();
    if (!title) return;
    await createTask(title);
    input.value = '';
    onRefresh();
  });

  // Task actions
  container.querySelectorAll('.backlog-action').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const target = e.currentTarget as HTMLElement;
      const action = target.dataset.action;
      const taskId = target.dataset.taskId;
      if (!action || !taskId) return;

      switch (action) {
        case 'add-today':
          await addTaskToToday(taskId);
          break;
        case 'keep':
          await updateTask(taskId, {});
          break;
        case 'delete':
          await deleteTask(taskId);
          break;
      }
      onRefresh();
    });
  });

  // Exception handlers
  attachExceptionHandlers(container, onRefresh);
}

function renderExceptionsSection(task: Task): string {
  const exceptions = task.siteExceptions ?? [];
  const exceptionsList = exceptions
    .map(
      (site) =>
        `<div class="flex items-center justify-between py-0.5">
          <span class="text-xs text-white/50 truncate">${escapeHtml(site)}</span>
          <button class="text-red-400/50 hover:text-red-400 exception-remove" data-task-id="${task.id}" data-site="${escapeHtml(site)}" title="Remove">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>`
    )
    .join('');

  return `
    <details class="mt-1.5 exception-details">
      <summary class="text-xs text-white/30 cursor-pointer hover:text-white/50 select-none">
        Allowed sites${exceptions.length > 0 ? ` (${exceptions.length})` : ''}
      </summary>
      <div class="mt-1.5 pl-1">
        ${exceptionsList}
        <form class="flex gap-1 mt-1 exception-form" data-task-id="${task.id}">
          <input type="text" class="input-field text-xs flex-1 py-0.5 px-1.5" placeholder="e.g. x.com" data-exception-input />
          <button type="submit" class="btn-ghost text-xs py-0.5 px-1.5">Add</button>
        </form>
      </div>
    </details>
  `;
}

function renderBacklogTask(task: Task, canAddToday: boolean): string {
  const age = daysAgo(task.lastInteractedAt);
  const daysUntilExpiry = TASK_EXPIRY_DAYS - age;
  const isExpiring = daysUntilExpiry <= TASK_EXPIRY_WARNING_DAYS && daysUntilExpiry > 0;
  const expiryBadge = isExpiring
    ? `<span class="badge badge-warning">Expires in ${daysUntilExpiry}d</span>`
    : '';

  return `
    <div class="task-card" data-task-id="${task.id}">
      <div class="flex items-center justify-between">
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium truncate">${escapeHtml(task.title)}</p>
          <div class="flex items-center gap-2 mt-0.5">
            ${expiryBadge}
            ${task.pomodoroCount > 0 ? `<span class="text-xs text-white/30">${task.pomodoroCount} pom</span>` : ''}
          </div>
        </div>
        <div class="flex items-center gap-1 ml-2 shrink-0">
          ${canAddToday ? `
            <button class="btn-ghost text-xs backlog-action" data-action="add-today" data-task-id="${task.id}" title="Add to today">
              Today
            </button>
          ` : ''}
          ${isExpiring ? `
            <button class="btn-icon backlog-action" data-action="keep" data-task-id="${task.id}" title="Mark as still relevant">
              <svg class="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            </button>
          ` : ''}
          <button class="btn-icon backlog-action text-red-400/50 hover:text-red-400" data-action="delete" data-task-id="${task.id}" title="Delete">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>
        </div>
      </div>
      ${renderExceptionsSection(task)}
    </div>
  `;
}

function attachExceptionHandlers(container: HTMLElement, onRefresh: () => void): void {
  container.querySelectorAll('.exception-form').forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formEl = e.currentTarget as HTMLFormElement;
      const taskId = formEl.dataset.taskId;
      const input = formEl.querySelector('[data-exception-input]') as HTMLInputElement;
      if (!taskId || !input) return;

      const site = input.value.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      if (!site) return;

      const task = (await getTasks()).find((t) => t.id === taskId);
      if (!task) return;

      const exceptions = task.siteExceptions ?? [];
      if (exceptions.includes(site)) {
        input.value = '';
        return;
      }

      await updateTask(taskId, { siteExceptions: [...exceptions, site] });
      onRefresh();
    });
  });

  container.querySelectorAll('.exception-remove').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const target = e.currentTarget as HTMLElement;
      const taskId = target.dataset.taskId;
      const site = target.dataset.site;
      if (!taskId || !site) return;

      const task = (await getTasks()).find((t) => t.id === taskId);
      if (!task) return;

      const exceptions = (task.siteExceptions ?? []).filter((s) => s !== site);
      await updateTask(taskId, { siteExceptions: exceptions });
      onRefresh();
    });
  });
}

function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
