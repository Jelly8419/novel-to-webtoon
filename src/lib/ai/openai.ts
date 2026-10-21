import OpenAI from "openai";
import { buildStoryboardUserPrompt, STORYBOARD_SYSTEM_PROMPT } from "@/pipeline/prompts/storyboard";
import { estimateLlmCostUsd } from "./pricing";
import type { LlmClient, LlmResult, StoryboardRequest } from "./types";

export const DEFAULT_LLM_MODEL = "gpt-6-luna";

/**
 * OpenAI Structured Outputs(strict)용 JSON 스키마.
 * strict 모드는 모든 필드가 required 여야 해서 narration 은 "없으면 null" 로 받고,
 * 받은 뒤 undefined 로 바꿔 `src/pipeline/schema.ts` 형식에 맞춘다.
 * 스키마를 바꾸면 schema.ts 와 docs/pipeline-spec.md 도 같이 고친다.
 */
export const STORYBOARD_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["characters", "panels"],
  properties: {
    characters: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "appearance"],
        properties: {
          name: { type: "string" },
          appearance: { type: "string" },
        },
      },
    },
    panels: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "index",
          "sceneIndex",
          "shot",
          "description",
          "characters",
          "dialogues",
          "narration",
        ],
        properties: {
          index: { type: "integer" },
          sceneIndex: { type: "integer" },
          shot: { type: "string", enum: ["wide", "medium", "closeup"] },
          description: { type: "string" },
          characters: { type: "array", items: { type: "string" } },
          dialogues: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["speaker", "text"],
              properties: {
                speaker: { type: "string" },
                text: { type: "string" },
              },
            },
          },
          narration: { type: ["string", "null"] },
        },
      },
    },
  },
} as const;

/** 테스트에서 가짜로 바꿔 끼울 수 있도록 SDK에서 실제로 쓰는 부분만 정의한다. */
export type ResponsesApi = {
  create(params: {
    model: string;
    instructions: string;
    input: string;
    text: {
      format: {
        type: "json_schema";
        name: string;
        strict: boolean;
        schema: Record<string, unknown>;
      };
    };
  }): Promise<{
    model?: string;
    output_text: string;
    usage?: { input_tokens: number; output_tokens: number } | null;
  }>;
};

/** narration: null 을 지워 파이프라인 스키마(optional)와 맞춘다. 형식이 이상하면 그대로 둔다(검증에서 걸러짐). */
export function normalizeStoryboardJson(data: unknown): unknown {
  if (!data || typeof data !== "object" || !Array.isArray((data as { panels?: unknown }).panels)) {
    return data;
  }
  const board = data as { panels: unknown[] };
  return {
    ...board,
    panels: board.panels.map((panel) => {
      if (
        panel &&
        typeof panel === "object" &&
        (panel as { narration?: unknown }).narration === null
      ) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { narration, ...rest } = panel as Record<string, unknown>;
        return rest;
      }
      return panel;
    }),
  };
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    // 형식 오류는 null 로 넘겨서 파이프라인의 스키마 검증·재시도에 맡긴다.
    return null;
  }
}

export function createOpenAiLlm(options: {
  apiKey?: string;
  model?: string;
  responses?: ResponsesApi;
}): LlmClient {
  const model = options.model || DEFAULT_LLM_MODEL;
  const responses =
    options.responses ??
    (new OpenAI({ apiKey: options.apiKey }).responses as unknown as ResponsesApi);

  return {
    async createStoryboard(request: StoryboardRequest): Promise<LlmResult> {
      const response = await responses.create({
        model,
        instructions: STORYBOARD_SYSTEM_PROMPT,
        input: buildStoryboardUserPrompt(request),
        text: {
          format: {
            type: "json_schema",
            name: "storyboard",
            strict: true,
            schema: STORYBOARD_JSON_SCHEMA as unknown as Record<string, unknown>,
          },
        },
      });

      const usedModel = response.model || model;
      const inputTokens = response.usage?.input_tokens ?? 0;
      const outputTokens = response.usage?.output_tokens ?? 0;

      return {
        data: normalizeStoryboardJson(parseJson(response.output_text)),
        usage: {
          model: usedModel,
          inputTokens,
          outputTokens,
          costUsd: estimateLlmCostUsd(usedModel, inputTokens, outputTokens),
        },
      };
    },
  };
}
