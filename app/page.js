"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "lockin-dashboard-v1";
const DEADLINE = new Date(2026, 7, 9); // Aug 9, 2026

const CARDS = [
  {
    id: "apartment",
    icon: "🎯",
    color: "#8b5cf6",
    bg: "#f3efff",
    title: "Apartment",
    timeline: "4 month timeline · Target: August 2026",
    description:
      "Start backwards from August. Month 1 (April): lock down your budget — what can you actually afford monthly with all businesses factored in? Research 3–5 complexes in Weston/Davie/Pembroke Pines. Month 2 (May): tour your top picks, get pre-approved if needed, compare lease terms. Month 3 (June): sign the lease, start buying essentials you don't have — don't go crazy, just the non-negotiables. Month 4 (July): move in, get settled, build your environment the way you want it. Treat this like a project with milestones, not something you'll figure out later.",
    subtasks: [
      "Lock down monthly budget",
      "Research 3-5 apartment complexes",
      "Tour top picks and compare leases",
      "Sign lease and move in",
    ],
  },
  {
    id: "schedule",
    icon: "📅",
    color: "#1e88e5",
    bg: "#e8f1fc",
    title: "Daily schedule",
    timeline: "AI-managed operating system · Build this week",
    description:
      "You already have the skeleton: market open at 9:30, two cold calling blocks, gym at 12:30, evening work block. Now make it airtight. Put every block into Google Calendar as recurring events — not suggestions, commitments. Use your personal ops dashboard to log whether you hit each block daily. The key is removing decision fatigue: you shouldn't be deciding what to do at 10 AM, the system should already tell you. Review every Sunday night for 15 minutes — what blocks did you skip, why, and what's the fix.",
    subtasks: [
      "Add all blocks as recurring Google Calendar events",
      "Log daily block completion in planner",
      "Set up Sunday night weekly review",
    ],
  },
  {
    id: "io",
    icon: "📊",
    color: "#10b981",
    bg: "#e8f7f0",
    title: "Weekly & monthly I/O",
    timeline: "Scale Mint cold calling · Track starting this week",
    description:
      "Define your numbers and track them religiously. Weekly inputs: number of cold calls made, conversations had, follow-ups sent. Weekly outputs: appointments booked, proposals sent, deals closed. Set a monthly target — if you're aiming for 20 appointments/week, that's your north star. Log every call in GHL or your dashboard. At the end of each week, review the numbers honestly. If inputs are low, the outputs will never come. This is a volume game early on — the skill compounds, but only if you're putting in the reps.",
    subtasks: [
      "Define weekly input/output metrics",
      "Set monthly appointment target",
      "Build weekly review habit (Friday EOD)",
    ],
  },
  {
    id: "ads",
    icon: "📈",
    color: "#f59e0b",
    bg: "#fef6e4",
    title: "Cold calling → Meta ads transition",
    timeline: "3–6 month horizon",
    description:
      "Cold calling is your engine right now because it costs $0 and builds skill. But the goal is to layer in Meta ads for Scale Mint's own lead gen once you have cash flow. Set a savings target — figure out how much you need to run $500–$1,000/month in ad spend for yourself. Once you hit 4–5 retainer clients from cold calling and have consistent MRR, allocate a percentage to testing Scale Mint ads. Don't cut cold calling cold turkey — run both in parallel until ads are producing reliable appointments, then shift the ratio.",
    subtasks: [
      "Set ad spend savings target",
      "Hit 4-5 retainer clients from cold calling",
      "Launch first Scale Mint Meta ad campaign",
      "Run cold calling + ads in parallel",
    ],
  },
  {
    id: "gym",
    icon: "💪",
    color: "#f97316",
    bg: "#feeede",
    title: "Gym & health goals",
    timeline: "Daily, starting now",
    description:
      "You're 175 at 5'9\" and focused on cutting belly fat and improving mobility before going heavy again. Stick to a consistent schedule — gym at 12:30 PM is already in your day. For the first 4–6 weeks, prioritize mobility work (hip flexors, shoulders, thoracic spine) and moderate cardio. Clean up nutrition: you don't need a crazy diet, just consistency — protein at every meal, cut the late-night garbage, drink water. Track your workouts even if they're simple. The goal isn't to look like a bodybuilder in 30 days, it's to build a habit that doesn't break when life gets busy.",
    subtasks: [
      "Hit gym 5x this week",
      "Meal prep or plan protein-first meals",
      "Start tracking workouts",
    ],
  },
  {
    id: "rejections",
    icon: "🔥",
    color: "#ec4899",
    bg: "#fcebf4",
    title: "Get more rejections — embrace boredom",
    timeline: "Mindset shift, permanent",
    description:
      "This is the one that separates you from everyone else your age who's thinking about starting a business. Rejections are proof you're in the arena. Set a rejection goal — try to get told no 5 times a day on cold calls. When you hit that number, you know you made enough attempts. Boredom is the other side of the same coin: the work that builds a business is repetitive. Dialing, following up, sending invoices, optimizing the same ad. Stop chasing novelty. The operators making $50K/month are doing the same boring shit every single day. That's the moto.",
    subtasks: [
      "Set daily rejection target (5/day)",
      "Track rejections alongside dials",
      'Identify one "boring" task to commit to daily',
    ],
  },
  {
    id: "weed",
    icon: "🌿",
    color: "#43a047",
    bg: "#e8f5e9",
    title: "Weed taper — finish the cart, then done",
    timeline: "This week, after 6 PM only",
    description:
      "You've got a few nights left on the cart. Rules: after 6 PM only, no exceptions. Once it's gone, it's gone — don't buy another one. This isn't about willpower in the moment, it's about removing the option entirely. When the cart is empty, throw it away that night. Replace the habit loop: if you smoked at 9 PM while watching something, find a new 9 PM activity — reading, journaling, going for a walk, even just sitting outside. The first 2 weeks without it will feel off. That's normal. You'll think clearer by week 3 and you'll realize how much it was dulling your edge.",
    subtasks: [
      "Only use after 6 PM — no exceptions",
      "Throw away cart when empty",
      "Replace 9 PM habit with new activity",
    ],
  },
];

