import { Task, DayPlan, TimerState, PomodoroRecord, Settings, DailyStats } from './types';
import { STORAGE_KEYS, DEFAULT_SETTINGS, MAX_DAILY_TASKS } from './constants';
import { generateId, getToday, getTomorrow } from './utils';

// --- Generic helpers ---

async function get<T>(key: string, fallback: T): Promise<T> {
  const result = await chrome.storage.local.get(key);
  return (result[key] as T) ?? fallback;
}

async function set<T>(key: string, value: T): Promise<void> {
  await chrome.storage.local.set({ [key]: value });
}

// --- Tasks ---

export async function getTasks(): Promise<Task[]> {
  return get<Task[]>(STORAGE_KEYS.TASKS, []);
}

export async function getTask(id: string): Promise<Task | undefined> {
  const tasks = await getTasks();
  return tasks.find((t) => t.id === id);
}

export async function saveTasks(tasks: Task[]): Promise<void> {
  await set(STORAGE_KEYS.TASKS, tasks);
}

export async function createTask(title: string): Promise<Task> {
  const tasks = await getTasks();
  const now = Date.now();
  const task: Task = {
    id: generateId(),
    title,
    status: 'backlog',
    createdAt: now,
    lastInteractedAt: now,
    totalWorkTime: 0,
    pomodoroCount: 0,
  };
  tasks.push(task);
  await saveTasks(tasks);
  return task;
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<Task | undefined> {
  const tasks = await getTasks();
  const index = tasks.findIndex((t) => t.id === id);
  if (index === -1) return undefined;
  tasks[index] = { ...tasks[index], ...updates, lastInteractedAt: Date.now() };
  await saveTasks(tasks);
  return tasks[index];
}

export async function deleteTask(id: string): Promise<void> {
  const tasks = await getTasks();
  const filtered = tasks.filter((t) => t.id !== id);
  await saveTasks(filtered);

  // Also remove from day plan
  const plan = await getDayPlan();
  if (plan.taskIds.includes(id)) {
    plan.taskIds = plan.taskIds.filter((tid) => tid !== id);
    await saveDayPlan(plan);
  }
}

export async function completeTask(id: string): Promise<void> {
  await updateTask(id, { status: 'completed', completedAt: Date.now() });
  const plan = await getDayPlan();
  plan.taskIds = plan.taskIds.filter((tid) => tid !== id);
  await saveDayPlan(plan);
}

export async function moveTaskToBacklog(id: string): Promise<void> {
  await updateTask(id, { status: 'backlog' });
  const plan = await getDayPlan();
  plan.taskIds = plan.taskIds.filter((tid) => tid !== id);
  await saveDayPlan(plan);
}

export async function moveTaskToTomorrow(id: string): Promise<void> {
  await updateTask(id, { status: 'active' });
  const plan = await getDayPlan();
  plan.taskIds = plan.taskIds.filter((tid) => tid !== id);
  await saveDayPlan(plan);

  const tomorrow = getTomorrow();
  const tomorrowPlan = await getDayPlanForDate(tomorrow);
  if (tomorrowPlan.taskIds.length < MAX_DAILY_TASKS && !tomorrowPlan.taskIds.includes(id)) {
    tomorrowPlan.taskIds.push(id);
    await saveDayPlanForDate(tomorrow, tomorrowPlan);
  }
}

// --- Day Plan ---

export async function getAllDayPlans(): Promise<Record<string, DayPlan>> {
  return get<Record<string, DayPlan>>(STORAGE_KEYS.DAY_PLAN, {});
}

export async function getDayPlanForDate(date: string): Promise<DayPlan> {
  const plans = await getAllDayPlans();
  return plans[date] ?? { date, taskIds: [] };
}

export async function getDayPlan(): Promise<DayPlan> {
  return getDayPlanForDate(getToday());
}

export async function saveDayPlanForDate(date: string, plan: DayPlan): Promise<void> {
  const plans = await getAllDayPlans();
  plans[date] = plan;
  await set(STORAGE_KEYS.DAY_PLAN, plans);
}

export async function saveDayPlan(plan: DayPlan): Promise<void> {
  await saveDayPlanForDate(getToday(), plan);
}

export async function addTaskToToday(taskId: string): Promise<boolean> {
  const plan = await getDayPlan();
  if (plan.taskIds.length >= MAX_DAILY_TASKS) return false;
  if (plan.taskIds.includes(taskId)) return false;

  plan.taskIds.push(taskId);
  await saveDayPlan(plan);
  await updateTask(taskId, { status: 'active' });
  return true;
}

export async function removeTaskFromToday(taskId: string): Promise<void> {
  const plan = await getDayPlan();
  plan.taskIds = plan.taskIds.filter((id) => id !== taskId);
  await saveDayPlan(plan);
}

// --- Timer State ---

export async function getTimerState(): Promise<TimerState> {
  const state = await get<TimerState>(STORAGE_KEYS.TIMER_STATE, {
    status: 'idle',
    activeTaskId: null,
    activeTaskIds: [],
    startedAt: null,
    remainingMs: 0,
  });
  // Migration: if old format with single activeTaskId, convert to array
  if (!state.activeTaskIds && state.activeTaskId) {
    state.activeTaskIds = [state.activeTaskId];
  } else if (!state.activeTaskIds) {
    state.activeTaskIds = [];
  }
  return state;
}

export async function saveTimerState(state: TimerState): Promise<void> {
  await set(STORAGE_KEYS.TIMER_STATE, state);
}

// --- Pomodoro Records ---

export async function getPomodoroRecords(): Promise<PomodoroRecord[]> {
  return get<PomodoroRecord[]>(STORAGE_KEYS.POMODORO_RECORDS, []);
}

export async function addPomodoroRecord(record: PomodoroRecord): Promise<void> {
  const records = await getPomodoroRecords();
  records.push(record);
  await set(STORAGE_KEYS.POMODORO_RECORDS, records);
}

// --- Settings ---

export async function getSettings(): Promise<Settings> {
  return get<Settings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
}

export async function saveSettings(settings: Settings): Promise<void> {
  await set(STORAGE_KEYS.SETTINGS, settings);
}

// --- Daily Stats ---

export async function getAllDailyStats(): Promise<DailyStats[]> {
  return get<DailyStats[]>(STORAGE_KEYS.DAILY_STATS, []);
}

export async function getDailyStatsForDate(date: string): Promise<DailyStats> {
  const all = await getAllDailyStats();
  return all.find((s) => s.date === date) ?? { date, completedTasks: 0, totalPomodoros: 0, totalWorkMs: 0 };
}

export async function updateDailyStats(date: string, updates: Partial<DailyStats>): Promise<void> {
  const all = await getAllDailyStats();
  const index = all.findIndex((s) => s.date === date);
  if (index === -1) {
    all.push({ date, completedTasks: 0, totalPomodoros: 0, totalWorkMs: 0, ...updates });
  } else {
    all[index] = { ...all[index], ...updates };
  }
  await set(STORAGE_KEYS.DAILY_STATS, all);
}
