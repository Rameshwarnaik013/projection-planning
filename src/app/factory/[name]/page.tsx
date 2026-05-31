import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import TopBar from "../../_components/TopBar";
import { FACTORIES } from "../../factories/page";

export default async function FactoryPage({ params }: { params: Promise<{ name: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { name } = await params;
  const factory = decodeURIComponent(name);
  if (!FACTORIES.includes(factory)) notFound();

  return (
    <>
      <TopBar user={session} />
      <div className="container">
        <p className="muted"><Link href="/factories">← All factories</Link></p>
        <h1>{factory}</h1>
        <p className="sub">What would you like to record?</p>
        <div className="grid">
          <Link href={`/factory/${encodeURIComponent(factory)}/capacity`} className="tile">
            Capacity Planning
            <small>Capacity, projection & utilization</small>
          </Link>
          <Link href={`/factory/${encodeURIComponent(factory)}/bottleneck`} className="tile">
            Bottleneck Analysis
            <small>Process gaps & actions</small>
          </Link>
        </div>
      </div>
    </>
  );
}
