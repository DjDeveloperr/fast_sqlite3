import { bench, run } from "npm:mitata";
import { open, prepare } from "./mod.js";

const db = open();

const query = prepare(db, "select ?1 as value;");

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
