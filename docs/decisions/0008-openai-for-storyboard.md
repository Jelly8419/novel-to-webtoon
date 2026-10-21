# 0008. 콘티 생성 LLM은 OpenAI (기본 gpt-6-luna)

- 날짜: 2026-10-22
- 상태: 확정
- 분류: 기술

## 배경

장면 분석과 콘티(JSON) 생성에 쓸 LLM이 필요하다. 화당 호출은 1~2회이고, 응답이 정해진 JSON 형식을 지켜야 한다.

## 결정

OpenAI Responses API를 Structured Outputs(strict JSON 스키마)로 쓴다. 기본 모델은 저가형 `gpt-6-luna`이고 `LLM_MODEL` 환경 변수로 바꿀 수 있다.

## 이유

- 사용자가 OpenAI 키를 새로 발급해 쓰기로 함
- strict JSON 스키마로 형식 오류가 줄어 재시도 비용이 적다
- 2026-10 기준 gpt-6-luna 가격($0.10 / $0.50, 100만 토큰당)으로 콘티 1회 약 3원
- 모델을 환경 변수로 빼서, 품질이 부족하면 코드 수정 없이 상위 모델(gpt-6.1-sol, 1회 약 70원)과 비교할 수 있다

## 검토한 대안

- Claude, Gemini, DeepSeek: 품질·가격 모두 후보였으나 키가 없음. `LlmClient` 인터페이스 뒤에 있어 나중에 교체 가능
- 상위 모델을 기본값으로: 품질 평가 전에 비용을 20배 쓸 이유가 없음

## 영향

- `src/lib/ai/openai.ts`, `src/lib/ai/pricing.ts`, `.env.example` 의 `LLM_MODEL`
- 실제 호출 품질은 `npm run try:storyboard -- … --live` 결과를 `storyboard-judge` 로 평가해서 확인한다
- 가격은 제3자 정리 기준이라 공식 가격표로 확인 필요
