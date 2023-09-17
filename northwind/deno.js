import { Database } from "https://deno.land/x/sqlite3@0.9.1/mod.ts";
import { bench, run } from "npm:mitata";

const db = new Database("./northwind.sqlite", {
  unsafeConcurrency: true,
});

{
  const sql = db.prepare(`SELECT * FROM "Order"`);

  bench('SELECT * FROM "Order"', () => {
    sql.all();
  });
}

{
  const sql = db.prepare(`SELECT * FROM "Product"`);

  bench('SELECT * FROM "Product"', () => {
    sql.all();
  });
}

{
  const sql = db.prepare(`SELECT * FROM "OrderDetail"`);

  bench('SELECT * FROM "OrderDetail"', () => {
    sql.all();
  });
}

await run();
