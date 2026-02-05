import { getTasks, getAllDailyStats } from '../lib/storage';
import { Task, DailyStats } from '../lib/types';

type Period = 'today' | 'week' | 'month' | 'all' | 'custom';
type ChartMode = 'time' | 'tasks';

let currentPeriod: Period = 'week';
let customDateRange: { start: string; end: string } | null = null;
let currentChartMode: ChartMode = 'time';
let cachedTasks: Task[] = [];
let cachedDailyStats: DailyStats[] = [];

// --- Date Helpers ---

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

function getDateNDaysAgo(n: number): string {
  const date = new Date();
  date.setDate(date.getDate() - n);
  return date.toISOString().split('T')[0];
}

function getStartOfWeek(): string {
  const date = new Date();
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  return date.toISOString().split('T')[0];
}

function getStartOfMonth(): string {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
}

function getDatesInRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const current = new Date(startDate);
  const end = new Date(endDate);
  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getDayName(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

function formatDuration(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

function formatHours(ms: number): string {
  const hours = ms / 3600000;
  return hours.toFixed(1) + 'h';
}

// --- Data Filtering ---

function getDateRange(period: Period): { start: string; end: string } {
  const today = getToday();
  switch (period) {
    case 'today':
      return { start: today, end: today };
    case 'week':
      return { start: getStartOfWeek(), end: today };
    case 'month':
      return { start: getStartOfMonth(), end: today };
    case 'all':
      return { start: '2000-01-01', end: today };
    case 'custom':
      return customDateRange || { start: today, end: today };
  }
}

function filterByPeriod<T extends { date: string }>(items: T[], period: Period): T[] {
  const { start, end } = getDateRange(period);
  return items.filter(item => item.date >= start && item.date <= end);
}

function filterTasksByPeriod(tasks: Task[], period: Period): Task[] {
  const { start, end } = getDateRange(period);
  const startMs = new Date(start).getTime();
  const endMs = new Date(end).getTime() + 86400000;
  return tasks.filter(task => {
    if (task.status !== 'completed' || !task.completedAt) return false;
    return task.completedAt >= startMs && task.completedAt < endMs;
  });
}

function getTasksWithWorkTime(tasks: Task[], period: Period): Task[] {
  // Get tasks that have work time, regardless of completion status
  // For pie chart we want to show time spent, not just completed tasks
  const { start, end } = getDateRange(period);
  return tasks.filter(t => t.totalWorkTime > 0);
}

// --- Stats Calculation ---

interface Stats {
  totalPomodoros: number;
  totalWorkMs: number;
  completedTasks: number;
  streak: number;
  activeDays: number;
  avgPomodoros: number;
  avgWorkMs: number;
  bestDay: string;
  bestDate: string;
  bestDatePomodoros: number;
}

function calculateStats(dailyStats: DailyStats[], tasks: Task[], period: Period): Stats {
  const filtered = filterByPeriod(dailyStats, period);
  const completedTasks = filterTasksByPeriod(tasks, period);

  const totalPomodoros = filtered.reduce((sum, d) => sum + d.totalPomodoros, 0);
  const totalWorkMs = filtered.reduce((sum, d) => sum + d.totalWorkMs, 0);
  const activeDays = filtered.filter(d => d.totalPomodoros > 0).length;

  // Calculate streak
  let streak = 0;
  const allStats = [...dailyStats].sort((a, b) => b.date.localeCompare(a.date));

  for (let i = 0; i < 365; i++) {
    const date = getDateNDaysAgo(i);
    const dayStats = allStats.find(d => d.date === date);
    if (dayStats && dayStats.totalPomodoros > 0) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  // Best day of week
  const dayTotals: Record<string, number> = {};
  filtered.forEach(d => {
    const day = getDayName(d.date);
    dayTotals[day] = (dayTotals[day] || 0) + d.totalPomodoros;
  });
  const bestDay = Object.entries(dayTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

  // Best single date
  const sortedByPomodoros = [...filtered].sort((a, b) => b.totalPomodoros - a.totalPomodoros);
  const best = sortedByPomodoros[0];

  return {
    totalPomodoros,
    totalWorkMs,
    completedTasks: completedTasks.length,
    streak,
    activeDays,
    avgPomodoros: activeDays > 0 ? Math.round(totalPomodoros / activeDays * 10) / 10 : 0,
    avgWorkMs: activeDays > 0 ? totalWorkMs / activeDays : 0,
    bestDay,
    bestDate: best ? formatDate(best.date) : '—',
    bestDatePomodoros: best?.totalPomodoros || 0,
  };
}

// --- Area Chart ---

function renderAreaChart(dailyStats: DailyStats[], tasks: Task[], period: Period, mode: ChartMode): void {
  const container = document.getElementById('area-chart');
  if (!container) return;

  const { start, end } = getDateRange(period);
  const dates = period === 'all'
    ? [...new Set(dailyStats.map(d => d.date))].sort().slice(-14)
    : getDatesInRange(start, end);

  if (dates.length === 0) {
    container.innerHTML = '<div class="text-white/30 text-center py-8">No data</div>';
    return;
  }

  const statsMap = new Map(dailyStats.map(d => [d.date, d]));

  // Count completed tasks per day
  const tasksPerDay = new Map<string, number>();
  tasks.filter(t => t.status === 'completed' && t.completedAt).forEach(t => {
    const date = new Date(t.completedAt!).toISOString().split('T')[0];
    tasksPerDay.set(date, (tasksPerDay.get(date) || 0) + 1);
  });

  const values = dates.map(date => {
    if (mode === 'time') {
      return (statsMap.get(date)?.totalWorkMs || 0) / 3600000; // hours
    } else {
      return tasksPerDay.get(date) || 0;
    }
  });

  const maxValue = Math.max(...values, 0.1);
  const width = 450;
  const height = 160;
  const padding = { top: 20, right: 20, bottom: 30, left: 45 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Generate path points
  const points = values.map((v, i) => {
    const x = padding.left + (i / Math.max(values.length - 1, 1)) * chartWidth;
    const y = padding.top + chartHeight - (v / maxValue) * chartHeight;
    return { x, y, value: v };
  });

  // Create smooth curve path
  const linePath = points.map((p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = points[i - 1];
    const cpx = (prev.x + p.x) / 2;
    return `C ${cpx} ${prev.y}, ${cpx} ${p.y}, ${p.x} ${p.y}`;
  }).join(' ');

  // Area path (same as line but closed at bottom)
  const areaPath = linePath + ` L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`;

  // Y-axis labels (3 ticks: 0, mid, max)
  const yTicks = [0, maxValue / 2, maxValue];
  const yLabels = yTicks.map((val, i) => {
    const y = padding.top + chartHeight - (val / maxValue) * chartHeight;
    const label = mode === 'time' ? `${val.toFixed(1)}h` : Math.round(val);
    return `<text x="${padding.left - 8}" y="${y + 4}" text-anchor="end" fill="rgba(255,255,255,0.4)" font-size="11">${label}</text>`;
  }).join('');

  // Horizontal grid lines
  const gridLines = yTicks.map(val => {
    const y = padding.top + chartHeight - (val / maxValue) * chartHeight;
    return `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="rgba(255,255,255,0.1)" stroke-dasharray="4,4" />`;
  }).join('');

  // X-axis labels
  const labelIndices = dates.length <= 7
    ? dates.map((_, i) => i)
    : [0, Math.floor(dates.length / 2), dates.length - 1];

  const xLabels = labelIndices.map(i => {
    const x = padding.left + (i / Math.max(dates.length - 1, 1)) * chartWidth;
    const label = dates.length <= 7 ? getDayName(dates[i]) : formatDate(dates[i]);
    return `<text x="${x}" y="${height - 8}" text-anchor="middle" fill="rgba(255,255,255,0.4)" font-size="11">${label}</text>`;
  }).join('');

  // Value dots (tooltip will be handled by JS)
  const dots = points.map((p, i) => {
    const displayValue = mode === 'time' ? formatHours(values[i] * 3600000) : `${values[i]} tasks`;
    const dayLabel = getDayName(dates[i]);
    return `
      <circle class="chart-dot" cx="${p.x}" cy="${p.y}" r="5" fill="#8B5CF6" stroke="#1a1a2e" stroke-width="2"
        data-tooltip="${dayLabel}: ${displayValue}" style="cursor: pointer;" />
    `;
  }).join('');

  container.innerHTML = `
    <div class="relative">
      <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" class="w-full h-full">
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#8B5CF6" stop-opacity="0.2"/>
            <stop offset="100%" stop-color="#8B5CF6" stop-opacity="0"/>
          </linearGradient>
        </defs>
        ${gridLines}
        ${yLabels}
        <path d="${areaPath}" fill="url(#areaGradient)" />
        <path d="${linePath}" fill="none" stroke="#8B5CF6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        ${dots}
        ${xLabels}
      </svg>
      <div id="chart-tooltip" class="chart-tooltip hidden"></div>
    </div>
  `;

  // Attach tooltip handlers
  const tooltip = container.querySelector('#chart-tooltip') as HTMLElement;
  container.querySelectorAll('.chart-dot').forEach(dot => {
    dot.addEventListener('mouseenter', (e) => {
      const target = e.target as SVGCircleElement;
      const text = target.dataset.tooltip || '';
      const rect = target.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      tooltip.textContent = text;
      tooltip.style.left = `${rect.left - containerRect.left + rect.width / 2}px`;
      tooltip.style.top = `${rect.top - containerRect.top - 8}px`;
      tooltip.classList.remove('hidden');
    });
    dot.addEventListener('mouseleave', () => {
      tooltip.classList.add('hidden');
    });
  });
}

// --- Heatmap (GitHub style) ---

function renderHeatmap(dailyStats: DailyStats[]): void {
  const container = document.getElementById('heatmap');
  if (!container) return;

  const weeksToShow = 16;

  // Create map of date -> workMs
  const statsMap = new Map(dailyStats.map(d => [d.date, d.totalWorkMs]));

  // Find max value for scaling
  const allValues = dailyStats.map(d => d.totalWorkMs);
  const maxMs = allValues.length > 0 ? Math.max(...allValues) : 1;

  // Generate dates for last N weeks
  const today = new Date();
  today.setHours(12, 0, 0, 0); // Normalize to avoid timezone issues

  // Start from Sunday of the week (weeksToShow) weeks ago
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - (weeksToShow * 7) - today.getDay());

  // Build weeks array
  const weeks: { dateStr: string; value: number }[][] = [];
  const cursor = new Date(startDate);

  while (cursor <= today) {
    const week: { dateStr: string; value: number }[] = [];
    for (let d = 0; d < 7 && cursor <= today; d++) {
      const dateStr = cursor.toISOString().split('T')[0];
      week.push({
        dateStr,
        value: statsMap.get(dateStr) || 0,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    if (week.length > 0) {
      weeks.push(week);
    }
  }

  // Get intensity level (0-4)
  const getLevel = (ms: number): number => {
    if (ms === 0) return 0;
    if (maxMs === 0) return 0;
    const ratio = ms / maxMs;
    if (ratio < 0.25) return 1;
    if (ratio < 0.5) return 2;
    if (ratio < 0.75) return 3;
    return 4;
  };

  const levelClasses = [
    'bg-white/5',
    'bg-primary/20',
    'bg-primary/40',
    'bg-primary/70',
    'bg-primary',
  ];

  const html = `
    <div class="flex gap-0.5">
      ${weeks.map(week => `
        <div class="flex flex-col gap-0.5">
          ${week.map(day => {
            const level = getLevel(day.value);
            const label = day.value > 0 ? formatDuration(day.value) : 'No activity';
            return `<div class="w-3 h-3 rounded-sm ${levelClasses[level]}" title="${day.dateStr}: ${label}"></div>`;
          }).join('')}
        </div>
      `).join('')}
    </div>
  `;

  container.innerHTML = html;
}

// --- Pie Chart ---

function renderPieChart(tasks: Task[], dailyStats: DailyStats[], period: Period): void {
  const container = document.getElementById('pie-chart');
  if (!container) return;

  const { start, end } = getDateRange(period);
  const startMs = new Date(start).getTime();
  const endMs = new Date(end).getTime() + 86400000; // end of day

  // Get total work time from dailyStats (same source as Work Time stat)
  const filteredDailyStats = filterByPeriod(dailyStats, period);
  const totalFromDailyStats = filteredDailyStats.reduce((sum, d) => sum + d.totalWorkMs, 0);

  if (totalFromDailyStats === 0) {
    container.innerHTML = '<div class="text-white/30 text-sm">No data</div>';
    return;
  }

  // Filter tasks by period: completed in period OR actively worked on (lastInteractedAt in period)
  const allTasksWithTime = tasks
    .filter(t => {
      if (t.totalWorkTime <= 0 || t.status === 'deleted') return false;
      if (period === 'all') return true;

      // Include if completed in period
      if (t.completedAt && t.completedAt >= startMs && t.completedAt < endMs) return true;

      // Include if last interacted in period (for active tasks)
      if (t.lastInteractedAt && t.lastInteractedAt >= startMs && t.lastInteractedAt < endMs) return true;

      return false;
    })
    .sort((a, b) => b.totalWorkTime - a.totalWorkTime);

  if (allTasksWithTime.length === 0) {
    container.innerHTML = '<div class="text-white/30 text-sm">No data</div>';
    return;
  }

  // Use task work times for proportions, but total from dailyStats
  const taskTotal = allTasksWithTime.reduce((sum, t) => sum + t.totalWorkTime, 0);
  const total = totalFromDailyStats; // Use dailyStats total for display (matches Work Time stat)

  // Take top 5 for display, group rest as "Other"
  // Scale task times proportionally to match dailyStats total
  const scale = taskTotal > 0 ? total / taskTotal : 1;

  const top5 = allTasksWithTime.slice(0, 5);
  const otherTime = allTasksWithTime.slice(5).reduce((sum, t) => sum + t.totalWorkTime, 0);

  const displayItems: { title: string; time: number }[] = top5.map(t => ({
    title: t.title,
    time: Math.round(t.totalWorkTime * scale)
  }));
  if (otherTime > 0) {
    displayItems.push({ title: 'Other', time: Math.round(otherTime * scale) });
  }

  const colors = ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#6B7280'];

  const cx = 60, cy = 60, r = 50;
  let currentAngle = -90; // Start from top

  const displayTotal = displayItems.reduce((sum, item) => sum + item.time, 0);

  const slices = displayItems.map((item, i) => {
    const percent = displayTotal > 0 ? item.time / displayTotal : 0;
    const angle = percent * 360;

    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);

    const largeArc = angle > 180 ? 1 : 0;
    const tooltipText = `${item.title}: ${formatDuration(item.time)}`;

    // For full circle (100%), draw a circle instead of arc
    if (percent >= 0.9999) {
      return `<circle class="pie-slice" cx="${cx}" cy="${cy}" r="${r}" fill="${colors[i]}" data-tooltip="${escapeHtml(tooltipText)}" style="cursor: pointer;"/>`;
    }

    return `<path class="pie-slice" d="M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z" fill="${colors[i]}" data-tooltip="${escapeHtml(tooltipText)}" style="cursor: pointer;"/>`;
  }).join('');

  const legend = displayItems.map((item, i) => `
    <div class="legend-item">
      <div class="legend-color" style="background: ${colors[i]}"></div>
      <span class="truncate" style="max-width: 120px">${escapeHtml(item.title)}</span>
    </div>
  `).join('');

  container.innerHTML = `
    <div class="flex items-center gap-4 relative">
      <div class="pie-chart-container flex-shrink-0">
        <svg viewBox="0 0 120 120" class="w-full h-full">
          ${slices}
          <circle cx="${cx}" cy="${cy}" r="30" fill="#1a1a2e" style="pointer-events: none;"/>
        </svg>
        <div class="pie-center">
          <div class="text-lg font-bold">${formatDuration(total)}</div>
        </div>
      </div>
      <div class="pie-legend">${legend}</div>
      <div id="pie-tooltip" class="chart-tooltip hidden"></div>
    </div>
  `;

  // Attach tooltip handlers
  const tooltip = container.querySelector('#pie-tooltip') as HTMLElement;
  container.querySelectorAll('.pie-slice').forEach(slice => {
    slice.addEventListener('mouseenter', (e) => {
      const target = e.target as SVGElement;
      const text = target.dataset.tooltip || '';
      const rect = target.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      tooltip.textContent = text;
      tooltip.style.left = `${rect.left - containerRect.left + rect.width / 2}px`;
      tooltip.style.top = `${rect.top - containerRect.top - 8}px`;
      tooltip.classList.remove('hidden');
    });
    slice.addEventListener('mouseleave', () => {
      tooltip.classList.add('hidden');
    });
  });
}

// --- Tasks Table ---

function renderTasksTable(tasks: Task[], period: Period): void {
  const container = document.getElementById('tasks-table');
  const noTasks = document.getElementById('no-tasks');
  if (!container || !noTasks) return;

  const completedTasks = filterTasksByPeriod(tasks, period)
    .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));

  if (completedTasks.length === 0) {
    container.innerHTML = '';
    noTasks.classList.remove('hidden');
    return;
  }

  noTasks.classList.add('hidden');

  container.innerHTML = completedTasks.map(task => `
    <div class="task-row">
      <div class="flex items-center gap-3">
        <svg class="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
        </svg>
        <span class="font-medium truncate">${escapeHtml(task.title)}</span>
      </div>
      <div class="flex items-center gap-6 text-sm text-white/50 flex-shrink-0">
        <span>${task.pomodoroCount} pom</span>
        <span>${formatDuration(task.totalWorkTime)}</span>
        <span>${task.completedAt ? formatDate(new Date(task.completedAt).toISOString().split('T')[0]) : '—'}</span>
      </div>
    </div>
  `).join('');
}

// --- UI Updates ---

function updateUI(stats: Stats): void {
  const el = (id: string) => document.getElementById(id);

  el('stat-pomodoros')!.textContent = String(stats.totalPomodoros);
  el('stat-time')!.textContent = formatDuration(stats.totalWorkMs);
  el('stat-tasks')!.textContent = String(stats.completedTasks);
  el('stat-streak')!.textContent = String(stats.streak);

  el('avg-pomodoros')!.textContent = String(stats.avgPomodoros);
  el('avg-time')!.textContent = formatDuration(stats.avgWorkMs);
  el('best-day')!.textContent = stats.bestDay;
  el('best-date')!.textContent = stats.bestDatePomodoros > 0
    ? `${stats.bestDate} (${stats.bestDatePomodoros} pom)`
    : '—';

  el('total-days')!.textContent = String(stats.activeDays);
}

async function loadData(): Promise<void> {
  [cachedTasks, cachedDailyStats] = await Promise.all([
    getTasks(),
    getAllDailyStats(),
  ]);

  renderAll();
}

function renderAll(): void {
  const stats = calculateStats(cachedDailyStats, cachedTasks, currentPeriod);
  updateUI(stats);
  renderAreaChart(cachedDailyStats, cachedTasks, currentPeriod, currentChartMode);
  renderHeatmap(cachedDailyStats);
  renderPieChart(cachedTasks, cachedDailyStats, currentPeriod);
  renderTasksTable(cachedTasks, currentPeriod);

  // Update totals
  const allCompleted = cachedTasks.filter(t => t.status === 'completed');
  const allTasksCount = cachedTasks.filter(t => t.status !== 'deleted').length;
  document.getElementById('total-tasks')!.textContent = String(allCompleted.length);
  document.getElementById('completion-rate')!.textContent =
    allTasksCount > 0 ? `${Math.round(allCompleted.length / allTasksCount * 100)}%` : '0%';
}

function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// --- Init ---

document.addEventListener('DOMContentLoaded', () => {
  const datePicker = document.getElementById('date-picker')!;
  const dateStartInput = document.getElementById('date-start') as HTMLInputElement;
  const dateEndInput = document.getElementById('date-end') as HTMLInputElement;

  // Set default date values
  dateStartInput.value = getStartOfWeek();
  dateEndInput.value = getToday();

  // Period selector
  document.querySelectorAll('.period-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentPeriod = btn.getAttribute('data-period') as Period;

      // Show/hide date picker for custom period
      if (currentPeriod === 'custom') {
        datePicker.classList.remove('hidden');
        customDateRange = { start: dateStartInput.value, end: dateEndInput.value };
      } else {
        datePicker.classList.add('hidden');
      }

      renderAll();
    });
  });

  // Date picker change handlers
  dateStartInput.addEventListener('change', () => {
    if (currentPeriod === 'custom') {
      customDateRange = { start: dateStartInput.value, end: dateEndInput.value };
      renderAll();
    }
  });

  dateEndInput.addEventListener('change', () => {
    if (currentPeriod === 'custom') {
      customDateRange = { start: dateStartInput.value, end: dateEndInput.value };
      renderAll();
    }
  });

  // Chart mode selector
  document.querySelectorAll('.chart-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.chart-mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentChartMode = btn.getAttribute('data-chart-mode') as ChartMode;
      renderAreaChart(cachedDailyStats, cachedTasks, currentPeriod, currentChartMode);
    });
  });

  loadData();
});
