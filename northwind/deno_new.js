import { bench, run } from "npm:mitata";
import { open, prepare } from "../mod.js";

const db = open("./northwind.sqlite");

{
  const sql = prepare(db, `SELECT * FROM "Order"`);
  bench('SELECT * FROM "Order"', () => {
    sql.all();
  });
}

{
  const sql = prepare(db, `SELECT * FROM "Product"`);
  bench('SELECT * FROM "Product"', () => {
    sql.all();
  });
}

{
  const sql = prepare(db, `SELECT * FROM "OrderDetail"`);
  bench('SELECT * FROM "OrderDetail"', () => {
    sql.all();
  });
}

await run();
