# Focus — Pomodoro Chrome Extension

## Overview

A Pomodoro-based productivity Chrome extension with task management, site blocking, and statistics. The extension helps users focus on up to 3 daily tasks using 50/10 minute work/break cycles with automatic blocking of distracting websites.

---

## Tech Stack

### Extension (current)
- **Chrome Manifest V3** — service workers, declarativeNetRequest
- **TypeScript** — strict mode
- **Vite** — bundling with multi-entry (popup, settings, blocked, offscreen)
- **Tailwind CSS 3** — utility-first styling
- **Chrome Storage API** — local data persistence

### Landing Page (current)
- **Next.js** (new package `packages/landing`) — static export, ready for future dashboard/auth/payments
- **Tailwind CSS 3** — shared design tokens with extension

### Future (not now, but influences stack choice)
- Dashboard / personal account — Next.js app router, server components
- Payments — Stripe integration
- Auth — NextAuth.js or Clerk
- Database — Supabase or PlanetScale

---

## Data Model

```typescript
interface Task {
  id: string;                  // crypto.randomUUID()
  title: string;
  status: 'backlog' | 'active' | 'completed' | 'deleted';
  createdAt: number;           // timestamp
  lastInteractedAt: number;    // timestamp — updated on any user action
  completedAt?: number;        // timestamp
  totalWorkTime: number;       // milliseconds accumulated across all pomodoros
  pomodoroCount: number;       // completed 50-min sessions for this task
}

interface DayPlan {
  date: string;                // 'YYYY-MM-DD'
  taskIds: string[];           // max 3
}

interface TimerState {
  status: 'idle' | 'work' | 'break';
  activeTaskId: string | null;
  startedAt: number | null;    // timestamp when current phase started
  remainingMs: number;         // persisted for pause/resume across popup closes
}

interface PomodoroRecord {
  id: string;
  taskId: string;
  date: string;                // 'YYYY-MM-DD'
  startedAt: number;
  endedAt: number;
  type: 'work' | 'break';
  durationMs: number;
}

interface Settings {
  workDurationMin: number;     // default 50
  breakDurationMin: number;    // default 10
  blockedSites: string[];      // default list + user additions
  allowedSites: string[];      // user exceptions
  soundEnabled: boolean;       // default true
  soundVolume: number;         // 0-100, default 80
}

interface DailyStats {
  date: string;                // 'YYYY-MM-DD'
  completedTasks: number;
  totalPomodoros: number;
  totalWorkMs: number;
}
```

---

## Feature Breakdown

### Phase 1 — Core Timer & Task Management

#### 1.1 Background Service Worker (`src/background/service-worker.ts`)
- Timer logic using `chrome.alarms` API (survives popup close)
- Alarm handlers: `work-timer-end`, `break-timer-end`
- Message handling for popup communication
- Badge text update (remaining minutes on extension icon)
- Sound playback via offscreen document
- Auto-cleanup job: check tasks daily, delete tasks with `lastInteractedAt` older than 7 days, send notification 3 days before deletion

#### 1.2 Offscreen Document (`src/offscreen/`)
- Play notification sounds (work end, break end)
- Required because Manifest V3 service workers can't access Audio API

#### 1.3 Task Storage (`src/lib/storage.ts`)
- CRUD operations for tasks
- Day plan management (max 3 tasks per day)
- Task lifecycle: backlog -> active -> completed/deleted
- `lastInteractedAt` updated on: create, edit, move to active, complete, postpone to tomorrow, manual "still relevant" mark
- Auto-expiry logic: tasks in backlog with `lastInteractedAt` > 7 days ago get deleted

#### 1.4 Popup UI (`src/popup/`)
Main extension popup — compact, focused interface.

**States:**
1. **No active tasks for today** — prompt to select tasks from backlog
2. **Tasks selected, timer idle** — show 3 tasks, each with "Start" button
3. **Timer running (work)** — show countdown (MM:SS), active task highlighted, blocked site indicator
4. **Timer running (break)** — show countdown, "Sites unblocked" indicator
5. **Timer finished** — prompt to start next pomodoro manually

