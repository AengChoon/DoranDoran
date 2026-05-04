import { nanoid } from "nanoid";
import { createDb } from "./client";
import { initSchema } from "./init";
import { users } from "./schema";

const owners = (process.env.OWNER_EMAILS ?? "").split(",").map((s) => s.trim()).filter(Boolean);

if (owners.length !== 2) {
  console.error("OWNER_EMAILS 환경변수에 두 개의 이메일을 콤마로 구분해 입력해주세요.");
  console.error("예: OWNER_EMAILS=me@example.com,partner@example.com");
  process.exit(1);
}

const { db, sqlite } = createDb();
initSchema(sqlite);

const [meEmail, partnerEmail] = owners as [string, string];

db.insert(users)
  .values([
    {
      id: nanoid(),
      email: meEmail,
      displayName: "나",
      nativeLang: "ko",
      learningLang: "ja",
    },
    {
      id: nanoid(),
      email: partnerEmail,
      displayName: "파트너",
      nativeLang: "ja",
      learningLang: "ko",
    },
  ])
  .onConflictDoNothing()
  .run();

console.log(`✓ seeded ${owners.length} users`);
