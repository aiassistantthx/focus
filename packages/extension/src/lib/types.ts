export interface Task {
  id: string;
  title: string;
  status: 'backlog' | 'active' | 'completed' | 'deleted';
  createdAt: number;
  lastInteractedAt: number;
  completedAt?: number;
  totalWorkTime: number;
  pomodoroCount: number;
  siteExceptions?: string[];
}

export interface DayPlan {
  date: string; // 'YYYY-MM-DD'
  taskIds: string[];
}

export interface TimerState {
  status: 'idle' | 'work' | 'break' | 'paused';
  activeTaskId: string | null; // Deprecated, use activeTaskIds
  activeTaskIds: string[]; // Multiple tasks can be active
  startedAt: number | null;
  remainingMs: number;
  pausedPhase?: 'work' | 'break'; // Which phase was paused
}

export interface PomodoroRecord {
  id: string;
  taskId: string;
  date: string; // 'YYYY-MM-DD'
  startedAt: number;
  endedAt: number;
  type: 'work' | 'break';
  durationMs: number;
}

export interface Settings {
  workDurationMin: number;
  breakDurationMin: number;
  blockedSites: string[];
  allowedSites: string[];
  soundEnabled: boolean;
  soundVolume: number;
  blockingEnabled: boolean;
}

export interface DailyStats {
  date: string; // 'YYYY-MM-DD'
  completedTasks: number;
  totalPomodoros: number;
  totalWorkMs: number;
}

export type MessageType =
  | { type: 'START_TIMER'; taskIds: string[] }
  | { type: 'ADD_TASK_TO_TIMER'; taskId: string }
  | { type: 'REMOVE_TASK_FROM_TIMER'; taskId: string }
  | { type: 'STOP_TIMER' }
  | { type: 'PAUSE_TIMER' }
  | { type: 'RESUME_TIMER' }
  | { type: 'SKIP_BREAK' }
  | { type: 'GET_TIMER_STATE' }
  | { type: 'TIMER_STATE_UPDATED'; state: TimerState }
  | { type: 'TIMER_PHASE_COMPLETE'; phase: 'work' | 'break' }
  | { type: 'PLAY_SOUND'; sound: 'work-end' | 'break-end'; volume: number };
