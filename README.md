# novel-to-webtoon

> 읽기 대신 보는 소설, 화 단위로 이어지는 나만의 웹툰

소설 텍스트(.txt, .md)를 올리면 AI가 웹툰으로 그리고, 같은 작품의 다음 화도 **같은 그림체와 캐릭터로 이어서** 그려주는 서비스입니다. 기획부터 배포까지 1인이 진행한 포트폴리오 프로젝트입니다.

> 🚧 개발 중 · 데모 링크와 스크린샷은 배포 후 추가됩니다.

## 핵심 기능

- **화 단위 생성**: 한 화(최대 2,000자)를 20컷 내외 세로 웹툰으로 변환
- **이어 그리기**: 작품별로 그림체와 캐릭터 시트를 저장해 다음 화에 그대로 적용
- **캐릭터 컨펌**: 새 등장인물은 작화 전에 시안을 보여주고 승인받아 일관성 유지
- **게스트 둘러보기**: 로그인 없이 샘플 작품 열람

## AI 파이프라인

```
텍스트 → 장면 분석·콘티(LLM, JSON) → 새 인물 확인·컨펌 → 컷 작화(이미지 API) → 말풍선 조판
```

- LLM 응답은 Zod 스키마로 검증
- 컨펌된 캐릭터 시트를 컷 작화 레퍼런스로 사용
- 대사는 이미지 모델이 아닌 서버에서 합성
- 개발·테스트는 mock AI(비용 0원), 실제 API는 명시적으로 켤 때만 호출

자세한 내용: [docs/pipeline-spec.md](docs/pipeline-spec.md) · [docs/architecture.md](docs/architecture.md)

## 기술 스택

Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · Zod · Vitest · Vercel

## AI 에이전트 개발 하네스

1인 개발 속도와 품질을 위해 Claude Code가 같은 규칙으로 일하고 스스로 검증하도록 개발 환경을 설계했습니다.

| 구성              | 위치                                      | 역할                                                 |
| ----------------- | ----------------------------------------- | ---------------------------------------------------- |
| 프로젝트 컨텍스트 | `CLAUDE.md`, `.claude/rules/`, `docs/`    | 스택, 규칙, 결정 기록(ADR)                           |
| 가드레일          | `.claude/settings.json`, `.claude/hooks/` | 비밀값·위험 명령 차단, AI 비용 보호                  |
| 자동 검증         | 훅 + GitHub Actions                       | 저장 시 포맷·린트, 완료 전 타입체크·테스트           |
| 워크플로우 커맨드 | `.claude/skills/`                         | `/feature` `/decision` `/experiment` `/troubleshoot` |
| 서브에이전트      | `.claude/agents/`                         | 코드 리뷰어, 콘티 품질 평가자                        |

## 주요 결정

| #                                                        | 결정                                          |
| -------------------------------------------------------- | --------------------------------------------- |
| [0001](docs/decisions/0001-episode-length-limit.md)      | 입력 분량을 화당 2,000자로 제한               |
| [0002](docs/decisions/0002-twenty-panels-per-episode.md) | 화당 20컷 내외                                |
| [0003](docs/decisions/0003-image-generation-api.md)      | 로컬 GPU 대신 저가 이미지 API (FLUX 계열)     |
| [0004](docs/decisions/0004-kakao-login-and-guest.md)     | 카카오 로그인 + 게스트 둘러보기               |
| [0005](docs/decisions/0005-copyright-policy.md)          | 저작권: 권리 확인 + 비공개 기본값 + 신고 절차 |
| [0006](docs/decisions/0006-character-confirmation.md)    | 새 등장인물 작화 전 컨펌                      |
| [0007](docs/decisions/0007-claude-code-harness.md)       | Claude Code 하네스 기반 워크플로우            |
| [0008](docs/decisions/0008-openai-for-storyboard.md)     | 콘티 생성 LLM은 OpenAI (기본 gpt-6-luna)      |

## 로컬 실행

```bash
npm install
cp .env.example .env.local   # 기본값 AI_MODE=mock 이면 키 없이 실행됩니다
npm run dev                  # http://localhost:3000
npm run check                # 린트 + 타입체크 + 테스트
```

## 저작권

데모에는 직접 쓴 글과 저작권이 만료된 작품만 사용합니다. 사용자는 본인이 권리를 가진 글만 업로드할 수 있으며, 생성된 웹툰은 기본적으로 비공개입니다.
