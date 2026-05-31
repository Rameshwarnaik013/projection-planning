"use client";

import { useEffect, useState } from "react";

const PROCESSES = ["Roasting", "Mixing", "Packing", "Secondary Packing"];

type Entry = {
  process: string;
  currentCapacity: string;
  requiredCapacity: string;
  actionRequired: string;
};

const emptyEntry = (): Entry => ({
  process: "",
  currentCapacity: "",
  requiredCapacity: "",
  actionRequired: "",
});

export default function BottleneckForm({ factory, userEmail }: { factory: string; userEmail: string }) {
  const [entries, setEntries] = useState<Entry[]>([emptyEntry()]);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [today, setToday] = useState("");
  useEffect(() => setToday(new Date().toLocaleDateString()), []);

  function setField(i: number, k: keyof Entry, v: string) {
    setEntries((list) => list.map((e, idx) => (idx === i ? { ...e, [k]: v } : e)));
  }

  function addEntry() {
    setEntries((list) => [...list, emptyEntry()]);
  }

  function removeEntry(i: number) {
    setEntries((list) => (list.length > 1 ? list.filter((_, idx) => idx !== i) : list));
  }

  function gapOf(e: Entry): number | null {
    if (e.currentCapacity === "" || e.requiredCapacity === "") return null;
    return Number(e.requiredCapacity) - Number(e.currentCapacity);
  }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    // Per-row guard: a positive gap requires an action.
    for (let i = 0; i < entries.length; i++) {
      const g = gapOf(entries[i]);
      if (g !== null && g > 0 && entries[i].actionRequired.trim() === "") {
        return setMsg({
          ok: false,
          text: `Process ${i + 1} (${entries[i].process || "unnamed"}): Required exceeds Current — Action Required must be filled.`,
        });
      }
    }
    setMsg(null);
    setLoading(true);
    const res = await fetch("/api/bottleneck", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ factory, entries }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setMsg({ ok: false, text: data.error || "Failed to submit." });
    setMsg({ ok: true, text: `Submitted ${data.count} process${data.count > 1 ? "es" : ""}.` });
    setEntries([emptyEntry()]);
  }

  return (
    <form onSubmit={submit}>
      <div className="note">
        <strong>Capacity basis:</strong> Available Hr = 18 (2 combined shifts at maximum efficiency). Gap =
        Required − Current; a positive gap is a shortfall to act on. Add multiple processes if applicable.
      </div>

      {entries.map((e, i) => {
        const gap = gapOf(e);
        const actionRequired = gap !== null && gap > 0;
        return (
          <div className="process-block" key={i}>
            <div className="process-block-head">
              <span className="process-block-title">Process {i + 1}</span>
              {entries.length > 1 && (
                <button
                  type="button"
                  className="remove-process"
                  onClick={() => removeEntry(i)}
                  aria-label={`Remove process ${i + 1}`}
                >
                  Remove
                </button>
              )}
            </div>

            <label>Process</label>
            <select value={e.process} onChange={(ev) => setField(i, "process", ev.target.value)} required>
              <option value="">Select a process…</option>
              {PROCESSES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            <div className="row2">
              <div>
                <label>Current Capacity</label>
                <input type="number" min="0" value={e.currentCapacity} onChange={(ev) => setField(i, "currentCapacity", ev.target.value)} required />
              </div>
              <div>
                <label>Required Capacity</label>
                <input type="number" min="0" value={e.requiredCapacity} onChange={(ev) => setField(i, "requiredCapacity", ev.target.value)} required />
              </div>
            </div>

            <label>Gap (Required − Current)</label>
            <input value={gap !== null ? gap.toString() : "—"} readOnly />

            <label>Action Required{actionRequired && <span className="req"> *</span>}</label>
            <textarea
              rows={3}
              value={e.actionRequired}
              onChange={(ev) => setField(i, "actionRequired", ev.target.value)}
              placeholder={actionRequired ? "required — required capacity exceeds current" : "e.g. Add a roasting line / extend shift"}
              required={actionRequired}
            />
          </div>
        );
      })}

      <button type="button" className="add-process" onClick={addEntry}>
        + Add another process
      </button>

      <p className="muted">Recorded automatically: {userEmail} · {today}</p>

      {msg && <div className={msg.ok ? "success" : "error"}>{msg.text}</div>}
      <button className="btn" disabled={loading}>{loading ? "Submitting…" : "Submit"}</button>
    </form>
  );
}
