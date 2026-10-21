// Stop: 코드가 바뀐 상태로 작업을 끝내려 하면 타입체크와 테스트를 돌린다.
// 실패하면 멈추지 않고 Claude가 이어서 고치도록 돌려보낸다.
import { readInput, run, tail } from "./_lib.mjs";

const input = await readInput();

// 이미 한 번 돌려보낸 뒤라면 무한 반복을 막기 위해 통과시킨다.
if (input?.stop_hook_active === true) process.exit(0);

const status = run("git", ["status", "--porcelain", "--", "src", "tests"]);
if (!status.ok || status.output.length === 0) process.exit(0);

const typecheck = run("npm", ["run", "typecheck", "--silent"]);
const test = typecheck.ok ? run("npm", ["run", "test", "--silent"]) : null;

if (typecheck.ok && test?.ok) process.exit(0);

const failed = !typecheck.ok ? typecheck : test;
const label = !typecheck.ok ? "타입체크" : "테스트";
process.stdout.write(
  JSON.stringify({
    decision: "block",
    reason: `${label}가 실패했어요. 완료 전에 고쳐주세요 (CLAUDE.md: npm run check 통과 필수).\n\n${tail(failed.output)}`,
  }),
);
process.exit(0);
