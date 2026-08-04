"use client";

import { useActionState, useState } from "react";
import { createDirectIssue } from "@/server/actions/fuel-issues";
import { AssetSelect, type AssetOption } from "./asset-select";
import { Label, Input, Select, FieldError, FormError, FormSuccess } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { FUEL_LABELS, FUEL_KINDS } from "@/lib/enums";
import { ymd } from "@/lib/utils";
import { idleState } from "@/lib/forms";

export function FuelIssueForm({ assets }: { assets: AssetOption[] }) {
  const [state, action] = useActionState(createDirectIssue, idleState);
  const [asset, setAsset] = useState<AssetOption | null>(null);
  const unitLabel = asset ? (asset.meterType === "KM" ? "Odometer (km)" : "Hour-meter (hrs)") : "Meter reading";

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
        <Label>Fuel type</Label>
        <Select name="fuelKind" defaultValue="AUTO_DIESEL">
          {FUEL_KINDS.map((k) => (
            <option key={k} value={k}>{FUEL_LABELS[k]}</option>
          ))}
        </Select>
      </div>
      <div>
        <Label>Litres</Label>
        <Input name="litres" type="number" step="0.01" min="0" inputMode="decimal" placeholder="0.00" />
        <FieldError>{state.fieldErrors?.litres}</FieldError>
      </div>
      <div>
        <Label>{unitLabel}</Label>
        <Input name="meterReading" type="number" step="0.1" min="0" inputMode="decimal" placeholder="optional" />
        <FieldError>{state.fieldErrors?.meterReading}</FieldError>
      </div>
      <div>
        <Label>Date</Label>
        <Input name="issueDate" type="date" defaultValue={ymd(new Date())} />
      </div>
      <div className="sm:col-span-2">
        <Label>Source (station / bowser)</Label>
        <Input name="source" placeholder="optional" />
      </div>
      <div className="sm:col-span-2">
        <SubmitButton pendingText="Saving…">Record fuel issue</SubmitButton>
      </div>
    </form>
  );
}
