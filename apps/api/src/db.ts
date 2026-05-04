import { createDb, initSchema, type DorandoranDb } from "@dorandoran/db";
import { env } from "./env";

let _db: DorandoranDb | null = null;

export function getDb(): DorandoranDb {
  if (_db) return _db;
  const { db, sqlite } = createDb(env.DB_PATH);
  initSchema(sqlite);
  _db = db;
  return _db;
}
