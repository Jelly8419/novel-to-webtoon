import { describe, expect, it, vi } from "vitest";
import { STORYBOARD_SYSTEM_PROMPT } from "@/pipeline/prompts/storyboard";
import { CharacterSchema, DialogueSchema, PanelSchema, StoryboardSchema } from "@/pipeline/schema";
import {
  createOpenAiLlm,
  DEFAULT_LLM_MODEL,
  normalizeStoryboardJson,
  STORYBOARD_JSON_SCHEMA,
  STORYBOARD_MAX_OUTPUT_TOKENS,
  type ResponsesApi,
} from "./openai";
import { estimateLlmCostUsd } from "./pricing";

const request = {
  text: "비가 내렸다. “가자.”",
  targetPanels: 20,
  maxPanels: 24,
  knownCharacters: [{ name: "김첨지", appearance: "마른 중년 남성" }],
};

const board = {
  characters: [{ name: "김첨지", appearance: "마른 중년 남성" }],
  panels: [
    {
      index: 0,
      sceneIndex: 0,
      shot: "wide",
      description: "비 오는 거리",
      characters: ["김첨지"],
      dialogues: [{ speaker: "김첨지", text: "가자." }],
      narration: null,
    },
  ],
};

function fakeResponses(outputText: string, model = "gpt-6-luna-2026-09-22") {
  const create = vi.fn<ResponsesApi["create"]>(async () => ({
    model,
    output_text: outputText,
    usage: { input_tokens: 4000, output_tokens: 4000 },
  }));
  return { create };
}

describe("createOpenAiLlm", () => {
  it("strict JSON 스키마와 프롬프트로 요청한다", async () => {
    const responses = fakeResponses(JSON.stringify(board));
    await createOpenAiLlm({ responses }).createStoryboard(request);

    const params = responses.create.mock.calls[0][0];
    expect(params.model).toBe(DEFAULT_LLM_MODEL);
    expect(params.instructions).toBe(STORYBOARD_SYSTEM_PROMPT);
    expect(params.input).toContain("목표 컷 수: 20컷 내외 (최대 24컷)");
    expect(params.input).toContain("- 김첨지: 마른 중년 남성");
    expect(params.input).toContain(request.text);
    expect(params.text.format).toMatchObject({ type: "json_schema", strict: true });
  });

  it("환경 변수로 받은 모델 이름을 쓴다", async () => {
    const responses = fakeResponses(JSON.stringify(board));
    await createOpenAiLlm({ responses, model: "gpt-6.1-sol" }).createStoryboard(request);
    expect(responses.create.mock.calls[0][0].model).toBe("gpt-6.1-sol");
  });

  it("응답을 파이프라인 스키마에 맞게 바꾸고 사용량·비용을 돌려준다", async () => {
    const responses = fakeResponses(JSON.stringify(board));
    const result = await createOpenAiLlm({ responses }).createStoryboard(request);

    expect(StoryboardSchema.safeParse(result.data).success).toBe(true);
    expect(result.usage).toEqual({
      model: "gpt-6-luna-2026-09-22",
      inputTokens: 4000,
      outputTokens: 4000,
      costUsd: (4000 * 0.1 + 4000 * 0.5) / 1_000_000,
    });
  });

  it("출력 토큰 상한을 건다", async () => {
    const responses = fakeResponses(JSON.stringify(board));
    await createOpenAiLlm({ responses }).createStoryboard(request);
    expect(responses.create.mock.calls[0][0].max_output_tokens).toBe(STORYBOARD_MAX_OUTPUT_TOKENS);
  });

  it("상한에 걸려 잘린 응답이나 빈 응답(거절)은 data 를 null 로 넘기고 사용량은 남긴다", async () => {
    const cut = vi.fn<ResponsesApi["create"]>(async () => ({
      status: "incomplete",
      output_text: JSON.stringify(board),
      usage: { input_tokens: 10, output_tokens: 20 },
    }));
    const truncated = await createOpenAiLlm({ responses: { create: cut } }).createStoryboard(
      request,
    );
    expect(truncated.data).toBeNull();
    expect(truncated.usage.outputTokens).toBe(20);

    const empty = await createOpenAiLlm({ responses: fakeResponses("  ") }).createStoryboard(
      request,
    );
    expect(empty.data).toBeNull();
  });

  it("JSON이 깨져 있으면 data 를 null 로 넘긴다 (재시도는 파이프라인 몫)", async () => {
    const responses = fakeResponses("{ 깨진 json");
    const result = await createOpenAiLlm({ responses }).createStoryboard(request);
    expect(result.data).toBeNull();
    expect(result.usage.inputTokens).toBe(4000);
  });
});

describe("normalizeStoryboardJson", () => {
  it("narration: null 만 지우고 나머지는 그대로 둔다", () => {
    const out = normalizeStoryboardJson({
      ...board,
      panels: [...board.panels, { ...board.panels[0], narration: "비가 왔다." }],
    }) as { panels: Record<string, unknown>[] };
    expect("narration" in out.panels[0]).toBe(false);
    expect(out.panels[1].narration).toBe("비가 왔다.");
  });

  it("형식이 이상한 값은 건드리지 않는다", () => {
    expect(normalizeStoryboardJson(null)).toBeNull();
    expect(normalizeStoryboardJson({ panels: "x" })).toEqual({ panels: "x" });
  });
});

describe("STORYBOARD_JSON_SCHEMA", () => {
  it("strict 모드 규칙대로 모든 속성이 required 다", () => {
    const panel = STORYBOARD_JSON_SCHEMA.properties.panels.items;
    expect([...panel.required].sort()).toEqual(Object.keys(panel.properties).sort());
  });

  it("필드 이름이 파이프라인 Zod 스키마와 같다", () => {
    const keys = (s: { properties: object }) => Object.keys(s.properties).sort();
    expect(keys(STORYBOARD_JSON_SCHEMA)).toEqual(Object.keys(StoryboardSchema.shape).sort());
    expect(keys(STORYBOARD_JSON_SCHEMA.properties.panels.items)).toEqual(
      Object.keys(PanelSchema.shape).sort(),
    );
    expect(keys(STORYBOARD_JSON_SCHEMA.properties.characters.items)).toEqual(
      Object.keys(CharacterSchema.shape).sort(),
    );
    expect(keys(STORYBOARD_JSON_SCHEMA.properties.panels.items.properties.dialogues.items)).toEqual(
      Object.keys(DialogueSchema.shape).sort(),
    );
  });
});

describe("estimateLlmCostUsd", () => {
  it("날짜가 붙은 스냅샷 이름도 계산한다", () => {
    expect(estimateLlmCostUsd("gpt-6-luna-2026-09-22", 1_000_000, 0)).toBeCloseTo(0.1);
  });

  it("가격표에 없는 모델은 null", () => {
    expect(estimateLlmCostUsd("unknown-model", 100, 100)).toBeNull();
  });
});
