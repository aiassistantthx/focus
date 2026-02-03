export const DEFAULT_WORK_DURATION_MIN = 50;
export const DEFAULT_BREAK_DURATION_MIN = 10;
export const MAX_DAILY_TASKS = 5;
export const TASK_EXPIRY_DAYS = 7;
export const TASK_EXPIRY_WARNING_DAYS = 3;

export const ALARM_WORK_END = 'work-timer-end';
export const ALARM_BREAK_END = 'break-timer-end';
export const ALARM_DAILY_CLEANUP = 'daily-cleanup';

export const STORAGE_KEYS = {
  TASKS: 'tasks',
  DAY_PLAN: 'dayPlan',
  TIMER_STATE: 'timerState',
  POMODORO_RECORDS: 'pomodoroRecords',
  SETTINGS: 'settings',
  DAILY_STATS: 'dailyStats',
} as const;

export const DEFAULT_BLOCKED_SITES: string[] = [
  'facebook.com',
  'www.facebook.com',
  'instagram.com',
  'www.instagram.com',
  'twitter.com',
  'www.twitter.com',
  'x.com',
  'www.x.com',
  'reddit.com',
  'www.reddit.com',
  'tiktok.com',
  'www.tiktok.com',
  'snapchat.com',
  'www.snapchat.com',
  'linkedin.com',
  'www.linkedin.com',
  'pinterest.com',
  'www.pinterest.com',
  'tumblr.com',
  'www.tumblr.com',
  'discord.com',
  'www.discord.com',
  'youtube.com',
  'www.youtube.com',
  'netflix.com',
  'www.netflix.com',
  'twitch.tv',
  'www.twitch.tv',
  '9gag.com',
  'www.9gag.com',
  'buzzfeed.com',
  'www.buzzfeed.com',
  'huffpost.com',
  'www.huffpost.com',
  'dailymail.co.uk',
  'www.dailymail.co.uk',
  'bbc.com',
  'www.bbc.com',
  'cnn.com',
  'www.cnn.com',
  'news.ycombinator.com',
];

export const DEFAULT_SETTINGS = {
  workDurationMin: DEFAULT_WORK_DURATION_MIN,
  breakDurationMin: DEFAULT_BREAK_DURATION_MIN,
  blockedSites: [] as string[],
  allowedSites: [] as string[],
  soundEnabled: true,
  soundVolume: 80,
  blockingEnabled: true,
};
