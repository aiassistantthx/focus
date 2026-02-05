import {
  getTimerState,
  saveTimerState,
  getSettings,
  getTask,
  updateTask,
  addPomodoroRecord,
  getDailyStatsForDate,
  updateDailyStats,
} from '../lib/storage';
import { TimerState, MessageType } from '../lib/types';
import { ALARM_WORK_END, ALARM_BREAK_END, ALARM_DAILY_CLEANUP, ALARM_BADGE_UPDATE } from '../lib/constants';
import { generateId, getToday, minutesToMs } from '../lib/utils';
import { enableBlocking, disableBlocking } from './blocker';
import { runCleanup } from './cleanup';

// --- Timer Logic ---

async function startWorkTimer(taskIds: string[]): Promise<TimerState> {
  const settings = await getSettings();
  const durationMs = minutesToMs(settings.workDurationMin);
  const now = Date.now();

  const state: TimerState = {
    status: 'work',
    activeTaskId: taskIds[0] || null, // Keep for backwards compat
    activeTaskIds: taskIds,
    startedAt: now,
    remainingMs: durationMs,
  };

  await saveTimerState(state);
  await chrome.alarms.create(ALARM_WORK_END, { delayInMinutes: settings.workDurationMin });

  // Touch tasks to update lastInteractedAt (prevents auto-deletion)
  for (const taskId of taskIds) {
    await updateTask(taskId, {});
  }

  // Enable site blocking (with task-specific exceptions from all tasks)
  await enableBlocking(taskIds);

  // Update badge and start periodic badge alarm
  updateBadge(state);
  await startBadgeAlarm();

  return state;
}

async function startBreakTimer(): Promise<TimerState> {
  const settings = await getSettings();
  const durationMs = minutesToMs(settings.breakDurationMin);
  const now = Date.now();
  const prevState = await getTimerState();

  const state: TimerState = {
    status: 'break',
    activeTaskId: prevState.activeTaskId,
    activeTaskIds: prevState.activeTaskIds || [],
    startedAt: now,
    remainingMs: durationMs,
  };

  await saveTimerState(state);
  await chrome.alarms.create(ALARM_BREAK_END, { delayInMinutes: settings.breakDurationMin });

  // Disable blocking during break
  await disableBlocking();

  updateBadge(state);

  return state;
}

async function stopTimer(): Promise<TimerState> {
  await chrome.alarms.clear(ALARM_WORK_END);
  await chrome.alarms.clear(ALARM_BREAK_END);
  await stopBadgeAlarm();

  const state: TimerState = {
    status: 'idle',
    activeTaskId: null,
    activeTaskIds: [],
    startedAt: null,
    remainingMs: 0,
  };

  await saveTimerState(state);
  await disableBlocking();
  chrome.action.setBadgeText({ text: '' });

  return state;
}

async function pauseTimer(): Promise<TimerState> {
  const currentState = await getTimerState();

  // Can only pause work or break
  if (currentState.status !== 'work' && currentState.status !== 'break') {
    return currentState;
  }

  // Clear alarms
  await chrome.alarms.clear(ALARM_WORK_END);
  await chrome.alarms.clear(ALARM_BREAK_END);

  // Calculate remaining time
  const elapsed = currentState.startedAt ? Date.now() - currentState.startedAt : 0;
  const remaining = Math.max(0, currentState.remainingMs - elapsed);

  const state: TimerState = {
    status: 'paused',
    activeTaskId: currentState.activeTaskId,
    activeTaskIds: currentState.activeTaskIds || [],
    startedAt: null,
    remainingMs: remaining,
    pausedPhase: currentState.status,
  };

  await saveTimerState(state);
  await disableBlocking();

  // Update badge to show paused state
  const minutes = Math.ceil(remaining / 60000);
  chrome.action.setBadgeText({ text: `||${minutes}` });
  chrome.action.setBadgeBackgroundColor({ color: '#F39C12' });

  return state;
}

async function resumeTimer(): Promise<TimerState> {
  const currentState = await getTimerState();

  // Can only resume if paused
  if (currentState.status !== 'paused' || !currentState.pausedPhase) {
    return currentState;
  }

  const now = Date.now();
  const delayInMinutes = currentState.remainingMs / 60000;

  const state: TimerState = {
    status: currentState.pausedPhase,
    activeTaskId: currentState.activeTaskId,
    activeTaskIds: currentState.activeTaskIds || [],
    startedAt: now,
    remainingMs: currentState.remainingMs,
  };

  await saveTimerState(state);

  // Set alarm for remaining time
  if (currentState.pausedPhase === 'work') {
    await chrome.alarms.create(ALARM_WORK_END, { delayInMinutes });
    await enableBlocking(currentState.activeTaskIds || []);
  } else {
    await chrome.alarms.create(ALARM_BREAK_END, { delayInMinutes });
  }

  updateBadge(state);

  return state;
}

