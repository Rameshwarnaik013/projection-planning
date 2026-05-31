import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import TopBar from "../../../_components/TopBar";
import CapacityForm from "../../../_components/CapacityForm";
import { FACTORIES } from "../../../factories/page";

export default async function CapacityPage({ params }: { params: Promise<{ name: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { name } = await params;
  const factory = decodeURIComponent(name);
  if (!FACTORIES.includes(factory)) notFound();

  return (
    <>
      <TopBar user={session} />
      <div className="container narrow">
        <p className="muted">
          <Link href={`/factory/${encodeURIComponent(factory)}`}>← {factory}</Link>
        </p>
        <div className="card">
          <h1>Capacity Planning</h1>
          <p className="sub">{factory}</p>
          <div className="tabs">
            <Link href={`/factory/${encodeURIComponent(factory)}/capacity`} className="active">Capacity Planning</Link>
            <Link href={`/factory/${encodeURIComponent(factory)}/bottleneck`}>Bottleneck Analysis</Link>
          </div>
          <CapacityForm factory={factory} userEmail={session.email} />
        </div>
      </div>
    </>
  );
}
