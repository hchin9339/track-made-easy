import { NextResponse } from "next/server";
import { createAnonymousClient } from "@/lib/supabase/anonymous";

export async function POST(request: Request) {
  const form = await request.formData();
  if (form.get("grant_type") !== "authorization_code")
    return NextResponse.json(
      { error: "unsupported_grant_type" },
      { status: 400 },
    );

  const db = createAnonymousClient();
  const { data, error } = await db.rpc("mcp_exchange_code", {
    raw_code: String(form.get("code") ?? ""),
    requested_client_id: String(form.get("client_id") ?? ""),
    requested_redirect_uri: String(form.get("redirect_uri") ?? ""),
    code_verifier: String(form.get("code_verifier") ?? ""),
  });
  if (error || !data)
    return NextResponse.json({ error: "invalid_grant" }, { status: 400 });
  return NextResponse.json({
    access_token: data.access_token,
    token_type: "Bearer",
    expires_in: data.expires_in,
    scope: "tme.read",
  });
}