async function skipBreak(): Promise<TimerState> {
  const currentState = await getTimerState();

  // Can only skip break
  if (currentState.status !== 'break') {
    return currentState;
  }

  // Clear break alarm
  await chrome.alarms.clear(ALARM_BREAK_END);

  // Go idle with tasks still selected, so user can start next pomodoro
  const state: TimerState = {
    status: 'idle',
    activeTaskId: currentState.activeTaskId,
    activeTaskIds: currentState.activeTaskIds || [],
    startedAt: null,
    remainingMs: 0,
  };

  await saveTimerState(state);
  chrome.action.setBadgeText({ text: '' });

  return state;
}

async function addTaskToTimer(taskId: string): Promise<TimerState> {
  const currentState = await getTimerState();

  // Can only add tasks during work or paused (during work phase)
  if (currentState.status !== 'work' && !(currentState.status === 'paused' && currentState.pausedPhase === 'work')) {
    return currentState;
  }

  const taskIds = currentState.activeTaskIds || [];
  if (taskIds.includes(taskId)) {
    return currentState; // Already in list
  }

  const state: TimerState = {
    ...currentState,
    activeTaskIds: [...taskIds, taskId],
    activeTaskId: currentState.activeTaskId || taskId, // Keep backwards compat
  };

  await saveTimerState(state);

  // Touch task to update lastInteractedAt
  await updateTask(taskId, {});

  // Re-enable blocking with new task's exceptions
  if (currentState.status === 'work') {
    await enableBlocking(state.activeTaskIds);
  }

  return state;
}

async function removeTaskFromTimer(taskId: string): Promise<TimerState> {
  const currentState = await getTimerState();

  // Can only remove tasks during work or paused
  if (currentState.status !== 'work' && currentState.status !== 'paused') {
    return currentState;
  }

  const taskIds = currentState.activeTaskIds || [];
  const newTaskIds = taskIds.filter((id) => id !== taskId);

  // If no tasks left, stop the timer
  if (newTaskIds.length === 0) {
    return stopTimer();
  }

  const state: TimerState = {
    ...currentState,
    activeTaskIds: newTaskIds,
    activeTaskId: newTaskIds[0], // Keep backwards compat
  };

  await saveTimerState(state);

  // Re-enable blocking with updated task exceptions
  if (currentState.status === 'work') {
    await enableBlocking(state.activeTaskIds);
  }

  return state;
}

async function onWorkEnd(): Promise<void> {
  const state = await getTimerState();
  const settings = await getSettings();
  const taskIds = state.activeTaskIds || (state.activeTaskId ? [state.activeTaskId] : []);

  if (taskIds.length > 0) {
    const workDurationMs = minutesToMs(settings.workDurationMin);
    // Time is split equally among all active tasks
    const timePerTask = Math.floor(workDurationMs / taskIds.length);
    const today = getToday();

    // Update each task
    for (const taskId of taskIds) {
      const task = await getTask(taskId);
      if (task) {
        await updateTask(taskId, {
          totalWorkTime: task.totalWorkTime + timePerTask,
          pomodoroCount: task.pomodoroCount + 1,
        });
      }

      // Record pomodoro for each task
      await addPomodoroRecord({
        id: generateId(),
        taskId: taskId,
        date: today,
        startedAt: state.startedAt!,
        endedAt: Date.now(),
        type: 'work',
        durationMs: timePerTask,
      });
    }

    // Update daily stats (total session time, not per-task)
    const stats = await getDailyStatsForDate(today);
    await updateDailyStats(today, {
      totalPomodoros: stats.totalPomodoros + 1,
      totalWorkMs: stats.totalWorkMs + workDurationMs,
    });
  }

  // Play sound
  await playSound('work-end');

  // Start break
  const breakState = await startBreakTimer();
  broadcastState(breakState);
  broadcastPhaseComplete('work');
}

async function onBreakEnd(): Promise<void> {
  const state = await getTimerState();

  // Play sound
  await playSound('break-end');

  // Go idle — user must manually start next pomodoro
  const idleState: TimerState = {
    status: 'idle',
    activeTaskId: state.activeTaskId,
    activeTaskIds: state.activeTaskIds || [],
    startedAt: null,
    remainingMs: 0,
  };

  await saveTimerState(idleState);
  await disableBlocking();
  chrome.action.setBadgeText({ text: '' });

  broadcastState(idleState);
  broadcastPhaseComplete('break');
}

// --- Badge ---

function updateBadge(state: TimerState): void {
  if (state.status === 'idle') {
    chrome.action.setBadgeText({ text: '' });
    return;
  }

  if (state.status === 'paused') {
    const minutes = Math.ceil(state.remainingMs / 60000);
    chrome.action.setBadgeText({ text: `||${minutes}` });
    chrome.action.setBadgeBackgroundColor({ color: '#F39C12' });
    return;
  }

  const remaining = getRemainingMs(state);
  const minutes = Math.ceil(remaining / 60000);
  const text = state.status === 'break' ? `${minutes}b` : `${minutes}`;
  const bgColor = state.status === 'work' ? '#E74C3C' : '#27AE60';

  chrome.action.setBadgeText({ text });
  chrome.action.setBadgeBackgroundColor({ color: bgColor });
}

