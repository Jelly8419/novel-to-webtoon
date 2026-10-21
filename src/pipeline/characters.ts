import type { Character, CharacterSheet, Storyboard } from "./schema";

const normalize = (name: string) => name.replace(/\s+/g, "").toLowerCase();

/**
 * 콘티에 나온 인물 중 작품에 아직 저장되지 않은 인물을 찾는다.
 * 결과가 비어 있지 않으면 작화 전에 캐릭터 컨펌 화면으로 보낸다.
 * 첫 화는 knownCharacters가 비어 있으므로 등장인물 전원이 반환된다.
 */
export function findNewCharacters(
  storyboard: Storyboard,
  knownCharacters: Pick<CharacterSheet, "name">[],
): Character[] {
  const known = new Set(knownCharacters.map((c) => normalize(c.name)));
  const appearing = new Set(storyboard.panels.flatMap((p) => p.characters).map(normalize));

  const seen = new Set<string>();
  return storyboard.characters.filter((character) => {
    const key = normalize(character.name);
    if (known.has(key) || seen.has(key) || !appearing.has(key)) return false;
    seen.add(key);
    return true;
  });
}
