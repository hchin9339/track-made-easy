import { redirect } from "next/navigation";
import { authorizeMcp } from "@/lib/actions/oauth";
import { workspaceContext } from "@/lib/data";
import { createAnonymousClient } from "@/lib/supabase/anonymous";

export const dynamic = "force-dynamic";

export default async function AuthorizePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const value = (key: string) =>
    typeof params[key] === "string" ? params[key] : "";
  const clientId = value("client_id");
  const redirectUri = value("redirect_uri");
  const codeChallenge = value("code_challenge");
  const state = value("state");
  if (
    value("response_type") !== "code" ||
    value("code_challenge_method") !== "S256"
  )
    return (
      <div className="notice failure">This connection request is invalid.</div>
    );

  const db = createAnonymousClient();
  const { data: valid } = await db.rpc("mcp_client_is_valid", {
    requested_client_id: clientId,
    requested_redirect_uri: redirectUri,
  });
  if (!valid)
    return (
      <div className="notice failure">This OAuth client is not registered.</div>
    );

  const context = await workspaceContext({ redirectToLogin: false });
  if (!context?.active) {
    const query = new URLSearchParams();
    for (const [key, raw] of Object.entries(params))
      if (typeof raw === "string") query.set(key, raw);
    redirect(`/login?next=${encodeURIComponent(`/oauth/authorize?${query}`)}`);
  }

  return (
    <section className="panel form-panel oauth-consent">
      <p className="eyebrow">CHATGPT WORK CONNECTION</p>
      <h1>Connect {context.active.team.name}</h1>
      <p className="muted">
        ChatGPT will be able to read workspace details, monthly budgets, and
        expenses. It cannot change or delete data.
      </p>
      <form action={authorizeMcp}>
        <input type="hidden" name="client_id" value={clientId} />
        <input type="hidden" name="redirect_uri" value={redirectUri} />
        <input type="hidden" name="code_challenge" value={codeChallenge} />
        <input type="hidden" name="state" value={state} />
        <button>Authorize ChatGPT Work</button>
      </form>
    </section>
  );
}
