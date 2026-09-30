# 회사 소개와 AX 콘텐츠

2026-09-30 회사 소개 개편. 현재 공급하는 부품·장비와 개발 중인 AX를 구분한다.

## 콘텐츠 원칙

- 회사 소개, 현재 사업, 제작 사진, 수행 범위, AX 개발 방향, FAQ, 상담 순서로 안내한다.
- 한영 문구와 metadata는 messages/ko.json 및 messages/en.json에서 함께 관리한다.
- 기존 공개 이미지 feature-fabrication.jpg와 feature-site.jpg를 사용한다. 신규 고객 실적이나 성능 수치를 만들지 않는다.
- 근거를 확인하지 못한 20% 단축, 협력사/거래처 수 및 인증 로드맵은 이번 소개에서 제외했다. 원본 증빙과 기준일 검토 후 복원할 수 있다.
- AX는 상용 공급 및 성능이 검증된 서비스가 아니라 개발 방향으로 명시한다. Organization 설명도 같은 한영 metadata를 사용한다.
- FAQ는 고객을 위한 HTML 문답이다. FAQ 리치 결과/PAA 노출 보장이나 별도 FAQ schema를 추가하지 않는다.
- 사용자 노출 문구에 엠대시 또는 독립 한글 모음 'ㅡ'를 문장 구분자로 사용하지 않는다. 문장을 나누거나 쉼표·콜론을 쓰고 검색 제목은 |로 구분한다.
- 운영 DB의 블로그 본문, 외부 원문, 기존 고객 자료는 일괄 변경하지 않는다. 저장된 글의 교정은 별도 검토한다.

## 검증 명령

- pnpm run check:i18n
- pnpm exec tsc --noEmit --incremental false
- pnpm run lint
- pnpm run test:unit
- 실행 중인 로컬 서버 대상으로 pnpm exec playwright test --config playwright.about.config.ts
- 다른 포트는 ABOUT_TEST_URL로 지정한다. 이 테스트는 폼 제출 없이 공개 페이지를 조회한다.

별도 제조 AX/화학공정 AX 상세 페이지, PAA 실수집, 검색 순위/유입 측정, 발행 및 배포는 이번 변경에 포함하지 않는다.
