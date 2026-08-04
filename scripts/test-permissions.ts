// Verifies the add-only permission matrix. Run: `tsx scripts/test-permissions.ts`
import { can, type Action } from "../src/lib/permissions";

const actions: Action[] = ["create", "update", "delete", "approve", "manage"];
let failed = 0;

function expect(label: string, got: boolean, want: boolean) {
  const ok = got === want;
  if (!ok) failed++;
  console.log(`${ok ? "✓" : "✗"} ${label} -> ${got} (want ${want})`);
}

// ADMIN can do everything
for (const a of actions) expect(`ADMIN can ${a}`, can("ADMIN", a), true);

// USER can ONLY create
expect("USER can create", can("USER", "create"), true);
expect("USER cannot update", can("USER", "update"), false);
expect("USER cannot delete", can("USER", "delete"), false);
expect("USER cannot approve", can("USER", "approve"), false);
expect("USER cannot manage", can("USER", "manage"), false);

if (failed) {
  console.error(`\n${failed} assertion(s) FAILED`);
  process.exit(1);
}
console.log("\nAll permission assertions passed.");
