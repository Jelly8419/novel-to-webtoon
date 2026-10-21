import { describe, expect, it } from "vitest";
import { findNewCharacters } from "./characters";
import type { Storyboard } from "./schema";

const board: Storyboard = {
  characters: [
    { name: "김첨지", appearance: "마른 체격의 중년 인력거꾼" },
    { name: "학생", appearance: "교복 차림" },
    { name: "아내", appearance: "병색이 짙은 얼굴" },
  ],
  panels: [
    {
      index: 0,
      sceneIndex: 0,
      shot: "wide",
      description: "비 오는 정류장",
      characters: ["김첨지", "학생"],
      dialogues: [],
    },
  ],
};

describe("findNewCharacters", () => {
  it("첫 화는 컷에 등장하는 인물 전원을 새 인물로 본다", () => {
    expect(findNewCharacters(board, []).map((c) => c.name)).toEqual(["김첨지", "학생"]);
  });

  it("이미 저장된 인물은 띄어쓰기가 달라도 제외한다", () => {
    expect(findNewCharacters(board, [{ name: "김 첨지" }]).map((c) => c.name)).toEqual(["학생"]);
  });

  it("목록에만 있고 컷에 등장하지 않는 인물은 컨펌하지 않는다", () => {
    expect(findNewCharacters(board, []).map((c) => c.name)).not.toContain("아내");
  });
});
