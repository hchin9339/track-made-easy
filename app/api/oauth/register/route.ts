import { NextResponse } from "next/server";
import { createAnonymousClient } from "@/lib/supabase/anonymous";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const redirectUris = Array.isArray(body.redirect_uris)
      ? body.redirect_uris
      : [];
    const db = createAnonymousClient();
    const { data, error } = await db.rpc("mcp_register_client", {
      requested_name: String(body.client_name ?? "ChatGPT Work"),
      requested_redirect_uris: redirectUris,
    });
    if (error)
      return NextResponse.json(
        { error: "invalid_client_metadata" },
        { status: 400 },
      );
    return NextResponse.json(
      {
        client_id: data,
        client_name: String(body.client_name ?? "ChatGPT Work"),
        redirect_uris: redirectUris,
        grant_types: ["authorization_code"],
        response_types: ["code"],
        token_endpoint_auth_method: "none",
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "invalid_client_metadata" },
      { status: 400 },
    );
  }
}
