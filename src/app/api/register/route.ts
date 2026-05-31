import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { appendRow, findUser } from "@/lib/sheets";
import { createSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }

    const existing = await findUser(email);
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const hash = await bcrypt.hash(password, 10);
    const displayName = name || email.split("@")[0];
    await appendRow("Users", [email.toLowerCase(), hash, displayName, new Date().toISOString()]);

    await createSession({ email: email.toLowerCase(), name: displayName });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Registration failed.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
