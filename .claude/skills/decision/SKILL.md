---
name: decision
description: 프로젝트 방향을 바꾸는 결정을 ADR 파일과 노션 의사결정 로그에 함께 기록한다. 사용자가 /decision 을 쓰거나 범위·기술·비용·정책 결정을 확정했을 때 사용.
argument-hint: "[결정 내용]"
---

# 의사결정 기록

결정: $ARGUMENTS

1. 대화와 코드에서 다음을 정리한다. 모르는 항목은 지어내지 말고 사용자에게 묻는다.
   - 결정 (한 문장)
   - 분류: 범위 / 기술 / 비용 / 정책 / UX 중 하나
   - 배경과 이유
   - 검토한 대안과 고르지 않은 이유
   - 영향: 바뀌는 코드·문서
2. `docs/decisions/` 의 마지막 번호 다음 번호로 `NNNN-짧은-영문-이름.md` 를 `docs/decisions/0000-template.md` 형식대로 만든다. 날짜는 오늘.
3. 노션 "의사결정 로그"(`docs/notion.md`)에 같은 내용을 한 행으로 추가한다.
4. 이 결정 때문에 고쳐야 할 문서(`docs/overview.md`, `docs/pipeline-spec.md`, `CLAUDE.md`, 스키마 `LIMITS` 등)가 있으면 목록으로 보여주고, 사용자 확인 후 수정한다.
5. 이전 결정을 뒤집는 경우 그 ADR의 상태를 "대체됨 (NNNN)"으로 바꾼다.
