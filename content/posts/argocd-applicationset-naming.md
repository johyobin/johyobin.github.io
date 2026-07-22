+++
date = '2026-07-22T00:00:00+09:00'
draft = false
title = 'ArgoCD ApplicationSet 자동 네이밍의 함정'
+++

앱 하나 배포할 땐 아무 문제 없었다. 근데 두 번째 앱을 GitOps 리포에 붙이자마자 ArgoCD 화면에 Application이 하나만 떠 있었다. 분명 디렉토리는 두 개를 커밋했는데. 범인은 `{{path.basename}}`이었다 — 이 변수는 스캔한 경로의 **가장 오른쪽 이름만** 돌려주는데, 리포 구조가 `manifests/applications/<app>/overlays/prd`처럼 한 겹 더 들어가 있다 보니 앱이 몇 개든 전부 `"prd"`라는 같은 이름으로 렌더링된 거다. 결론부터 말하면, 이 경로 구조를 유지한다면 `{{path.basename}}` 대신 `{{path[2]}}`처럼 앱 세그먼트를 명시해야 한다.

## 증상: Application이 하나만 보였다

리포는 ArgoCD의 App-of-Apps 패턴을 쓰고 있었다. 루트 Application 하나가 하위 Application들을 관리하고, 실제 서비스 앱들은 ApplicationSet의 Git 제너레이터로 자동 생성/삭제되게 짜뒀다. 앱을 추가하고 싶으면 그냥 디렉토리를 만들고 커밋하면 되는 구조였다.

디렉토리는 이렇게 잡았다.

```
manifests/applications/
├── app-a/
│   ├── base/                # Deployment, Service 등 공통 리소스
│   └── overlays/prd/        # 운영 환경 오버레이 (이미지 태그 등)
└── app-b/
    ├── base/
    └── overlays/prd/
```

앱별로 `base`/`overlays`를 분리해두고, 나중에 `overlays/stg` 같은 걸 추가할 여지도 남겨두려고 이렇게 짰다. ApplicationSet은 `manifests/applications/*/overlays/prd`를 스캔하도록 설정했고, 공식 예시 스타일 그대로 Application 이름은 `{{path.basename}}`으로 뽑도록 해뒀다.

```yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: apps
  namespace: argocd
spec:
  generators:
    - git:
        repoURL: https://<git-host>/<org>/gitops-root.git
        revision: main
        directories:
          - path: manifests/applications/*/overlays/prd
  template:
    metadata:
      name: '{{path.basename}}'
    spec:
      project: default
      source:
        repoURL: https://<git-host>/<org>/gitops-root.git
        targetRevision: main
        path: '{{path}}'
      destination:
        server: https://kubernetes.default.svc
        namespace: '{{path[2]}}'
```

`app-a`만 있을 때는 Application 이름이 `prd`로 잡혀도 딱히 티가 안 났다. 어차피 리포에 앱이 하나뿐이니 이름이 뭐가 됐든 화면엔 그거 하나만 뜨니까.

## 첫 삽질: 삭제된 줄 알았다

`app-b` 디렉토리를 만들고 커밋 push까지 했는데, ArgoCD Applications 목록엔 여전히 `prd` 하나뿐이었다. 처음엔 ApplicationSet 컨트롤러가 아직 리포를 못 읽은 줄 알고 `argocd app list`를 몇 번 다시 돌렸다. 그다음엔 Git 제너레이터의 `directories.path` 패턴이 `app-b` 쪽을 못 매칭하는 줄 알고 glob 패턴을 의심했다. 두 경로 다 `manifests/applications/*/overlays/prd` 패턴에 정확히 걸리는 걸 확인하고 나서야, “매칭은 두 번 됐는데 생성하려는 Application 이름이 같아서 충돌하고 있다”는 쪽으로 방향을 틀었다.

`{{path.basename}}`을 다시 들여다보니 이유가 바로 보였다. `manifests/applications/app-a/overlays/prd`도, `manifests/applications/app-b/overlays/prd`도 마지막 세그먼트는 똑같이 `prd`다. ArgoCD 입장에서는 같은 네임스페이스에 동일한 이름의 Application을 두 개 만들려는 상황이다. 두 경로를 독립적인 Application으로 관리할 수 없으니, 생성·갱신 과정에서 충돌이 발생한다.

