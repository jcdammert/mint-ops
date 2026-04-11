"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import NavBar from "../_nav/NavBar";

/* ── Colors ─────────────────────────────────────────── */
const C = {
  bg: "#0A0A0F",
  card: "#12121C",
  border: "#1E1E2E",
  purple: "#6C63FF",
  teal: "#00C9A7",
  orange: "#FFB347",
  blue: "#4FC3F7",
  red: "#FF6B6B",
  green: "#A8E06C",
  muted: "#555",
  text: "#eee",
  textDim: "#888",
};

const METRICS = [
  { key: "dials", label: "Dials", icon: "📞", color: C.purple },
  { key: "conversations", label: "Conversations", icon: "💬", color: C.teal },
  { key: "booked", label: "Booked", icon: "📅", color: C.orange },
  { key: "showed", label: "Showed", icon: "✅", color: C.blue },
  { key: "closed", label: "Closed", icon: "🤝", color: C.red },
  { key: "revenue", label: "Revenue", icon: "💰", color: C.green },
];

const WEEKLY_TARGETS = { dials: 250, booked: 6, closed: 1 };
const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function storageKey(y, m) {
  return `sm-kpi-${y}-${m}`;
}
function pct(num, den) {
  if (!den) return "—";
  return ((num / den) * 100).toFixed(0) + "%";
}
function fmtMoney(n) {
  return "$" + Number(n || 0).toLocaleString("en-US");
}
function emptyDay() {
  return { dials: 0, conversations: 0, booked: 0, showed: 0, closed: 0, revenue: 0, notes: "" };
}

