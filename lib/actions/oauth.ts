"use server";
import { redirect } from "next/navigation";
import { workspaceContext } from "@/lib/data";

export async function authorizeMcp(form: FormData) {
  const context = await workspaceContext({ redirectToLogin: false });
  if (!context?.active) redirect("/login");
  const clientId = String(form.get("client_id") ?? "");
  const redirectUri = String(form.get("redirect_uri") ?? "");
  const codeChallenge = String(form.get("code_challenge") ?? "");
  const state = String(form.get("state") ?? "");
  const { data, error } = await context.db.rpc("mcp_issue_code", {
    requested_client_id: clientId,
    requested_redirect_uri: redirectUri,
    requested_code_challenge: codeChallenge,
    requested_team_id: context.active.team.id,
  });
  if (error || !data)
    throw new Error("Could not authorize this MCP connection.");
  const destination = new URL(redirectUri);
  destination.searchParams.set("code", data);
  if (state) destination.searchParams.set("state", state);
  redirect(destination.toString());
}
