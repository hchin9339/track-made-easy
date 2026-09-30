"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { workspaceContext } from "@/lib/data";

export type AuthState = { error?: string; message?: string };

function safeNext(form: FormData) {
  const next = String(form.get("next") ?? "");
  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export async function signIn(_: AuthState, form: FormData): Promise<AuthState> {
  const email = String(form.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(form.get("password") ?? "");
  const db = await createClient();
  const { error } = await db.auth.signInWithPassword({ email, password });
  if (error) return { error: "Email or password is incorrect." };
  redirect(safeNext(form));
}

export async function signUp(_: AuthState, form: FormData): Promise<AuthState> {
  const email = String(form.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(form.get("password") ?? "");
  if (password.length < 8)
    return { error: "Use at least 8 characters for your password." };
  const db = await createClient();
  const { data, error } = await db.auth.signUp({ email, password });
  if (error) return { error: error.message };
  if (!data.session)
    return {
      message: "Check your email to confirm your account, then sign in.",
    };
  redirect(safeNext(form) === "/" ? "/onboarding" : safeNext(form));
}

export async function signOut() {
  const db = await createClient();
  await db.auth.signOut();
  (await cookies()).delete("active_team");
  redirect("/login");
}

export async function createTeam(
  _: AuthState,
  form: FormData,
): Promise<AuthState> {
  const name = String(form.get("name") ?? "").trim();
  if (!name) return { error: "Enter a team name." };
  const context = await workspaceContext({ redirectToLogin: false });
  if (!context) redirect("/login");
  const { data, error } = await context.db.rpc("create_team", {
    team_name: name,
  });
  if (error) return { error: error.message };
  (await cookies()).set("active_team", data, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
  });
  redirect("/");
}

export async function renameTeam(
  _: AuthState,
  form: FormData,
): Promise<AuthState> {
  const name = String(form.get("name") ?? "").trim();
  if (!name) return { error: "Enter a team name." };
  if (name.length > 80)
    return { error: "Keep the team name to 80 characters or fewer." };

  const context = await workspaceContext({ redirectToLogin: false });
  if (!context?.active) redirect("/login");
  if (context.active.role !== "owner")
    return { error: "Only the team owner can rename this workspace." };
  if (name === context.active.team.name)
    return { message: "The workspace name is already up to date." };

  const { error } = await context.db
    .from("teams")
    .update({ name })
    .eq("id", context.active.team.id);
  if (error) return { error: "Could not rename the workspace. Try again." };

  revalidatePath("/", "layout");
  return { message: "Workspace renamed successfully." };
}

export async function selectTeam(form: FormData) {
  const teamId = String(form.get("team_id") ?? "");
  const context = await workspaceContext({ redirectToLogin: false });
  if (!context?.memberships.some((m) => m.team.id === teamId))
    redirect("/login");
  (await cookies()).set("active_team", teamId, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
  });
  revalidatePath("/", "layout");
  redirect("/");
}
