import Database from "better-sqlite3";
import type { Database as BetterSqliteDatabase } from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import * as schema from "./schema";

export type DorandoranDb = ReturnType<typeof drizzle<typeof schema>>;

/** dev에서 raw sqlite도 같이 들고 다닐 수 있게 묶어서 반환 */
export type DbBundle = {
  db: DorandoranDb;
  sqlite: BetterSqliteDatabase;
};

export function createDb(dbPath?: string): DbBundle {
  const path = resolve(dbPath ?? process.env.DB_PATH ?? "./data/dorandoran.db");
  mkdirSync(dirname(path), { recursive: true });

  const sqlite = new Database(path);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("synchronous = NORMAL");
  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("busy_timeout = 5000");

  const db = drizzle(sqlite, { schema });

  return { db, sqlite };
}

export { schema };
