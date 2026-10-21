/**
 * 콘티 생성을 터미널에서 바로 시험해 보는 스크립트.
 *
 *   npm run try:storyboard -- samples/rainy-umbrella.txt          # mock (비용 0원)
 *   npm run try:storyboard -- samples/rainy-umbrella.txt --live   # OpenAI 실제 호출
 *
 * --live 는 .env.local 의 LLM_API_KEY, LLM_MODEL 을 쓴다.
 * 결과는 experiments/<날짜>-storyboard/ 에 JSON 으로 저장된다 (git 에 올라가지 않음).
 * 저장된 파일은 storyboard-judge 에이전트로 품질을 평가할 수 있다.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { getAiClients, type LlmUsage } from "@/lib/ai";
import { DEFAULT_LLM_MODEL } from "@/lib/ai/openai";
import { targetPanelsFor, type Storyboard } from "@/pipeline/schema";
import {
  createStoryboard,
  normalizeEpisodeText,
  StoryboardFormatError,
} from "@/pipeline/storyboard";

const KRW_PER_USD = 1400;

function longestShotRun(board: Storyboard): number {
  let longest = 0;
  let run = 0;
  board.panels.forEach((panel, i) => {
    run = i > 0 && board.panels[i - 1].shot === panel.shot ? run + 1 : 1;
    longest = Math.max(longest, run);
  });
  return longest;
}

function totalCost(usage: LlmUsage[]): number | null {
  if (usage.some((u) => u.costUsd === null)) return null;
  return usage.reduce((sum, u) => sum + (u.costUsd ?? 0), 0);
}

function formatCost(usd: number | null): string {
  if (usd === null) return "알 수 없음 (가격표에 없는 모델)";
  if (usd === 0) return "0원";
  return `$${usd.toFixed(5)} (약 ${Math.max(1, Math.round(usd * KRW_PER_USD))}원)`;
}

async function main() {
  const args = process.argv.slice(2);
  const live = args.includes("--live");
  const file = args.find((a) => !a.startsWith("--"));
  if (!file) {
    console.error("사용법: npm run try:storyboard -- <텍스트 파일> [--live]");
    process.exit(1);
  }

  const raw = readFileSync(file, "utf8");
  const model = live ? process.env.LLM_MODEL || DEFAULT_LLM_MODEL : "mock";
  console.log(`▶ ${path.basename(file)} · ${live ? "live" : "mock"} · ${model}`);

  const startedAt = Date.now();
  try {
    const clients = getAiClients({ ...process.env, AI_MODE: live ? "live" : "mock" });
    const { storyboard, usage } = await createStoryboard(raw, { llm: clients.llm });
    const seconds = (Date.now() - startedAt) / 1000;
    const text = normalizeEpisodeText(raw);

    const shots = storyboard.panels.reduce<Record<string, number>>((acc, p) => {
      acc[p.shot] = (acc[p.shot] ?? 0) + 1;
      return acc;
    }, {});
    const scenes = new Set(storyboard.panels.map((p) => p.sceneIndex)).size;
    const dialogues = storyboard.panels.reduce((n, p) => n + p.dialogues.length, 0);

    console.log("");
    console.log(`글자 수    ${text.length}`);
    console.log(`컷 수      ${storyboard.panels.length} (목표 ${targetPanelsFor(text.length)})`);
    console.log(`장면 수    ${scenes}`);
    console.log(
      `샷 분포    ${Object.entries(shots)
        .map(([k, v]) => `${k} ${v}`)
        .join(" · ")}`,
    );
    console.log(`같은 샷 최장 연속  ${longestShotRun(storyboard)}`);
    console.log(`등장인물   ${storyboard.characters.map((c) => c.name).join(", ")}`);
    console.log(`대사       ${dialogues}개`);
    console.log(
      `호출       ${usage.length}회 · 토큰 ${usage.map((u) => `${u.inputTokens}+${u.outputTokens}`).join(", ")}`,
    );
    console.log(`비용       ${formatCost(totalCost(usage))}`);
    console.log(`소요 시간  ${seconds.toFixed(1)}초`);

    const day = new Date().toLocaleDateString("sv-SE"); // 로컬 날짜 YYYY-MM-DD
    const dir = path.join("experiments", `${day}-storyboard`);
    mkdirSync(dir, { recursive: true });
    const outPath = path.join(
      dir,
      `${path.basename(file, path.extname(file))}-${model}-${Date.now()}.json`,
    );
    writeFileSync(
      outPath,
      JSON.stringify(
        { source: file, model, mode: clients.mode, usage, seconds, text, storyboard },
        null,
        2,
      ),
    );
    console.log(`\n저장됨: ${outPath}`);
  } catch (error) {
    if (error instanceof StoryboardFormatError) {
      console.error(`\n✖ ${error.message}`);
      console.error(`  비용: ${formatCost(totalCost(error.usage))}`);
    } else {
      console.error(`\n✖ ${error instanceof Error ? error.message : String(error)}`);
    }
    process.exit(1);
  }
}

void main();
