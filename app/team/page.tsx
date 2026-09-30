import { redirect } from "next/navigation";
import CreateTeamForm from "@/components/CreateTeamForm";
import RenameTeamForm from "@/components/RenameTeamForm";
import { workspaceContext } from "@/lib/data";

export const dynamic = "force-dynamic";
export default async function TeamPage() {
  const context = await workspaceContext();
  if (!context?.active) redirect("/onboarding");
  const { count } = await context.db
    .from("team_members")
    .select("user_id", { count: "exact", head: true })
    .eq("team_id", context.active.team.id);
  return (
    <>
      <header className="page-heading">
        <div>
          <p className="eyebrow">TEAM SETTINGS</p>
          <h1>{context.active.team.name}</h1>
          <p className="muted">
            A private workspace with its own categories, budgets, expenses, and
            approvals.
          </p>
        </div>
        <span className="badge actual">{context.active.role}</span>
      </header>
      <section className="panel form-panel">
        <h2>Workspace access</h2>
        <p className="muted">
          {count ?? 1} team member{count === 1 ? "" : "s"}. Owners and admins
          control budgets and approvals; members can record expenses.
        </p>
      </section>
      <section className="panel form-panel">
        <h2>Workspace details</h2>
        <p className="muted">
          The team name appears in the navigation and on every budget view.
        </p>
        {context.active.role === "owner" ? (
          <RenameTeamForm currentName={context.active.team.name} />
        ) : (
          <p className="muted">Only the team owner can change this name.</p>
        )}
      </section>
      <section className="panel form-panel">
        <h2>Create another workspace</h2>
        <p className="muted">
          Use separate workspaces for departments, clients, or legal entities.
          Data never crosses workspace boundaries.
        </p>
        <CreateTeamForm />
      </section>
    </>
  );
}
