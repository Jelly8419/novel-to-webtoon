/**
 * LLM 가격표 (USD / 100만 토큰).
 * 출처: IntuitionLabs "ChatGPT API Pricing 2026" (OpenAI 가격표 기준 2026-10-10 확인)
 * https://intuitionlabs.ai/articles/chatgpt-api-pricing-2026-token-costs-limits
 * 가격이 바뀌면 이 표만 고친다. 공식 가격: https://platform.openai.com/docs/pricing
 */
export const LLM_PRICES_PER_MILLION: Record<string, { input: number; output: number }> = {
  "gpt-6-luna": { input: 0.1, output: 0.5 },
  "gpt-6.1-sol": { input: 2, output: 10 },
  "gpt-6-sol": { input: 2, output: 10 },
  "gpt-5.6-luna": { input: 0.2, output: 1.2 },
  "gpt-5-mini": { input: 0.25, output: 2 },
  "gpt-5-nano": { input: 0.05, output: 0.4 },
};

/** 토큰 수로 비용을 계산한다. 가격표에 없는 모델이면 null. 날짜가 붙은 스냅샷 이름도 찾는다. */
export function estimateLlmCostUsd(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number | null {
  const key = Object.keys(LLM_PRICES_PER_MILLION)
    .sort((a, b) => b.length - a.length)
    .find((name) => model === name || model.startsWith(`${name}-`));
  if (!key) return null;
  const price = LLM_PRICES_PER_MILLION[key];
  return (inputTokens * price.input + outputTokens * price.output) / 1_000_000;
}
