import { describe, expect, it } from "vitest";
import { getAiClients, getAiMode, type LlmClient } from "@/lib/ai";
import { LIMITS } from "./schema";
import { createStoryboard, EpisodeTextError, normalizeEpisodeText } from "./storyboard";

const sample = [
  "비가 추적추적 내리는 오후였다.",
  "김첨지는 정류장 앞에서 손님을 기다렸다.",
  "“오늘은 운수가 좋구먼.” 그가 중얼거렸다.",
  "멀리서 학생 하나가 뛰어왔다.",
].join("\n");

describe("normalizeEpisodeText", () => {
  it("빈 텍스트를 거부한다", () => {
    expect(() => normalizeEpisodeText("   \n ")).toThrow(EpisodeTextError);
  });

  it("최대 글자 수를 넘으면 거부한다", () => {
    expect(() => normalizeEpisodeText("가".repeat(LIMITS.maxEpisodeChars + 1))).toThrow(
      /최대 2,000자/,
    );
  });

  it("줄바꿈을 정리하고 앞뒤 공백을 지운다", () => {
    expect(normalizeEpisodeText("  첫 줄\r\n둘째 줄  ")).toBe("첫 줄\n둘째 줄");
  });
});

describe("createStoryboard (mock)", () => {
  const { llm } = getAiClients({ AI_MODE: "mock" });

  it("콘티를 만들고 컷 번호를 0부터 매긴다", async () => {
    const board = await createStoryboard(sample, { llm });
    expect(board.panels.length).toBeGreaterThan(0);
    expect(board.panels.length).toBeLessThanOrEqual(LIMITS.maxPanels);
    expect(board.panels.map((p) => p.index)).toEqual(board.panels.map((_, i) => i));
  });

  it("따옴표 안 문장을 대사로 뽑는다", async () => {
    const board = await createStoryboard(sample, { llm });
    const lines = board.panels.flatMap((p) => p.dialogues.map((d) => d.text));
    expect(lines).toContain("오늘은 운수가 좋구먼.");
  });

  it("LLM이 형식에 맞지 않는 응답을 주면 실패한다", async () => {
    const broken: LlmClient = { createStoryboard: async () => ({ panels: "oops" }) };
    await expect(createStoryboard(sample, { llm: broken })).rejects.toThrow(/콘티 형식/);
  });
});

describe("getAiMode", () => {
  it("값이 없으면 mock 으로 동작한다", () => {
    expect(getAiMode({})).toBe("mock");
    expect(getAiMode({ AI_MODE: "Live" })).toBe("mock");
  });

  it("live 인데 키가 없으면 에러를 낸다", () => {
    expect(() => getAiClients({ AI_MODE: "live" })).toThrow(/LLM_API_KEY/);
  });
});
