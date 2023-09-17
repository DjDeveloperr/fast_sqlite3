import { bench, run } from "npm:mitata";

const {
  test,
} = Deno.dlopen("test.dylib", {
  test: {
    parameters: ["pointer"],
    result: "i32",
  },
}).symbols;

const ptr = Deno.UnsafePointer.create(0xDEAD);

bench("noop", () => {});

bench("test", () => {
  test(ptr);
});

await run();
