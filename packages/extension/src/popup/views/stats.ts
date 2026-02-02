import { getAllDailyStats, getTasks, getPomodoroRecords } from '../../lib/storage';
import { DailyStats } from '../../lib/types';
import { formatDate } from '../../lib/utils';

export async function renderStats(container: HTMLElement): Promise<void> {
  const allStats = await getAllDailyStats();
  const allTasks = await getTasks();
  const records = await getPomodoroRecords();

  const today = new Date();
  const todayStr = formatDate(today);

  // Summary stats
  const todayStats = allStats.find((s) => s.date === todayStr) ?? {
    date: todayStr,
    completedTasks: 0,
    totalPomodoros: 0,
    totalWorkMs: 0,
  };

  const weekStats = getStatsForPeriod(allStats, 7);
  const monthStats = getStatsForPeriod(allStats, 30);

  // Completed tasks count
  const completedToday = allTasks.filter(
    (t) => t.status === 'completed' && t.completedAt && formatDate(new Date(t.completedAt)) === todayStr,
  ).length;

  // Heatmap data: last 13 weeks (91 days)
  const heatmapHtml = renderHeatmap(allStats, 91);

  // Per-task breakdown (tasks with pomodoros)
  const taskBreakdown = allTasks
    .filter((t) => t.pomodoroCount > 0)
    .sort((a, b) => b.totalWorkTime - a.totalWorkTime)
    .slice(0, 10);

  const breakdownHtml = taskBreakdown.length > 0
    ? taskBreakdown
        .map(
          (t) => `
      <div class="flex items-center justify-between py-1.5">
        <span class="text-sm truncate flex-1 mr-2 ${t.status === 'completed' ? 'line-through text-white/30' : ''}">${escapeHtml(t.title)}</span>
        <div class="flex items-center gap-3 shrink-0">
          <span class="text-xs text-white/40">${t.pomodoroCount} pom</span>
          <span class="text-xs text-white/30">${formatDuration(t.totalWorkTime)}</span>
        </div>
      </div>
    `,
        )
        .join('')
    : '<p class="text-xs text-white/30 py-2">No data yet</p>';

  container.innerHTML = `
    <div class="px-4 py-3 space-y-4">
      <!-- Summary Cards -->
      <div class="grid grid-cols-3 gap-2">
        ${renderSummaryCard('Today', todayStats.totalPomodoros, completedToday, todayStats.totalWorkMs)}
        ${renderSummaryCard('Week', weekStats.totalPomodoros, weekStats.completedTasks, weekStats.totalWorkMs)}
        ${renderSummaryCard('Month', monthStats.totalPomodoros, monthStats.completedTasks, monthStats.totalWorkMs)}
      </div>

      <!-- Heatmap -->
      <div>
        <p class="text-xs text-white/40 uppercase tracking-wide font-medium mb-2">Activity</p>
        <div class="bg-card-dark rounded-lg p-3 overflow-x-auto">
          ${heatmapHtml}
        </div>
      </div>

      <!-- Per-task breakdown -->
      <div>
        <p class="text-xs text-white/40 uppercase tracking-wide font-medium mb-2">Tasks</p>
        <div class="bg-card-dark rounded-lg px-3 py-1 divide-y divide-white/5">
          ${breakdownHtml}
        </div>
      </div>
    </div>
  `;
}

function renderSummaryCard(label: string, pomodoros: number, tasks: number, workMs: number): string {
  return `
    <div class="bg-card-dark rounded-lg p-3 text-center">
      <p class="text-xs text-white/40 mb-1">${label}</p>
      <p class="text-xl font-bold font-mono">${pomodoros}</p>
      <p class="text-[10px] text-white/30">pomodoros</p>
      <div class="mt-1 text-[10px] text-white/30">
        <span>${tasks} tasks</span>
        <span class="mx-0.5">&middot;</span>
        <span>${formatDuration(workMs)}</span>
      </div>
    </div>
  `;
}

function renderHeatmap(allStats: DailyStats[], days: number): string {
  const statsMap = new Map<string, DailyStats>();
  allStats.forEach((s) => statsMap.set(s.date, s));

  const today = new Date();
  const cells: { date: string; count: number; dayOfWeek: number }[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = formatDate(d);
    const stats = statsMap.get(dateStr);
    cells.push({
      date: dateStr,
      count: stats?.totalPomodoros ?? 0,
      dayOfWeek: d.getDay(),
    });
  }

  // Find max for color scaling
  const maxCount = Math.max(1, ...cells.map((c) => c.count));

  // Build weeks (columns)
  const weeks: typeof cells[] = [];
  let currentWeek: typeof cells = [];

  // Pad first week
  if (cells.length > 0) {
    for (let i = 0; i < cells[0].dayOfWeek; i++) {
      currentWeek.push({ date: '', count: -1, dayOfWeek: i });
    }
  }

  for (const cell of cells) {
    if (cell.dayOfWeek === 0 && currentWeek.length > 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push(cell);
  }
  if (currentWeek.length > 0) weeks.push(currentWeek);

  const cellSize = 12;
  const gap = 2;
  const svgWidth = weeks.length * (cellSize + gap);
  const svgHeight = 7 * (cellSize + gap);

  let rectsHtml = '';
  weeks.forEach((week, wi) => {
    week.forEach((cell) => {
      if (cell.count < 0) return;
      const x = wi * (cellSize + gap);
      const y = cell.dayOfWeek * (cellSize + gap);
      const color = cell.count === 0 ? 'rgba(255,255,255,0.06)' : getHeatmapColor(cell.count, maxCount);
      rectsHtml += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="2" fill="${color}"><title>${cell.date}: ${cell.count} pomodoros</title></rect>`;
    });
  });

  return `<svg width="${svgWidth}" height="${svgHeight}" class="block">${rectsHtml}</svg>`;
}

function getHeatmapColor(count: number, max: number): string {
  const ratio = count / max;
  if (ratio <= 0.25) return 'rgba(39, 174, 96, 0.3)';
  if (ratio <= 0.5) return 'rgba(39, 174, 96, 0.5)';
  if (ratio <= 0.75) return 'rgba(39, 174, 96, 0.7)';
  return 'rgba(39, 174, 96, 1)';
}

function getStatsForPeriod(allStats: DailyStats[], days: number): DailyStats {
  const today = new Date();
  const result: DailyStats = { date: '', completedTasks: 0, totalPomodoros: 0, totalWorkMs: 0 };

  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = formatDate(d);
    const s = allStats.find((st) => st.date === dateStr);
    if (s) {
      result.completedTasks += s.completedTasks;
      result.totalPomodoros += s.totalPomodoros;
      result.totalWorkMs += s.totalWorkMs;
    }
  }

  return result;
}

function formatDuration(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
