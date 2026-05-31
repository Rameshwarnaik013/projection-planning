"use client";

import { useEffect, useState } from "react";

const PROCESSES = ["Roasting", "Mixing", "Packing", "Secondary Packing"];

export default function BottleneckForm({ factory, userEmail }: { factory: string; userEmail: string }) {
  const [form, setForm] = useState({
    process: "",
    currentCapacity: "",
    requiredCapacity: "",
    actionRequired: "",
  });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [today, setToday] = useState("");
  useEffect(() => setToday(new Date().toLocaleDateString()), []);

  const cur = Number(form.currentCapacity);
  const req = Number(form.requiredCapacity);
  const gap = form.currentCapacity !== "" && form.requiredCapacity !== "" ? req - cur : null;

  function set(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    const res = await fetch("/api/bottleneck", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ factory, ...form }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setMsg({ ok: false, text: data.error || "Failed to save." });
    setMsg({ ok: true, text: `Saved to Google Sheet. Gap = ${data.gap}.` });
    setForm({ process: "", currentCapacity: "", requiredCapacity: "", actionRequired: "" });
  }

  return (
    <form onSubmit={submit}>
      <div className="note">
        <strong>Capacity basis:</strong> Available Hr = 18 (2 combined shifts at maximum efficiency). Gap =
        Required − Current; a positive gap is a shortfall to act on.
      </div>

      <label>Process</label>
      <select value={form.process} onChange={(e) => set("process", e.target.value)} required>
        <option value="">Select a process…</option>
        {PROCESSES.map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>

      <div className="row2">
        <div>
          <label>Current Capacity</label>
          <input type="number" min="0" value={form.currentCapacity} onChange={(e) => set("currentCapacity", e.target.value)} required />
        </div>
        <div>
          <label>Required Capacity</label>
          <input type="number" min="0" value={form.requiredCapacity} onChange={(e) => set("requiredCapacity", e.target.value)} required />
        </div>
      </div>

      <label>Gap (Required − Current)</label>
      <input value={gap !== null ? gap.toString() : "—"} readOnly />

      <label>Action Required</label>
      <textarea rows={3} value={form.actionRequired} onChange={(e) => set("actionRequired", e.target.value)} placeholder="e.g. Add a roasting line / extend shift" />

      <p className="muted">Recorded automatically: {userEmail} · {today}</p>

      {msg && <div className={msg.ok ? "success" : "error"}>{msg.text}</div>}
      <button className="btn" disabled={loading}>{loading ? "Saving…" : "Save to Google Sheet"}</button>
    </form>
  );
}
