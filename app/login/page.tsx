import { redirect } from "next/navigation";
import AuthForm from "@/components/AuthForm";
import { workspaceContext } from "@/lib/data";

export const dynamic = "force-dynamic";
export default async function LoginPage() {
  if (await workspaceContext({ redirectToLogin: false })) redirect("/");
  return (
    <div className="auth-shell">
      <AuthForm />
    </div>
  );
}
