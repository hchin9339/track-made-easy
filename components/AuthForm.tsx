"use client";
import { useActionState, useState } from "react";
import { signIn, signUp, type AuthState } from "@/lib/actions/auth";
import LogoMark from "@/components/LogoMark";

const initial: AuthState = {};
export default function AuthForm() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [signInState, signInAction, signingIn] = useActionState(
    signIn,
    initial,
  );
  const [signUpState, signUpAction, signingUp] = useActionState(
    signUp,
    initial,
  );
  const state = mode === "signin" ? signInState : signUpState;
  return (
    <div className="auth-card">
      <div className="auth-brand">
        <LogoMark />
        <strong>Track Made Easy</strong>
      </div>
      <p className="eyebrow">TEAM BUDGET CONTROL</p>
      <h1>{mode === "signin" ? "Welcome back" : "Create your account"}</h1>
      <p className="muted">
        Plan budgets, record commitments, and approve actual spend together.
      </p>
      <div className="auth-tabs" role="tablist">
        <button
          type="button"
          className={mode === "signin" ? "active" : "secondary"}
          onClick={() => setMode("signin")}
        >
          Sign in
        </button>
        <button
          type="button"
          className={mode === "signup" ? "active" : "secondary"}
          onClick={() => setMode("signup")}
        >
          Create account
        </button>
      </div>
      <form action={mode === "signin" ? signInAction : signUpAction}>
        <label>
          Email
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            autoComplete={
              mode === "signin" ? "current-password" : "new-password"
            }
            minLength={8}
            required
          />
        </label>
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
        <button disabled={signingIn || signingUp}>
          {mode === "signin" ? "Sign in to workspace" : "Create account"}
        </button>
      </form>
    </div>
  );
}