**Task actions (on each active task):**
- Start pomodoro (only if timer is idle)
- Mark as completed
- Move to tomorrow (goes to next day's plan)
- Move back to backlog
- Delete

**Navigation:**
- "Backlog" button → opens backlog view
- "Stats" button → opens stats view
- "Settings" gear icon → opens settings page

#### 1.5 Backlog View (inside popup)
- List of all backlog tasks, sorted by `lastInteractedAt` desc
- Add new task (text input + Enter)
- Swipe/button to delete a task
- Button to move task to today's active (disabled if 3 already selected)
- Warning badge on tasks expiring within 3 days: "Expires in X days"
- "Mark as still relevant" action on expiring tasks (updates `lastInteractedAt`)

### Phase 2 — Site Blocking

#### 2.1 Block List (`src/lib/blocklist.ts`)
Default blocked domains (top 20 non-Chinese social/news/forum sites):

**Social Media:**
1. facebook.com
2. instagram.com
3. twitter.com / x.com
4. reddit.com
5. tiktok.com
6. snapchat.com
7. linkedin.com (feed only — can be debated)
8. pinterest.com
9. tumblr.com
10. discord.com

**News & Media:**
11. youtube.com
12. netflix.com
13. twitch.tv

**Forums & Time Sinks:**
14. 9gag.com
15. buzzfeed.com
16. huffpost.com
17. dailymail.co.uk
18. bbc.com/news
19. cnn.com
20. news.ycombinator.com

#### 2.2 Blocking Mechanism (`src/background/blocker.ts`)
- Uses `chrome.declarativeNetRequest` to add/remove blocking rules
- Rules activated when timer status = `work`
- Rules deactivated when timer status = `break` or `idle`
- Redirect blocked URLs to `blocked/blocked.html` with original URL as param

#### 2.3 Blocked Page (`src/blocked/blocked.html`)
- Full-page message: "Stay focused! You're in a work session."
- Show remaining time in current pomodoro
- Show active task name
- Motivational message (rotate through a few)
- "Back to work" button (closes tab or goes back)

#### 2.4 Settings — Block List Management (`src/settings/`)
- View default blocked sites (can't remove, but can add exceptions)
- Add custom sites to block
- Add exceptions (allow-list overrides block-list)
- Toggle blocking on/off globally

### Phase 3 — Statistics

#### 3.1 Stats Storage (`src/lib/stats.ts`)
- Record each completed pomodoro with task association
- Aggregate daily stats
- Query methods: by day, week, month, all-time

#### 3.2 Stats View (inside popup or settings page)
- **Contribution heatmap** (GitHub-style grid):
  - Rows = days of week, columns = weeks
  - Color intensity = number of completed pomodoros that day
  - Shows last 3 months by default
- **Summary cards:**
  - Today: X pomodoros, Y tasks completed, Z hours focused
  - This week: same metrics
  - This month: same metrics
- **Per-task breakdown:**
  - List of tasks with total time spent, number of pomodoros

### Phase 4 — Landing Page (`packages/landing`)

- Single-page static site
- Hero section with extension screenshot/mockup
- Feature highlights (3-4 cards)
- "Add to Chrome" button → Chrome Web Store link
- Footer with links
- Built with Next.js static export (`output: 'export'`)
- Deployed to Vercel or similar

---

## File Structure

```
packages/
  extension/
    manifest.json
    public/
      icons/          # icon-16.png, icon-48.png, icon-128.png
      sounds/         # work-end.mp3, break-end.mp3
    src/
      background/
        service-worker.ts    # alarms, message routing, badge updates
        blocker.ts           # declarativeNetRequest rule management
        cleanup.ts           # task auto-expiry logic
      popup/
        popup.html
        popup.ts
        popup.css
        views/
          active-tasks.ts    # main view — 3 daily tasks + timer
          backlog.ts         # backlog management
          stats.ts           # statistics & heatmap
          task-picker.ts     # select tasks for today from backlog
      settings/
        settings.html
        settings.ts
        settings.css
      blocked/
        blocked.html
        blocked.ts
        blocked.css
      offscreen/
        offscreen.html
        offscreen.ts
      components/
        timer-display.ts     # countdown component
        task-card.ts         # task item component
        heatmap.ts           # GitHub-style contribution grid
        modal.ts             # confirmation dialogs
      lib/
        storage.ts           # chrome.storage wrapper, typed CRUD
        blocklist.ts         # default blocked domains list
        stats.ts             # statistics aggregation
        constants.ts         # timer defaults, limits
        types.ts             # all TypeScript interfaces
        utils.ts             # date helpers, formatters
  landing/
    (Next.js project — Phase 4)
```

---

## Implementation Order

1. **Data layer** — `lib/types.ts`, `lib/constants.ts`, `lib/storage.ts`
2. **Background service worker** — timer via alarms, message API
3. **Offscreen document** — sound playback
4. **Popup: active tasks view** — display tasks, start/stop timer
5. **Popup: backlog view** — add/remove tasks, move to active
6. **Popup: task picker** — select up to 3 tasks for today
7. **Site blocker** — declarativeNetRequest rules, blocked page
8. **Settings page** — block list management, timer config, sound settings
9. **Task auto-expiry** — cleanup alarm, expiry warnings
10. **Statistics** — data recording, heatmap, summary cards
11. **Icons** — generate via `generate-icons.cjs`
12. **Sound files** — source or generate notification sounds
13. **Landing page** — Next.js static site

---

## UI/UX Notes

- Dark theme by default (colors already defined in tailwind config)
- Popup width: 380px, height: auto (Chrome popup max ~600px)
- Timer font: monospace (JetBrains Mono), large and centered
- Active task highlighted with left border color
- Smooth transitions between views (no page reloads in popup)
- Badge on extension icon: remaining minutes during work, break indicator during break
- Notification sounds: short, pleasant, not jarring
- Heatmap: green shades (like GitHub) for completed pomodoros
