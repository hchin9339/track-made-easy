// Test-only PostgREST simulator. Never imported by application code.
import http from "node:http";
import { randomUUID } from "node:crypto";
export function startDatabase(port = 54329) {
  const faults = { write: false };
  const tables = { categories: [], budgets: [], expenses: [] };
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, "http://localhost");
    if (process.env.DEBUG_FAKE)
      console.log(req.method, url.pathname, url.search);
    const table = url.pathname.split("/").pop();
    if (!tables[table]) {
      res.writeHead(404);
      res.end("{}");
      return;
    }
    let raw = "";
    for await (const chunk of req) raw += chunk;
    const body = raw ? JSON.parse(raw) : {};
    if (faults.write && ["POST", "PATCH", "DELETE"].includes(req.method)) {
      faults.write = false;
      res.writeHead(503, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Simulated write failure" }));
      return;
    }
    let rows = tables[table].filter((row) =>
      [...url.searchParams].every(
        ([key, value]) =>
          !value.startsWith("eq.") || String(row[key]) === value.slice(3),
      ),
    );
    if (req.method === "POST") {
      if (
        table === "budgets" &&
        req.headers.prefer?.includes("resolution=merge-duplicates")
      ) {
        const existing = tables.budgets.find(
          (b) => b.category_id === body.category_id && b.month === body.month,
        );
        if (existing) {
          Object.assign(existing, body);
          rows = [existing];
        } else {
          rows = [{ id: randomUUID(), ...body }];
          tables[table].push(...rows);
        }
      } else {
        rows = [
          { id: randomUUID(), created_at: new Date().toISOString(), ...body },
        ];
        tables[table].push(...rows);
      }
    } else if (req.method === "PATCH") {
      rows.forEach((row) => Object.assign(row, body));
    } else if (req.method === "DELETE") {
      tables[table] = tables[table].filter((row) => !rows.includes(row));
    }
    const single = req.headers.accept?.includes("vnd.pgrst.object");
    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Range",
      `0-${Math.max(0, rows.length - 1)}/${rows.length}`,
    );
    if (single && rows.length !== 1) {
      res.writeHead(406);
      res.end(
        JSON.stringify({
          code: "PGRST116",
          details: `The result contains ${rows.length} rows`,
          message: "Expected one row",
        }),
      );
      return;
    }
    res.end(
      req.method === "HEAD" ? "" : JSON.stringify(single ? rows[0] : rows),
    );
  });
  return new Promise((resolve) =>
    server.listen(port, "127.0.0.1", () => resolve({ server, tables, faults })),
  );
}
