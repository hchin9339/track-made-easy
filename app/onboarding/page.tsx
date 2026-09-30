"use client";
import { useActionState } from "react";
import { createTeam, type AuthState } from "@/lib/actions/auth";

const initial: AuthState = {};
export default function OnboardingPage() {
  const [state, action, pending] = useActionState(createTeam, initial);
  return (
    <div className="auth-shell">
      <div className="auth-card">
        <p className="eyebrow">NEW WORKSPACE</p>
        <h1>Create your team</h1>
        <p className="muted">
          Your categories, budgets, expenses, and approvals stay isolated from
          every other team.
        </p>
        <form action={action}>
          <label>
            Team name
            <input
              name="name"
              maxLength={80}
              placeholder="Marketing team"
              required
              autoFocus
            />
          </label>
          {state.error && (
            <div className="notice failure" role="alert">
              {state.error}
            </div>
          )}
          <button disabled={pending}>Create team workspace</button>
        </form>
      </div>
    </div>
  );
}
