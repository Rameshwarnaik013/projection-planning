import { NextResponse } from "next/server";
import { appendRow } from "@/lib/sheets";
import { getSession } from "@/lib/auth";

const AVAILABLE_HR = 18; // 2 combined shifts at max efficiency

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  try {
    const b = await req.json();
    const capacity = Number(b.capacity);
    const projection = Number(b.projection);
    if (!b.factory || !capacity || !projection) {
      return NextResponse.json(
        { error: "Factory, capacity and projection are required." },
        { status: 400 }
      );
    }

    // Utilization = projection / capacity (e.g. 2.5M / 2M = 1.25 = 125%).
    const utilization = capacity > 0 ? +(projection / capacity).toFixed(4) : 0;

    await appendRow("CapacityPlanning", [
      new Date().toISOString(),
      session.email,
      b.factory,
      b.month ?? "",
      AVAILABLE_HR,
      capacity,
      projection,
      utilization,
      b.peakUtilizationPct ?? "",
      b.bottleneckArea ?? "",
      b.expandableCapacity ?? "",
    ]);

    return NextResponse.json({ ok: true, utilization });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to save.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
