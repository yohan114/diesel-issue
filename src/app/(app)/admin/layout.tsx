import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/rbac";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") redirect("/dashboard");
  return <>{children}</>;
}
