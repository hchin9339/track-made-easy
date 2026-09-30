"use client";
import { useActionState } from "react";
import { renameTeam, type AuthState } from "@/lib/actions/auth";

const initial: AuthState = {};

export default function RenameTeamForm({
  currentName,
}: {
  currentName: string;
}) {
  const [state, action, pending] = useActionState(renameTeam, initial);

  return (
    <form action={action} className="inline-form">
      <label>
        Team name
        <input
          name="name"
          defaultValue={currentName}
          maxLength={80}
          autoComplete="organization"
          required
        />
      </label>
      <button disabled={pending}>{pending ? "Saving…" : "Save name"}</button>
      {state.error && (
        <div className="notice failure" role="alert">
          {state.error}
        </div>
      )}
      {state.message && (
        <div className="notice success" role="status">
          {state.message}
        </div>
      )}
    </form>
  );
}
