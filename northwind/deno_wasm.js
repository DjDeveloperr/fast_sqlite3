import { DB } from "https://deno.land/x/sqlite@v3.4.1/mod.ts";
import { bench, run } from "npm:mitata";

const db = new DB("./northwind.sqlite");

{
  const sql = db.prepareQuery(`SELECT * FROM "Order"`);
  bench('SELECT * FROM "Order" all', () => {
    sql.all();
  });
}

{
  const sql = db.prepareQuery(`SELECT * FROM "Product"`);
  bench('SELECT * FROM "Product" all', () => {
    sql.all();
  });
}

{
  const sql = db.prepareQuery(`SELECT * FROM "OrderDetail"`);
  bench('SELECT * FROM "OrderDetail" all', () => {
    sql.all();
  });
}

await run();
