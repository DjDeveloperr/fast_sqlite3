import { bench, run } from "mitata";
import { Database } from "bun:sqlite";

const db = Database.open("./northwind.sqlite");

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
  const sql = db.prepare(`SELECT *, ?1 as val FROM "OrderDetail"`);
  bench('SELECT * FROM "OrderDetail"', () => {
    sql.all();
  });
}

await run();
