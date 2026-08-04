"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { assertCan } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";
import { hashPassword } from "@/lib/auth";
import { roleSchema } from "@/lib/enums";
import { toActionError } from "@/lib/errors";
import { type ActionState, str, optStr, zodFieldErrors } from "@/lib/forms";

const createSchema = z.object({
  username: z.string().min(3, "At least 3 characters").regex(/^[a-zA-Z0-9._-]+$/, "Letters, numbers, . _ - only"),
  name: z.string().min(1, "Enter a name"),
  password: z.string().min(6, "At least 6 characters"),
  role: roleSchema,
  email: z.string().email("Invalid email").optional(),
});

// ADMIN-only: create a new account.
export async function createUser(_prev: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const admin = await assertCan("manage");
    const parsed = createSchema.safeParse({
      username: str(fd, "username").toLowerCase(),
      name: str(fd, "name"),
      password: str(fd, "password"),
      role: str(fd, "role"),
      email: optStr(fd, "email"),
    });
    if (!parsed.success) return { ok: false, fieldErrors: zodFieldErrors(parsed.error), error: "Please fix the highlighted fields." };
    const data = parsed.data;

    if (await db.user.findUnique({ where: { username: data.username } })) {
      return { ok: false, error: `Username "${data.username}" is taken.` };
    }
    const user = await db.user.create({
      data: {
        username: data.username,
        name: data.name,
        email: data.email ?? null,
        passwordHash: await hashPassword(data.password),
        role: data.role,
        createdById: admin.id,
      },
    });
    await writeAudit(admin.id, "CREATE", "User", user.id, `Created ${user.role} ${user.username}`);
    revalidatePath("/admin/users");
    return { ok: true, message: `User "${user.username}" created.` };
  } catch (err) {
    return toActionError(err);
  }
}

// ADMIN-only: activate / deactivate.
export async function setUserActive(_prev: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const admin = await assertCan("update");
    const userId = str(fd, "userId");
    const active = str(fd, "active") === "true";
    if (userId === admin.id) return { ok: false, error: "You cannot deactivate your own account." };
    const user = await db.user.update({ where: { id: userId }, data: { active } });
    await writeAudit(admin.id, "UPDATE", "User", userId, `${active ? "Activated" : "Deactivated"} ${user.username}`);
    revalidatePath("/admin/users");
    return { ok: true, message: `${user.username} ${active ? "activated" : "deactivated"}.` };
  } catch (err) {
    return toActionError(err);
  }
}

// ADMIN-only: reset a user's password.
export async function resetPassword(_prev: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const admin = await assertCan("update");
    const userId = str(fd, "userId");
    const password = str(fd, "password");
    if (password.length < 6) return { ok: false, error: "Password must be at least 6 characters." };
    const user = await db.user.update({ where: { id: userId }, data: { passwordHash: await hashPassword(password) } });
    await writeAudit(admin.id, "UPDATE", "User", userId, `Reset password for ${user.username}`);
    revalidatePath("/admin/users");
    return { ok: true, message: `Password reset for ${user.username}.` };
  } catch (err) {
    return toActionError(err);
  }
}
