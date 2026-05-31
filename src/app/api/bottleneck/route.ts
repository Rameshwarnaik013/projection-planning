import { NextResponse } from "next/server";
import { appendRow } from "@/lib/sheets";
import { getSession } from "@/lib/auth";

const AVAILABLE_HR = 18;

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  try {
    const b = await req.json();
    if (!b.factory || !b.process) {
      return NextResponse.json({ error: "Factory and process are required." }, { status: 400 });
    }

    const current = Number(b.currentCapacity) || 0;
    const required = Number(b.requiredCapacity) || 0;
    // Gap = required - current. Positive means a shortfall.
    const gap = required - current;

    await appendRow("BottleneckAnalysis", [
      new Date().toISOString(),
      session.email,
      b.factory,
      AVAILABLE_HR,
      b.process,
      current,
      required,
      gap,
      b.actionRequired ?? "",
    ]);

    return NextResponse.json({ ok: true, gap });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to save.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
