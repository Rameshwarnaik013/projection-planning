"use client";

import { useEffect, useState } from "react";

const AVAILABLE_HR = 18;

export default function CapacityForm({ factory, userEmail }: { factory: string; userEmail: string }) {
  const [form, setForm] = useState({
    month: "",
    capacity: "",
    projection: "",
    peakUtilizationPct: "",
    bottleneckArea: "",
    expandableCapacity: "",
  });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [today, setToday] = useState("");
  useEffect(() => setToday(new Date().toLocaleDateString()), []);

  const cap = Number(form.capacity);
  const proj = Number(form.projection);
  const utilization = cap > 0 && proj > 0 ? proj / cap : null;
  const bottleneckRequired = proj > cap && cap > 0;

  function set(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (bottleneckRequired && form.bottleneckArea.trim() === "") {
      return setMsg({
        ok: false,
        text: "Projection exceeds Capacity — Bottleneck Area is required.",
      });
    }
    setMsg(null);
    setLoading(true);
    const res = await fetch("/api/capacity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ factory, ...form }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setMsg({ ok: false, text: data.error || "Failed to submit." });
    setMsg({ ok: true, text: `Submitted. Utilization = ${(data.utilization * 100).toFixed(1)}%.` });
    setForm({ month: "", capacity: "", projection: "", peakUtilizationPct: "", bottleneckArea: "", expandableCapacity: "" });
  }

  return (
    <form onSubmit={submit}>
      <div className="note">
        <strong>Capacity basis:</strong> Available Hr = {AVAILABLE_HR} (2 combined shifts at maximum company
        efficiency). Enter monthly Capacity on this basis. Current Utilization % is auto-calculated as
        Projection ÷ Capacity.
      </div>

      <label>Month</label>
      <input type="month" value={form.month} onChange={(e) => set("month", e.target.value)} required />

      <div className="row2">
        <div>
          <label>Capacity (units / month)</label>
          <input type="number" min="0" value={form.capacity} onChange={(e) => set("capacity", e.target.value)} placeholder="e.g. 2000000" required />
        </div>
        <div>
          <label>Projection for the month</label>
          <input type="number" min="0" value={form.projection} onChange={(e) => set("projection", e.target.value)} placeholder="e.g. 2500000" required />
        </div>
      </div>

      <label>Current Utilization %</label>
      <input value={utilization !== null ? `${(utilization * 100).toFixed(1)}% (${utilization.toFixed(2)}×)` : "—"} readOnly />

      <div className="row2">
        <div>
          <label>Peak Utilization %</label>
          <input type="number" step="0.01" value={form.peakUtilizationPct} onChange={(e) => set("peakUtilizationPct", e.target.value)} placeholder="optional" />
        </div>
        <div>
          <label>Expandable Capacity</label>
          <input value={form.expandableCapacity} onChange={(e) => set("expandableCapacity", e.target.value)} placeholder="optional" />
        </div>
      </div>

      <label>Bottleneck Area{bottleneckRequired && <span className="req"> *</span>}</label>
      <input
        value={form.bottleneckArea}
        onChange={(e) => set("bottleneckArea", e.target.value)}
        placeholder={bottleneckRequired ? "required — projection exceeds capacity" : "optional"}
        required={bottleneckRequired}
      />

      <p className="muted">Recorded automatically: {userEmail} · {today}</p>

      {msg && <div className={msg.ok ? "success" : "error"}>{msg.text}</div>}
      <button className="btn" disabled={loading}>{loading ? "Submitting…" : "Submit"}</button>
    </form>
  );
}
