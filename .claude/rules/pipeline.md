---
paths:
  - "src/pipeline/**/*.ts"
  - "src/lib/ai/**/*.ts"
---

# AI 파이프라인 규칙

- 단계 순서: 장면 분석 → 콘티(JSON) → 캐릭터 확인(새 인물 컨펌) → 컷 작화 → 말풍선 조판. 상세는 `docs/pipeline-spec.md`.
- AI 호출은 `getAiClients()` 로만 한다. 파이프라인 함수는 클라이언트를 인자로 받아서 mock 으로 테스트할 수 있게 만든다.
- LLM 응답은 `src/pipeline/schema.ts` 스키마로 검증한다. 스키마를 바꾸면 `docs/pipeline-spec.md` 도 같이 고친다.
- 분량·컷 수는 `LIMITS` 상수만 쓴다.
- 새 인물이 있으면 작화로 넘어가지 않는다(`findNewCharacters`). 컨펌된 캐릭터 시트의 이미지를 컷 작화 레퍼런스로 넘긴다.
- 대사·효과음 글자는 이미지 모델에 그리게 하지 않는다. 조판 단계에서 서버가 합성한다.
- 모든 이미지 호출은 `costUsd` 를 기록한다. 실험 결과와 회고의 비용 근거가 된다.
- 실제 API(`AI_MODE=live`) 테스트는 사용자가 허락한 경우에만, 최소 컷 수로 한다.
