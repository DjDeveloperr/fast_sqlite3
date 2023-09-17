import { Database } from "https://deno.land/x/sqlite3@0.9.1/mod.ts";
import { bench, run } from "npm:mitata";

const db = new Database(":memory:", { unsafeConcurrency: true });
const query = db.prepare("select ?1 as value;");

bench("noop", () => {});

function assert(cond) {
  if (!cond) {
    throw new Error("assertion failed");
  }
}

let n = 0;
bench("query.get()", () => {
  n++;
  const { value } = query.get(n);
  assert(value === n);
});

await run();
