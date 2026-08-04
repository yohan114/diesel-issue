// Standalone monthly price refresh (for system cron): `tsx scripts/refresh-prices.ts`
import { runPriceRefresh } from "../src/lib/jobs/refresh-prices";

(async () => {
  const r = await runPriceRefresh();
  if (r.error) {
    console.warn("Price refresh:", r.error);
  } else {
    console.log(`Price refresh OK (source ${r.source}). Updated: ${r.updated.length ? r.updated.join(", ") : "none (already current)"}.`);
  }
  process.exit(0);
})();
