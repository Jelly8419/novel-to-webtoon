import type { LlmClient } from "@/lib/ai";
import { LIMITS, StoryboardSchema, type CharacterSheet, type Storyboard } from "./schema";

export class EpisodeTextError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EpisodeTextError";
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

/** 텍스트 → 콘티. LLM 응답은 스키마로 검증해서 형식이 틀리면 바로 실패시킨다. */
export async function createStoryboard(
  rawText: string,
  deps: { llm: LlmClient; knownCharacters?: CharacterSheet[] },
): Promise<Storyboard> {
  const text = normalizeEpisodeText(rawText);
  const knownCharacters = (deps.knownCharacters ?? []).map(({ name, appearance }) => ({
    name,
    appearance,
  }));

  const raw = await deps.llm.createStoryboard({
    text,
    targetPanels: LIMITS.targetPanels,
    knownCharacters,
  });

  const parsed = StoryboardSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`콘티 형식이 올바르지 않습니다: ${parsed.error.message}`);
  }

  // 컷 번호를 0부터 연속되게 다시 매긴다.
  const panels = parsed.data.panels.map((panel, index) => ({ ...panel, index }));
  return { ...parsed.data, panels };
}
