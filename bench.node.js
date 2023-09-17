import { bench, run } from "mitata";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const open = require("better-sqlite3");

const db = open(":memory:");
const query = db.prepare("select ? as value");

bench("noop", () => {});

function assert(cond) {
  if (!cond) {
    throw new Error("assertion failed");
  }
}

let n = 0;
bench("query.get()", () => {
  n++;
  const str = n.toString();
  const { value } = query.get(str);
  // assert(value === n);
});

await run();
