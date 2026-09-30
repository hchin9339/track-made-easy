import type { Metadata } from "next";
import { Suspense } from "react";
import Sidebar from "@/components/Sidebar";
import { currentWorkspace } from "@/lib/data";
import "./globals.css";
export const metadata: Metadata = {
  title: "Track Made Easy — Marcom budgets",
  description: "Monthly marketing budgets, expense tracking, and approvals.",
};
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const workspace = await currentWorkspace();
  return (
    <html lang="en">
      <body>
        <Suspense>
          <Sidebar workspace={workspace} />
        </Suspense>
        <div className={workspace ? "workspace" : "workspace guest-workspace"}>
          {workspace && (
            <div className="topbar">
              <span>
                Workspace <span className="crumb">/</span>{" "}
                <strong>{workspace.team.name}</strong>
              </span>
              <span className="topbar-status">
                <i /> Data synced
              </span>
              <span className="demo-tag">{workspace.role}</span>
            </div>
          )}
          <main>{children}</main>
          {workspace && (
            <footer>
              Track Made Easy · {workspace.team.name} · All amounts in USD
            </footer>
          )}
        </div>
      </body>
    </html>
  );
}
