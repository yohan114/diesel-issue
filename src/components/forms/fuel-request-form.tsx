"use client";

import { useActionState, useState } from "react";
import { createRequest } from "@/server/actions/fuel-requests";
import { AssetSelect, type AssetOption } from "./asset-select";
import { Label, Input, Select, FieldError, FormError, FormSuccess } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { FUEL_LABELS, FUEL_KINDS } from "@/lib/enums";
import { idleState } from "@/lib/forms";

export function FuelRequestForm({ assets }: { assets: AssetOption[] }) {
  const [state, action] = useActionState(createRequest, idleState);
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
        <Label>Litres requested</Label>
        <Input name="requestedLitres" type="number" step="0.01" min="0" inputMode="decimal" placeholder="0.00" />
        <FieldError>{state.fieldErrors?.requestedLitres}</FieldError>
      </div>
      <div>
        <Label>{unitLabel}</Label>
        <Input name="meterReading" type="number" step="0.1" min="0" inputMode="decimal" placeholder="optional" />
      </div>
      <div>
        <Label>Reason</Label>
        <Input name="reason" placeholder="optional" />
      </div>
      <div className="sm:col-span-2">
        <SubmitButton pendingText="Submitting…">Submit request</SubmitButton>
      </div>
    </form>
  );
}
