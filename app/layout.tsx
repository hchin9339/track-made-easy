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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* Manrope is the typeface specified by the approved Stitch design. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Suspense>
          <Sidebar workspace={workspace} />
        </Suspense>
        <div className={workspace ? "workspace" : "workspace guest-workspace"}>
          {workspace && (
            <div className="topbar">
              <span>
                Budget governance <span className="crumb">/</span>{" "}
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