function emptyState() {
  const checked = {};
  const subtasks = {};
  const open = {};
  for (const c of CARDS) {
    checked[c.id] = false;
    subtasks[c.id] = c.subtasks.map(() => false);
    open[c.id] = false;
  }
  return { checked, subtasks, open };
}

export default function Home() {
  const [hydrated, setHydrated] = useState(false);
  const [state, setState] = useState(emptyState);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setState({
          checked: { ...emptyState().checked, ...(parsed.checked || {}) },
          subtasks: { ...emptyState().subtasks, ...(parsed.subtasks || {}) },
          open: { ...emptyState().open, ...(parsed.open || {}) },
        });
      }
    } catch (e) {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const completed = CARDS.filter((c) => state.checked[c.id]).length;
  const pct = (completed / CARDS.length) * 100;

  const daysLeft = Math.max(
    0,
    Math.ceil((DEADLINE.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
  );

  function toggleOpen(id) {
    setState((s) => ({ ...s, open: { ...s.open, [id]: !s.open[id] } }));
  }
  function toggleChecked(id) {
    setState((s) => ({ ...s, checked: { ...s.checked, [id]: !s.checked[id] } }));
  }
  function toggleSub(id, idx) {
    setState((s) => {
      const arr = [...(s.subtasks[id] || [])];
      arr[idx] = !arr[idx];
      return { ...s, subtasks: { ...s.subtasks, [id]: arr } };
    });
  }

  if (!hydrated) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#aaa", fontSize: 13 }}>
        Loading…
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", padding: "32px 20px", maxWidth: 760, margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          display: "inline-block",
          background: "#b91c1c",
          color: "#fff",
          fontFamily: "var(--font-dm-mono), monospace",
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: 1,
          padding: "4px 10px",
          borderRadius: 6,
          marginBottom: 14,
        }}
      >
        APRIL 9 — DAY ZERO
      </div>
      <h1
        style={{
          fontSize: 30,
          fontWeight: 700,
          color: "#1a1a1a",
          marginBottom: 6,
          lineHeight: 1.15,
        }}
      >
        Lock-in command center
      </h1>
      <p style={{ fontSize: 14, color: "#666", marginBottom: 22, lineHeight: 1.5 }}>
        7 priorities. No negotiating. Check them off as you build the structure.
      </p>

      {/* Stats row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 10,
          marginBottom: 14,
        }}
      >
        <StatCard label="Completed" value={`${completed} / ${CARDS.length}`} />
        <StatCard label="Deadline" value="Aug 9" />
        <StatCard label="Days left" value={daysLeft.toString()} />
      </div>

      {/* Progress bar */}
      <div
        style={{
          height: 6,
          background: "#ececec",
          borderRadius: 999,
          overflow: "hidden",
          marginBottom: 18,
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: "#43a047",
            transition: "width 0.3s ease",
          }}
        />
      </div>

      {/* Nav */}
      <a
        href="/planner"
        style={{
          display: "inline-block",
          padding: "10px 16px",
          background: "#1a1a1a",
          color: "#fff",
          borderRadius: 10,
          fontSize: 13,
          fontWeight: 500,
          marginBottom: 22,
        }}
      >
        Open daily planner →
      </a>

      {/* Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {CARDS.map((c, i) => {
          const isChecked = state.checked[c.id];
          const isOpen = state.open[c.id];
          const subs = state.subtasks[c.id] || [];
          return (
            <div
              key={c.id}
              style={{
                background: isChecked ? "#f3fbf4" : "#fff",
                border: `1px solid ${isChecked ? "#b8e0c0" : "#e6e6e6"}`,
                borderRadius: 14,
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                transition: "all 0.2s ease",
              }}
            >
              <div
                onClick={() => toggleOpen(c.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: 16,
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: c.bg,
                    color: c.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                    flexShrink: 0,
                  }}
                >
                  {c.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: "#aaa",
                      fontFamily: "var(--font-dm-mono), monospace",
                      marginBottom: 2,
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      color: isChecked ? "#999" : "#1a1a1a",
                      textDecoration: isChecked ? "line-through" : "none",
                      lineHeight: 1.3,
                    }}
                  >
                    {c.title}
                  </div>
                  <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>
                    {c.timeline}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleChecked(c.id);
                  }}
                  aria-label="Mark complete"
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 999,
                    border: `2px solid ${isChecked ? "#43a047" : "#d4d4d4"}`,
                    background: isChecked ? "#43a047" : "#fff",
                    color: "#fff",
                    fontSize: 14,
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {isChecked ? "✓" : ""}
                </button>
              </div>
              {isOpen && (
                <div
                  style={{
                    padding: "0 16px 16px 16px",
                    borderTop: "1px solid #f2f2f2",
                    paddingTop: 14,
                  }}
                >
                  <p style={{ fontSize: 13, color: "#555", lineHeight: 1.6, marginBottom: 14 }}>
                    {c.description}
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {c.subtasks.map((t, idx) => {
                      const done = subs[idx];
                      return (
                        <label
                          key={idx}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            cursor: "pointer",
                            fontSize: 13,
                            color: done ? "#aaa" : "#333",
                            textDecoration: done ? "line-through" : "none",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={done}
                            onChange={() => toggleSub(c.id, idx)}
                            style={{ width: 16, height: 16, accentColor: "#43a047" }}
                          />
                          <span>{t}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <footer
        style={{
          marginTop: 32,
          paddingTop: 16,
          borderTop: "1px solid #ececec",
          textAlign: "center",
          fontSize: 11,
          color: "#aaa",
          fontFamily: "var(--font-dm-mono), monospace",
        }}
      >
        No days off. No excuses. Execute.
      </footer>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e6e6e6",
        borderRadius: 12,
        padding: 12,
      }}
    >
      <div
        style={{
          fontSize: 10,
          color: "#aaa",
          textTransform: "uppercase",
          letterSpacing: 0.6,
          fontWeight: 500,
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: "#1a1a1a" }}>{value}</div>
    </div>
  );
}
