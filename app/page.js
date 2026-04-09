"use client";

import { useEffect, useMemo, useState } from "react";

const DEFAULT_BLOCKS = [
  { id: "1", time: "6:00 AM", task: "Wake up — water, wet face" },
  { id: "2", time: "6:05 AM", task: "Prayer + dynamic stretch (15min)" },
  { id: "3", time: "6:30 AM", task: "Cardio — Stairmaster, walk, run" },
  { id: "4", time: "7:45 AM", task: "Shower + eat" },
  { id: "5", time: "8:00 AM", task: "Backend work — Meta ads, GHL, client deliverables (1 hr)" },
  { id: "6", time: "9:00 AM", task: "Pre-market review — watchlist, bias, plan" },
  { id: "7", time: "9:30 AM", task: "Focused trade window — charts only, zero distractions" },
  { id: "8", time: "10:30 AM", task: "Cold calling block 1 — 2 hours, dial/qualify/book" },
  { id: "9", time: "12:30 PM", task: "Gym + eat — train hard, decompress, come back sharp" },
  { id: "10", time: "2:30 PM", task: "Cold calling block 2 — 2 more hours, finish strong" },
  { id: "11", time: "4:30 PM", task: "Review — trading journal + tomorrow's plan" },
  { id: "12", time: "5:00 PM", task: "You're done. Take 1hr break for last work block." },
  { id: "13", time: "6:00 PM", task: "(Optional) Extra backend work, systems, or deep work — only if you have energy" },
];

const BOLD_KEYWORDS = ["Cold calling", "Focused trade", "You're done", "Backend work"];

const BLOCKS_KEY = "planner-blocks-v2";
const DAILY_KEY = "planner-daily-v2";
const MEALS_KEY = "planner-meals-v2";
const CHECKIN_KEY = "planner-checkins-v1";

const WORLD_CLOCKS = [
  { label: "New York", tz: "America/New_York" },
  { label: "London", tz: "Europe/London" },
  { label: "Dubai", tz: "Asia/Dubai" },
  { label: "Tokyo", tz: "Asia/Tokyo" },
  { label: "Sydney", tz: "Australia/Sydney" },
];

// Check-ins fire when local time >= hour:minute (once per day per id)
const CHECKINS = [
  {
    id: "morning",
    hour: 10,
    minute: 0,
    question: "Morning check — how's the energy so far?",
    goodReply: "Love it. Keep momentum — knock out your next block.",
    badReply:
      "You usually feel better after 10 deep breaths + a glass of water. Do that, then ease into your next block.",
  },
  {
    id: "midday",
    hour: 13,
    minute: 0,
    question: "Midday check — still on track with the plan?",
    goodReply: "Great. Protect the afternoon block — no distractions.",
    badReply:
      "Reset. Step outside for 5 minutes of sunlight, drink water, then pick the ONE next task and commit.",
  },
  {
    id: "afternoon",
    hour: 16,
    minute: 0,
    question: "How's your day going so far? Feeling good?",
    goodReply: "Perfect. Finish strong — one focused push until the review block.",
    badReply:
      "You usually go for walks right now and it makes you feel better. Go for a 15-min walk, then come back and do the work you were supposed to do.",
  },
  {
    id: "evening",
    hour: 19,
    minute: 0,
    question: "Evening check — how'd today actually go?",
    goodReply: "Good. Journal one win, set tomorrow's top 3, then rest.",
    badReply:
      "It's okay. Write down ONE thing you learned, ONE thing you'll change, then close the laptop. Tomorrow resets.",
  },
];

function dateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatLong(d) {
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function isBoldTask(task) {
  return BOLD_KEYWORDS.some((k) => task.toLowerCase().includes(k.toLowerCase()));
}

const MEAL_FIELDS = [
  { key: "breakfast", label: "Breakfast" },
  { key: "lunch", label: "Lunch" },
  { key: "dinner", label: "Dinner" },
  { key: "snacks", label: "Snacks" },
];

export default function Home() {
  const [hydrated, setHydrated] = useState(false);
  const [blocks, setBlocks] = useState(DEFAULT_BLOCKS);
  const [daily, setDaily] = useState({});
  const [meals, setMeals] = useState({});
  const [currentDate, setCurrentDate] = useState(() => new Date());

  // edit state
  const [editingId, setEditingId] = useState(null);
  const [editingField, setEditingField] = useState(null); // "time" | "task"
  const [editValue, setEditValue] = useState("");

  // add row state
  const [addingRow, setAddingRow] = useState(false);
  const [newTime, setNewTime] = useState("");
  const [newTask, setNewTask] = useState("");

  const [hoverId, setHoverId] = useState(null);
  const [dragId, setDragId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  const [now, setNow] = useState(() => new Date());
  const [showClocks, setShowClocks] = useState(false);
  const [checkins, setCheckins] = useState({}); // { "2026-04-08": { afternoon: "good"|"bad"|"dismissed" } }
  const [activeCheckin, setActiveCheckin] = useState(null); // checkin object
  const [checkinStage, setCheckinStage] = useState("ask"); // "ask" | "reply"
  const [checkinReply, setCheckinReply] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const [calMonth, setCalMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  useEffect(() => {
    try {
      const b = localStorage.getItem(BLOCKS_KEY);
      const d = localStorage.getItem(DAILY_KEY);
      const m = localStorage.getItem(MEALS_KEY);
      const c = localStorage.getItem(CHECKIN_KEY);
      if (b) setBlocks(JSON.parse(b));
      if (d) setDaily(JSON.parse(d));
      if (m) setMeals(JSON.parse(m));
      if (c) setCheckins(JSON.parse(c));
    } catch (e) {}
    setHydrated(true);
  }, []);

  // Live clock — tick every second
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Check-in trigger — runs on every tick, fires first unseen check-in whose time has passed
  useEffect(() => {
    if (!hydrated || activeCheckin) return;
    const tk = dateKey(now);
    const todays = checkins[tk] || {};
    const curMin = now.getHours() * 60 + now.getMinutes();
    for (const c of CHECKINS) {
      const cMin = c.hour * 60 + c.minute;
      if (curMin >= cMin && !todays[c.id]) {
        setActiveCheckin(c);
        setCheckinStage("ask");
        setCheckinReply("");
        return;
      }
    }
  }, [now, hydrated, checkins, activeCheckin]);

  useEffect(() => {
    if (hydrated) localStorage.setItem(CHECKIN_KEY, JSON.stringify(checkins));
  }, [checkins, hydrated]);

  useEffect(() => {
    if (hydrated) localStorage.setItem(BLOCKS_KEY, JSON.stringify(blocks));
  }, [blocks, hydrated]);
  useEffect(() => {
    if (hydrated) localStorage.setItem(DAILY_KEY, JSON.stringify(daily));
  }, [daily, hydrated]);
  useEffect(() => {
    if (hydrated) localStorage.setItem(MEALS_KEY, JSON.stringify(meals));
  }, [meals, hydrated]);

  const today = new Date();
  const dk = dateKey(currentDate);
  const todayKey = dateKey(today);
  const isToday = dk === todayKey;

  const dayEntries = daily[dk] || {};
  const dayMeals = meals[dk] || {};

  const plannedCount = useMemo(
    () => blocks.filter((b) => (dayEntries[b.id] || "").trim() !== "").length,
    [blocks, dayEntries]
  );
  const totalCount = blocks.length;
  const progressPct = totalCount ? (plannedCount / totalCount) * 100 : 0;

  function changeDay(delta) {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + delta);
    setCurrentDate(d);
  }

  function goToday() {
    setCurrentDate(new Date());
  }

  function updateEntry(blockId, value) {
    setDaily((prev) => ({
      ...prev,
      [dk]: { ...(prev[dk] || {}), [blockId]: value },
    }));
  }

  function updateMeal(key, value) {
    setMeals((prev) => ({
      ...prev,
      [dk]: { ...(prev[dk] || {}), [key]: value },
    }));
  }

  function startEdit(id, field, currentValue) {
    setEditingId(id);
    setEditingField(field);
    setEditValue(currentValue);
  }
  function cancelEdit() {
    setEditingId(null);
    setEditingField(null);
    setEditValue("");
  }
  function saveEdit() {
    setBlocks((prev) =>
      prev.map((b) => (b.id === editingId ? { ...b, [editingField]: editValue } : b))
    );
    cancelEdit();
  }

  function deleteBlock(id) {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  }

  function addBlock() {
    if (!newTime.trim() || !newTask.trim()) return;
    const id = Date.now().toString();
    setBlocks((prev) => [...prev, { id, time: newTime.trim(), task: newTask.trim() }]);
    setNewTime("");
    setNewTask("");
    setAddingRow(false);
  }

  function copyPrev() {
    const prev = new Date(currentDate);
    prev.setDate(prev.getDate() - 1);
    const pk = dateKey(prev);
    setDaily((p) => ({ ...p, [dk]: { ...(p[pk] || {}) } }));
    setMeals((p) => ({ ...p, [dk]: { ...(p[pk] || {}) } }));
  }

  function clearDay() {
    setDaily((p) => {
      const n = { ...p };
      delete n[dk];
      return n;
    });
    setMeals((p) => {
      const n = { ...p };
      delete n[dk];
      return n;
    });
  }

  function handleDrop(targetId) {
    if (!dragId || dragId === targetId) {
      setDragId(null);
      setDragOverId(null);
      return;
    }
    setBlocks((prev) => {
      const from = prev.findIndex((b) => b.id === dragId);
      const to = prev.findIndex((b) => b.id === targetId);
      if (from === -1 || to === -1) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setDragId(null);
    setDragOverId(null);
  }

  function answerCheckin(answer) {
    if (!activeCheckin) return;
    const tk = dateKey(now);
    setCheckins((prev) => ({
      ...prev,
      [tk]: { ...(prev[tk] || {}), [activeCheckin.id]: answer },
    }));
    if (answer === "dismissed") {
      setActiveCheckin(null);
      return;
    }
    setCheckinReply(answer === "good" ? activeCheckin.goodReply : activeCheckin.badReply);
    setCheckinStage("reply");
  }

  function closeCheckin() {
    setActiveCheckin(null);
    setCheckinStage("ask");
    setCheckinReply("");
  }

  function pickDate(d) {
    setCurrentDate(d);
    setShowCalendar(false);
  }

  function resetAll() {
    if (!confirm("Reset everything? This clears all data.")) return;
    localStorage.removeItem(BLOCKS_KEY);
    localStorage.removeItem(DAILY_KEY);
    localStorage.removeItem(MEALS_KEY);
    setBlocks(DEFAULT_BLOCKS);
    setDaily({});
    setMeals({});
  }

  return (
    <div style={{ minHeight: "100vh", padding: "32px 20px", maxWidth: 880, margin: "0 auto" }}>
      {/* Header */}
      <header style={{ marginBottom: 24 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => changeDay(-1)}
              aria-label="Previous day"
              style={navBtnStyle}
            >
              ‹
            </button>
            <div style={{ position: "relative" }}>
              <div
                onClick={() => setShowCalendar((s) => !s)}
                style={{
                  fontSize: 22,
                  fontWeight: 600,
                  color: "#1a1a1a",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  cursor: "pointer",
                }}
              >
                {formatLong(currentDate)}
                {isToday && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: 0.5,
                      background: "#43a047",
                      color: "#fff",
                      padding: "3px 8px",
                      borderRadius: 6,
                    }}
                  >
                    TODAY
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>Daily Ops · click date for calendar</div>
              {showCalendar && (
                <CalendarPopover
                  month={calMonth}
                  setMonth={setCalMonth}
                  selected={currentDate}
                  today={today}
                  onPick={pickDate}
                  onClose={() => setShowCalendar(false)}
                />
              )}
            </div>
            <button
              onClick={() => changeDay(1)}
              aria-label="Next day"
              style={navBtnStyle}
            >
              ›
            </button>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {!isToday && (
              <button
                onClick={goToday}
                style={{
                  padding: "8px 14px",
                  background: "#e8f5e9",
                  color: "#2e7d32",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                Today
              </button>
            )}
            <ClockWidget
              now={now}
              show={showClocks}
              setShow={setShowClocks}
            />
            <button onClick={copyPrev} style={ghostBtnStyle}>
              Copy prev day
            </button>
            <button onClick={clearDay} style={ghostBtnStyle}>
              Clear day
            </button>
          </div>
        </div>

        {/* Progress */}
        <div style={{ marginTop: 18 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 12,
              color: "#999",
              marginBottom: 6,
            }}
          >
            <span>
              Planned {plannedCount}/{totalCount}
            </span>
            <span>{Math.round(progressPct)}%</span>
          </div>
          <div
            style={{
              height: 6,
              background: "#ececec",
              borderRadius: 999,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progressPct}%`,
                height: "100%",
                background: progressPct === 100 ? "#43a047" : "#1e88e5",
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>
      </header>

      {/* Table card */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e6e6e6",
          borderRadius: 14,
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
          overflow: "hidden",
        }}
      >
        {/* Table header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "20px 86px 1fr 1fr",
            padding: "12px 16px",
            fontSize: 11,
            fontWeight: 500,
            color: "#aaa",
            textTransform: "uppercase",
            letterSpacing: 0.6,
            borderBottom: "1px solid #f0f0f0",
          }}
        >
          <div></div>
          <div>Time</div>
          <div>Block</div>
          <div style={{ color: "#1e88e5" }}>Today's specifics</div>
        </div>

        {blocks.map((b) => {
          const entry = dayEntries[b.id] || "";
          const filled = entry.trim() !== "";
          const isHover = hoverId === b.id;
          return (
            <div
              key={b.id}
              onMouseEnter={() => setHoverId(b.id)}
              onMouseLeave={() => setHoverId(null)}
              onDragOver={(e) => {
                e.preventDefault();
                if (dragId && dragOverId !== b.id) setDragOverId(b.id);
              }}
              onDrop={() => handleDrop(b.id)}
              style={{
                display: "grid",
                gridTemplateColumns: "20px 86px 1fr 1fr",
                padding: "10px 16px",
                borderBottom: "1px solid #f2f2f2",
                background:
                  dragOverId === b.id && dragId !== b.id
                    ? "#eef6ff"
                    : filled
                    ? "#fafff9"
                    : "transparent",
                opacity: dragId === b.id ? 0.4 : 1,
                position: "relative",
                gap: 8,
                alignItems: "start",
              }}
            >
              {/* DRAG HANDLE */}
              <div
                draggable
                onDragStart={() => setDragId(b.id)}
                onDragEnd={() => {
                  setDragId(null);
                  setDragOverId(null);
                }}
                title="Drag to reorder"
                style={{
                  cursor: "grab",
                  color: isHover ? "#bbb" : "transparent",
                  fontSize: 14,
                  lineHeight: 1,
                  paddingTop: 6,
                  userSelect: "none",
                }}
              >
                ⋮⋮
              </div>
              {/* TIME */}
              <div
                style={{
                  fontFamily: "var(--font-dm-mono), monospace",
                  fontSize: 12,
                  color: "#999",
                  paddingTop: 6,
                }}
              >
                {editingId === b.id && editingField === "time" ? (
                  <EditCell
                    value={editValue}
                    onChange={setEditValue}
                    onSave={saveEdit}
                    onCancel={cancelEdit}
                    width={72}
                  />
                ) : (
                  <span
                    onClick={() => startEdit(b.id, "time", b.time)}
                    style={{ cursor: "pointer" }}
                  >
                    {b.time}
                  </span>
                )}
              </div>
              {/* TASK */}
              <div style={{ paddingRight: 8, paddingTop: 4 }}>
                {editingId === b.id && editingField === "task" ? (
                  <EditCell
                    value={editValue}
                    onChange={setEditValue}
                    onSave={saveEdit}
                    onCancel={cancelEdit}
                  />
                ) : (
                  <span
                    onClick={() => startEdit(b.id, "task", b.task)}
                    style={{
                      cursor: "pointer",
                      fontSize: 14,
                      color: "#333",
                      fontWeight: isBoldTask(b.task) ? 600 : 400,
                    }}
                  >
                    {b.task}
                  </span>
                )}
              </div>
              {/* SPECIFICS */}
              <div style={{ position: "relative" }}>
                <textarea
                  value={entry}
                  onChange={(e) => updateEntry(b.id, e.target.value)}
                  placeholder="specific for today..."
                  rows={1}
                  style={{
                    width: "100%",
                    background: "transparent",
                    border: "1px solid transparent",
                    borderRadius: 6,
                    padding: "5px 8px",
                    fontSize: 14,
                    color: "#1a1a1a",
                    outline: "none",
                    minHeight: 30,
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#d4d4d4")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "transparent")}
                />
                {isHover && (
                  <button
                    onClick={() => deleteBlock(b.id)}
                    aria-label="Delete row"
                    style={{
                      position: "absolute",
                      right: -6,
                      top: 4,
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      color: "#aaa",
                      fontSize: 14,
                      lineHeight: 1,
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Add row */}
        <div style={{ padding: 12 }}>
          {addingRow ? (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                placeholder="7:00 AM"
                style={{
                  width: 90,
                  padding: "8px 10px",
                  border: "1px solid #d4d4d4",
                  borderRadius: 8,
                  fontSize: 13,
                  fontFamily: "var(--font-dm-mono), monospace",
                  outline: "none",
                }}
              />
              <input
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                placeholder="Block description"
                style={{
                  flex: 1,
                  padding: "8px 10px",
                  border: "1px solid #d4d4d4",
                  borderRadius: 8,
                  fontSize: 13,
                  outline: "none",
                }}
              />
              <button
                onClick={addBlock}
                style={{
                  padding: "8px 14px",
                  background: "#2e7d32",
                  color: "#fff",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                Add
              </button>
              <button
                onClick={() => {
                  setAddingRow(false);
                  setNewTime("");
                  setNewTask("");
                }}
                style={ghostBtnStyle}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAddingRow(true)}
              style={{
                width: "100%",
                padding: "10px",
                border: "1px dashed #d4d4d4",
                borderRadius: 10,
                color: "#999",
                fontSize: 13,
              }}
            >
              + Add time block
            </button>
          )}
        </div>
      </div>

      {/* Meals */}
      <div style={{ marginTop: 24 }}>
        <h2
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: "#aaa",
            textTransform: "uppercase",
            letterSpacing: 0.6,
            marginBottom: 10,
          }}
        >
          Meals
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 12,
          }}
        >
          {MEAL_FIELDS.map((m) => (
            <div
              key={m.key}
              style={{
                background: "#fff",
                border: "1px solid #e6e6e6",
                borderRadius: 12,
                padding: 14,
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: "#aaa",
                  textTransform: "uppercase",
                  letterSpacing: 0.6,
                  marginBottom: 6,
                }}
              >
                {m.label}
              </div>
              <textarea
                value={dayMeals[m.key] || ""}
                onChange={(e) => updateMeal(m.key, e.target.value)}
                placeholder="..."
                rows={2}
                style={{
                  width: "100%",
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  fontSize: 14,
                  color: "#1a1a1a",
                  minHeight: 40,
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Check-in modal */}
      {activeCheckin && (
        <CheckinModal
          checkin={activeCheckin}
          stage={checkinStage}
          reply={checkinReply}
          onAnswer={answerCheckin}
          onClose={closeCheckin}
        />
      )}

      {/* Footer */}
      <footer
        style={{
          marginTop: 32,
          paddingTop: 16,
          borderTop: "1px solid #ececec",
          display: "flex",
          justifyContent: "space-between",
          fontSize: 11,
          color: "#aaa",
        }}
      >
        <span>Daily Ops · saved locally</span>
        <button onClick={resetAll} style={{ fontSize: 11, color: "#aaa" }}>
          Reset all data
        </button>
      </footer>
    </div>
  );
}

function EditCell({ value, onChange, onSave, onCancel, width }) {
  return (
    <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
      <input
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSave();
          if (e.key === "Escape") onCancel();
        }}
        style={{
          width: width || "100%",
          padding: "4px 6px",
          border: "1px solid #d4d4d4",
          borderRadius: 6,
          fontSize: 13,
          outline: "none",
        }}
      />
      <button onClick={onSave} style={{ color: "#2e7d32", fontSize: 14 }}>
        ✓
      </button>
      <button onClick={onCancel} style={{ color: "#aaa", fontSize: 14 }}>
        ×
      </button>
    </span>
  );
}

function ClockWidget({ now, show, setShow }) {
  const localTime = now.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setShow(!show)}
        title="World clocks"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "8px 12px",
          background: "#fff",
          border: "1px solid #e6e6e6",
          borderRadius: 8,
          fontSize: 13,
          color: "#333",
          fontFamily: "var(--font-dm-mono), monospace",
        }}
      >
        <span style={{ fontSize: 14 }}>🕐</span>
        <span>{localTime}</span>
      </button>
      {show && (
        <>
          <div
            onClick={() => setShow(false)}
            style={{ position: "fixed", inset: 0, zIndex: 40 }}
          />
          <div
            style={{
              position: "absolute",
              top: "100%",
              right: 0,
              marginTop: 8,
              zIndex: 50,
              background: "#fff",
              border: "1px solid #e6e6e6",
              borderRadius: 12,
              boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
              padding: 14,
              width: 240,
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: "#aaa",
                textTransform: "uppercase",
                letterSpacing: 0.6,
                marginBottom: 10,
                fontWeight: 500,
              }}
            >
              World Clocks
            </div>
            {WORLD_CLOCKS.map((c) => {
              const t = now.toLocaleTimeString("en-US", {
                timeZone: c.tz,
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              });
              const d = now.toLocaleDateString("en-US", {
                timeZone: c.tz,
                weekday: "short",
              });
              return (
                <div
                  key={c.tz}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 0",
                    borderBottom: "1px solid #f2f2f2",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, color: "#1a1a1a", fontWeight: 500 }}>
                      {c.label}
                    </div>
                    <div style={{ fontSize: 10, color: "#aaa" }}>{d}</div>
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-dm-mono), monospace",
                      fontSize: 13,
                      color: "#333",
                    }}
                  >
                    {t}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function CheckinModal({ checkin, stage, reply, onAnswer, onClose }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(26,26,26,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        zIndex: 100,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: 28,
          maxWidth: 420,
          width: "100%",
          boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
        }}
      >
        <div
          style={{
            fontSize: 10,
            color: "#aaa",
            textTransform: "uppercase",
            letterSpacing: 0.6,
            fontWeight: 500,
            marginBottom: 10,
          }}
        >
          Check-in · {checkin.hour % 12 || 12}:{String(checkin.minute).padStart(2, "0")}{" "}
          {checkin.hour >= 12 ? "PM" : "AM"}
        </div>
        {stage === "ask" ? (
          <>
            <div style={{ fontSize: 18, fontWeight: 600, color: "#1a1a1a", marginBottom: 20 }}>
              {checkin.question}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => onAnswer("good")}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: "#e8f5e9",
                  color: "#2e7d32",
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                Yes, feeling good
              </button>
              <button
                onClick={() => onAnswer("bad")}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: "#fef2f2",
                  color: "#b91c1c",
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                Not really
              </button>
            </div>
            <button
              onClick={() => onAnswer("dismissed")}
              style={{
                marginTop: 12,
                width: "100%",
                padding: "8px",
                fontSize: 12,
                color: "#aaa",
              }}
            >
              Skip
            </button>
          </>
        ) : (
          <>
            <div style={{ fontSize: 15, color: "#333", lineHeight: 1.5, marginBottom: 20 }}>
              {reply}
            </div>
            <button
              onClick={onClose}
              style={{
                width: "100%",
                padding: "12px",
                background: "#1a1a1a",
                color: "#fff",
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              Got it
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function CalendarPopover({ month, setMonth, selected, today, onPick, onClose }) {
  const year = month.getFullYear();
  const m = month.getMonth();
  const firstDay = new Date(year, m, 1).getDay();
  const daysInMonth = new Date(year, m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const selK = dateKey(selected);
  const todayK = dateKey(today);
  const monthLabel = month.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, zIndex: 40 }}
      />
      <div
        style={{
          position: "absolute",
          top: "100%",
          left: 0,
          marginTop: 8,
          zIndex: 50,
          background: "#fff",
          border: "1px solid #e6e6e6",
          borderRadius: 12,
          boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
          padding: 14,
          width: 260,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <button
            onClick={() => setMonth(new Date(year, m - 1, 1))}
            style={{ padding: "4px 8px", color: "#666", fontSize: 16 }}
          >
            ‹
          </button>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>{monthLabel}</div>
          <button
            onClick={() => setMonth(new Date(year, m + 1, 1))}
            style={{ padding: "4px 8px", color: "#666", fontSize: 16 }}
          >
            ›
          </button>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 2,
            fontSize: 10,
            color: "#aaa",
            textTransform: "uppercase",
            marginBottom: 4,
          }}
        >
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div key={i} style={{ textAlign: "center", padding: 4 }}>
              {d}
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
          {cells.map((d, i) => {
            if (d === null) return <div key={i} />;
            const date = new Date(year, m, d);
            const k = dateKey(date);
            const isSel = k === selK;
            const isTod = k === todayK;
            return (
              <button
                key={i}
                onClick={() => onPick(date)}
                style={{
                  padding: "6px 0",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: isSel || isTod ? 600 : 400,
                  background: isSel ? "#1e88e5" : isTod ? "#e8f5e9" : "transparent",
                  color: isSel ? "#fff" : isTod ? "#2e7d32" : "#333",
                }}
              >
                {d}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

const navBtnStyle = {
  width: 32,
  height: 32,
  borderRadius: 8,
  background: "#fff",
  border: "1px solid #e6e6e6",
  fontSize: 18,
  color: "#666",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const ghostBtnStyle = {
  padding: "8px 14px",
  background: "#fff",
  border: "1px solid #e6e6e6",
  borderRadius: 8,
  fontSize: 13,
  color: "#666",
};
