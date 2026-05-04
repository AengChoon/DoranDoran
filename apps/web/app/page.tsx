import { redirect } from "next/navigation";
import { hasSessionCookie } from "@/lib/session";

export default async function HomePage() {
  if (await hasSessionCookie()) {
    redirect("/feed");
  }
  redirect("/login");
}
