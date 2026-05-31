import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { findUser } from "@/lib/sheets";
import { createSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const user = await findUser(email);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    await createSession({ email: user.email, name: user.name });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Login failed.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
