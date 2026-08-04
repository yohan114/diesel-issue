"use client";

import { useActionState } from "react";
import { loginAction } from "@/server/actions/auth";
import { Label, Input, FormError } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { idleState } from "@/lib/forms";

export function LoginForm() {
  const [state, action] = useActionState(loginAction, idleState);
  return (
    <form action={action} className="space-y-4">
      <FormError>{state.error}</FormError>
      <div>
        <Label htmlFor="username">Username</Label>
        <Input id="username" name="username" autoComplete="username" autoFocus placeholder="admin" required />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" placeholder="••••••••" required />
      </div>
      <SubmitButton className="w-full" size="lg" pendingText="Signing in…">
        Sign in
      </SubmitButton>
    </form>
  );
}
