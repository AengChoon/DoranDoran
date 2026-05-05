import type { Database as BetterSqliteDatabase } from "better-sqlite3";

/**
 * 도란도란 DB 초기화 — schema.ts와 1:1 일치하는 CREATE TABLE IF NOT EXISTS.
 *
 * 단일 source: 스키마 변경 시 schema.ts와 여기 둘 다 수정.
 * 새 컬럼 추가는 ensureColumn으로 in-place ALTER (실제 사용 데이터 보존).
 * 테이블 자체 제거는 wipe로 처리.
 *
 * idempotent라 매 부팅마다 실행해도 안전.
 */
export function initSchema(sqlite: BetterSqliteDatabase) {
  const stmts = [
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      native_lang TEXT NOT NULL,
      learning_lang TEXT NOT NULL,
      avatar_url TEXT,
      onboarded_at INTEGER,
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
      tags TEXT,
      furigana TEXT,
      confirmed_at INTEGER,
      confirmed_by TEXT REFERENCES users(id) ON DELETE SET NULL,
      correction TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
      deleted_at INTEGER
    )`,
    `CREATE INDEX IF NOT EXISTS cards_author_idx ON cards(author_id)`,
    `CREATE INDEX IF NOT EXISTS cards_created_idx ON cards(created_at)`,
    `CREATE INDEX IF NOT EXISTS cards_updated_idx ON cards(updated_at)`,

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

    `CREATE TABLE IF NOT EXISTS pin_codes (
      code TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      consumed_at INTEGER,
      attempts INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    )`,
    `CREATE INDEX IF NOT EXISTS pin_codes_email_idx ON pin_codes(email)`,
  ];

  for (const sql of stmts) sqlite.exec(sql);

  // ─── in-place 컬럼 추가 (옛 DB에 새 컬럼 보강) ──────────
  ensureColumn(sqlite, "cards", "correction", "TEXT");

  // ─── 폐기 테이블 정리 ───────────────────────────────────
  // 옛 댓글 시스템(첨삭으로 대체됨) — 데이터 손실 없음 (사용자 가시 X였음)
  sqlite.exec(`DROP TABLE IF EXISTS comments`);
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
