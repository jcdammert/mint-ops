"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

const STORAGE_KEY = "text-overrides-v1";
const EditCtx = createContext(null);

export function useEdit() {
  return useContext(EditCtx);
}

export function EditProvider({ children }) {
  const [editMode, setEditMode] = useState(false);
  const [overrides, setOverrides] = useState({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setOverrides(JSON.parse(raw));
    } catch (e) {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  }, [overrides, hydrated]);

  function setOverride(id, value) {
    setOverrides((o) => ({ ...o, [id]: value }));
  }

  function resetAll() {
    if (!confirm("Reset all edited text to defaults?")) return;
    setOverrides({});
  }

  return (
    <EditCtx.Provider
      value={{ editMode, setEditMode, overrides, setOverride, resetAll }}
    >
      {children}
      <EditToolbar />
    </EditCtx.Provider>
  );
}

function EditToolbar() {
  const { editMode, setEditMode, resetAll } = useEdit();
  return (
    <div
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        zIndex: 200,
        display: "flex",
        gap: 8,
      }}
    >
      {editMode && (
        <button
          onClick={resetAll}
          style={{
            padding: "10px 14px",
            background: "#fff",
            color: "#666",
            border: "1px solid #e6e6e6",
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 500,
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            cursor: "pointer",
          }}
        >
          Reset text
        </button>
      )}
      <button
        onClick={() => setEditMode(!editMode)}
        style={{
          padding: "10px 16px",
          background: editMode ? "#43a047" : "#1a1a1a",
          color: "#fff",
          border: "none",
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 600,
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          cursor: "pointer",
        }}
      >
        {editMode ? "✓ Lock text" : "✎ Edit text"}
      </button>
    </div>
  );
}

export function EditableText({ id, children, as: Tag = "span", style, ...rest }) {
  const ctx = useEdit();
  const ref = useRef(null);
  const fallback = typeof children === "string" ? children : "";
  const override = ctx?.overrides?.[id];
  const current = override !== undefined ? override : fallback;

  useEffect(() => {
    if (ctx?.editMode && ref.current) {
      if (ref.current.innerText !== current) {
        ref.current.innerText = current;
      }
    }
  }, [ctx?.editMode]); // eslint-disable-line

  if (!ctx) return <Tag style={style} {...rest}>{current}</Tag>;

  if (ctx.editMode) {
    return (
      <Tag
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onBlur={(e) => ctx.setOverride(id, e.currentTarget.innerText)}
        style={{
          outline: "1px dashed #1e88e5",
          outlineOffset: 2,
          borderRadius: 3,
          cursor: "text",
          ...style,
        }}
        {...rest}
      />
    );
  }

  return (
    <Tag style={style} {...rest}>
      {current}
    </Tag>
  );
}
