# 이슈 트래커: GitHub

이 repo의 이슈와 PRD는 GitHub Issues에 둔다. 모든 작업은 `gh` CLI를 사용한다.

## 규칙

- **이슈 생성**: `gh issue create --title "..." --body "..."`. 여러 줄 본문은 heredoc을 사용한다.
- **이슈 읽기**: `gh issue view <number> --comments`. 필요하면 `jq`로 댓글과 label을 필터링한다.
- **이슈 목록**: `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'`에 필요한 `--label`, `--state` 필터를 더한다.
- **댓글 작성**: `gh issue comment <number> --body "..."`
- **label 추가/제거**: `gh issue edit <number> --add-label "..."`, `gh issue edit <number> --remove-label "..."`
- **닫기**: `gh issue close <number> --comment "..."`

repo는 `git remote -v`에서 추론한다. clone 내부에서 실행하면 `gh`가 자동으로 처리한다.

## Pull requests as a triage surface

**PRs as a request surface: no.** _(외부 PR도 기능 요청처럼 triage하려면 `yes`로 바꾼다. `/triage`가 이 값을 읽는다.)_

`yes`로 설정한 경우 PR도 이슈와 같은 label/state 흐름을 사용하며 `gh pr` 대응 명령을 쓴다.

- **PR 읽기**: `gh pr view <number> --comments`, diff는 `gh pr diff <number>`.
- **triage 대상 외부 PR 목록**: `gh pr list --state open --json number,title,body,labels,author,authorAssociation,comments` 후 `authorAssociation`이 `CONTRIBUTOR`, `FIRST_TIME_CONTRIBUTOR`, `NONE`인 항목만 남긴다. `OWNER`, `MEMBER`, `COLLABORATOR`는 제외한다.
- **댓글/label/닫기**: `gh pr comment`, `gh pr edit --add-label`/`--remove-label`, `gh pr close`.

GitHub는 issue와 PR이 같은 번호 공간을 공유한다. `#42`가 issue인지 PR인지 애매하면 `gh pr view 42`를 먼저 시도하고 실패하면 `gh issue view 42`를 실행한다.

## skill이 "publish to the issue tracker"라고 할 때

GitHub issue를 생성한다.

## skill이 "fetch the relevant ticket"이라고 할 때

`gh issue view <number> --comments`를 실행한다.

## Wayfinding 작업

`/wayfinder`가 사용한다. **map**은 `wayfinder:map` label이 붙은 단일 issue이고, **child** issue들이 ticket이다.

- **Map**: Notes / Decisions-so-far / Fog 본문을 담은 단일 issue. `gh issue create --label wayfinder:map`.
- **Child ticket**: GitHub sub-issue로 map에 연결한 issue. sub-issue가 활성화되어 있지 않으면 map 본문의 task list에 child를 추가하고 child 본문 상단에 `Part of #<map>`을 둔다. Label은 `wayfinder:<type>` (`research`, `prototype`, `grilling`, `task`). claim되면 driving dev에게 assign한다.
- **Blocking**: GitHub native issue dependencies가 canonical 표현이다. `gh api --method POST repos/<owner>/<repo>/issues/<child>/dependencies/blocked_by -F issue_id=<blocker-db-id>`로 edge를 추가한다. `<blocker-db-id>`는 blocker의 numeric database id이며 `#number`나 `node_id`가 아니다. `gh api repos/<owner>/<repo>/issues/<n> --jq .id`로 얻는다. dependencies를 사용할 수 없으면 child 본문 상단에 `Blocked by: #<n>, #<n>` 라인을 둔다.
- **Frontier query**: map의 open child 목록을 가져온 뒤, open blocker가 있거나 assignee가 있는 ticket을 제외한다. map 순서상 첫 ticket이 우선이다.
- **Claim**: `gh issue edit <n> --add-assignee @me`.
- **Resolve**: `gh issue comment <n> --body "<answer>"`, `gh issue close <n>`, 그리고 map의 Decisions-so-far에 context pointer를 추가한다.
