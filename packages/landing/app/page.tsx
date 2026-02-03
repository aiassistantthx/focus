const CWS_URL = '#';

/* ─── Navbar ─── */
function Navbar() {
  return (
    <nav className="fixed top-0 z-50 w-full border-b border-white/5 bg-bg-dark/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-primary" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <span className="text-lg font-bold tracking-tight">Focus</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="#features" className="hidden text-sm text-text-light/50 transition hover:text-text-light sm:block">Features</a>
          <a href="#how-it-works" className="hidden text-sm text-text-light/50 transition hover:text-text-light sm:block">How it works</a>
          <a
            href={CWS_URL}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20"
          >
            Add to Chrome
          </a>
        </div>
      </div>
    </nav>
  );
}

/* ─── Hero ─── */
function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-32">
      {/* Background effects */}
      <div className="absolute inset-0 grid-bg" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] radial-fade" />

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="flex flex-col items-center text-center lg:flex-row lg:text-left lg:gap-16">
          {/* Copy */}
          <div className="flex-1">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-text-light/60">
              <span className="inline-block h-2 w-2 rounded-full bg-break-green animate-pulse" />
              Free &amp; open-source Chrome extension
            </div>

            <h1 className="text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              50 minutes of<br />
              <span className="gradient-text">deep work.</span><br />
              Every single day.
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-relaxed text-text-light/50">
              Focus combines a Pomodoro timer, task management, and automatic site blocking
              into one lightweight extension. Pick up to 5 tasks, start the timer, and let Focus
              handle the distractions.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href={CWS_URL}
                className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-primary px-7 py-3.5 text-base font-semibold text-white shadow-xl shadow-primary/20 transition hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/30"
              >
                <ChromeIcon />
                Add to Chrome &mdash; It&apos;s Free
              </a>
              <span className="text-sm text-text-light/30">Works with any Chromium browser</span>
            </div>

            <div className="mt-10 flex items-center gap-8 text-sm text-text-light/40">
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-break-green" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                No account needed
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-break-green" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                100% local data
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-break-green" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                &lt; 1 MB
              </div>
            </div>
          </div>

          {/* Timer mockup */}
          <div className="mt-14 flex-shrink-0 lg:mt-0">
            <PopupMockup />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Popup visual mockup ─── */
