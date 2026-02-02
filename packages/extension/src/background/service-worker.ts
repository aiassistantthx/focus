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
import { ALARM_WORK_END, ALARM_BREAK_END, ALARM_DAILY_CLEANUP } from '../lib/constants';
import { generateId, getToday, minutesToMs } from '../lib/utils';
import { enableBlocking, disableBlocking } from './blocker';
import { runCleanup } from './cleanup';

// --- Timer Logic ---

async function startWorkTimer(taskId: string): Promise<TimerState> {
  const settings = await getSettings();
  const durationMs = minutesToMs(settings.workDurationMin);
  const now = Date.now();

  const state: TimerState = {
    status: 'work',
    activeTaskId: taskId,
    startedAt: now,
    remainingMs: durationMs,
  };

  await saveTimerState(state);
  await chrome.alarms.create(ALARM_WORK_END, { delayInMinutes: settings.workDurationMin });

  // Enable site blocking (with task-specific exceptions)
  await enableBlocking(taskId);

  // Update badge
  updateBadge(state);

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

  const state: TimerState = {
    status: 'idle',
    activeTaskId: null,
    startedAt: null,
    remainingMs: 0,
  };

  await saveTimerState(state);
  await disableBlocking();
  chrome.action.setBadgeText({ text: '' });

  return state;
}

async function onWorkEnd(): Promise<void> {
  const state = await getTimerState();
  const settings = await getSettings();

  if (state.activeTaskId) {
    const workDurationMs = minutesToMs(settings.workDurationMin);

    // Update task work time
    const task = await getTask(state.activeTaskId);
    if (task) {
      await updateTask(state.activeTaskId, {
        totalWorkTime: task.totalWorkTime + workDurationMs,
        pomodoroCount: task.pomodoroCount + 1,
      });
    }

    // Record pomodoro
    const today = getToday();
    await addPomodoroRecord({
      id: generateId(),
      taskId: state.activeTaskId,
      date: today,
      startedAt: state.startedAt!,
      endedAt: Date.now(),
      type: 'work',
      durationMs: workDurationMs,
    });

    // Update daily stats
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

// Keep badge updated every minute
setInterval(async () => {
  const state = await getTimerState();
  if (state.status !== 'idle') {
    updateBadge(state);
  }
}, 30000);

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
  chrome.runtime.sendMessage({ type: 'PLAY_SOUND', sound } satisfies MessageType);
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
    startWorkTimer(message.taskId).then((state) => {
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

  if (message.type === 'GET_TIMER_STATE') {
    getTimerState().then((state) => {
      // Recalculate remaining
      if (state.startedAt && state.status !== 'idle') {
        const elapsed = Date.now() - state.startedAt;
        state.remainingMs = Math.max(0, state.remainingMs - elapsed);
      }
      sendResponse({ state });
    });
    return true;
  }

  return false;
});

// --- Alarms ---

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_WORK_END) {
    onWorkEnd();
  } else if (alarm.name === ALARM_BREAK_END) {
    onBreakEnd();
  } else if (alarm.name === ALARM_DAILY_CLEANUP) {
    runCleanup();
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
  if (state.status === 'work') {
    await enableBlocking(state.activeTaskId);
    updateBadge(state);
  }
});
