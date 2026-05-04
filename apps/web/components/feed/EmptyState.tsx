import Link from "next/link";
import { Mascot } from "@/components/Mascot";
import { buttonVariants } from "@/components/ui/Button";

/**
 * 카드가 0개일 때 표시되는 빈 상태.
 * "첫 카드 쓰기" 버튼은 /new로 이동.
 */
export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
      <Mascot variant="pair-thinking" size="xl" />

      <h2 className="mt-6 text-2xl text-duo-text" style={{ fontWeight: 800 }}>
        아직 도란도란할 말이 없어요
      </h2>
      <p className="mt-2 text-base text-duo-text-muted">
        오늘 배운 말 한 가지를 적어보세요
      </p>

      <Link
        href="/new"
        className={buttonVariants({ variant: "primary", size: "lg" }) + " mt-6"}
      >
        첫 카드 쓰기
      </Link>
    </div>
  );
}