function PopupMockup() {
  return (
    <div className="animate-float relative w-[300px] rounded-2xl border border-white/10 bg-card-dark p-0 mockup-shadow">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 px-5 py-3">
        <span className="text-sm font-bold">Focus</span>
        <div className="flex gap-1.5">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-4 w-4 rounded bg-white/10" />
          ))}
        </div>
      </div>

      {/* Timer */}
      <div className="flex flex-col items-center py-8">
        <p className="mb-3 text-[10px] font-medium uppercase tracking-widest text-primary">Work Session</p>
        <div className="relative">
          <svg viewBox="0 0 120 120" className="h-32 w-32">
            <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(231,76,60,0.1)" strokeWidth="4" />
            <circle
              cx="60" cy="60" r="54"
              fill="none" stroke="#E74C3C" strokeWidth="4"
              strokeDasharray="339.29" strokeDashoffset="85"
              strokeLinecap="round"
              transform="rotate(-90 60 60)"
              className="timer-ring-animated"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-mono text-2xl font-bold text-primary">37:42</span>
          </div>
        </div>
        <p className="mt-3 text-[10px] text-white/30">Distracting sites blocked</p>
      </div>

      {/* Task cards */}
      <div className="space-y-1.5 px-4 pb-4">
        {[
          { title: 'Write blog post', active: true, pom: '2 pom', time: '95m' },
          { title: 'Review pull requests', active: false, pom: '', time: '' },
          { title: 'Update landing page', active: false, pom: '1 pom', time: '50m' },
        ].map((t) => (
          <div
            key={t.title}
            className={`rounded-lg border px-3 py-2 text-xs ${
              t.active
                ? 'border-primary/30 bg-primary/5'
                : 'border-white/5 bg-white/[0.02]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`font-medium ${t.active ? 'text-text-light' : 'text-white/60'}`}>{t.title}</span>
              <div className="flex items-center gap-2 text-[10px] text-white/30">
                {t.time && <span>{t.time}</span>}
                {t.pom && <span>{t.pom}</span>}
              </div>
            </div>
            {t.active && (
              <div className="mt-1.5 flex items-center gap-1.5">
                <span className="rounded bg-accent/20 px-1.5 py-0.5 text-[9px] font-medium text-accent">Working...</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Numbers banner ─── */
function Numbers() {
  return (
    <section className="border-y border-white/5 bg-card-dark/50">
      <div className="mx-auto grid max-w-4xl grid-cols-2 gap-6 px-6 py-12 sm:grid-cols-4 text-center">
        {[
          { value: '50 min', label: 'Focus sessions' },
          { value: '5', label: 'Daily tasks max' },
          { value: '47+', label: 'Sites blocked' },
          { value: '0', label: 'Accounts needed' },
        ].map((s) => (
          <div key={s.label}>
            <p className="text-2xl font-bold text-text-light sm:text-3xl">{s.value}</p>
            <p className="mt-1 text-xs text-text-light/40">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Features section ─── */
const features = [
  {
    tag: 'Timer',
    tagColor: 'text-primary bg-primary/10',
    title: 'Pomodoro timer built for real work',
    description:
      'Default 50-minute work sessions with 10-minute breaks — because 25 minutes isn\u2019t enough to reach deep focus. Fully configurable from 1 to 120 minutes. The timer lives in your toolbar badge so you always know where you stand.',
    details: ['Configurable work & break durations', 'Live countdown in extension badge', 'Sound notifications between phases', 'Auto-transitions work \u2192 break \u2192 idle'],
    visual: <TimerVisual />,
  },
  {
    tag: 'Tasks',
    tagColor: 'text-break-green bg-break-green/10',
    title: 'Five tasks. No more.',
    description:
      'Every day, pick up to 5 tasks from your backlog. This constraint is the feature — it forces you to prioritize ruthlessly. Tasks expire after 7 days of inactivity so your backlog stays clean automatically.',
    details: ['Backlog with auto-expiry (7 days)', 'One-click "Add to today" planning', 'Per-task pomodoro & time tracking', 'Move to tomorrow or back to backlog'],
    visual: <TasksVisual />,
  },
  {
    tag: 'Blocking',
    tagColor: 'text-accent bg-accent/10',
    title: 'Distractions blocked. Exceptions allowed.',
    description:
      'When the timer is running, 47+ distracting sites are automatically blocked — including X, Reddit, YouTube, TikTok, Instagram, and more. During breaks, everything unlocks automatically.',
    details: ['47+ default blocked sites', 'Custom block & allow lists', 'Per-task site exceptions', 'Auto-unblock during breaks'],
    visual: <BlockingVisual />,
  },
  {
    tag: 'Stats',
    tagColor: 'text-primary bg-primary/10',
    title: 'See your focus streaks grow',
    description:
      'A GitHub-style activity heatmap shows your daily focus intensity over the last 91 days. Track completed tasks, pomodoro counts, and total deep work time — daily, weekly, and monthly.',
    details: ['91-day activity heatmap', 'Today / week / month summaries', 'Per-task time breakdown', 'All data stored locally'],
    visual: <StatsVisual />,
  },
];

function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-24 lg:py-32">
      <div className="text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-primary">Features</p>
        <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
          Everything you need.<br className="hidden sm:block" /> Nothing you don&apos;t.
        </h2>
      </div>

      <div className="mt-20 space-y-28 lg:space-y-36">
        {features.map((f, i) => (
          <div
            key={f.tag}
            className={`flex flex-col items-center gap-12 lg:gap-20 ${
              i % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'
            }`}
          >
            {/* Text */}
            <div className="flex-1">
              <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${f.tagColor}`}>
                {f.tag}
              </span>
              <h3 className="mt-4 text-2xl font-bold leading-snug sm:text-3xl">{f.title}</h3>
              <p className="mt-4 leading-relaxed text-text-light/50">{f.description}</p>
              <ul className="mt-6 space-y-2.5">
                {f.details.map((d) => (
                  <li key={d} className="flex items-center gap-3 text-sm text-text-light/60">
                    <svg className="h-4 w-4 shrink-0 text-break-green" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {d}
                  </li>
                ))}
              </ul>
            </div>

            {/* Visual */}
            <div className="w-full max-w-md flex-shrink-0 lg:w-[420px]">
              {f.visual}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Feature visuals ─── */
function TimerVisual() {
  return (
    <div className="flex items-center justify-center rounded-2xl border border-white/5 bg-card-dark p-10 glow-red">
      <div className="relative">
        <svg viewBox="0 0 200 200" className="h-48 w-48">
          <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(231,76,60,0.08)" strokeWidth="6" />
          <circle cx="100" cy="100" r="90" fill="none" stroke="#E74C3C" strokeWidth="6"
            strokeDasharray="565.48" strokeDashoffset="141" strokeLinecap="round"
            transform="rotate(-90 100 100)" className="timer-ring-animated" />
          <circle cx="100" cy="100" r="75" fill="none" stroke="rgba(231,76,60,0.04)" strokeWidth="1" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-4xl font-bold text-primary">37:42</span>
          <span className="mt-1 text-xs font-medium uppercase tracking-widest text-primary/60">Focus</span>
        </div>
      </div>
    </div>
  );
}

function TasksVisual() {
  const tasks = [
    { title: 'Write blog post about launch', done: true },
    { title: 'Review design mockups', done: false, active: true },
    { title: 'Prepare demo for meeting', done: false },
    { title: 'Fix login bug', done: false },
    { title: 'Update documentation', done: false },
  ];
  return (
    <div className="rounded-2xl border border-white/5 bg-card-dark p-6 glow-green">
      <p className="mb-4 text-[10px] font-medium uppercase tracking-widest text-white/30">Today&apos;s Tasks</p>
      <div className="space-y-2.5">
        {tasks.map((t) => (
          <div
            key={t.title}
            className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
              t.done
                ? 'border-break-green/20 bg-break-green/5'
                : t.active
                  ? 'border-primary/20 bg-primary/5'
                  : 'border-white/5 bg-white/[0.02]'
            }`}
          >
            <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
              t.done
                ? 'border-break-green bg-break-green'
                : 'border-white/20'
            }`}>
              {t.done && (
                <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span className={`text-sm ${t.done ? 'text-white/30 line-through' : 'text-text-light'}`}>
              {t.title}
            </span>
            {t.active && (
              <span className="ml-auto rounded bg-accent/20 px-2 py-0.5 text-[10px] font-medium text-accent">Working</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function BlockingVisual() {
  const sites = [
    { name: 'x.com', icon: 'X' },
    { name: 'reddit.com', icon: 'R' },
    { name: 'youtube.com', icon: 'Y' },
    { name: 'tiktok.com', icon: 'T' },
    { name: 'instagram.com', icon: 'I' },
    { name: 'facebook.com', icon: 'F' },
    { name: 'linkedin.com', icon: 'L' },
    { name: 'twitch.tv', icon: 'Tw' },
    { name: 'netflix.com', icon: 'N' },
  ];
  return (
    <div className="rounded-2xl border border-white/5 bg-card-dark p-6">
      <div className="mb-4 flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
        <span className="text-[10px] font-medium uppercase tracking-widest text-white/30">Blocked during focus</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {sites.map((s) => (
          <div key={s.name} className="group relative flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 transition hover:border-primary/20">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-white/10 text-[10px] font-bold text-white/40">
              {s.icon}
            </div>
            <span className="text-xs text-white/40">{s.name}</span>
            <svg className="absolute right-2 top-2 h-3 w-3 text-primary/40" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
            </svg>
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-lg border border-dashed border-break-green/20 bg-break-green/5 px-3 py-2 text-xs text-break-green/60">
        <span className="font-medium text-break-green/80">Per-task exceptions:</span> Allow specific sites for specific tasks (e.g., X.com for &quot;Write social post&quot;)
      </div>
    </div>
  );
}

function StatsVisual() {
  // Generate deterministic heatmap data
  const weeks = 13;
  const days = 7;
  const cells: number[][] = [];
  let seed = 42;
  const seededRandom = () => {
    seed = (seed * 16807 + 0) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  for (let w = 0; w < weeks; w++) {
    const week: number[] = [];
    for (let d = 0; d < days; d++) {
      const base = w > 8 ? 0.6 : w > 4 ? 0.4 : 0.2;
      week.push(seededRandom() > (1 - base) ? Math.ceil(seededRandom() * 4) : 0);
    }
    cells.push(week);
  }

  const getColor = (v: number) => {
    if (v === 0) return 'rgba(255,255,255,0.04)';
    if (v === 1) return 'rgba(39,174,96,0.3)';
    if (v === 2) return 'rgba(39,174,96,0.5)';
    if (v === 3) return 'rgba(39,174,96,0.7)';
    return 'rgba(39,174,96,1)';
  };

  return (
    <div className="rounded-2xl border border-white/5 bg-card-dark p-6 glow-green">
      {/* Summary cards */}
      <div className="mb-5 grid grid-cols-3 gap-2">
        {[
          { label: 'Today', pom: '4', time: '3h 20m' },
          { label: 'Week', pom: '18', time: '15h' },
          { label: 'Month', pom: '64', time: '53h' },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-center">
            <p className="text-[10px] text-white/30">{s.label}</p>
            <p className="text-lg font-bold">{s.pom}</p>
            <p className="text-[10px] text-white/30">{s.time}</p>
          </div>
        ))}
      </div>

      {/* Heatmap */}
      <p className="mb-2 text-[10px] font-medium uppercase tracking-widest text-white/30">Activity</p>
      <div className="overflow-hidden rounded-lg border border-white/5 bg-white/[0.01] p-3">
        <svg viewBox={`0 0 ${weeks * 14} ${days * 14}`} className="w-full">
          {cells.map((week, wi) =>
            week.map((val, di) => (
              <rect
                key={`${wi}-${di}`}
                x={wi * 14}
                y={di * 14}
                width="11"
                height="11"
                rx="2"
                fill={getColor(val)}
              />
            ))
          )}
        </svg>
      </div>
    </div>
  );
}

/* ─── How it works ─── */
const steps = [
  {
    number: '01',
    title: 'Add tasks to your backlog',
    description: 'Brain-dump everything you need to do. Tasks auto-expire after 7 days, keeping your list fresh.',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
    ),
  },
  {
    number: '02',
    title: 'Pick today\u2019s tasks (up to 5)',
    description: 'The daily limit forces prioritization. Move tasks from backlog to today with one click.',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
      </svg>
    ),
  },
  {
    number: '03',
    title: 'Start the timer & focus',
    description: 'Hit start on a task. Distracting sites are blocked automatically. All you can do is work.',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
      </svg>
    ),
  },
  {
    number: '04',
    title: 'Take a break, repeat',
    description: 'After 50 minutes, take a 10-minute break. Sites unblock. Then start the next session.',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
      </svg>
    ),
  },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="relative border-t border-white/5 bg-card-dark/30 px-6 py-24 lg:py-32">
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-primary">How it works</p>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
            From chaos to deep work<br className="hidden sm:block" /> in 60 seconds
          </h2>
        </div>

        <div className="relative mt-16">
          {/* Vertical line */}
          <div className="absolute left-8 top-0 hidden h-full w-px bg-gradient-to-b from-primary/40 via-primary/20 to-transparent lg:block" />

          <div className="space-y-10">
            {steps.map((s) => (
              <div key={s.number} className="flex gap-6 lg:gap-10">
                <div className="flex shrink-0 flex-col items-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-bg-dark text-primary">
                    {s.icon}
                  </div>
                </div>
                <div className="pt-2">
                  <p className="font-mono text-xs text-primary/60">{s.number}</p>
                  <h3 className="mt-1 text-lg font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-text-light/50">{s.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Per-task exceptions callout ─── */
function ExceptionsCallout() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24 lg:py-32">
      <div className="overflow-hidden rounded-3xl border border-white/5 bg-card-dark">
        <div className="grid lg:grid-cols-2">
          <div className="p-8 lg:p-12">
            <span className="inline-block rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">New</span>
            <h3 className="mt-4 text-2xl font-bold sm:text-3xl">
              Smart exceptions<br />for every task
            </h3>
            <p className="mt-4 leading-relaxed text-text-light/50">
              Need X.com for your &quot;Write social media post&quot; task? Or Wikipedia for research?
              Add per-task site exceptions so only the sites you actually need are unblocked &mdash;
              everything else stays blocked.
            </p>
            <div className="mt-6 space-y-3">
              {[
                { task: 'Write post about launch', exception: 'x.com' },
                { task: 'Research competitors', exception: 'reddit.com, linkedin.com' },
                { task: 'Watch tutorial', exception: 'youtube.com' },
              ].map((ex) => (
                <div key={ex.task} className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
                  <div className="mt-0.5 shrink-0 rounded bg-primary/10 p-1">
                    <svg className="h-3 w-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{ex.task}</p>
                    <p className="text-xs text-break-green/60">Allows: {ex.exception}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-center bg-gradient-to-br from-primary/5 to-transparent p-8 lg:p-12">
            <div className="w-full max-w-[260px] animate-float-delayed rounded-xl border border-white/10 bg-bg-dark p-4 mockup-shadow">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium">Write post about launch</span>
                <span className="rounded bg-accent/20 px-1.5 py-0.5 text-[9px] text-accent">Working</span>
              </div>
              <details open className="text-xs">
                <summary className="cursor-default text-white/30">Allowed sites (1)</summary>
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between rounded bg-white/5 px-2 py-1">
                    <span className="text-white/50">x.com</span>
                    <span className="text-red-400/50">&times;</span>
                  </div>
                  <div className="flex gap-1">
                    <div className="flex-1 rounded border border-white/10 bg-transparent px-2 py-1 text-white/30">
                      e.g. reddit.com
                    </div>
                    <div className="rounded bg-white/5 px-2 py-1 text-white/40">Add</div>
                  </div>
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Philosophy ─── */
function Philosophy() {
  return (
    <section className="border-t border-white/5 px-6 py-24 lg:py-32">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-primary">Philosophy</p>
        <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Why 5 tasks &amp; 50 minutes?</h2>
        <div className="mt-10 space-y-8 text-left">
          <div className="rounded-2xl border border-white/5 bg-card-dark p-6">
            <h3 className="font-semibold">The 5-task limit</h3>
            <p className="mt-2 text-sm leading-relaxed text-text-light/50">
              Most productivity apps let you create infinite tasks, which leads to infinite overwhelm.
              Focus caps you at 5 tasks per day. If something doesn&apos;t make the cut today, it goes
              to tomorrow or stays in the backlog. This forces daily prioritization instead of
              endless list management.
            </p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-card-dark p-6">
            <h3 className="font-semibold">50 minutes, not 25</h3>
            <p className="mt-2 text-sm leading-relaxed text-text-light/50">
              The classic Pomodoro is 25 minutes, but research on flow states shows it takes 15-20 minutes
              just to reach deep focus. A 50-minute session gives you a full 30+ minutes of peak
              concentration. Of course, you can adjust this to any duration that works for you.
            </p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-card-dark p-6">
            <h3 className="font-semibold">Automatic blocking, not willpower</h3>
            <p className="mt-2 text-sm leading-relaxed text-text-light/50">
              You shouldn&apos;t need willpower to avoid Twitter during a work session. Focus blocks
              distracting sites automatically when the timer is running, and unblocks them during breaks.
              Your data never leaves your browser — everything is stored locally in Chrome.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Final CTA ─── */
function FinalCTA() {
  return (
    <section className="px-6 py-24 lg:py-32">
      <div className="relative mx-auto max-w-3xl overflow-hidden rounded-3xl border border-white/5 bg-card-dark p-12 text-center lg:p-16">
        <div className="absolute inset-0 radial-fade" />
        <div className="relative">
          <h2 className="text-3xl font-bold sm:text-4xl lg:text-5xl">
            Ready to <span className="gradient-text">focus</span>?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-text-light/50">
            Install Focus in under 10 seconds. No sign-up, no subscription, no data collection.
            Just you and your work.
          </p>
          <a
            href={CWS_URL}
            className="mt-8 inline-flex items-center gap-2.5 rounded-xl bg-primary px-8 py-4 text-lg font-semibold text-white shadow-xl shadow-primary/20 transition hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/30"
          >
            <ChromeIcon />
            Add to Chrome &mdash; It&apos;s Free
          </a>
          <div className="mt-6 flex items-center justify-center gap-6 text-xs text-text-light/30">
            <span>Chrome, Edge, Brave, Arc</span>
            <span>&bull;</span>
            <span>100% free &amp; local</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Footer ─── */
function Footer() {
  return (
    <footer className="border-t border-white/5 px-6 py-8">
      <div className="mx-auto flex max-w-6xl items-center justify-between text-xs text-text-light/30">
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-primary/10">
            <svg viewBox="0 0 24 24" className="h-3 w-3 text-primary" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          Focus
        </div>
        <p>&copy; {new Date().getFullYear()} Focus. All data stays on your device.</p>
      </div>
    </footer>
  );
}

/* ─── Shared icons ─── */
function ChromeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="4" />
      <line x1="21.17" y1="8" x2="12" y2="8" />
      <line x1="3.95" y1="6.06" x2="8.54" y2="14" />
      <line x1="10.88" y1="21.94" x2="15.46" y2="14" />
    </svg>
  );
}

/* ─── Page ─── */
export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Numbers />
        <Features />
        <ExceptionsCallout />
        <HowItWorks />
        <Philosophy />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
