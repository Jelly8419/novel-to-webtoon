// PreToolUse(Read|Edit|Write): .env 계열 파일 접근을 막는다. (.env.example 은 허용)
import path from "node:path";
import { block, readInput } from "./_lib.mjs";

const input = await readInput();
const filePath = String(input?.tool_input?.file_path ?? "");
const name = path.basename(filePath);

if (name.startsWith(".env") && name !== ".env.example") {
  block(
    `차단됨: ${name} 은 비밀값 파일이라 읽거나 수정하지 않아요. 새 환경 변수는 .env.example 에 키 이름만 추가하고, 값은 사용자에게 넣어 달라고 요청하세요.`,
  );
}

process.exit(0);
