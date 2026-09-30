# ChatGPT Work MCP connection

Track Made Easy exposes a read-only, OAuth 2.1 protected MCP server at:

`https://track-made-easy.vercel.app/api/mcp`

The connector supports three tools:

- `get_workspace` identifies the authorized team and the user's role.
- `get_budget_summary` returns approved, committed, actual, and remaining spend for a month.
- `list_expenses` returns up to 100 expenses for a month.

## Connect from ChatGPT Work

1. In ChatGPT, open **Settings → Security and login** and enable **Developer mode**.
2. Open **Plugins**, select **+**, and create a connection.
3. Enter the MCP URL above.
4. Sign in to Track Made Easy when prompted.
5. Review the read-only permission and authorize the selected workspace.
6. Add the connection from the tools menu in a new chat.

Access tokens expire after 30 days. Removing a user from the team immediately prevents that token from reading the workspace.

## Protocol endpoints

- Protected resource metadata: `/.well-known/oauth-protected-resource`
- Authorization server metadata: `/.well-known/oauth-authorization-server`
- Dynamic client registration: `/api/oauth/register`
- Authorization: `/oauth/authorize`
- Token exchange: `/api/oauth/token`
- MCP Streamable HTTP: `/api/mcp`

The server requires authorization-code flow with PKCE S256. All data access is scoped to the team selected during consent and rechecks active team membership on every tool call.
