import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "H3 Agent 개인정보처리방침",
  robots: { index: false, follow: false },
};

/**
 * H3 Agent(사내 업무 자동화 도구)의 Google OAuth 동의 화면 게시용 개인정보처리방침.
 * h3tech의 고객 대상 서비스와는 무관한 내부 도구 전용 문서 — /[locale]/privacy(회사
 * 공식 개인정보처리방침)와 별개로 관리한다. 사이트 내비게이션에는 노출하지 않는다.
 */
export default function H3AgentPrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-20 text-neutral-800">
      <h1 className="text-2xl font-semibold">H3 Agent 개인정보처리방침</h1>
      <p className="mt-2 text-sm text-neutral-500">
        (주)에이치쓰리테크 — 사내 업무 자동화 도구 &ldquo;H3 Agent&rdquo; 전용
      </p>

      <div className="mt-10 space-y-8 text-[15px] leading-7">
        <p>
          H3 Agent는 (주)에이치쓰리테크 내부 업무 자동화를 위한 도구로, 다음과 같이
          Google 계정 데이터를 사용합니다.
        </p>

        <section>
          <h2 className="font-semibold">접근 범위</h2>
          <p className="mt-2">
            Gmail 읽기 전용 권한(<code>gmail.readonly</code>)만 사용하며, 계정 정보
            수정이나 메일 발송 권한은 요청하지 않습니다.
          </p>
        </section>

        <section>
          <h2 className="font-semibold">사용 목적</h2>
          <p className="mt-2">
            회사 대표 메일함에서 매입세금계산서 등 세무 관련 알림 메일을 찾아 그
            내용(발신자, 제목, 본문, 첨부파일 텍스트)을 읽어 사내 회계 시스템에
            자동으로 반영하기 위한 용도로만 사용합니다.
          </p>
        </section>

        <section>
          <h2 className="font-semibold">보관</h2>
          <p className="mt-2">
            읽은 메일 원문은 장기 저장하지 않으며, 처리에 필요한 최소한의
            정보(메일 ID, 처리 상태)만 내부 시스템에 남깁니다.
          </p>
        </section>

        <section>
          <h2 className="font-semibold">제3자 제공</h2>
          <p className="mt-2">수집한 정보를 외부 제3자와 공유하거나 판매하지 않습니다.</p>
        </section>

        <section>
          <h2 className="font-semibold">접근 주체</h2>
          <p className="mt-2">(주)에이치쓰리테크 임직원 외 접근 권한이 없습니다.</p>
        </section>

        <section>
          <h2 className="font-semibold">문의</h2>
          <p className="mt-2">h3tech.ceo@gmail.com</p>
        </section>
      </div>
    </main>
  );
}
