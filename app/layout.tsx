import type { Metadata } from "next";
import { Suspense } from "react";
import Sidebar from "@/components/Sidebar";
import "./globals.css";
export const metadata: Metadata = {
  title: "Track Made Easy — Marcom budgets",
  description: "Monthly marketing budgets, expense tracking, and approvals.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Suspense>
          <Sidebar />
        </Suspense>
        <div className="workspace">
          <div className="topbar">
            <span>
              Marketing / <strong>Budget tracker</strong>
            </span>
            <span className="demo-tag">DEMO WORKSPACE</span>
          </div>
          <main>{children}</main>
          <footer>
            Track Made Easy · Shared demo data · All amounts in USD
          </footer>
        </div>
      </body>
    </html>
  );
}
