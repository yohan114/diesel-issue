"use client";

import { useActionState, useState } from "react";
import { createReading } from "@/server/actions/readings";
import { AssetSelect, type AssetOption } from "./asset-select";
import { Label, Input, FieldError, FormError, FormSuccess } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { ymd } from "@/lib/utils";
import { idleState } from "@/lib/forms";

export function ReadingForm({ assets }: { assets: AssetOption[] }) {
  const [state, action] = useActionState(createReading, idleState);
  const [asset, setAsset] = useState<AssetOption | null>(null);
  const unitLabel = asset ? (asset.meterType === "KM" ? "Odometer (km)" : "Hour-meter (hrs)") : "Reading value";

  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      {state.ok && <div className="sm:col-span-2"><FormSuccess>{state.message}</FormSuccess></div>}
      {state.error && <div className="sm:col-span-2"><FormError>{state.error}</FormError></div>}

      <div className="sm:col-span-2">
        <Label>Asset</Label>
        <AssetSelect assets={assets} value={asset?.id ?? ""} onChange={setAsset} />
        <FieldError>{state.fieldErrors?.assetId}</FieldError>
      </div>
      <div>
        <Label>{unitLabel}</Label>
        <Input name="value" type="number" step="0.1" min="0" inputMode="decimal" placeholder="0" />
        <FieldError>{state.fieldErrors?.value}</FieldError>
      </div>
      <div>
        <Label>Date</Label>
        <Input name="readingDate" type="date" defaultValue={ymd(new Date())} />
      </div>
      <div className="sm:col-span-2">
        <SubmitButton pendingText="Saving…">Save reading</SubmitButton>
      </div>
    </form>
  );
}
