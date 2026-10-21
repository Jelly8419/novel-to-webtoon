import { z } from "zod";

/** MVP 분량 제한. 바꾸면 docs/pipeline-spec.md 와 ADR도 함께 수정한다. */
export const LIMITS = {
  maxEpisodeChars: 2000,
  /** 최대 분량(2,000자)일 때의 목표 컷 수 */
  targetPanels: 20,
  maxPanels: 24,
  minPanels: 4,
  /** 텍스트 약 100자당 1컷 (ADR 0002) */
  charsPerPanel: 100,
} as const;

/** 텍스트 길이에 맞는 목표 컷 수. 짧은 글에 20컷을 억지로 채우지 않도록 비율로 계산한다. */
export function targetPanelsFor(textLength: number): number {
  const byLength = Math.round(textLength / LIMITS.charsPerPanel);
  return Math.min(LIMITS.targetPanels, Math.max(LIMITS.minPanels, byLength));
}

export const ShotSchema = z.enum(["wide", "medium", "closeup"]);

export const DialogueSchema = z.object({
  speaker: z.string().min(1),
  text: z.string().min(1),
});

export const PanelSchema = z.object({
  index: z.number().int().nonnegative(),
  sceneIndex: z.number().int().nonnegative(),
  shot: ShotSchema,
  /** 이미지 생성에 쓰일 장면 묘사 (영어 프롬프트로 변환 전 원문) */
  description: z.string().min(1),
  /** 이 컷에 등장하는 인물 이름 */
  characters: z.array(z.string().min(1)),
  dialogues: z.array(DialogueSchema),
  narration: z.string().optional(),
});

export const CharacterSchema = z.object({
  name: z.string().min(1),
  /** 소설에서 추출한 외모 묘사. 캐릭터 컨펌 화면에서 사용자가 수정할 수 있다. */
  appearance: z.string(),
});

export const StoryboardSchema = z.object({
  characters: z.array(CharacterSchema),
  panels: z.array(PanelSchema).min(1).max(LIMITS.maxPanels),
});

export type Shot = z.infer<typeof ShotSchema>;
export type Dialogue = z.infer<typeof DialogueSchema>;
export type Panel = z.infer<typeof PanelSchema>;
export type Character = z.infer<typeof CharacterSchema>;
export type Storyboard = z.infer<typeof StoryboardSchema>;

/** 작품에 저장된(컨펌 완료된) 캐릭터 시트 */
export type CharacterSheet = Character & {
  id: string;
  /** 승인된 시안 이미지. 이후 컷 작화의 레퍼런스로 쓴다. */
  referenceImageUrl: string;
};
