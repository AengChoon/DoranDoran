import type { Database as BetterSqliteDatabase } from "better-sqlite3";

/**
 * 도란도란 DB 초기화 — schema.ts와 1:1 일치하는 CREATE TABLE IF NOT EXISTS.
 *
 * 단일 source: 스키마 변경 시 schema.ts와 여기 둘 다 수정. 오래된 DB는 wipe.
 * (개발 중 2인용 앱이므로 in-place 마이그레이션 부담 X)
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
}
