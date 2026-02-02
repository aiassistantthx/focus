const CHROME_STORE_URL = '#'; // TODO: replace with actual Chrome Web Store URL

function Navbar() {
  return (
    <nav className="fixed top-0 z-50 w-full border-b border-white/10 bg-bg-dark/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <span className="text-xl font-bold tracking-tight">
          <span className="text-primary">Focus</span>
        </span>
        <a
          href={CHROME_STORE_URL}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90"
        >
          Add to Chrome
        </a>
      </div>
    </nav>
  );
}

function TimerIllustration() {
  return (
    <div className="relative mx-auto h-48 w-48 sm:h-64 sm:w-64">
      {/* Outer ring */}
      <svg viewBox="0 0 200 200" className="h-full w-full">
        <circle
          cx="100"
          cy="100"
          r="90"
          fill="none"
          stroke="#16213E"
          strokeWidth="8"
        />
        <circle
          cx="100"
          cy="100"
          r="90"
          fill="none"
          stroke="#E74C3C"
          strokeWidth="8"
          strokeDasharray="565.48"
          strokeDashoffset="141.37"
          strokeLinecap="round"
          transform="rotate(-90 100 100)"
          className="animate-pulse"
        />
        <text
          x="100"
          y="95"
          textAnchor="middle"
          className="fill-text-light font-mono text-3xl font-bold"
          style={{ fontSize: '36px' }}
        >
          37:30
        </text>
        <text
          x="100"
          y="120"
          textAnchor="middle"
          className="fill-primary text-xs uppercase tracking-widest"
          style={{ fontSize: '12px' }}
        >
          Focus
        </text>
      </svg>
    </div>
  );
}

function Hero() {
  return (
    <section className="flex min-h-screen flex-col items-center justify-center px-6 pt-20 text-center">
      <TimerIllustration />
      <h1 className="mt-8 max-w-3xl text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
        Stay focused.{' '}
        <span className="text-primary">Get things done.</span>
      </h1>
      <p className="mt-4 max-w-xl text-lg text-text-light/70">
        Pomodoro timer, task management, site blocking, and activity tracking
        — all in one lightweight Chrome extension.
      </p>
      <a
        href={CHROME_STORE_URL}
        className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-primary/25 transition hover:scale-105 hover:bg-primary/90"
      >
        <ChromeIcon />
        Add to Chrome — It&apos;s Free
      </a>
    </section>
  );
}

function ChromeIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="4" />
      <line x1="21.17" y1="8" x2="12" y2="8" />
      <line x1="3.95" y1="6.06" x2="8.54" y2="14" />
      <line x1="10.88" y1="21.94" x2="15.46" y2="14" />
    </svg>
  );
}

const features = [
  {
    title: 'Pomodoro Timer',
    description: '50-minute focus sessions with 10-minute breaks. Stay in the zone with structured work cycles.',
    icon: (
      <svg viewBox="0 0 40 40" className="h-10 w-10 text-primary">
        <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="2" />
        <line x1="20" y1="8" x2="20" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <line x1="20" y1="20" x2="28" y2="24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Task Management',
    description: 'Pick 3 daily tasks from your backlog. Focus on what matters most, every single day.',
    icon: (
      <svg viewBox="0 0 40 40" className="h-10 w-10 text-break-green">
        <rect x="6" y="8" width="28" height="6" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
        <rect x="6" y="17" width="28" height="6" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
        <rect x="6" y="26" width="28" height="6" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
        <polyline points="10,11 12,13 16,9" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    title: 'Site Blocking',
    description: 'Block 20+ distracting websites during focus sessions. No more doomscrolling when you should be working.',
    icon: (
      <svg viewBox="0 0 40 40" className="h-10 w-10 text-accent">
        <circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" strokeWidth="2" />
        <line x1="8" y1="8" x2="32" y2="32" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
  },
  {
    title: 'Statistics',
    description: 'GitHub-style activity heatmap to visualize your productivity streaks and daily focus time.',
    icon: (
      <svg viewBox="0 0 40 40" className="h-10 w-10 text-primary">
        {[0, 1, 2, 3, 4].map((row) =>
          [0, 1, 2, 3, 4, 5, 6].map((col) => (
            <rect
              key={`${row}-${col}`}
              x={4 + col * 5}
              y={6 + row * 6}
              width="4"
              height="4"
              rx="0.5"
              fill="currentColor"
              opacity={Math.random() > 0.4 ? 0.3 + Math.random() * 0.7 : 0.1}
            />
          ))
        )}
      </svg>
    ),
  },
];

function Features() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <h2 className="text-center text-3xl font-bold sm:text-4xl">
        Everything you need to <span className="text-primary">stay productive</span>
      </h2>
      <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f) => (
          <div
            key={f.title}
            className="rounded-2xl border border-white/5 bg-card-dark p-6 transition hover:border-primary/30"
          >
            <div className="mb-4">{f.icon}</div>
            <h3 className="text-lg font-semibold">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-text-light/60">
              {f.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

const steps = [
  { number: '1', title: 'Add your tasks', description: 'Pick up to 3 tasks you want to accomplish today.' },
  { number: '2', title: 'Start the timer', description: 'Hit play and enter a 50-minute focus session.' },
  { number: '3', title: 'Stay focused', description: 'Distracting sites are blocked. Just you and your work.' },
];

function HowItWorks() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-24">
      <h2 className="text-center text-3xl font-bold sm:text-4xl">
        How it <span className="text-primary">works</span>
      </h2>
      <div className="mt-16 grid gap-8 sm:grid-cols-3">
        {steps.map((s) => (
          <div key={s.number} className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 font-mono text-2xl font-bold text-primary">
              {s.number}
            </div>
            <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
            <p className="mt-2 text-sm text-text-light/60">{s.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="px-6 py-24 text-center">
      <div className="mx-auto max-w-2xl rounded-3xl border border-white/5 bg-card-dark p-12">
        <h2 className="text-3xl font-bold sm:text-4xl">
          Ready to <span className="text-primary">focus</span>?
        </h2>
        <p className="mt-4 text-text-light/60">
          Join thousands of people who use Focus to get more done every day.
        </p>
        <a
          href={CHROME_STORE_URL}
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-primary/25 transition hover:scale-105 hover:bg-primary/90"
        >
          <ChromeIcon />
          Add to Chrome — It&apos;s Free
        </a>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/10 px-6 py-8 text-center text-sm text-text-light/40">
      <p>&copy; {new Date().getFullYear()} Focus. Built with Focus.</p>
    </footer>
  );
}

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