function getRemainingMs(state: TimerState): number {
  if (!state.startedAt) return state.remainingMs;
  const elapsed = Date.now() - state.startedAt;
  return Math.max(0, state.remainingMs - elapsed);
}

// Start periodic badge updates via chrome.alarms (survives service worker sleep)
async function startBadgeAlarm(): Promise<void> {
  await chrome.alarms.create(ALARM_BADGE_UPDATE, { periodInMinutes: 0.5 });
}

async function stopBadgeAlarm(): Promise<void> {
  await chrome.alarms.clear(ALARM_BADGE_UPDATE);
}

// --- Sound via Offscreen ---

let offscreenCreated = false;

async function ensureOffscreen(): Promise<void> {
  if (offscreenCreated) return;
  try {
    await chrome.offscreen.createDocument({
      url: 'offscreen/offscreen.html',
      reasons: [chrome.offscreen.Reason.AUDIO_PLAYBACK],
      justification: 'Play timer notification sounds',
    });
    offscreenCreated = true;
  } catch {
    // Already exists
    offscreenCreated = true;
  }
}

async function playSound(sound: 'work-end' | 'break-end'): Promise<void> {
  const settings = await getSettings();
  if (!settings.soundEnabled) return;
  await ensureOffscreen();
  const volume = settings.soundVolume / 100;
  chrome.runtime.sendMessage({ type: 'PLAY_SOUND', sound, volume } satisfies MessageType);
}

// --- Messaging ---

function broadcastState(state: TimerState): void {
  chrome.runtime.sendMessage({
    type: 'TIMER_STATE_UPDATED',
    state,
  } satisfies MessageType).catch(() => {
    // Popup may not be open
  });
}

function broadcastPhaseComplete(phase: 'work' | 'break'): void {
  chrome.runtime.sendMessage({
    type: 'TIMER_PHASE_COMPLETE',
    phase,
  } satisfies MessageType).catch(() => {});
}

chrome.runtime.onMessage.addListener((message: MessageType, _sender, sendResponse) => {
  if (message.type === 'START_TIMER') {
    startWorkTimer(message.taskIds).then((state) => {
      sendResponse({ state });
      broadcastState(state);
    });
    return true;
  }

  if (message.type === 'ADD_TASK_TO_TIMER') {
    addTaskToTimer(message.taskId).then((state) => {
      sendResponse({ state });
      broadcastState(state);
    });
    return true;
  }

  if (message.type === 'REMOVE_TASK_FROM_TIMER') {
    removeTaskFromTimer(message.taskId).then((state) => {
      sendResponse({ state });
      broadcastState(state);
    });
    return true;
  }

  if (message.type === 'STOP_TIMER') {
    stopTimer().then((state) => {
      sendResponse({ state });
      broadcastState(state);
    });
    return true;
  }

  if (message.type === 'PAUSE_TIMER') {
    pauseTimer().then((state) => {
      sendResponse({ state });
      broadcastState(state);
    });
    return true;
  }

  if (message.type === 'RESUME_TIMER') {
    resumeTimer().then((state) => {
      sendResponse({ state });
      broadcastState(state);
    });
    return true;
  }

  if (message.type === 'SKIP_BREAK') {
    skipBreak().then((state) => {
      sendResponse({ state });
      broadcastState(state);
    });
    return true;
  }

  if (message.type === 'GET_TIMER_STATE') {
    getTimerState().then((state) => {
      // Update badge whenever popup requests state (keeps badge in sync)
      updateBadge(state);
      sendResponse({ state });
    });
    return true;
  }

  if (message.type === 'REFRESH_BLOCKING') {
    getTimerState().then(async (state) => {
      // Refresh blocking rules during work (and paused-work) state
      if (state.status === 'work' || (state.status === 'paused' && state.pausedPhase === 'work')) {
        await enableBlocking(state.activeTaskIds || []);
      }
      sendResponse({ ok: true });
    });
    return true;
  }

  return false;
});

// --- Alarms ---

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_WORK_END) {
    onWorkEnd();
  } else if (alarm.name === ALARM_BREAK_END) {
    onBreakEnd();
  } else if (alarm.name === ALARM_DAILY_CLEANUP) {
    runCleanup();
  } else if (alarm.name === ALARM_BADGE_UPDATE) {
    const state = await getTimerState();
    if (state.status !== 'idle') {
      updateBadge(state);
    } else {
      stopBadgeAlarm();
    }
  }
});

// --- Install / Startup ---

chrome.runtime.onInstalled.addListener(() => {
  // Schedule daily cleanup at midnight
  chrome.alarms.create(ALARM_DAILY_CLEANUP, {
    periodInMinutes: 60 * 24,
    delayInMinutes: 60,
  });
});

chrome.runtime.onStartup.addListener(async () => {
  // Restore timer state and re-enable blocking if needed
  const state = await getTimerState();
  if (state.status !== 'idle') {
    if (state.status === 'work') {
      await enableBlocking(state.activeTaskIds || []);
    }
    updateBadge(state);
    await startBadgeAlarm();
  }
});
