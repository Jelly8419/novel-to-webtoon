import { getAiMode } from "@/lib/ai";
import { LIMITS } from "@/pipeline/schema";

export default function Home() {
  const mode = getAiMode();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-6 px-6 py-24">
      <p className="text-sm text-zinc-600">[서비스명] · 개발 중</p>
      <h1 className="text-3xl leading-snug font-bold text-zinc-900">
        읽기 대신 보는 소설,
        <br />화 단위로 이어지는 나만의 웹툰
      </h1>
      <p className="text-lg leading-8 text-zinc-600">
        .txt, .md 파일을 올리면 AI가 웹툰으로 그려줘요. 다음 화도 같은 그림체와 캐릭터로 이어서
        그립니다.
      </p>
      <dl className="grid grid-cols-3 gap-4 rounded-xl border border-zinc-200 p-5 text-sm">
        <div>
          <dt className="text-zinc-600">화당 최대</dt>
          <dd className="font-semibold">{LIMITS.maxEpisodeChars.toLocaleString()}자</dd>
        </div>
        <div>
          <dt className="text-zinc-600">목표 컷 수</dt>
          <dd className="font-semibold">{LIMITS.targetPanels}컷</dd>
        </div>
        <div>
          <dt className="text-zinc-600">AI 모드</dt>
          <dd className="font-semibold">{mode === "mock" ? "mock (비용 0원)" : "live"}</dd>
        </div>
      </dl>
    </main>
  );
}
