# 보안 점검 체크리스트

## 1. 비밀정보 커밋
- 방어: `.git/hooks/pre-commit`에서 `gitleaks` 자동 스캔 (커밋 차단)
- 추가: push 시 GitHub Secret Scanning + Push Protection 이미 활성화 (public repo 기본)
- 새 클론 시 훅은 로컬 전용이라 재적용 필요: `cp .git/hooks/pre-commit.sample` 대신 위 스캔 명령 재설정

## 2. 개인정보/사내정보 노출
- 글 작성 후 push 전 셀프체크: 실명, 사내 IP/도메인, 고객사명, 미공개 아키텍처 다이어그램 유무 확인
- 원칙: 회사명/고객명은 익명화("A사", "핀테크 스타트업") 또는 삭제

## 3. GitHub 계정
- 2FA 필수 (미설정 시 `gh api user --jq .two_factor_authentication` 로 확인)
- PAT는 필요 scope만 (`workflow` 등), 만료기한 설정

## 4. Actions 워크플로우
- 서드파티 action은 메이저 버전 태그 고정(`@v4` 등) 사용 중 — official action만 사용, 미검증 action 추가 금지
- `permissions`는 `.github/workflows/hugo.yml`에 최소 권한만 부여됨 (`contents: read`, `pages: write`, `id-token: write`) — 변경 시 최소권한 원칙 유지
- fork PR 미허용 (개인 블로그, 협업자 없음 — 향후 외부 기여 받을 경우 `pull_request_target` 사용 금지 확인 필요)

## 5. 테마 서브모듈
- PaperMod submodule 업데이트 시 커밋 해시 diff 확인 후 반영 (`git submodule update --remote` 전 upstream 커밋 로그 확인)

## 6. Draft 노출
- `hugo.toml`에 `buildDrafts = false` 유지 — 배포 전 반드시 확인
