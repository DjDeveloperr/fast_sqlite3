import { bench, run } from "mitata";
import { Database } from "bun:sqlite";

const db = new Database(":memory:");
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
  const str = n.toString();
  const { value } = query.get(str);
  // assert(value === str);
});

await run();
