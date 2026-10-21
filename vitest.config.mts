import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
    env: {
      // 테스트는 항상 가짜(mock) AI 응답으로 돌려서 비용이 나가지 않게 한다.
      AI_MODE: "mock",
    },
  },
});
