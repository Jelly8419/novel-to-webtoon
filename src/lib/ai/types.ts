import type { CharacterSheet } from "@/pipeline/schema";

export type StoryboardRequest = {
  text: string;
  targetPanels: number;
  maxPanels: number;
  /** 이미 컨펌된 인물. LLM이 같은 이름을 쓰도록 알려준다. */
  knownCharacters: Pick<CharacterSheet, "name" | "appearance">[];
};

/** LLM 한 번 호출의 사용량. 비용 추적과 실험 기록에 쓴다. */
export type LlmUsage = {
  model: string;
  inputTokens: number;
  outputTokens: number;
  /** 가격표에 없는 모델이면 null */
  costUsd: number | null;
};

export type LlmResult = {
  /** 검증 전 원본 JSON. 반드시 스키마로 검증한 뒤 쓴다. */
  data: unknown;
  usage: LlmUsage;
};

/** 텍스트 처리 (장면 분석 + 콘티) */
export interface LlmClient {
  createStoryboard(request: StoryboardRequest): Promise<LlmResult>;
}

export type ImageRequest = {
  prompt: string;
  /** 캐릭터 시트 이미지 등 레퍼런스. 모델이 지원할 때만 사용된다. */
  referenceImageUrls?: string[];
  width?: number;
  height?: number;
  seed?: number;
};

export type ImageResult = {
  imageUrl: string;
  /** 이번 호출 비용(USD). 비용 추적과 회고용. mock은 0. */
  costUsd: number;
};

/** 이미지 생성 (캐릭터 시안, 컷 작화) */
export interface ImageClient {
  generate(request: ImageRequest): Promise<ImageResult>;
}

export type AiClients = {
  mode: "mock" | "live";
  llm: LlmClient;
  image: ImageClient;
};
