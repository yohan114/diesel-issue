"use client";

import { useActionState, useState } from "react";
import { setUserActive, resetPassword } from "@/server/actions/users";
import { Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { idleState } from "@/lib/forms";

export function UserRowActions({ userId, active, isSelf }: { userId: string; active: boolean; isSelf: boolean }) {
  const [toggleState, toggle] = useActionState(setUserActive, idleState);
  const [resetState, reset] = useActionState(resetPassword, idleState);
  const [showReset, setShowReset] = useState(false);

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        {!isSelf && (
          <form action={toggle}>
            <input type="hidden" name="userId" value={userId} />
            <input type="hidden" name="active" value={(!active).toString()} />
            <SubmitButton size="sm" variant={active ? "outline" : "primary"} pendingText="…">
              {active ? "Deactivate" : "Activate"}
            </SubmitButton>
          </form>
        )}
        <Button size="sm" variant="ghost" onClick={() => setShowReset((s) => !s)}>Reset password</Button>
      </div>
      {showReset && (
        <form action={reset} className="flex items-center gap-2">
          <input type="hidden" name="userId" value={userId} />
          <Input name="password" type="text" placeholder="new password" className="h-8 w-40" />
          <SubmitButton size="sm" pendingText="…">Set</SubmitButton>
        </form>
      )}
      {(toggleState.error || resetState.error) && <span className="text-xs text-red-600">{toggleState.error || resetState.error}</span>}
      {(toggleState.ok || resetState.ok) && <span className="text-xs text-green-600">{toggleState.message || resetState.message}</span>}
    </div>
  );
}
