import type { ImageClient, LlmClient, StoryboardRequest } from "./types";

/**
 * 가짜 AI 클라이언트. 실제 API를 부르지 않으므로 비용이 0원이다.
 * 개발, 테스트, CI의 기본값이며 결과는 입력에 대해 항상 같다(결정적).
 */

const QUOTE = /["“]([^"”]+)["”]/g;

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?。…])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export const mockLlm: LlmClient = {
  async createStoryboard({ text, targetPanels, knownCharacters }: StoryboardRequest) {
    const sentences = splitSentences(text);
    const panelCount = Math.max(1, Math.min(targetPanels, sentences.length));
    const perPanel = Math.ceil(sentences.length / panelCount);

    const protagonist = knownCharacters[0]?.name ?? "주인공";
    const characters =
      knownCharacters.length > 0
        ? knownCharacters.map(({ name, appearance }) => ({ name, appearance }))
        : [{ name: protagonist, appearance: "[mock] 외모 묘사" }];

    const shots = ["wide", "medium", "closeup"] as const;
    const panels = Array.from({ length: panelCount }, (_, index) => {
      const chunk = sentences.slice(index * perPanel, (index + 1) * perPanel).join(" ");
      const dialogues = [...chunk.matchAll(QUOTE)].map((m) => ({
        speaker: protagonist,
        text: m[1].trim(),
      }));
      return {
        index,
        sceneIndex: Math.floor(index / 4),
        shot: shots[index % shots.length],
        description: chunk.replace(QUOTE, "").trim() || chunk,
        characters: [protagonist],
        dialogues,
      };
    }).filter((p) => p.description.length > 0);

    return { characters, panels };
  },
};

export const mockImage: ImageClient = {
  async generate({ prompt, width = 768, height = 1024 }) {
    const label = prompt.slice(0, 40).replace(/[<>&"]/g, "");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="#E4E4E0"/><text x="50%" y="50%" text-anchor="middle" font-size="28" fill="#5F5F5A">[mock] ${label}</text></svg>`;
    return {
      imageUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
      costUsd: 0,
    };
  },
};
