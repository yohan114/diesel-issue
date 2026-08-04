"use client";

import { useActionState } from "react";
import { updateAsset } from "@/server/actions/assets";
import { Label, Input, Select, FormError, FormSuccess } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { ASSET_STATUSES, METER_TYPES } from "@/lib/enums";
import { idleState } from "@/lib/forms";

type Props = {
  asset: {
    id: string;
    status: string;
    meterType: string;
    site: string | null;
    regNo: string | null;
    capacity: string | null;
    brand: string | null;
    model: string | null;
  };
};

export function AssetEditForm({ asset }: Props) {
  const [state, action] = useActionState(updateAsset, idleState);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <input type="hidden" name="id" value={asset.id} />
      {state.ok && <div className="sm:col-span-2"><FormSuccess>{state.message}</FormSuccess></div>}
      {state.error && <div className="sm:col-span-2"><FormError>{state.error}</FormError></div>}
      <div>
        <Label>Status</Label>
        <Select name="status" defaultValue={asset.status}>
          {ASSET_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
      </div>
      <div>
        <Label>Meter type</Label>
        <Select name="meterType" defaultValue={asset.meterType}>
          {METER_TYPES.map((m) => <option key={m} value={m}>{m === "KM" ? "Kilometres" : "Hours"}</option>)}
        </Select>
      </div>
      <div>
        <Label>Brand</Label>
        <Input name="brand" defaultValue={asset.brand ?? ""} />
      </div>
      <div>
        <Label>Model</Label>
        <Input name="model" defaultValue={asset.model ?? ""} />
      </div>
      <div>
        <Label>Registration No.</Label>
        <Input name="regNo" defaultValue={asset.regNo ?? ""} />
      </div>
      <div>
        <Label>Capacity</Label>
        <Input name="capacity" defaultValue={asset.capacity ?? ""} />
      </div>
      <div className="sm:col-span-2">
        <Label>Site</Label>
        <Input name="site" defaultValue={asset.site ?? ""} />
      </div>
      <div className="sm:col-span-2">
        <SubmitButton pendingText="Saving…">Save changes</SubmitButton>
      </div>
    </form>
  );
}
