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
import { MAX_DAILY_TASKS } from '../../lib/constants';
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

  const activeTaskIds = timerState.activeTaskIds || (timerState.activeTaskId ? [timerState.activeTaskId] : []);
  const isTimerRunning = timerState.status === 'work' || timerState.status === 'paused' || timerState.status === 'break';

  // Timer display (work, break, paused)
  if (timerState.status !== 'idle') {
    const timerHtml = renderTimer(timerState);

    // Separate active tasks from other tasks
    const workingTasks = activeTasks.filter((t) => activeTaskIds.includes(t.id));
    const otherTasks = activeTasks.filter((t) => !activeTaskIds.includes(t.id));

    const workingTasksHtml = workingTasks.map((t) => renderWorkingTaskCard(t)).join('');
    const otherTasksHtml = otherTasks.map((t) => renderAddableTaskCard(t, timerState)).join('');

    // Show "add more" section only during work or paused state
    const canAddTasks = timerState.status === 'work' || timerState.status === 'paused';
    const addMoreSection = canAddTasks && otherTasks.length > 0 ? `
      <details class="mt-4">
        <summary class="text-xs text-white/40 cursor-pointer hover:text-white/60 select-none">
          + Add more tasks (${otherTasks.length})
        </summary>
        <div class="mt-2 space-y-2">${otherTasksHtml}</div>
      </details>
    ` : '';

    container.innerHTML = `
      ${timerHtml}
      <div class="px-4 pb-4">
        ${workingTasks.length > 0 ? `
          <p class="text-xs text-white/40 uppercase tracking-wide font-medium mb-2">Working on</p>
          <div class="space-y-2">${workingTasksHtml}</div>
        ` : `
          <p class="text-xs text-white/40 text-center py-4">No tasks selected. Timer running without task.</p>
        `}
        ${addMoreSection}
      </div>
    `;

    // Update timer countdown
    const timerEl = container.querySelector('#timer-display');
    if (timerEl && timerState.status !== 'paused') {
      timerInterval = setInterval(() => {
        if (!timerState.startedAt) return;
        const elapsed = Date.now() - timerState.startedAt;
        const remaining = Math.max(0, timerState.remainingMs - elapsed);
        timerEl.textContent = formatTime(remaining);
      }, 200);
    }

    // Timer control buttons
    container.querySelector('#btn-stop-timer')?.addEventListener('click', async () => {
      await chrome.runtime.sendMessage({ type: 'STOP_TIMER' });
      onRefresh();
    });
    container.querySelector('#btn-pause-timer')?.addEventListener('click', async () => {
      await chrome.runtime.sendMessage({ type: 'PAUSE_TIMER' });
      onRefresh();
    });
    container.querySelector('#btn-resume-timer')?.addEventListener('click', async () => {
      await chrome.runtime.sendMessage({ type: 'RESUME_TIMER' });
      onRefresh();
    });
    container.querySelector('#btn-skip-break')?.addEventListener('click', async () => {
      await chrome.runtime.sendMessage({ type: 'SKIP_BREAK' });
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
        <p class="text-xs mb-4">Pick up to ${MAX_DAILY_TASKS} tasks from your backlog</p>
        <button id="btn-go-backlog" class="btn-primary">Open Backlog</button>
      </div>
    `;
    container.querySelector('#btn-go-backlog')?.addEventListener('click', onNavigateToBacklog);
  } else {
    // Tasks present, timer idle
    const tasksHtml = activeTasks.map((t) => renderIdleTaskCard(t)).join('');
    const slotsLeft = MAX_DAILY_TASKS - activeTasks.length;
    const addMore = slotsLeft > 0
      ? `<button id="btn-add-more" class="btn-ghost w-full text-center py-2">+ Add task (${slotsLeft} slot${slotsLeft > 1 ? 's' : ''} left)</button>`
      : '';

    container.innerHTML = `
      <div class="px-4 py-3 space-y-2">
        <div class="flex items-center justify-between">
          <p class="text-xs text-white/40 uppercase tracking-wide font-medium">Today's Tasks</p>
        </div>
        ${tasksHtml}
        ${addMore}
      </div>
    `;

    container.querySelector('#btn-add-more')?.addEventListener('click', onNavigateToBacklog);
  }

  // Attach task action handlers
  attachTaskActions(container, timerState, activeTaskIds, isTimerRunning, onRefresh);
  attachExceptionHandlers(container, onRefresh);
}

function renderTimer(state: TimerState): string {
  const isPaused = state.status === 'paused';
  const elapsed = state.startedAt ? Date.now() - state.startedAt : 0;
  const remaining = isPaused ? state.remainingMs : Math.max(0, state.remainingMs - elapsed);

  const isWork = state.status === 'work' || state.pausedPhase === 'work';
  const isBreak = state.status === 'break' || state.pausedPhase === 'break';

  let label = 'Work Session';
  let color = 'text-work-red';
  let ringColor = 'ring-work-red/30';

  if (isPaused) {
    label = 'Paused';
    color = 'text-accent';
    ringColor = 'ring-accent/30';
  } else if (isBreak) {
    label = 'Break Time';
    color = 'text-break-green';
    ringColor = 'ring-break-green/30';
  }

  const taskCount = (state.activeTaskIds || []).length;
  const taskCountLabel = taskCount > 1 ? `<p class="text-xs text-white/30 mb-1">${taskCount} tasks active</p>` : '';

  const statusText = isPaused
    ? '<p class="text-xs text-white/40 mb-2">Timer paused</p>'
    : isBreak
      ? '<p class="text-xs text-white/40 mb-2">All sites unblocked</p>'
      : '<p class="text-xs text-white/40 mb-2">Distracting sites blocked</p>';

  const pauseResumeBtn = isPaused
    ? '<button id="btn-resume-timer" class="btn-primary text-xs">Resume</button>'
    : (state.status === 'work'
        ? '<button id="btn-pause-timer" class="btn-ghost text-xs">Pause</button>'
        : '');

  const skipBreakBtn = state.status === 'break'
    ? '<button id="btn-skip-break" class="btn-primary text-xs">Skip Break</button>'
    : '';

  return `
    <div class="flex flex-col items-center py-6 px-4">
      <p class="text-xs uppercase tracking-wide font-medium ${color} mb-2">${label}</p>
      ${taskCountLabel}
      <div class="w-32 h-32 rounded-full flex items-center justify-center ring-4 ${ringColor} mb-3">
        <span id="timer-display" class="font-mono text-3xl font-bold ${color}">${formatTime(remaining)}</span>
      </div>
      ${statusText}
      <div class="flex items-center gap-2">
        ${skipBreakBtn}
        ${pauseResumeBtn}
        <button id="btn-stop-timer" class="btn-ghost text-xs">Stop</button>
      </div>
    </div>
  `;
}

// Card for tasks that are currently being worked on
function renderWorkingTaskCard(task: Task): string {
  const timeSpent = task.totalWorkTime > 0
    ? `<span class="text-xs text-white/30">${Math.floor(task.totalWorkTime / 60000)}m</span>`
    : '';

  const pomodoroCount = task.pomodoroCount > 0
    ? `<span class="text-xs text-white/30">${task.pomodoroCount} pom</span>`
    : '';

  return `
    <div class="task-card working" data-task-id="${task.id}">
      <div class="flex items-center justify-between mb-1">
        <span class="text-sm font-medium truncate flex-1 mr-2">${escapeHtml(task.title)}</span>
        <div class="flex items-center gap-2">
          ${timeSpent}
          ${pomodoroCount}
        </div>
      </div>
      <div class="flex items-center gap-1 mt-2">
        <span class="badge badge-warning">Working...</span>
        <div class="flex-1"></div>
        <button class="btn-icon task-action" data-action="complete" data-task-id="${task.id}" title="Complete">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
        </button>
        <button class="btn-icon remove-task-btn" data-task-id="${task.id}" title="Remove from session">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
      ${renderExceptionsSection(task)}
    </div>
  `;
}

// Card for tasks that can be added to current session
function renderAddableTaskCard(task: Task, timerState: TimerState): string {
  const timeSpent = task.totalWorkTime > 0
    ? `<span class="text-xs text-white/30">${Math.floor(task.totalWorkTime / 60000)}m</span>`
    : '';

  const pomodoroCount = task.pomodoroCount > 0
    ? `<span class="text-xs text-white/30">${task.pomodoroCount} pom</span>`
    : '';

  return `
    <div class="task-card" data-task-id="${task.id}">
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium truncate flex-1 mr-2">${escapeHtml(task.title)}</span>
        <div class="flex items-center gap-2">
          ${timeSpent}
          ${pomodoroCount}
          <button class="btn-ghost text-xs add-task-btn" data-task-id="${task.id}">+ Add</button>
        </div>
      </div>
    </div>
  `;
}

// Card for idle state (with Start button)
function renderIdleTaskCard(task: Task): string {
  const timeSpent = task.totalWorkTime > 0
    ? `<span class="text-xs text-white/30">${Math.floor(task.totalWorkTime / 60000)}m</span>`
    : '';

  const pomodoroCount = task.pomodoroCount > 0
    ? `<span class="text-xs text-white/30">${task.pomodoroCount} pom</span>`
    : '';

  return `
    <div class="task-card active-task" data-task-id="${task.id}">
      <div class="flex items-center justify-between mb-1">
        <span class="text-sm font-medium truncate flex-1 mr-2">${escapeHtml(task.title)}</span>
        <div class="flex items-center gap-2">
          ${timeSpent}
          ${pomodoroCount}
          <button class="btn-primary text-xs start-task-btn" data-task-id="${task.id}">Start</button>
        </div>
      </div>
      <div class="flex items-center gap-1 mt-2">
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

function attachTaskActions(
  container: HTMLElement,
  timerState: TimerState,
  activeTaskIds: string[],
  isTimerRunning: boolean,
  onRefresh: () => void
): void {
  // Start button (when timer is idle)
  container.querySelectorAll('.start-task-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const target = e.currentTarget as HTMLElement;
      const taskId = target.dataset.taskId;
      if (!taskId) return;
      await chrome.runtime.sendMessage({ type: 'START_TIMER', taskIds: [taskId] });
      onRefresh();
    });
  });

  // Add button (when timer is running)
  container.querySelectorAll('.add-task-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const target = e.currentTarget as HTMLElement;
      const taskId = target.dataset.taskId;
      if (!taskId) return;
      await chrome.runtime.sendMessage({ type: 'ADD_TASK_TO_TIMER', taskId });
      onRefresh();
    });
  });

  // Remove button (when timer is running and task is active)
  container.querySelectorAll('.remove-task-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const target = e.currentTarget as HTMLElement;
      const taskId = target.dataset.taskId;
      if (!taskId) return;
      await chrome.runtime.sendMessage({ type: 'REMOVE_TASK_FROM_TIMER', taskId });
      onRefresh();
    });
  });

  // Task actions (complete, tomorrow, backlog, delete)
  container.querySelectorAll('.task-action').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const target = e.currentTarget as HTMLElement;
      const action = target.dataset.action;
      const taskId = target.dataset.taskId;
      if (!action || !taskId) return;

      const isActiveTask = activeTaskIds.includes(taskId);

      // If task is being worked on, first remove it from timer
      if (isTimerRunning && isActiveTask) {
        if (activeTaskIds.length === 1) {
          // Last active task - stop timer completely
          await chrome.runtime.sendMessage({ type: 'STOP_TIMER' });
        } else {
          // Remove from active tasks
          await chrome.runtime.sendMessage({ type: 'REMOVE_TASK_FROM_TIMER', taskId });
        }
      }

      switch (action) {
        case 'complete':
          await completeTask(taskId);
          break;
        case 'tomorrow':
          await moveTaskToTomorrow(taskId);
          break;
        case 'backlog':
          await moveTaskToBacklog(taskId);
          break;
        case 'delete':
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
