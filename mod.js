import {
  SQLITE3_OK,
  SQLITE3_OPEN_MEMORY,
  SQLITE3_OPEN_READWRITE,
  SQLITE3_ROW,
  SQLITE_BLOB,
  SQLITE_FLOAT,
  SQLITE_INTEGER,
  SQLITE_NULL,
  SQLITE_TEXT,
} from "./constants.ts";

const {
  sqlite3_initialize,
  sqlite3_open_v2,
  sqlite3_prepare_v2,
  sqlite3_column_count,
  sqlite3_column_name,
  sqlite3_reset,
  sqlite3_step,
  sqlite3_bind_int,
  sqlite3_column_int,
  sqlite3_column_type,
  sqlite3_column_bytes,
  sqlite3_column_double,
  sqlite3_column_text,
  sqlite3_column_blob,
  sqlite3_bind_double,
  sqlite3_bind_text,
  sqlite3_changes,
} = Deno.dlopen(
  "/usr/lib/libsqlite3.dylib" ??
    new URL("./build/libsqlite3_aarch64.dylib", import.meta.url),
  {
    sqlite3_initialize: {
      parameters: [],
      result: "i32",
    },

    sqlite3_open_v2: {
      parameters: ["buffer", "buffer", "i32", "pointer"],
      result: "i32",
    },

    sqlite3_prepare_v2: {
      parameters: ["pointer", "buffer", "i32", "buffer", "pointer"],
      result: "i32",
    },

    sqlite3_column_count: {
      parameters: ["pointer"],
      result: "i32",
    },

    sqlite3_column_name: {
      parameters: ["pointer", "i32"],
      result: "pointer",
    },

    sqlite3_reset: {
      parameters: ["pointer"],
      result: "i32",
    },

    sqlite3_step: {
      parameters: ["pointer"],
      result: "i32",
    },

    sqlite3_bind_int: {
      parameters: ["pointer", "i32", "i32"],
      result: "i32",
    },

    sqlite3_column_int: {
      parameters: ["pointer", "i32"],
      result: "i32",
    },

    sqlite3_column_type: {
      parameters: ["pointer", "i32"],
      result: "i32",
    },

    sqlite3_column_double: {
      parameters: ["pointer", "i32"],
      result: "f64",
    },

    sqlite3_column_text: {
      parameters: ["pointer", "i32"],
      result: "pointer",
    },

    sqlite3_column_bytes: {
      parameters: ["pointer", "i32"],
      result: "i32",
    },

    sqlite3_column_blob: {
      parameters: ["pointer", "i32"],
      result: "pointer",
    },

    sqlite3_bind_double: {
      parameters: ["pointer", "i32", "f64"],
      result: "i32",
    },

    sqlite3_bind_text: {
      parameters: ["pointer", "i32", "buffer", "i32", "pointer"],
      result: "i32",
    },

    sqlite3_changes: {
      parameters: ["pointer"],
      result: "i32",
    },
  },
).symbols;

function unwrap(code) {
  if (code != SQLITE3_OK) {
    throw new Error(`sqlite3 error: ${code}`);
  }
}

function encode(str) {
  str += "\0";
  const encoder = new TextEncoder();
  const buffer = encoder.encode(str);
  return [buffer, buffer.byteLength];
}

unwrap(sqlite3_initialize());

const ptr = new BigUint64Array(1);
const ptru8 = new Uint8Array(ptr.buffer);

export function open(path = ":memory:") {
  const [cstr] = encode(path);

  unwrap(
    sqlite3_open_v2(
      cstr,
      ptru8,
      SQLITE3_OPEN_READWRITE | (path !== ":memory:" ? 0 : SQLITE3_OPEN_MEMORY),
      null,
    ),
  );

  const db = Deno.UnsafePointer.create(ptr[0]);
  return db;
}

function column_value(query, i) {
  const type = sqlite3_column_type(query, i);
  switch (type) {
    case SQLITE_NULL:
      return null;

    case SQLITE_INTEGER:
      return sqlite3_column_int(query, i);

    case SQLITE_FLOAT:
      return sqlite3_column_double(query, i);

    case SQLITE_TEXT: {
      const ptr = sqlite3_column_text(query, i);
      // const len = sqlite3_column_bytes(query, i);
      // return Deno.UnsafePointerView.getCString(ptr);
      return ptr;
    }

    case SQLITE_BLOB: {
      const bytes = sqlite3_column_bytes(query, i);
      const value = new Uint8Array(bytes);
      const ptr = sqlite3_column_blob(query, i);
      Deno.UnsafePointerView.copyInto(ptr, value);
      return ptr;
    }

    default:
      throw new Error(`sqlite3 error: unknown type ${type}`);
  }
}

export function prepare(db, query) {
  const [cstr, len] = encode(query);

  unwrap(
    sqlite3_prepare_v2(
      db,
      cstr,
      len,
      ptru8,
      null,
    ),
  );

  return new Stmt(Deno.UnsafePointer.create(ptr[0]));
}

export class Stmt {
  columnNames;
  columnCount;
  getRowObject;
  bindRefs = new Set();

  constructor(ptr) {
    this.ptr = ptr;
  }

  reset() {
    sqlite3_reset(this.ptr);
    // clear is slow
    this.bindRefs = new Set();
  }

  getCurrentRow() {
    const ptr = this.ptr;

    if (!this.columnNames) {
      this.columnCount = sqlite3_column_count(ptr);
      this.columnNames = new Array(this.columnCount);
      for (let i = 0; i < this.columnCount; i++) {
        const columnName = sqlite3_column_name(ptr, i);
        this.columnNames[i] = Deno.UnsafePointerView.getCString(columnName);
      }
    }

    if (!this.getRowObject) {
      this.getRowObject = new Function(
        "column_value",
        `return function (query) {
          return {
            ${
          this.columnNames.map((name, i) =>
            `${name}: column_value(query, ${i})`
          )
            .join(
              ",\n",
            )
        }
          }; 
        }`,
      )(column_value);
    }

    return this.getRowObject(ptr);
  }

  bind(i, value) {
    const query = this.ptr;

    switch (typeof value) {
      case "number":
        if (Number.isInteger(value)) {
          unwrap(sqlite3_bind_int(query, i, value));
        } else {
          unwrap(sqlite3_bind_double(query, i, value));
        }
        break;

      case "string": {
        const buf = new TextEncoder().encode(value);
        unwrap(sqlite3_bind_text(query, i, buf, buf.byteLength, null));
        this.bindRefs.add(buf);
        break;
      }

      default:
        throw new Error(`sqlite3 error: unknown type ${typeof value}`);
    }
  }

  bindAll(args) {
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      this.bind(i + 1, arg);
    }
  }

  get(...args) {
    this.bindAll(args);

    const ptr = this.ptr;

    if (sqlite3_step(ptr) != SQLITE3_ROW) {
      throw new Error("sqlite3 error: no row");
    }

    const row = this.getCurrentRow();

    this.reset();

    return row;
  }

  run(...args) {
    this.bindAll(args);

    const ptr = this.ptr;

    if (sqlite3_step(ptr) != SQLITE3_ROW) {
      throw new Error("sqlite3 error: no row");
    }

    const changes = sqlite3_changes(ptr);

    this.reset();

    return changes;
  }

  all(...args) {
    this.bindAll(args);

    const ptr = this.ptr;

    const rows = [];

    while (sqlite3_step(ptr) == SQLITE3_ROW) {
      rows.push(this.getCurrentRow());
    }

    this.reset();

    return rows;
  }

  values() {}
}
