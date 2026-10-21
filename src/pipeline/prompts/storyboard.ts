import type { StoryboardRequest } from "@/lib/ai/types";

/** 콘티 생성 시스템 프롬프트. 바꿀 때는 /experiment 로 이전 버전과 비교한다. */
export const STORYBOARD_SYSTEM_PROMPT = `너는 한국 웹툰 콘티 작가다. 소설 원문 한 화를 세로 스크롤 웹툰 콘티로 바꾼다.

규칙:
1. 원문의 사건을 빠짐없이 순서대로 담는다. 원문에 없는 사건이나 설정을 만들지 않는다.
2. 장면(장소·시간이 바뀌는 단위)으로 나누고, 각 컷에 sceneIndex(0부터)를 붙인다.
3. 중요한 장면(갈등, 감정 변화, 반전)에 컷을 더 배정한다.
4. shot은 wide(배경·상황 소개), medium(행동·대화), closeup(감정·디테일) 중 하나다. 같은 shot을 3컷 연속 쓰지 않는다.
5. description은 그 컷 한 장을 그릴 수 있게 구체적으로 쓴다: 장소, 인물의 자세·표정, 구도. 글자나 말풍선은 넣지 않는다.
6. dialogues는 원문 대사를 그대로 옮긴다. 대사를 지어내지 않는다. 화자를 알 수 없으면 가장 가능성 높은 인물로 하고, 그래도 모르면 "알 수 없음"으로 쓴다.
7. 대사가 아닌 서술 중 꼭 필요한 문장만 narration으로 짧게 넣는다. 없으면 null.
8. characters에는 이 화에 등장하는 모든 인물을 넣는다. appearance는 원문에 근거한 외모만 쓰고, 원문에 없으면 성별·나이대 정도만 추정해 "(추정)"을 붙인다.
9. 각 컷의 characters에는 그 컷에 그려지는 인물 이름만 넣는다. 이름은 characters 목록과 정확히 같게 쓴다.
10. 모든 텍스트는 한국어로 쓴다.`;

/** 사용자 메시지: 분량 기준, 기존 인물, 원문 */
export function buildStoryboardUserPrompt({
  text,
  targetPanels,
  maxPanels,
  knownCharacters,
}: StoryboardRequest): string {
  const known =
    knownCharacters.length === 0
      ? "없음 (첫 화)"
      : knownCharacters.map((c) => `- ${c.name}: ${c.appearance}`).join("\n");

  return [
    `목표 컷 수: ${targetPanels}컷 내외 (최대 ${maxPanels}컷)`,
    "",
    "이미 확정된 등장인물 (같은 인물이면 반드시 이 이름과 외모를 그대로 쓸 것):",
    known,
    "",
    "원문:",
    "<<<",
    text,
    ">>>",
  ].join("\n");
}
