import { TimerState, MessageType } from '../lib/types';
import { formatTime } from '../lib/utils';
import { getTasks } from '../lib/storage';

const motivations = [
  'Deep work produces results. Stay the course.',
  'Every minute of focus compounds over time.',
  'The best way to finish is to not stop.',
  'Your future self will thank you for staying focused.',
  'Distractions are the enemy of progress.',
  'Small consistent effort beats sporadic bursts.',
];

async function init(): Promise<void> {
  // Show random motivation
  const motivEl = document.getElementById('motivation');
  if (motivEl) {
    motivEl.textContent = motivations[Math.floor(Math.random() * motivations.length)];
  }

  // Back button
  document.getElementById('btn-back')?.addEventListener('click', () => {
    if (history.length > 1) {
      history.back();
    } else {
      window.close();
    }
  });

  // Get timer state and update display
  updateTimer();
  setInterval(updateTimer, 1000);
}

async function updateTimer(): Promise<void> {
  const state = await new Promise<TimerState>((resolve) => {
    chrome.runtime.sendMessage({ type: 'GET_TIMER_STATE' } satisfies MessageType, (response) => {
      resolve(
        response?.state ?? { status: 'idle', activeTaskId: null, startedAt: null, remainingMs: 0 },
      );
    });
  });

  const timerEl = document.getElementById('timer-display');
  const taskEl = document.getElementById('task-name');

  if (timerEl) {
    if (state.status !== 'idle' && state.remainingMs > 0) {
      timerEl.textContent = formatTime(state.remainingMs);
    } else {
      timerEl.textContent = '--:--';
    }
  }

  if (taskEl && state.activeTaskId) {
    const tasks = await getTasks();
    const task = tasks.find((t) => t.id === state.activeTaskId);
    if (task) {
      taskEl.textContent = `Working on: ${task.title}`;
    }
  }
}

init();
