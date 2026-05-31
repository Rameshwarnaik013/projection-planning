"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

export default function TopBar({ user }: { user: { email: string; name: string } }) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="topbar">
      <Link href="/factories" className="brand">Projection Planning</Link>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <span className="user">{user.name} ({user.email})</span>
        <button className="btn secondary" style={{ width: "auto", margin: 0, padding: "6px 14px" }} onClick={logout}>
          Log out
        </button>
      </div>
    </div>
  );
}
