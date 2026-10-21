import type { LlmClient, LlmUsage } from "@/lib/ai";
import {
  LIMITS,
  StoryboardSchema,
  targetPanelsFor,
  type CharacterSheet,
  type Storyboard,
} from "./schema";

export class EpisodeTextError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EpisodeTextError";
  }
}

/** 스키마 검증 실패 시 다시 시도하는 횟수 (docs/pipeline-spec.md: 재시도 1회) */
export const STORYBOARD_MAX_ATTEMPTS = 2;

export type StoryboardResult = {
  storyboard: Storyboard;
  /** 호출마다의 사용량. 재시도한 호출도 비용이 나가므로 모두 남긴다. */
  usage: LlmUsage[];
};

export class StoryboardFormatError extends Error {
  constructor(
    message: string,
    readonly usage: LlmUsage[],
  ) {
    super(message);
    this.name = "StoryboardFormatError";
  }
}

/** 업로드된 한 화 분량 텍스트를 검사하고 정리한다. */
export function normalizeEpisodeText(raw: string): string {
  const text = raw.replace(/\r\n/g, "\n").trim();
  if (text.length === 0) {
    throw new EpisodeTextError("텍스트가 비어 있어요.");
  }
  if (text.length > LIMITS.maxEpisodeChars) {
    throw new EpisodeTextError(
      `한 화는 최대 ${LIMITS.maxEpisodeChars.toLocaleString()}자까지 올릴 수 있어요. (현재 ${text.length.toLocaleString()}자)`,
    );
  }
  return text;
}

/** 텍스트 → 콘티. LLM 응답은 스키마로 검증하고, 형식이 틀리면 1회 재시도 후 실패시킨다. */
export async function createStoryboard(
  rawText: string,
  deps: { llm: LlmClient; knownCharacters?: CharacterSheet[] },
): Promise<StoryboardResult> {
  const text = normalizeEpisodeText(rawText);
  const knownCharacters = (deps.knownCharacters ?? []).map(({ name, appearance }) => ({
    name,
    appearance,
  }));

  const usage: LlmUsage[] = [];
  let lastError = "";

  for (let attempt = 1; attempt <= STORYBOARD_MAX_ATTEMPTS; attempt++) {
    const result = await deps.llm.createStoryboard({
      text,
      targetPanels: targetPanelsFor(text.length),
      maxPanels: LIMITS.maxPanels,
      knownCharacters,
    });
    usage.push(result.usage);

    const parsed = StoryboardSchema.safeParse(result.data);
    if (parsed.success) {
      // 컷 번호를 0부터 연속되게 다시 매긴다.
      const panels = parsed.data.panels.map((panel, index) => ({ ...panel, index }));
      return { storyboard: { ...parsed.data, panels }, usage };
    }
    lastError = parsed.error.message;
  }

  throw new StoryboardFormatError(
    `콘티 형식이 올바르지 않습니다 (${STORYBOARD_MAX_ATTEMPTS}회 시도): ${lastError}`,
    usage,
  );
}
