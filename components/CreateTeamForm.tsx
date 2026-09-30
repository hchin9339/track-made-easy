"use client";
import { useActionState } from "react";
import { createTeam, type AuthState } from "@/lib/actions/auth";

const initial: AuthState = {};
export default function CreateTeamForm() {
  const [state, action, pending] = useActionState(createTeam, initial);
  return (
    <form action={action} className="inline-form">
      <label>
        Workspace name
        <input
          name="name"
          maxLength={80}
          placeholder="Growth marketing"
          required
        />
      </label>
      <button disabled={pending}>
        {pending ? "Creating…" : "Create workspace"}
      </button>
      {state.error && (
        <div className="notice failure" role="alert">
          {state.error}
        </div>
      )}
    </form>
  );
}
