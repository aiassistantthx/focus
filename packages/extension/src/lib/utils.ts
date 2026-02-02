export function generateId(): string {
  return crypto.randomUUID();
}

export function getToday(): string {
  return formatDate(new Date());
}

export function getTomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return formatDate(d);
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function daysAgo(timestamp: number): number {
  const now = Date.now();
  return Math.floor((now - timestamp) / (1000 * 60 * 60 * 24));
}

export function formatTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function minutesToMs(minutes: number): number {
  return minutes * 60 * 1000;
}
