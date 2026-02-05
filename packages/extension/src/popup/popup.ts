import { TimerState, MessageType } from '../lib/types';
import { renderActiveTasks } from './views/active-tasks';
import { renderBacklog } from './views/backlog';

type ViewName = 'tasks' | 'backlog';
let currentView: ViewName = 'tasks';

// --- Navigation ---

function switchView(view: ViewName): void {
  currentView = view;

  document.querySelectorAll('.view').forEach((el) => el.classList.add('hidden'));
  document.getElementById(`view-${view}`)?.classList.remove('hidden');

  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.classList.toggle('active', (btn as HTMLElement).dataset.view === view);
  });

  refreshCurrentView();
}

document.querySelectorAll('.nav-btn[data-view]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const view = (btn as HTMLElement).dataset.view as ViewName;
    switchView(view);
  });
});

// Settings button opens options page
document.getElementById('nav-settings')?.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

// Stats button opens dashboard in new tab
document.getElementById('nav-stats')?.addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('dashboard/dashboard.html') });
});

// --- Timer State ---

async function getTimerState(): Promise<TimerState> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'GET_TIMER_STATE' } satisfies MessageType, (response) => {
      resolve(
        response?.state ?? {
          status: 'idle',
          activeTaskId: null,
          startedAt: null,
          remainingMs: 0,
        },
      );
    });
  });
}

// --- Refresh ---

async function refreshCurrentView(): Promise<void> {
  const timerState = await getTimerState();

  switch (currentView) {
    case 'tasks': {
      const container = document.getElementById('view-tasks')!;
      await renderActiveTasks(container, timerState, () => switchView('backlog'), refreshCurrentView);
      break;
    }
    case 'backlog': {
      const container = document.getElementById('view-backlog')!;
      await renderBacklog(container, refreshCurrentView);
      break;
    }
  }
}

// --- Listen for state updates from background ---

chrome.runtime.onMessage.addListener((message: MessageType) => {
  if (message.type === 'TIMER_STATE_UPDATED' || message.type === 'TIMER_PHASE_COMPLETE') {
    refreshCurrentView();
  }
});

// --- Init ---

refreshCurrentView();
