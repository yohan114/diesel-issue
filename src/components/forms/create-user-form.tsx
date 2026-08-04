"use client";

import { useActionState } from "react";
import { createUser } from "@/server/actions/users";
import { Label, Input, Select, FieldError, FormError, FormSuccess } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { ROLES } from "@/lib/enums";
import { idleState } from "@/lib/forms";

export function CreateUserForm() {
  const [state, action] = useActionState(createUser, idleState);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      {state.ok && <div className="sm:col-span-2"><FormSuccess>{state.message}</FormSuccess></div>}
      {state.error && <div className="sm:col-span-2"><FormError>{state.error}</FormError></div>}
      <div>
        <Label>Full name</Label>
        <Input name="name" placeholder="Jane Perera" />
        <FieldError>{state.fieldErrors?.name}</FieldError>
      </div>
      <div>
        <Label>Username</Label>
        <Input name="username" placeholder="jperera" autoComplete="off" />
        <FieldError>{state.fieldErrors?.username}</FieldError>
      </div>
      <div>
        <Label>Email (optional)</Label>
        <Input name="email" type="email" placeholder="jane@example.com" />
        <FieldError>{state.fieldErrors?.email}</FieldError>
      </div>
      <div>
        <Label>Role</Label>
        <Select name="role" defaultValue="USER">
          {ROLES.map((r) => (
            <option key={r} value={r}>{r === "ADMIN" ? "Administrator (full control)" : "User (add-only)"}</option>
          ))}
        </Select>
      </div>
      <div className="sm:col-span-2">
        <Label>Temporary password</Label>
        <Input name="password" type="text" placeholder="at least 6 characters" autoComplete="new-password" />
        <FieldError>{state.fieldErrors?.password}</FieldError>
      </div>
      <div className="sm:col-span-2">
        <SubmitButton pendingText="Creating…">Create user</SubmitButton>
      </div>
    </form>
  );
}
