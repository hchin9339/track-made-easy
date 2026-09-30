"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { selectTeam, signOut } from "@/lib/actions/auth";
import type { Workspace } from "@/lib/types";
export default function Sidebar({
  workspace,
}: {
  workspace: Workspace | null;
}) {
  const path = usePathname();
  const search = useSearchParams();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);
  if (!workspace) return null;
  return (
    <>
      <button
        className="menu-button secondary"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls="navigation"
        aria-label={open ? "Close navigation" : "Open navigation"}
      >
        <span aria-hidden="true">☰</span> Menu
      </button>
      {open && (
        <button
          className="nav-backdrop"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        />
      )}
      <aside id="navigation" className={`sidebar ${open ? "open" : ""}`}>
        <Link className="brand" href="/">
          <span className="brand-mark">T</span>
          <span>
            Track<span className="brand-sub">Made Easy</span>
          </span>
        </Link>
        <p className="nav-label">WORKSPACE</p>
        <nav>
          {[
            ["/", "⌂", "Dashboard"],
            ["/budgets", "$", "Budgets"],
            ["/expenses", "↗", "Expenses"],
            ["/categories", "#", "Categories"],
            ["/team", "◇", "Team"],
          ].map(([href, icon, title]) => (
            <Link
              key={href}
              className={
                (
                  href === "/"
                    ? path === "/" || path === "/dashboard"
                    : path.startsWith(href)
                )
                  ? "active"
                  : ""
              }
              href={`${href}${search.get("month") ? `?month=${search.get("month")}` : ""}`}
              onClick={() => setOpen(false)}
            >
              <span className="nav-icon" aria-hidden="true">
                {icon}
              </span>
              {title}
            </Link>
          ))}
        </nav>
        <div className="sidebar-footer">
          <span className="avatar">
            {workspace.team.name.slice(0, 2).toUpperCase()}
          </span>
          <div>
            {workspace.memberships.length > 1 ? (
              <form action={selectTeam}>
                <select
                  name="team_id"
                  aria-label="Active workspace"
                  value={workspace.team.id}
                  onChange={(e) => e.currentTarget.form?.requestSubmit()}
                >
                  {workspace.memberships.map(({ team }) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </form>
            ) : (
              <strong>{workspace.team.name}</strong>
            )}
            <small>
              {workspace.role} · {workspace.userEmail}
            </small>
            <form action={signOut}>
              <button className="signout" type="submit">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}