## 원리: basename은 항상 맨 끝만 본다

ArgoCD 공식 문서를 보면 Git 디렉토리 제너레이터의 템플릿 변수는 이렇다.[^1]

| 변수                          | 반환값 (`manifests/applications/app-a/overlays/prd` 기준) |
| ----------------------------- | --------------------------------------------------------- |
| `{{path}}`                    | `manifests/applications/app-a/overlays/prd` (전체 경로)   |
| `{{path.basename}}`           | `prd` (경로 최하위 세그먼트, 항상 오른쪽 끝)              |
| `{{path[0]}}` ~ `{{path[4]}}` | `manifests`, `applications`, `app-a`, `overlays`, `prd`   |

문서에는 "the right-most path name always becomes basename"이라고 명시돼 있다. 경로가 몇 겹이든 무조건 맨 끝 세그먼트만 준다는 뜻이라, `<app>/overlays/prd`처럼 한 겹 더 파고든 구조에서는 앱 이름이 아니라 환경 이름(`prd`)이 잡힐 수밖에 없다. 현재 경로 계약이 `manifests/applications/<app>/overlays/prd`로 고정돼 있다면 `path[2]`로 앱 세그먼트를 선택할 수 있다. 따라서 이 구조를 유지하는 동안의 수정은 `name: '{{path[2]}}'`다. 다만 디렉토리 깊이가 바뀌면 인덱스도 함께 바뀐다는 제약이 있다.

재밌는 건 같은 템플릿 안에서 `destination.namespace`는 이미 `{{path[2]}}`를 쓰고 있었다는 거다. 네임스페이스는 인덱스로 정확히 잡아놓고, 정작 Application 이름만 basename을 썼던 거라 둘을 나란히 놓고 보면 실수가 꽤 명확하다. 공식 예시를 그대로 베낄 때 필드마다 뭘 참조하는지 안 따져본 게 원인이었다.

## 이름은 화면에 보이는 문자열이 아니라 운영 식별자다

여기서 이름을 고치는 일은 화면에 앱을 두 개 보이게 만드는 수준의 수정이 아니다. Application 이름은 배포 상태 조회, 알림 라벨, 권한 정책, 장애 대상 식별에 계속 사용되는 운영 식별자다. 앱 디렉토리 이름과 환경 디렉토리 이름을 어떤 규칙으로 조합할지 먼저 정해야 한다.

이번 구조에서는 `overlays/prd`를 직접 스캔하므로 Application의 실제 단위는 앱 하나가 아니라 **앱-환경 조합**이다. 운영과 스테이징을 각각 독립적으로 배포한다면 이름도 `app-a-prd`, `app-a-stg`처럼 조합하는 편이 의미가 분명하다. 반대로 Application을 앱 단위로만 운영할 계획이라면 환경을 디렉토리 경로에 넣는 방식과 ApplicationSet 구성을 다시 설계해야 한다.

현재처럼 운영 환경만 스캔하고 앱 단위 이름을 유지하려면 수정은 간단하다.

```yaml
template:
  metadata:
    name: '{{path[2]}}'
```

환경까지 Application 식별자에 포함하려면 앱과 환경을 조합한다.

```yaml
template:
  metadata:
    name: '{{path[2]}}-{{path.basename}}'
```

최소한 다음 규칙은 저장소의 네이밍 계약으로 남겨야 한다.

- Application 이름은 `<app>-<environment>` 형식으로 유일해야 한다.
- 앱·환경 디렉토리 이름은 Kubernetes 이름 제약을 만족해야 한다.
- 경로 깊이를 바꾸면 템플릿 인덱스와 Application 이름이 함께 바뀌는지 리뷰한다.

## 다음부터는 생성 결과를 먼저 검증한다

