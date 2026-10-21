// PreToolUse(Bash): 되돌리기 어려운 명령과 비밀값 노출을 막는다.
import { block, readInput } from "./_lib.mjs";

const input = await readInput();
const command = String(input?.tool_input?.command ?? "");

const rules = [
  [
    /\brm\s+-[a-z]*r[a-z]*f|\brm\s+-[a-z]*f[a-z]*r/i,
    "rm -rf 는 금지예요. 지울 파일을 하나씩 지정하거나 사용자에게 요청하세요.",
  ],
  [
    /\bgit\s+push\b.*(--force\b|\s-f\b|--force-with-lease)/,
    "강제 푸시는 금지예요. 새 커밋으로 고치세요.",
  ],
  [/\bgit\s+reset\s+--hard\b/, "git reset --hard 는 금지예요. 사용자에게 먼저 확인하세요."],
  [
    /\bgit\s+push\b[^;&|]*[\s:](main|master)(\s|$)/,
    "main 에 직접 푸시하지 않아요. feat/… 브랜치에서 PR 로 병합하세요.",
  ],
  [
    /(cat|less|more|head|tail|type|grep|sed|awk)\b[^|;&]*\.env(?!\.example)/,
    ".env 파일 내용은 읽거나 출력하지 않아요.",
  ],
  [/^\s*(printenv|env)\s*$/, "환경 변수 전체 출력은 비밀값이 노출될 수 있어 금지예요."],
];

for (const [pattern, reason] of rules) {
  if (pattern.test(command)) block(`차단됨: ${reason}\n명령: ${command}`);
}

if (/\bAI_MODE=live\b|\btry:\w+\b.*--live\b/.test(command)) {
  block(
    "실제 AI API 호출(AI_MODE=live, --live)은 비용이 나가요. 사용자가 이번 작업에서 실제 호출을 명시적으로 허락했는지 먼저 확인하세요.",
  );
}

process.exit(0);
