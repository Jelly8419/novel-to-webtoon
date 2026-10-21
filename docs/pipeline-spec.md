# AI 파이프라인 스펙

코드 기준: `src/pipeline/schema.ts`. 스키마를 바꾸면 이 문서도 같이 고친다.

## 단계

| 단계                | 입력                                  | 출력                                    | 담당                        |
| ------------------- | ------------------------------------- | --------------------------------------- | --------------------------- |
| 1. 입력 정리        | 업로드 텍스트                         | 정리된 텍스트 (≤ 2,000자)               | `normalizeEpisodeText`      |
| 2. 장면 분석 + 콘티 | 텍스트, 기존 캐릭터                   | Storyboard JSON                         | `createStoryboard` (OpenAI) |
| 3. 캐릭터 확인      | Storyboard, 저장된 시트               | 새 인물 목록                            | `findNewCharacters`         |
| 4. 캐릭터 시안      | 새 인물 외모 묘사, 그림체             | 시안 이미지 → 사용자 승인 → 캐릭터 시트 | 이미지 API (예정)           |
| 5. 컷 작화          | 컷 묘사, 등장인물 시트 이미지, 그림체 | 컷 이미지                               | 이미지 API (예정)           |
| 6. 조판             | 컷 이미지, 대사·내레이션              | 말풍선이 들어간 컷                      | 서버 합성 (예정)            |

## 분량 기준 (`LIMITS`)

- 화당 텍스트 최대 2,000자
- 목표 컷 수는 길이 비례: 약 100자당 1컷, 최소 4컷, 최대 20컷 (`targetPanelsFor`). 2,000자면 20컷.
- 콘티 결과는 최대 24컷까지 허용

## 2단계: 콘티 생성 (OpenAI)

- 클라이언트: `src/lib/ai/openai.ts`, 프롬프트: `src/pipeline/prompts/storyboard.ts`
- Responses API + Structured Outputs(strict JSON 스키마 `STORYBOARD_JSON_SCHEMA`). strict 모드라 `narration` 은 "없으면 null" 로 받고 클라이언트에서 지운다.
- 모델: 환경 변수 `LLM_MODEL` (기본 `gpt-6-luna`). 바꿀 때는 `/experiment` 로 비교한다.
- 출력 토큰 상한 `STORYBOARD_MAX_OUTPUT_TOKENS` (4,000 + 컷당 500). 잘린 응답·빈 응답은 형식 오류로 보고 재시도한다.
- SDK 자체 재시도 1회, 타임아웃 120초.
- 시험: `npm run try:storyboard -- samples/rainy-umbrella.txt [--live]` → `experiments/<날짜>-storyboard/` 에 결과 저장

## Storyboard JSON

```json
{
  "characters": [{ "name": "김첨지", "appearance": "마른 체격의 중년 인력거꾼, 낡은 두루마기" }],
  "panels": [
    {
      "index": 0,
      "sceneIndex": 0,
      "shot": "wide",
      "description": "비 내리는 전차 정류장 앞, 인력거 옆에 선 김첨지",
      "characters": ["김첨지"],
      "dialogues": [{ "speaker": "김첨지", "text": "오늘은 운수가 좋구먼." }],
      "narration": "비가 추적추적 내리는 오후였다."
    }
  ]
}
```

- `shot`: `wide` | `medium` | `closeup`
- LLM 응답은 반드시 `StoryboardSchema` 로 검증한다. 실패하면 재시도 1회 후 작업 실패 처리.
- 대사·내레이션 글자는 이미지에 그리지 않고 6단계에서 합성한다.

## 비용 규칙

- 기본 `AI_MODE=mock`. 테스트와 CI는 항상 mock.
- 콘티: gpt-6-luna 기준 1회 약 3원 (입력·출력 각 약 4천 토큰). 가격표 `src/lib/ai/pricing.ts`.
- 작화: 개발 검증은 FLUX.1 schnell (20컷 1화 약 60원), 최종 작화 모델은 실험 후 결정.
- 모든 LLM·이미지 호출은 사용량과 `costUsd` 를 기록한다. 재시도·실패한 호출도 포함.
- API 콘솔에 월 지출 상한을 설정한다.
