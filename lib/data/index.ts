import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Snapshot, Team, TeamRole, Workspace } from "@/lib/types";

export async function workspaceContext(options?: {
  redirectToLogin?: boolean;
}) {
  const db = await createClient();
  const { data: auth } = await db.auth.getUser();
  if (!auth.user) {
    if (options?.redirectToLogin !== false) redirect("/login");
    return null;
  }
  const { data, error } = await db
    .from("team_members")
    .select("role, teams(id,name,slug)")
    .eq("user_id", auth.user.id);
  if (error) throw new Error("Could not load your workspaces.");
  const memberships = (data ?? [])
    .map((row) => ({
      role: row.role as TeamRole,
      team: row.teams as unknown as Team,
    }))
    .filter((row) => row.team?.id);
  if (!memberships.length)
    return { db, user: auth.user, memberships, active: null };
  const requested = (await cookies()).get("active_team")?.value;
  const active =
    memberships.find((m) => m.team.id === requested) ?? memberships[0];
  return { db, user: auth.user, memberships, active };
}

export async function currentWorkspace(): Promise<Workspace | null> {
  const context = await workspaceContext({ redirectToLogin: false });
  if (!context?.active) return null;
  return {
    userId: context.user.id,
    userEmail: context.user.email ?? "Team member",
    team: context.active.team,
    role: context.active.role,
    memberships: context.memberships,
  };
}

export async function snapshot(month: string): Promise<Snapshot> {
  const context = await workspaceContext();
  if (!context?.active) redirect("/onboarding");
  const { db, active } = context;
  async function all(table: "categories" | "budgets" | "expenses") {
    const rows = [];
    for (let offset = 0; ; offset += 500) {
      let query = db
        .from(table)
        .select("*")
        .eq("team_id", active.team.id)
        .order("id");
      if (table !== "categories") query = query.eq("month", month);
      const { data, error } = await query.range(offset, offset + 499);
      if (error)
        throw new Error("Could not load your budget data. Please try again.");
      rows.push(...data);
      if (data.length < 500) break;
    }
    return rows;
  }
  const [categories, budgets, expenses] = await Promise.all([
    all("categories"),
    all("budgets"),
    all("expenses"),
  ]);
  categories.sort((a, b) => a.name.localeCompare(b.name));
  expenses.sort(
    (a, b) =>
      b.expense_date.localeCompare(a.expense_date) ||
      b.created_at.localeCompare(a.created_at),
  );
  return {
    categories,
    budgets,
    expenses,
    workspace: {
      userId: context.user.id,
      userEmail: context.user.email ?? "Team member",
      team: active.team,
      role: active.role,
      memberships: context.memberships,
    },
  } as Snapshot;
}
