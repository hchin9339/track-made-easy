"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { selectTeam, signOut } from "@/lib/actions/auth";
import type { Workspace } from "@/lib/types";
import LogoMark from "@/components/LogoMark";
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
  const navItems = [
    ["/", "⌂", "Dashboard"],
    ["/budgets", "$", "Budgets"],
    ["/expenses", "↗", "Expenses"],
    ["/categories", "#", "Categories"],
    ["/team", "◇", "Team"],
  ];
  const hrefFor = (href: string) =>
    `${href}${search.get("month") ? `?month=${search.get("month")}` : ""}`;
  const isActive = (href: string) =>
    href === "/"
      ? path === "/" || path === "/dashboard"
      : path.startsWith(href);
  return (
    <>
      <header className="mobile-appbar">
        <button
          className="mobile-menu"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls="navigation"
          aria-label={open ? "Close navigation" : "Open navigation"}
        >
          ☰
        </button>
        <Link className="mobile-brand" href="/">
          <LogoMark />
          <span>trackmade easy</span>
        </Link>
        <Link className="mobile-team" href="/team" aria-label="Team settings">
          {workspace.team.name.slice(0, 1).toUpperCase()}
        </Link>
      </header>
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
          <LogoMark />
          <span>
            track<span className="brand-sub">made easy</span>
          </span>
        </Link>
        <div className="governance-label">
          <span>Budget governance</span>
          <small>{workspace.team.name}</small>
        </div>
        <p className="nav-label">WORKSPACE</p>
        <nav>
          {navItems.map(([href, icon, title]) => (
            <Link
              key={href}
              className={isActive(href) ? "active" : ""}
              href={hrefFor(href)}
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
      <nav className="mobile-bottom-nav" aria-label="Primary navigation">
        {navItems.slice(0, 4).map(([href, icon, title]) => (
          <Link
            key={href}
            className={isActive(href) ? "active" : ""}
            href={hrefFor(href)}
          >
            <span aria-hidden="true">{icon}</span>
            <small>{title}</small>
          </Link>
        ))}
      </nav>
    </>
  );
}
