import { redirect } from "next/navigation";
import AuthForm from "@/components/AuthForm";
import { workspaceContext } from "@/lib/data";

export const dynamic = "force-dynamic";
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const destination =
    next?.startsWith("/") && !next.startsWith("//") ? next : "/";
  if (await workspaceContext({ redirectToLogin: false })) redirect(destination);
  return (
    <div className="auth-shell">
      <AuthForm next={destination} />
    </div>
  );
}
