import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { resolve } from "node:path";
import { createDb } from "./client";

const { db } = createDb();
migrate(db, { migrationsFolder: resolve(import.meta.dirname, "../migrations") });
console.log("✓ migrations applied");
