// 훅 스크립트 공용 함수. Windows(Git Bash)와 macOS/Linux 모두에서 동작하도록 Node로 작성했다.
import { spawnSync } from "node:child_process";

/** 훅 입력(JSON)을 stdin에서 읽는다. */
export async function readInput() {
  let raw = "";
  for await (const chunk of process.stdin) raw += chunk;
  try {
    return JSON.parse(raw || "{}");
  } catch {
    return {};
  }
}

/** 프로젝트 루트에서 명령을 실행하고 결과를 돌려준다. */
export function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: process.env.CLAUDE_PROJECT_DIR || process.cwd(),
    encoding: "utf8",
    shell: process.platform === "win32",
  });
  return {
    ok: result.status === 0,
    output: `${result.stdout ?? ""}${result.stderr ?? ""}`.trim(),
  };
}

/** 동작을 막고 이유를 Claude에게 전달한다 (exit 2). */
export function block(reason) {
  process.stderr.write(`${reason}\n`);
  process.exit(2);
}

/** 긴 출력은 끝부분만 남긴다. */
export function tail(text, lines = 40) {
  return text.split("\n").slice(-lines).join("\n");
}