/* ── Main ───────────────────────────────────────────── */
export default function PipelinePage() {
  const [now] = useState(() => new Date());
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [data, setData] = useState({});
  const [selectedDay, setSelectedDay] = useState(null);
  const [editField, setEditField] = useState(null);
  const [editValue, setEditValue] = useState("");

  /* Load / save */
  const sk = storageKey(viewYear, viewMonth);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(sk);
      setData(raw ? JSON.parse(raw) : {});
    } catch {
      setData({});
    }
    setSelectedDay(null);
  }, [sk]);

  const save = useCallback(
    (next) => {
      setData(next);
      localStorage.setItem(sk, JSON.stringify(next));
    },
    [sk]
  );

  /* Calendar math */
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDow = new Date(viewYear, viewMonth, 1).getDay();
  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const todayDate = now.getDate();
  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth();

  /* Aggregates */
  const totals = useMemo(() => {
    const t = { dials: 0, conversations: 0, booked: 0, showed: 0, closed: 0, revenue: 0, activeDays: 0 };
    for (const d of Object.values(data)) {
      const active = (d.dials || 0) > 0;
      if (active) t.activeDays++;
      t.dials += d.dials || 0;
      t.conversations += d.conversations || 0;
      t.booked += d.booked || 0;
      t.showed += d.showed || 0;
      t.closed += d.closed || 0;
      t.revenue += d.revenue || 0;
    }
    return t;
  }, [data]);

  /* Week totals (current ISO week) */
  const weekTotals = useMemo(() => {
    const wt = { dials: 0, booked: 0, closed: 0 };
    // Figure out the start of this week (Sunday)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      if (d.getMonth() === viewMonth && d.getFullYear() === viewYear) {
        const entry = data[String(d.getDate())];
        if (entry) {
          wt.dials += entry.dials || 0;
          wt.booked += entry.booked || 0;
          wt.closed += entry.closed || 0;
        }
      }
    }
    return wt;
  }, [data, viewMonth, viewYear, now]);

  /* Day detail */
  const dayData = selectedDay ? { ...emptyDay(), ...(data[String(selectedDay)] || {}) } : null;

  function updateDay(field, value) {
    const num = field === "notes" ? value : Math.max(0, parseInt(value, 10) || 0);
    const updated = { ...data, [String(selectedDay)]: { ...emptyDay(), ...(data[String(selectedDay)] || {}), [field]: num } };
    save(updated);
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  }
  function resetMonth() {
    if (!confirm(`Clear all data for ${monthLabel}?`)) return;
    save({});
    setSelectedDay(null);
  }

  function startInlineEdit(field, current) {
    setEditField(field);
    setEditValue(String(current));
  }
  function commitEdit(field) {
    updateDay(field, editValue);
    setEditField(null);
  }

  /* Cell tint */
  function cellBg(d) {
    const e = data[String(d)];
    if (!e) return "transparent";
    if ((e.closed || 0) > 0) return "rgba(168,224,108,0.12)";
    if ((e.booked || 0) > 0) return "rgba(255,179,71,0.10)";
    if ((e.dials || 0) >= 50) return "rgba(108,99,255,0.18)";
    if ((e.dials || 0) > 0) return "rgba(108,99,255,0.08)";
    return "transparent";
  }

  /* ── Render ─────────────────────────── */
  const font = { fontFamily: "var(--font-jetbrains), var(--font-dm-mono), monospace" };
  const headFont = { fontFamily: "var(--font-space), var(--font-dm-sans), sans-serif" };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, padding: "32px 20px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        {/* Nav */}
        <div style={{ filter: "invert(1) hue-rotate(180deg)" }}>
          <NavBar />
        </div>

        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: 1.2,
              color: C.purple,
              ...font,
              marginBottom: 4,
            }}
          >
            SCALE MINT
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, ...headFont, margin: 0 }}>
            Sales Pipeline
          </h1>
        </div>

        {/* Summary cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 14 }}>
          {METRICS.map((m) => (
            <div
              key={m.key}
              style={{
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 12,
                padding: 12,
              }}
            >
              <div style={{ fontSize: 10, color: C.textDim, letterSpacing: 0.6, marginBottom: 4, ...font }}>
                {m.icon} {m.label.toUpperCase()}
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: m.color, ...font }}>
                {m.key === "revenue" ? fmtMoney(totals[m.key]) : totals[m.key]}
              </div>
            </div>
          ))}
        </div>

        {/* Conversion funnel */}
        <div
          style={{
            display: "flex",
            gap: 0,
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            overflow: "hidden",
            marginBottom: 14,
            flexWrap: "wrap",
          }}
        >
          {[
            { label: "Dial→Convo", val: pct(totals.conversations, totals.dials) },
            { label: "Convo→Book", val: pct(totals.booked, totals.conversations) },
            { label: "Show Rate", val: pct(totals.showed, totals.booked) },
            { label: "Close Rate", val: pct(totals.closed, totals.showed) },
            { label: "Active Days", val: totals.activeDays },
          ].map((f, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                minWidth: 0,
                padding: "10px 8px",
                textAlign: "center",
                borderRight: i < 4 ? `1px solid ${C.border}` : "none",
              }}
            >
              <div style={{ fontSize: 9, color: C.textDim, letterSpacing: 0.4, ...font }}>{f.label}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginTop: 2, ...font }}>{f.val}</div>
            </div>
          ))}
        </div>

        {/* Month nav */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <button onClick={prevMonth} style={arrowBtn}>‹</button>
          <div style={{ fontSize: 14, fontWeight: 600, ...headFont }}>{monthLabel}</div>
          <button onClick={nextMonth} style={arrowBtn}>›</button>
        </div>

        {/* Calendar */}
        <div
          style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 14,
            padding: 10,
            marginBottom: 14,
          }}
        >
          {/* Day-of-week header */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: 4 }}>
            {DAYS_OF_WEEK.map((d) => (
              <div key={d} style={{ textAlign: "center", fontSize: 10, color: C.textDim, padding: 4, ...font }}>
                {d}
              </div>
            ))}
          </div>
          {/* Cells */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
            {Array.from({ length: firstDow }).map((_, i) => (
              <div key={"e" + i} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const d = i + 1;
              const entry = data[String(d)] || {};
              const isToday = isCurrentMonth && d === todayDate;
              const isSelected = d === selectedDay;
              return (
                <button
                  key={d}
                  onClick={() => setSelectedDay(d)}
                  style={{
                    minHeight: 52,
                    background: cellBg(d),
                    border: isSelected
                      ? `2px solid ${C.purple}`
                      : isToday
                      ? `2px solid ${C.orange}`
                      : `1px solid ${C.border}`,
                    borderRadius: 8,
                    color: C.text,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    padding: "4px 5px",
                    cursor: "pointer",
                    transition: "transform 0.1s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.04)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                >
                  <div style={{ fontSize: 10, color: isToday ? C.orange : C.textDim, fontWeight: isToday ? 700 : 400, ...font }}>
                    {d}
                  </div>
                  <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginTop: "auto" }}>
                    {(entry.dials || 0) > 0 && (
                      <span style={{ fontSize: 8, color: C.purple, ...font }}>{entry.dials}d</span>
                    )}
                    {(entry.booked || 0) > 0 && (
                      <span style={{ fontSize: 8, color: C.orange, ...font }}>{entry.booked}b</span>
                    )}
                    {(entry.closed || 0) > 0 && (
                      <span style={{ width: 6, height: 6, borderRadius: 999, background: C.green, display: "inline-block" }} />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Day detail panel */}
        {selectedDay && dayData && (
          <div
            style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 14,
              padding: 18,
              marginBottom: 14,
              animation: "fadeIn 0.2s ease",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, ...headFont }}>
                  {new Date(viewYear, viewMonth, selectedDay).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              </div>
              <button onClick={() => setSelectedDay(null)} style={{ color: C.textDim, fontSize: 18, background: "none", border: "none", cursor: "pointer" }}>
                ×
              </button>
            </div>
            {/* Metric rows */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 14 }}>
              {METRICS.map((m) => {
                const val = dayData[m.key] || 0;
                const isEditing = editField === m.key;
                return (
                  <div key={m.key} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 9, color: C.textDim, letterSpacing: 0.5, marginBottom: 4, ...font }}>
                      {m.icon} {m.label.toUpperCase()}
                    </div>
                    {isEditing ? (
                      <input
                        autoFocus
                        type={m.key === "revenue" ? "number" : "number"}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => commitEdit(m.key)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitEdit(m.key);
                          if (e.key === "Escape") setEditField(null);
                        }}
                        style={{
                          width: "100%",
                          textAlign: "center",
                          background: C.bg,
                          border: `1px solid ${C.purple}`,
                          borderRadius: 6,
                          color: m.color,
                          fontSize: 18,
                          fontWeight: 700,
                          padding: "4px 0",
                          outline: "none",
                          ...font,
                        }}
                      />
                    ) : (
                      <div
                        onClick={() => startInlineEdit(m.key, val)}
                        style={{
                          fontSize: 18,
                          fontWeight: 700,
                          color: m.color,
                          cursor: "pointer",
                          ...font,
                        }}
                      >
                        {m.key === "revenue" ? fmtMoney(val) : val}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {/* Day conversions */}
            <div
              style={{
                display: "flex",
                gap: 0,
                borderRadius: 8,
                overflow: "hidden",
                border: `1px solid ${C.border}`,
                marginBottom: 14,
                flexWrap: "wrap",
              }}
            >
              {[
                { label: "Connect", val: pct(dayData.conversations, dayData.dials) },
                { label: "Book", val: pct(dayData.booked, dayData.conversations) },
                { label: "Show", val: pct(dayData.showed, dayData.booked) },
                { label: "Close", val: pct(dayData.closed, dayData.showed) },
              ].map((f, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    textAlign: "center",
                    padding: "8px 4px",
                    background: C.bg,
                    borderRight: i < 3 ? `1px solid ${C.border}` : "none",
                  }}
                >
                  <div style={{ fontSize: 8, color: C.textDim, ...font }}>{f.label}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.text, ...font }}>{f.val}</div>
                </div>
              ))}
            </div>
            {/* Notes */}
            <textarea
              value={dayData.notes || ""}
              onChange={(e) => updateDay("notes", e.target.value)}
              placeholder="Notes — hot leads, follow-ups, what worked…"
              rows={3}
              style={{
                width: "100%",
                background: C.bg,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                padding: 10,
                color: C.text,
                fontSize: 13,
                outline: "none",
                resize: "vertical",
                fontFamily: "var(--font-dm-sans), sans-serif",
              }}
            />
          </div>
        )}

        {/* Weekly targets */}
        <div
          style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: "12px 16px",
            display: "flex",
            justifyContent: "space-around",
            marginBottom: 14,
          }}
        >
          {[
            { label: "Dials", val: weekTotals.dials, target: WEEKLY_TARGETS.dials, color: C.purple },
            { label: "Booked", val: weekTotals.booked, target: WEEKLY_TARGETS.booked, color: C.orange },
            { label: "Closed", val: weekTotals.closed, target: WEEKLY_TARGETS.closed, color: C.red },
          ].map((t) => {
            const hit = t.val >= t.target;
            return (
              <div key={t.label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 9, color: C.textDim, letterSpacing: 0.4, ...font }}>
                  WEEK {t.label.toUpperCase()}
                </div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: hit ? t.color : C.textDim,
                    ...font,
                  }}
                >
                  {t.val} <span style={{ fontSize: 10, fontWeight: 400 }}>/ {t.target}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Reset */}
        <div style={{ textAlign: "center", marginTop: 10 }}>
          <button
            onClick={resetMonth}
            style={{
              fontSize: 11,
              color: C.textDim,
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            Reset month
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

const arrowBtn = {
  width: 32,
  height: 32,
  borderRadius: 8,
  background: "#12121C",
  border: "1px solid #1E1E2E",
  color: "#eee",
  fontSize: 18,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
