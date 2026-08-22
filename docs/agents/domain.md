# Domain Docs

engineering skill이 codebase를 탐색할 때 이 repo의 domain documentation을 읽는 방식이다.

## 탐색 전에 읽을 것

- repo 루트의 **`CONTEXT.md`**, 또는
- repo 루트에 **`CONTEXT-MAP.md`**가 있으면 그 파일. 관련 context의 `CONTEXT.md`를 읽는다.
- **`docs/adr/`**. 작업 영역과 관련된 ADR을 읽는다. multi-context repo에서는 `src/<context>/docs/adr/`도 확인한다.

이 파일들이 없으면 **조용히 진행한다**. 없다고 알리거나 미리 만들자고 제안하지 않는다. `/domain-modeling` skill이 용어나 결정이 실제로 정리될 때 lazily 생성한다.

## 파일 구조

Single-context repo:

```text
/
|-- CONTEXT.md
|-- docs/adr/
|   |-- 0001-event-sourced-orders.md
|   `-- 0002-postgres-for-write-model.md
`-- src/
```

Multi-context repo (`CONTEXT-MAP.md`가 루트에 있는 경우):

```text
/
|-- CONTEXT-MAP.md
|-- docs/adr/                          # system-wide decisions
`-- src/
    |-- ordering/
    |   |-- CONTEXT.md
    |   `-- docs/adr/                  # context-specific decisions
    `-- billing/
        |-- CONTEXT.md
        `-- docs/adr/
```

## glossary의 vocabulary 사용

issue title, refactor proposal, hypothesis, test name 등에서 domain concept를 부를 때는 `CONTEXT.md`에 정의된 용어를 사용한다. glossary가 피하라고 한 synonym으로 drift하지 않는다.

필요한 concept가 glossary에 없다면 signal로 본다. project가 쓰지 않는 언어를 만들고 있는지 재검토하거나, 실제 gap이면 `/domain-modeling`에 남긴다.

## ADR 충돌 표시

출력이 기존 ADR과 충돌하면 조용히 덮어쓰지 말고 명시한다.

> _Contradicts ADR-0007 (event-sourced orders) - but worth reopening because..._