이번 문제는 두 번째 앱을 추가한 뒤 ArgoCD 화면에서 발견했다. 다음부터는 PR 단계에서 ApplicationSet이 렌더링할 결과를 먼저 확인하는 검증을 넣기로 했다.

- 변경된 경로마다 예상 Application 이름이 유일한지 검사한다.
- ApplicationSet 렌더링 결과를 CLI 또는 CI 검증으로 확인해 생성 목록을 확인한다.
- 경로 depth를 바꾸는 변경에는 별도 리뷰를 요구한다.
- Go Template으로 옮길 때는 `missingkey=error`를 켜서 변수 오타를 조기에 실패시킨다.

이렇게 하면 “디렉토리는 매칭됐는데 Application이 왜 하나지?”라는 문제를 배포 후 화면이 아니라 변경 검증 단계에서 잡을 수 있다.

## 덤: Go Template으로 옮길 때 같이 바꿔야 한다

여기 쓴 `{{path}}`, `{{path.basename}}`, `{{path[n]}}` 문법은 ArgoCD의 예전 템플릿 엔진인 fasttemplate 방식이다. ApplicationSet에 `goTemplate: true`를 켜면 문법이 Go 템플릿 방식으로 바뀐다.[^2]

| 항목            | fasttemplate (`goTemplate: false`, 기본값) | Go Template (`goTemplate: true`) |
| --------------- | ------------------------------------------ | --------------------------------- |
| 전체 경로       | `{{path}}`                                 | `{{.path.path}}`                 |
| 최하위 세그먼트 | `{{path.basename}}`                        | `{{.path.basename}}`             |
| 인덱스 참조     | `{{path[2]}}`                              | `{{index .path.segments 2}}`     |

공식 문서엔 이런 문구도 있다.

> ApplicationSet is using fasttemplate but will be soon deprecated in favor of Go Template.[^3]

지금 설정은 전부 fasttemplate 문법으로 짜여 있다. 당장 깨지는 건 아니지만, Go Template으로 옮길 때 문법과 인덱스 참조를 함께 바꿔야 하는 기술 부채다. 새로 작성하는 설정이라면 Go Template과 `missingkey=error`를 기본값으로 검토하는 편이 낫다.

## 교훈

- 스캔 경로의 마지막 세그먼트가 여러 대상에서 같다면 `path.basename`을 이름으로 쓰면 안 된다. 중첩 깊이보다 “이름으로 쓸 세그먼트가 실제로 유일한가”가 핵심이다.
- Application이 "안 만들어졌다"고 착각하기 쉽다. 실제로는 제너레이터가 경로를 매칭했지만, 템플릿의 name이 겹쳐 독립적인 리소스로 생성되지 않은 것일 수 있다. 목록에 개수가 안 맞으면 제너레이터 매칭뿐 아니라 템플릿의 name 필드도 확인해야 한다.
- `path[n]`은 인덱스가 디렉토리 depth에 그대로 묶인다. 나중에 `overlays/prd` 앞뒤로 폴더 하나만 추가/삭제해도 인덱스가 밀려서 조용히 깨진다. 구조를 최대한 고정하거나, 바뀔 걸 감안해서 리뷰 체크리스트에 넣어두는 게 낫다.
- `goTemplate: true` + `{{index .path.segments 2}}`로 옮길 때는 이름 규칙, 정규화, 누락 키 처리까지 함께 검토한다. 단순히 문법만 치환하면 같은 충돌을 새 템플릿에서도 반복할 수 있다.

## 출처

[^1]: ArgoCD 공식 문서 - ApplicationSet Git Generator (디렉토리 제너레이터 템플릿 변수): https://argo-cd.readthedocs.io/en/stable/operator-manual/applicationset/Generators-Git/

[^2]: ArgoCD 공식 문서 - ApplicationSet Go Template (fasttemplate ↔ Go Template 문법 비교): https://argo-cd.readthedocs.io/en/stable/operator-manual/applicationset/GoTemplate/

[^3]: ArgoCD 공식 문서 - ApplicationSet Template (fasttemplate deprecated 예고 문구): https://argo-cd.readthedocs.io/en/stable/operator-manual/applicationset/Template/
