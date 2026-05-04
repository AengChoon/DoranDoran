import type { Database as BetterSqliteDatabase } from "better-sqlite3";

/**
 * 도란도란 DB 초기화 — Tier 3 sync 지원 스키마.
 *
 * 동기 가능한 모든 테이블에 createdAt / updatedAt / deletedAt 트리오.
 * deletedAt은 소프트 삭제 (톰스톤). null이면 정상.
 *
 * 1. CREATE TABLE IF NOT EXISTS — 빈 DB라면 깔끔히 생성
 * 2. ensureColumn — 기존 DB는 누락 컬럼만 ALTER로 추가 (idempotent 마이그레이션)
 *
 * 둘 다 idempotent라 매 부팅마다 실행해도 안전.
 */
export function initSchema(sqlite: BetterSqliteDatabase) {
  // ── 1. CREATE TABLE IF NOT EXISTS ────────────────────
  const stmts = [
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      native_lang TEXT NOT NULL,
      learning_lang TEXT NOT NULL,
      avatar_url TEXT,
      push_subscription TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
      deleted_at INTEGER
    )`,
    `CREATE INDEX IF NOT EXISTS users_updated_idx ON users(updated_at)`,

    `CREATE TABLE IF NOT EXISTS cards (
      id TEXT PRIMARY KEY,
      author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      lang TEXT NOT NULL,
      target_text TEXT NOT NULL,
      meaning TEXT NOT NULL,
      example TEXT,
      note TEXT,
      audio_s3_key TEXT,
      tags TEXT,
      furigana TEXT,
      confirmed_at INTEGER,
      confirmed_by TEXT REFERENCES users(id) ON DELETE SET NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
      deleted_at INTEGER
    )`,
    `CREATE INDEX IF NOT EXISTS cards_author_idx ON cards(author_id)`,
    `CREATE INDEX IF NOT EXISTS cards_created_idx ON cards(created_at)`,
    `CREATE INDEX IF NOT EXISTS cards_updated_idx ON cards(updated_at)`,

    `CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      card_id TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
      author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      body TEXT NOT NULL,
      audio_s3_key TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
      deleted_at INTEGER
    )`,
    `CREATE INDEX IF NOT EXISTS comments_card_idx ON comments(card_id)`,
    `CREATE INDEX IF NOT EXISTS comments_updated_idx ON comments(updated_at)`,

    `CREATE TABLE IF NOT EXISTS review_states (
      card_id TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      ease_factor REAL NOT NULL DEFAULT 2.5,
      interval_days INTEGER NOT NULL DEFAULT 0,
      repetitions INTEGER NOT NULL DEFAULT 0,
      next_review_at INTEGER NOT NULL,
      last_reviewed_at INTEGER,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
      deleted_at INTEGER,
      PRIMARY KEY (card_id, user_id)
    )`,
    `CREATE INDEX IF NOT EXISTS review_next_idx ON review_states(user_id, next_review_at)`,
    `CREATE INDEX IF NOT EXISTS review_updated_idx ON review_states(updated_at)`,

    `CREATE TABLE IF NOT EXISTS magic_links (
      token TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      consumed_at INTEGER,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    )`,
  ];

  for (const sql of stmts) sqlite.exec(sql);

  // ── 2. 기존 DB 마이그레이션 ──────────────────────────
  // (구버전 DB에서 컬럼이 없으면 추가. 새 DB엔 무관)
  ensureColumn(sqlite, "users", "updated_at", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(sqlite, "users", "deleted_at", "INTEGER");

  ensureColumn(sqlite, "cards", "furigana", "TEXT");
  ensureColumn(sqlite, "cards", "confirmed_at", "INTEGER");
  ensureColumn(
    sqlite,
    "cards",
    "confirmed_by",
    "TEXT REFERENCES users(id) ON DELETE SET NULL",
  );
  ensureColumn(sqlite, "cards", "deleted_at", "INTEGER");
  // 기존 cards에 updated_at 없을 수 있음
  ensureColumn(
    sqlite,
    "cards",
    "updated_at",
    "INTEGER NOT NULL DEFAULT 0",
  );

  ensureColumn(
    sqlite,
    "comments",
    "updated_at",
    "INTEGER NOT NULL DEFAULT 0",
  );
  ensureColumn(sqlite, "comments", "deleted_at", "INTEGER");

  ensureColumn(
    sqlite,
    "review_states",
    "updated_at",
    "INTEGER NOT NULL DEFAULT 0",
  );
  ensureColumn(sqlite, "review_states", "deleted_at", "INTEGER");

  // updated_at 인덱스도 누락 시 추가
  sqlite.exec(
    `CREATE INDEX IF NOT EXISTS cards_updated_idx ON cards(updated_at)`,
  );
  sqlite.exec(
    `CREATE INDEX IF NOT EXISTS comments_updated_idx ON comments(updated_at)`,
  );
  sqlite.exec(
    `CREATE INDEX IF NOT EXISTS users_updated_idx ON users(updated_at)`,
  );
  sqlite.exec(
    `CREATE INDEX IF NOT EXISTS review_updated_idx ON review_states(updated_at)`,
  );

  // 백필 — 기존 DB에서 updated_at이 0이면 created_at으로 (sync에 포함되도록)
  sqlite.exec(
    `UPDATE users SET updated_at = created_at WHERE updated_at = 0`,
  );
  sqlite.exec(
    `UPDATE cards SET updated_at = created_at WHERE updated_at = 0`,
  );
  sqlite.exec(
    `UPDATE comments SET updated_at = created_at WHERE updated_at = 0`,
  );
  sqlite.exec(
    `UPDATE review_states SET updated_at = created_at WHERE updated_at = 0`,
  );
}

/** 컬럼이 없으면 ALTER TABLE ADD COLUMN으로 추가. 있으면 무시. */
function ensureColumn(
  sqlite: BetterSqliteDatabase,
  table: string,
  column: string,
  def: string,
) {
  const cols = sqlite
    .prepare(`PRAGMA table_info(${table})`)
    .all() as Array<{ name: string }>;
  if (cols.some((c) => c.name === column)) return;
  sqlite.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${def}`);
}
