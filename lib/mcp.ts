import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { createAnonymousClient } from "@/lib/supabase/anonymous";

type CategorySummary = {
  id: string;
  name: string;
  approved: number;
  committed: number;
  actual: number;
};
type McpSnapshot = {
  team: { id: string; name: string; slug: string };
  role: string;
  month: string;
  categories: CategorySummary[];
  expenses: Array<Record<string, unknown>>;
};

async function loadSnapshot(token: string, month: string, limit = 50) {
  const db = createAnonymousClient();
  const { data, error } = await db.rpc("mcp_snapshot", {
    raw_token: token,
    target_month: `${month}-01`,
    expense_limit: limit,
  });
  if (error)
    throw new Error(
      "The Track Made Easy connection is invalid or has expired.",
    );
  return data as McpSnapshot;
}

export function createMcpServer(token: string) {
  const server = new McpServer(
    { name: "track-made-easy", version: "1.0.0" },
    {
      instructions:
        "Use these tools for the connected Track Made Easy workspace. Amounts are in USD. Read the monthly summary before explaining budget availability.",
    },
  );

  server.registerTool(
    "get_workspace",
    {
      title: "Get connected workspace",
      description:
        "Identify the Track Made Easy team connected to this account.",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
      },
    },
    async () => {
      const month = new Date().toISOString().slice(0, 7);
      const data = await loadSnapshot(token, month, 1);
      const result = { team: data.team, role: data.role };
      return {
        structuredContent: result,
        content: [
          {
            type: "text",
            text: `Connected to ${data.team.name} as ${data.role}.`,
          },
        ],
      };
    },
  );

  server.registerTool(
    "get_budget_summary",
    {
      title: "Get monthly budget summary",
      description:
        "Review approved, committed, actual, and remaining budget by category for a YYYY-MM month.",
      inputSchema: {
        month: z
          .string()
          .regex(/^\d{4}-\d{2}$/)
          .describe("Month in YYYY-MM format"),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
      },
    },
    async ({ month }) => {
      const data = await loadSnapshot(token, month, 1);
      const categories = data.categories.map((item) => ({
        ...item,
        approved: Number(item.approved),
        committed: Number(item.committed),
        actual: Number(item.actual),
        remaining:
          Number(item.approved) - Number(item.committed) - Number(item.actual),
      }));
      const totals = categories.reduce(
        (sum, item) => ({
          approved: sum.approved + item.approved,
          committed: sum.committed + item.committed,
          actual: sum.actual + item.actual,
          remaining: sum.remaining + item.remaining,
        }),
        { approved: 0, committed: 0, actual: 0, remaining: 0 },
      );
      const result = { team: data.team.name, month, totals, categories };
      return {
        structuredContent: result,
        content: [
          {
            type: "text",
            text: `${data.team.name} has $${totals.remaining.toFixed(2)} remaining for ${month}.`,
          },
        ],
      };
    },
  );

  server.registerTool(
    "list_expenses",
    {
      title: "List monthly expenses",
      description: "List committed and approved expenses for a YYYY-MM month.",
      inputSchema: {
        month: z
          .string()
          .regex(/^\d{4}-\d{2}$/)
          .describe("Month in YYYY-MM format"),
        limit: z.number().int().min(1).max(100).default(50),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
      },
    },
    async ({ month, limit }) => {
      const data = await loadSnapshot(token, month, limit);
      const result = { team: data.team.name, month, expenses: data.expenses };
      return {
        structuredContent: result,
        content: [
          {
            type: "text",
            text: `Found ${data.expenses.length} expenses for ${month}.`,
          },
        ],
      };
    },
  );

  return server;
}
