import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import TopBar from "../_components/TopBar";

export const FACTORIES = ["Indore", "Bihar", "Kundli", "UD", "South"];

export default async function FactoriesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <>
      <TopBar user={session} />
      <div className="container">
        <h1>Select a factory</h1>
        <p className="sub">Choose a plant to record Capacity Planning or Bottleneck Analysis.</p>
        <div className="grid">
          {FACTORIES.map((f) => (
            <Link key={f} href={`/factory/${encodeURIComponent(f)}`} className="tile">
              {f}
              <small>Open plant</small>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
