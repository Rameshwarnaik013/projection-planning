import { NextResponse } from "next/server";
import { appendRows } from "@/lib/sheets";
import { getSession } from "@/lib/auth";

const AVAILABLE_HR = 18;

type Entry = {
  process?: string;
  currentCapacity?: string | number;
  requiredCapacity?: string | number;
  actionRequired?: string;
};

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  try {
    const b = await req.json();
    if (!b.factory) {
      return NextResponse.json({ error: "Factory is required." }, { status: 400 });
    }

    // Accept either a single entry (legacy) or an array of process entries.
    const entries: Entry[] = Array.isArray(b.entries) ? b.entries : [b];
    if (entries.length === 0) {
      return NextResponse.json({ error: "At least one process is required." }, { status: 400 });
    }

    const timestamp = new Date().toISOString();
    const rows: (string | number)[][] = [];
    const gaps: number[] = [];

    for (const e of entries) {
      if (!e.process) {
        return NextResponse.json({ error: "Each process row needs a process selected." }, { status: 400 });
      }
      const current = Number(e.currentCapacity) || 0;
      const required = Number(e.requiredCapacity) || 0;
      // Gap = required - current. Positive means a shortfall.
      const gap = required - current;
      if (gap > 0 && (!e.actionRequired || e.actionRequired.trim() === "")) {
        return NextResponse.json(
          { error: `"${e.process}": Required exceeds Current — Action Required must be filled.` },
          { status: 400 }
        );
      }
      gaps.push(gap);
      rows.push([
        timestamp,
        session.email,
        b.factory,
        AVAILABLE_HR,
        e.process,
        current,
        required,
        gap,
        e.actionRequired ?? "",
      ]);
    }

    await appendRows("BottleneckAnalysis", rows);

    return NextResponse.json({ ok: true, count: rows.length, gaps });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to save.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
