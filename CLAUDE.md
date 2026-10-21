# novel-to-webtoon

소설 텍스트(.txt, .md)를 올리면 AI가 웹툰으로 그리고, 같은 작품의 다음 화도 같은 그림체와 캐릭터로 이어서 그리는 서비스. 1인 포트폴리오 프로젝트(기획 → 배포).

@AGENTS.md

## 먼저 읽을 문서

- `docs/overview.md` — 서비스 개요, MVP 범위, 화면 목록
- `docs/architecture.md` — 시스템 구조와 데이터 흐름
- `docs/pipeline-spec.md` — AI 파이프라인 단계, 콘티 JSON 스키마, 비용 규칙
- `docs/decisions/` — 확정된 결정(ADR). 결정과 다르게 구현해야 하면 멈추고 사용자에게 묻는다.

## 기술 스택

Next.js 16 (App Router, `src/`), React 19, TypeScript strict, Tailwind CSS 4, Zod, Vitest. 배포는 Vercel.
Next.js 16은 학습 데이터와 API가 다르다. 라우팅·데이터·캐시 관련 코드는 `node_modules/next/dist/docs/`를 먼저 확인한다.

## 명령어

- `npm run dev` — 개발 서버
- `npm run check` — 린트 + 타입체크 + 테스트 (작업 완료 전 반드시 통과)
- `npm run test` / `npm run test:watch` — Vitest
- `npm run format` — Prettier
- `npm run build` — 프로덕션 빌드

## 폴더 구조

- `src/app/` — 화면과 API 라우트
- `src/pipeline/` — 장면 분석, 콘티, 캐릭터 판별, 작화, 조판 (UI와 무관한 순수 로직)
- `src/lib/ai/` — LLM·이미지 API 클라이언트. `getAiClients()`로만 접근한다.
- 테스트는 대상 파일 옆에 `*.test.ts`

## 반드시 지킬 규칙

- **AI 비용**: 기본은 `AI_MODE=mock`(비용 0원). 실제 API(`AI_MODE=live`)는 사용자가 명시적으로 요청할 때만 쓴다. 테스트와 CI는 항상 mock.
- **비밀값**: `.env*` 파일을 읽거나 출력하지 않는다. API 키를 코드·문서·커밋에 넣지 않는다. 새 환경 변수는 `.env.example`에 키 이름만 추가한다.
- **AI 응답 검증**: LLM이 돌려준 JSON은 항상 `src/pipeline/schema.ts`의 Zod 스키마로 검증한 뒤 쓴다.
- **분량 제한**: 숫자를 하드코딩하지 말고 `LIMITS`(화당 2,000자, 20컷 목표, 최대 24컷)를 쓴다.
- **UI 문구**: 한국어, 존댓말 해요체. 저작권 관련 고지(권리 확인 체크, 기본 비공개)를 빼지 않는다.
- **작은 변경**: 요청과 무관한 리팩터링이나 파일 이동을 하지 않는다.

## 작업 방식

- 기능 작업은 `/feature`로 시작한다: 계획 → 승인 → 구현 → 테스트 → 리뷰(`reviewer` 에이전트) → 커밋·PR.
- 방향을 바꾸는 결정은 `/decision`, 해결한 문제는 `/troubleshoot`, 모델·프롬프트 실험은 `/experiment`로 기록한다.
- 브랜치: `feat/…`, `fix/…`, `exp/…`. 커밋: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:` 접두어, 한국어 본문.
- main에 직접 커밋하지 않는다. PR로만 병합한다.
- 진행 관리와 기록은 노션 "소설→웹툰 변환 서비스 프로젝트" 페이지(작업 일정, 의사결정 로그, 실험 기록, 트러블슈팅)에 한다.
