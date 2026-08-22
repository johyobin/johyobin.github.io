## GitHub publishing

- For `gh` authentication, GitHub API, and `git push` commands, request host execution (`require_escalated`): the sandbox cannot access the macOS keychain and can falsely report an invalid GitHub CLI token.
- This is a personal GitHub Pages blog. When the user asks to deploy an approved change, commit and push directly to `main`; do not create a pull request unless explicitly requested.

## Agent skills

### Issue tracker

이슈와 PRD는 GitHub Issues에서 관리한다. 자세한 내용은 `docs/agents/issue-tracker.md`를 본다.

### Domain docs

단일 컨텍스트 repo로 본다. 루트 `CONTEXT.md`와 루트 `docs/adr/`를 사용한다. 자세한 내용은 `docs/agents/domain.md`를 본다.
