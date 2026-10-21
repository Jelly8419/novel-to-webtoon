// PostToolUse(Edit|Write): 수정한 파일을 Prettier로 정리하고, 코드 파일이면 ESLint를 돌린다.
// 남은 린트 오류는 Claude에게 바로 알려서(exit 2) 이어서 고치게 한다.
import { existsSync } from "node:fs";
import path from "node:path";
import { block, readInput, run, tail } from "./_lib.mjs";

const input = await readInput();
const filePath = String(input?.tool_input?.file_path ?? "");
if (!filePath || !existsSync(filePath) || /[\\/](node_modules|\.next)[\\/]/.test(filePath)) {
  process.exit(0);
}

const ext = path.extname(filePath).toLowerCase();
const prettierExts = [
  ".ts",
  ".tsx",
  ".js",
  ".mjs",
  ".cjs",
  ".json",
  ".css",
  ".md",
  ".yml",
  ".yaml",
];
const lintExts = [".ts", ".tsx", ".js", ".mjs"];

if (prettierExts.includes(ext)) {
  run("npx", ["prettier", "--write", "--log-level", "warn", filePath]);
}

if (lintExts.includes(ext) && !filePath.includes(`${path.sep}.claude${path.sep}`)) {
  const lint = run("npx", ["eslint", "--fix", filePath]);
  if (!lint.ok) {
    block(`ESLint 오류가 남아 있어요. 고쳐주세요:\n${tail(lint.output)}`);
  }
}

process.exit(0);
