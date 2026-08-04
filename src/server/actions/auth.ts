"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { verifyPassword, signSession, setSessionCookie, clearSessionCookie } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { getSessionUser } from "@/lib/rbac";
import type { Role } from "@/lib/enums";
import { type ActionState, str } from "@/lib/forms";

const schema = z.object({
  username: z.string().min(1, "Enter your username"),
  password: z.string().min(1, "Enter your password"),
});

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = schema.safeParse({ username: str(formData, "username"), password: str(formData, "password") });
  if (!parsed.success) return { ok: false, error: "Please enter your username and password." };

  const { username, password } = parsed.data;
  const user = await db.user.findUnique({ where: { username } });
  if (!user || !user.active || !(await verifyPassword(password, user.passwordHash))) {
    return { ok: false, error: "Invalid username or password." };
  }

  const token = await signSession({
    sub: user.id,
    role: user.role as Role,
    name: user.name,
    username: user.username,
  });
  await setSessionCookie(token);
  await writeAudit(user.id, "LOGIN", "User", user.id, `${user.username} signed in`);
  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  const u = await getSessionUser();
  if (u) await writeAudit(u.id, "LOGOUT", "User", u.id, `${u.username} signed out`);
  await clearSessionCookie();
  redirect("/login");
}
