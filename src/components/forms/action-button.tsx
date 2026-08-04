"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { type ActionState, idleState } from "@/lib/forms";

export function ActionButton({
  action,
  children,
  pendingText = "Working…",
  variant = "secondary",
}: {
  action: () => Promise<ActionState>;
  children: React.ReactNode;
  pendingText?: string;
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
}) {
  const [state, dispatch, pending] = useActionState<ActionState>(async () => action(), idleState);
  return (
    <div className="flex flex-col gap-1">
      <form action={dispatch}>
        <Button type="submit" variant={variant} disabled={pending}>
          {pending ? pendingText : children}
        </Button>
      </form>
      {state.ok && <span className="text-xs text-green-600">{state.message}</span>}
      {state.error && <span className="text-xs text-red-600">{state.error}</span>}
    </div>
  );
}
