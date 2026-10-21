import { mockImage, mockLlm } from "./mock";
import type { AiClients } from "./types";

export type AiMode = "mock" | "live";

/** AI_MODE 환경 변수를 읽는다. 값이 없거나 이상하면 항상 mock(비용 0원)으로 동작한다. */
export function getAiMode(env: Record<string, string | undefined> = process.env): AiMode {
  return env.AI_MODE === "live" ? "live" : "mock";
}

export function getAiClients(env: Record<string, string | undefined> = process.env): AiClients {
  const mode = getAiMode(env);
  if (mode === "mock") {
    return { mode, llm: mockLlm, image: mockImage };
  }

  const missing = ["LLM_API_KEY", "IMAGE_API_KEY"].filter((key) => !env[key]);
  if (missing.length > 0) {
    throw new Error(`AI_MODE=live 에는 ${missing.join(", ")} 가 필요합니다 (.env.local 확인)`);
  }

  // TODO(파이프라인 검증 2주차): 실제 LLM·이미지 API 클라이언트 구현 후 여기서 반환
  throw new Error("live AI 클라이언트는 아직 구현되지 않았습니다. 지금은 AI_MODE=mock 을 쓰세요.");
}

export type * from "./types";
