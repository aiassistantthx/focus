import { Task, TimerState } from '../../lib/types';
import {
  getDayPlan,
  getTasks,
  completeTask,
  moveTaskToBacklog,
  moveTaskToTomorrow,
  deleteTask,
  updateTask,
} from '../../lib/storage';
import { formatTime } from '../../lib/utils';

let timerInterval: ReturnType<typeof setInterval> | null = null;

export async function renderActiveTasks(
  container: HTMLElement,
  timerState: TimerState,
  onNavigateToBacklog: () => void,
  onRefresh: () => void,
): Promise<void> {
  const plan = await getDayPlan();
  const allTasks = await getTasks();
  const activeTasks = plan.taskIds
    .map((id) => allTasks.find((t) => t.id === id))
    .filter((t): t is Task => t !== undefined && t.status !== 'completed' && t.status !== 'deleted');

  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  // Timer display
  if (timerState.status !== 'idle') {
    const timerHtml = renderTimer(timerState);
    const tasksHtml = activeTasks.map((t) => renderTaskCard(t, timerState)).join('');

    container.innerHTML = `
      ${timerHtml}
      <div class="px-4 pb-4 space-y-2">${tasksHtml}</div>
    `;

    // Update timer countdown
    const timerEl = container.querySelector('#timer-display');
    if (timerEl) {
      timerInterval = setInterval(() => {
        if (!timerState.startedAt) return;
        const elapsed = Date.now() - timerState.startedAt;
        const remaining = Math.max(0, timerState.remainingMs - elapsed);
        timerEl.textContent = formatTime(remaining);
      }, 200);
    }

    // Stop button
    container.querySelector('#btn-stop-timer')?.addEventListener('click', async () => {
      await chrome.runtime.sendMessage({ type: 'STOP_TIMER' });
      onRefresh();
    });
  } else if (activeTasks.length === 0) {
    // Empty state
    container.innerHTML = `
      <div class="empty-state">
        <svg class="w-12 h-12 mb-3 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <p class="text-sm font-medium mb-1">No tasks for today</p>
        <p class="text-xs mb-4">Pick up to 3 tasks from your backlog</p>
        <button id="btn-go-backlog" class="btn-primary">Open Backlog</button>
      </div>
    `;
    container.querySelector('#btn-go-backlog')?.addEventListener('click', onNavigateToBacklog);
  } else {
    // Tasks selected, timer idle
    const tasksHtml = activeTasks.map((t) => renderTaskCard(t, timerState)).join('');
    const slotsLeft = 3 - activeTasks.length;
    const addMore = slotsLeft > 0
      ? `<button id="btn-add-more" class="btn-ghost w-full text-center py-2">+ Add task (${slotsLeft} slot${slotsLeft > 1 ? 's' : ''} left)</button>`
      : '';

    container.innerHTML = `
      <div class="px-4 py-3 space-y-2">
        <p class="text-xs text-white/40 uppercase tracking-wide font-medium">Today's Tasks</p>
        ${tasksHtml}
        ${addMore}
      </div>
    `;

    container.querySelector('#btn-add-more')?.addEventListener('click', onNavigateToBacklog);
  }

  // Attach task action handlers
  attachTaskActions(container, timerState, onRefresh);
  attachExceptionHandlers(container, onRefresh);
}

