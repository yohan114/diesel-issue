"use client";

import { useActionState } from "react";
import { addPrice } from "@/server/actions/prices";
import { Label, Input, Select, FieldError, FormError, FormSuccess } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { FUEL_KINDS, FUEL_LABELS } from "@/lib/enums";
import { ymd } from "@/lib/utils";
import { idleState } from "@/lib/forms";

export function AddPriceForm() {
  const [state, action] = useActionState(addPrice, idleState);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      {state.ok && <div className="sm:col-span-2"><FormSuccess>{state.message}</FormSuccess></div>}
      {state.error && <div className="sm:col-span-2"><FormError>{state.error}</FormError></div>}
      <div>
        <Label>Fuel type</Label>
        <Select name="fuelKind" defaultValue="AUTO_DIESEL">
          {FUEL_KINDS.map((k) => (
            <option key={k} value={k}>{FUEL_LABELS[k]}</option>
          ))}
        </Select>
      </div>
      <div>
        <Label>Price per litre (LKR)</Label>
        <Input name="price" type="number" step="0.01" min="0" inputMode="decimal" placeholder="407.00" />
        <FieldError>{state.fieldErrors?.price}</FieldError>
      </div>
      <div>
        <Label>Effective from</Label>
        <Input name="effectiveFrom" type="date" defaultValue={ymd(new Date())} />
      </div>
      <div>
        <Label>Note (optional)</Label>
        <Input name="note" placeholder="e.g. CPC revision" />
      </div>
      <div className="sm:col-span-2">
        <SubmitButton pendingText="Saving…">Save price</SubmitButton>
      </div>
    </form>
  );
}
