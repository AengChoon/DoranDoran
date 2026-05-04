import { useQuery } from "@tanstack/react-query";
import { useLiveQuery } from "dexie-react-hooks";
import type { MeResponse, UserPublic } from "@dorandoran/shared";
import { apiFetch } from "./client";
import { getLocalDb } from "@/lib/local/db";

/**
 * /auth/me 응답에 사용자 id가 들어있어야 "본인이 누구인지" 알 수 있음.
 * 로컬 DB만으론 "current user"를 결정할 수 없으니 한 번 fetch는 필요.
 *
 * 흐름:
 *  1. /auth/me로 본인 user id 받아옴 (TanStack Query에 캐싱)
 *  2. partner는 로컬 users 테이블에서 본인 외의 첫 사용자 (sync 후 채워짐)
 */

export const meKey = ["me"] as const;

export function useMe() {
  // 본인 정보 — 항상 서버에서 (id 결정 권한)
  const meQuery = useQuery({
    queryKey: meKey,
    queryFn: () => apiFetch<MeResponse>("/auth/me"),
    staleTime: 1000 * 60 * 5,
  });

  // 파트너 — 로컬 users에서 본인 외 첫 사용자
  const partner = useLiveQuery(
    async () => {
      const myId = meQuery.data?.user.id;
      if (!myId) return null;
      const all = await getLocalDb().users.toArray();
      const others = all.filter((u) => u.id !== myId && u.deletedAt === null);
      return others[0] ?? meQuery.data?.partner ?? null;
    },
    [meQuery.data?.user.id, meQuery.data?.partner?.id],
  );

  return {
    ...meQuery,
    user: meQuery.data?.user as UserPublic | undefined,
    partner: (partner ?? meQuery.data?.partner) as UserPublic | null | undefined,
  };
}
