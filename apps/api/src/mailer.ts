import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import { env } from "./env";

const ses = new SESv2Client({ region: env.AWS_REGION });

export async function sendMagicLinkEmail(to: string, link: string): Promise<void> {
  const subject = "도란도란 로그인 링크";

  const text = [
    "안녕하세요,",
    "",
    "아래 링크를 눌러 도란도란에 로그인하세요.",
    link,
    "",
    "링크는 15분 동안만 유효해요.",
    "본인이 요청하지 않았다면 이 메일은 무시해 주세요.",
    "",
    "— 도란도란",
  ].join("\n");

  const html = renderMagicLinkHtml(link);

  await ses.send(
    new SendEmailCommand({
      FromEmailAddress: env.MAIL_FROM,
      Destination: { ToAddresses: [to] },
      Content: {
        Simple: {
          Subject: { Data: subject, Charset: "UTF-8" },
          Body: {
            Text: { Data: text, Charset: "UTF-8" },
            Html: { Data: html, Charset: "UTF-8" },
          },
        },
      },
    }),
  );
}

function renderMagicLinkHtml(link: string): string {
  // 인라인 스타일 — 메일 클라이언트는 <style> 무시하거나 stripping 함
  return `<!doctype html>
<html lang="ko">
<head><meta charset="utf-8"><title>도란도란 로그인</title></head>
<body style="margin:0;padding:24px;background:#f7f7f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#4b4b4b;">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border:2px solid #e5e5e5;border-radius:20px;padding:32px;text-align:center;">
    <h1 style="margin:0 0 8px;color:#58cc02;font-size:32px;font-weight:900;letter-spacing:-0.02em;">도란도란</h1>
    <p style="margin:0 0 24px;color:#777;font-size:14px;font-weight:600;">둘이서 도란도란</p>
    <p style="margin:0 0 24px;font-size:16px;line-height:1.5;font-weight:600;">아래 버튼을 눌러 로그인하세요.</p>
    <a href="${link}" style="display:inline-block;background:#58cc02;color:#ffffff;text-decoration:none;font-weight:900;font-size:16px;padding:14px 28px;border-radius:16px;box-shadow:0 4px 0 0 #58a700;">오늘도 도란도란 시작하기</a>
    <p style="margin:24px 0 0;color:#777;font-size:13px;font-weight:600;line-height:1.5;">링크는 15분 동안만 유효해요.<br>본인이 요청하지 않았다면 이 메일은 무시해 주세요.</p>
  </div>
</body>
</html>`;
}
