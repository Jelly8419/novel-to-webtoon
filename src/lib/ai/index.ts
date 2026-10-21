import { mockImage, mockLlm } from "./mock";
import { createOpenAiLlm, DEFAULT_LLM_MODEL } from "./openai";
import type { AiClients } from "./types";

export type AiMode = "mock" | "live";

/** AI_MODE 환경 변수를 읽는다. 값이 없거나 이상하면 항상 mock(비용 0원)으로 동작한다. */
export function getAiMode(env: Record<string, string | undefined> = process.env): AiMode {
  return env.AI_MODE === "live" ? "live" : "mock";
}

/**
 * AI 클라이언트를 돌려준다. 파이프라인은 반드시 이 함수로만 AI에 접근한다.
 * - mock: LLM·이미지 모두 가짜 응답 (비용 0원)
 * - live: LLM은 OpenAI. 이미지는 이미지 API 작업 전까지 mock.
 */
export function getAiClients(env: Record<string, string | undefined> = process.env): AiClients {
  const mode = getAiMode(env);
  if (mode === "mock") {
    return { mode, llm: mockLlm, image: mockImage };
  }

  if (!env.LLM_API_KEY) {
    throw new Error("AI_MODE=live 에는 LLM_API_KEY 가 필요합니다 (.env.local 확인)");
  }

  return {
    mode,
    llm: createOpenAiLlm({ apiKey: env.LLM_API_KEY, model: env.LLM_MODEL || DEFAULT_LLM_MODEL }),
    // TODO(이미지 API 연결 작업): FLUX 이미지 클라이언트로 교체
    image: mockImage,
  };
}

export type * from "./types";