function renderTimer(state: TimerState): string {
  const elapsed = state.startedAt ? Date.now() - state.startedAt : 0;
  const remaining = Math.max(0, state.remainingMs - elapsed);
  const isWork = state.status === 'work';
  const label = isWork ? 'Work Session' : 'Break Time';
  const color = isWork ? 'text-work-red' : 'text-break-green';
  const ringColor = isWork ? 'ring-work-red/30' : 'ring-break-green/30';

  return `
    <div class="flex flex-col items-center py-6 px-4">
      <p class="text-xs uppercase tracking-wide font-medium ${color} mb-2">${label}</p>
      <div class="w-32 h-32 rounded-full flex items-center justify-center ring-4 ${ringColor} mb-3">
        <span id="timer-display" class="font-mono text-3xl font-bold ${color}">${formatTime(remaining)}</span>
      </div>
      ${!isWork ? '<p class="text-xs text-white/40 mb-2">All sites unblocked</p>' : '<p class="text-xs text-white/40 mb-2">Distracting sites blocked</p>'}
      <button id="btn-stop-timer" class="btn-ghost text-xs">Stop Timer</button>
    </div>
  `;
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

function renderTaskCard(task: Task, timerState: TimerState): string {
  const isWorking = timerState.status === 'work' && timerState.activeTaskId === task.id;
  const isIdle = timerState.status === 'idle';
  const cardClass = isWorking ? 'task-card working' : 'task-card active-task';

  const timeSpent = task.totalWorkTime > 0
    ? `<span class="text-xs text-white/30">${Math.floor(task.totalWorkTime / 60000)}m</span>`
    : '';

  const pomodoroCount = task.pomodoroCount > 0
    ? `<span class="text-xs text-white/30">${task.pomodoroCount} pom</span>`
    : '';

  return `
    <div class="${cardClass}" data-task-id="${task.id}">
      <div class="flex items-center justify-between mb-1">
        <span class="text-sm font-medium truncate flex-1 mr-2">${escapeHtml(task.title)}</span>
        <div class="flex items-center gap-2">
          ${timeSpent}
          ${pomodoroCount}
        </div>
      </div>
      <div class="flex items-center gap-1 mt-2">
        ${isIdle ? `<button class="btn-primary text-xs task-action" data-action="start" data-task-id="${task.id}">Start</button>` : ''}
        ${isWorking ? `<span class="badge badge-warning">Working...</span>` : ''}
        <div class="flex-1"></div>
        <button class="btn-icon task-action" data-action="complete" data-task-id="${task.id}" title="Complete">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
        </button>
        <button class="btn-icon task-action" data-action="tomorrow" data-task-id="${task.id}" title="Move to tomorrow">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
        </button>
        <button class="btn-icon task-action" data-action="backlog" data-task-id="${task.id}" title="Move to backlog">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2"/></svg>
        </button>
        <button class="btn-icon task-action text-red-400/50 hover:text-red-400" data-action="delete" data-task-id="${task.id}" title="Delete">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
        </button>
      </div>
      ${renderExceptionsSection(task)}
    </div>
  `;
}

function attachTaskActions(container: HTMLElement, timerState: TimerState, onRefresh: () => void): void {
  container.querySelectorAll('.task-action').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const target = e.currentTarget as HTMLElement;
      const action = target.dataset.action;
      const taskId = target.dataset.taskId;
      if (!action || !taskId) return;

      switch (action) {
        case 'start':
          if (timerState.status !== 'idle') return;
          await chrome.runtime.sendMessage({ type: 'START_TIMER', taskId });
          break;
        case 'complete':
          if (timerState.status === 'work' && timerState.activeTaskId === taskId) {
            await chrome.runtime.sendMessage({ type: 'STOP_TIMER' });
          }
          await completeTask(taskId);
          break;
        case 'tomorrow':
          if (timerState.status === 'work' && timerState.activeTaskId === taskId) {
            await chrome.runtime.sendMessage({ type: 'STOP_TIMER' });
          }
          await moveTaskToTomorrow(taskId);
          break;
        case 'backlog':
          if (timerState.status === 'work' && timerState.activeTaskId === taskId) {
            await chrome.runtime.sendMessage({ type: 'STOP_TIMER' });
          }
          await moveTaskToBacklog(taskId);
          break;
        case 'delete':
          if (timerState.status === 'work' && timerState.activeTaskId === taskId) {
            await chrome.runtime.sendMessage({ type: 'STOP_TIMER' });
          }
          await deleteTask(taskId);
          break;
      }
      onRefresh();
    });
  });
}

function attachExceptionHandlers(container: HTMLElement, onRefresh: () => void): void {
  // Add exception
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

  // Remove exception
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
