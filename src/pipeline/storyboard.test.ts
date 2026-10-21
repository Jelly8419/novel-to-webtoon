import { describe, expect, it, vi } from "vitest";
import { getAiClients, getAiMode, type LlmClient, type LlmResult } from "@/lib/ai";
import { LIMITS, targetPanelsFor } from "./schema";
import {
  createStoryboard,
  EpisodeTextError,
  normalizeEpisodeText,
  StoryboardError,
  StoryboardFormatError,
} from "./storyboard";

const sample = [
  "비가 추적추적 내리는 오후였다.",
  "김첨지는 정류장 앞에서 손님을 기다렸다.",
  "“오늘은 운수가 좋구먼.” 그가 중얼거렸다.",
  "멀리서 학생 하나가 뛰어왔다.",
].join("\n");

const usage = { model: "fake", inputTokens: 100, outputTokens: 200, costUsd: 0.001 };

const validBoard = {
  characters: [{ name: "김첨지", appearance: "마른 중년 남성" }],
  panels: [
    {
      index: 5,
      sceneIndex: 0,
      shot: "wide",
      description: "비 오는 정류장",
      characters: ["김첨지"],
      dialogues: [],
    },
  ],
};

function fakeLlm(...responses: unknown[]): LlmClient & { calls: number } {
  const llm = {
    calls: 0,
    createStoryboard: vi.fn(async (): Promise<LlmResult> => {
      const data = responses[Math.min(llm.calls, responses.length - 1)];
      llm.calls++;
      return { data, usage };
    }),
  };
  return llm;
}

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
    const { storyboard } = await createStoryboard(sample, { llm });
    expect(storyboard.panels.length).toBeGreaterThan(0);
    expect(storyboard.panels.length).toBeLessThanOrEqual(LIMITS.maxPanels);
    expect(storyboard.panels.map((p) => p.index)).toEqual(storyboard.panels.map((_, i) => i));
  });

  it("따옴표 안 문장을 대사로 뽑는다", async () => {
    const { storyboard } = await createStoryboard(sample, { llm });
    const lines = storyboard.panels.flatMap((p) => p.dialogues.map((d) => d.text));
    expect(lines).toContain("오늘은 운수가 좋구먼.");
  });

  it("mock 은 비용이 0이다", async () => {
    const result = await createStoryboard(sample, { llm });
    expect(result.usage.every((u) => u.costUsd === 0)).toBe(true);
  });
});

describe("createStoryboard 재시도", () => {
  it("목표 컷 수는 길이 비례로 정하되 최소·최대를 지킨다", () => {
    expect(targetPanelsFor(50)).toBe(LIMITS.minPanels);
    expect(targetPanelsFor(1300)).toBe(13);
    expect(targetPanelsFor(LIMITS.maxEpisodeChars)).toBe(LIMITS.targetPanels);
  });

  it("LLM에 분량 기준과 기존 인물을 넘긴다", async () => {
    const llm = fakeLlm(validBoard);
    await createStoryboard(sample, {
      llm,
      knownCharacters: [
        { id: "c1", name: "김첨지", appearance: "마른 중년 남성", referenceImageUrl: "x" },
      ],
    });
    expect(llm.createStoryboard).toHaveBeenCalledWith(
      expect.objectContaining({
        targetPanels: targetPanelsFor(normalizeEpisodeText(sample).length),
        maxPanels: LIMITS.maxPanels,
        knownCharacters: [{ name: "김첨지", appearance: "마른 중년 남성" }],
      }),
    );
  });

  it("첫 응답 형식이 틀리면 한 번 더 시도하고, 두 번의 사용량을 모두 남긴다", async () => {
    const llm = fakeLlm({ panels: "oops" }, validBoard);
    const result = await createStoryboard(sample, { llm });
    expect(llm.calls).toBe(2);
    expect(result.usage).toHaveLength(2);
    expect(result.storyboard.panels[0].index).toBe(0);
  });

  it("두 번 모두 틀리면 사용량을 담아 실패한다", async () => {
    const llm = fakeLlm(null);
    const error = await createStoryboard(sample, { llm }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(StoryboardFormatError);
    expect((error as StoryboardFormatError).usage).toHaveLength(2);
    expect(llm.calls).toBe(2);
  });

  it("두 번째 호출에서 API가 실패해도 첫 호출의 사용량을 잃지 않는다", async () => {
    let calls = 0;
    const llm: LlmClient = {
      createStoryboard: async () => {
        calls++;
        if (calls === 1) return { data: null, usage };
        throw new Error("429 Too Many Requests");
      },
    };
    const error = await createStoryboard(sample, { llm }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(StoryboardError);
    expect(error).not.toBeInstanceOf(StoryboardFormatError);
    expect((error as StoryboardError).message).toContain("429");
    expect((error as StoryboardError).usage).toEqual([usage]);
  });

  it("최대 컷 수를 넘는 콘티는 형식 오류로 본다", async () => {
    const tooMany = {
      ...validBoard,
      panels: Array.from({ length: LIMITS.maxPanels + 1 }, () => validBoard.panels[0]),
    };
    await expect(createStoryboard(sample, { llm: fakeLlm(tooMany) })).rejects.toThrow(
      StoryboardFormatError,
    );
  });
});

describe("getAiMode / getAiClients", () => {
  it("값이 없으면 mock 으로 동작한다", () => {
    expect(getAiMode({})).toBe("mock");
    expect(getAiMode({ AI_MODE: "Live" })).toBe("mock");
  });

  it("live 인데 키가 없으면 에러를 낸다", () => {
    expect(() => getAiClients({ AI_MODE: "live" })).toThrow(/LLM_API_KEY/);
  });

  it("live 에서 LLM 키만 있어도 동작하고, 이미지는 아직 mock 이다", async () => {
    const clients = getAiClients({ AI_MODE: "live", LLM_API_KEY: "test-key" });
    expect(clients.mode).toBe("live");
    const image = await clients.image.generate({ prompt: "test" });
    expect(image.costUsd).toBe(0);
  });
});
