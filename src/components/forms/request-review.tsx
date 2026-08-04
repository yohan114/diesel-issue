"use client";

import { useActionState } from "react";
import { approveRequest, rejectRequest } from "@/server/actions/fuel-requests";
import { Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { ymd } from "@/lib/utils";
import { idleState } from "@/lib/forms";

export function RequestReview({ requestId, requestedLitres }: { requestId: string; requestedLitres: number }) {
  const [aState, approve] = useActionState(approveRequest, idleState);
  const [rState, reject] = useActionState(rejectRequest, idleState);

  return (
    <div className="space-y-2 rounded-lg bg-slate-50 p-3">
      <form action={approve} className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="requestId" value={requestId} />
        <label className="text-xs text-slate-500">
          Litres
          <Input name="litres" type="number" step="0.01" min="0" defaultValue={requestedLitres} className="mt-0.5 h-8 w-24" />
        </label>
        <label className="text-xs text-slate-500">
          Source
          <Input name="source" className="mt-0.5 h-8 w-32" placeholder="optional" />
        </label>
        <label className="text-xs text-slate-500">
          Date
          <Input name="issueDate" type="date" defaultValue={ymd(new Date())} className="mt-0.5 h-8 w-40" />
        </label>
        <SubmitButton size="sm" pendingText="Approving…">Approve & issue</SubmitButton>
      </form>
      <form action={reject} className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="requestId" value={requestId} />
        <Input name="reviewNote" className="h-8 w-48" placeholder="reject reason (optional)" />
        <SubmitButton size="sm" variant="danger" pendingText="…">Reject</SubmitButton>
      </form>
      {(aState.error || rState.error) && <p className="text-xs text-red-600">{aState.error || rState.error}</p>}
    </div>
  );
}
