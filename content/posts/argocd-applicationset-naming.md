+++
date = '2026-07-20T00:00:00+09:00'
draft = false
title = 'ArgoCD ApplicationSet 자동 네이밍의 함정'
+++

앱 하나 배포할 땐 아무 문제 없었다. 근데 두 번째 앱을 GitOps 리포에 붙이자마자 ArgoCD 화면에 Application이 하나만 떠 있었다. 분명 디렉토리는 두 개를 커밋했는데. 범인은 `{{path.basename}}`이었다 — 이 변수는 스캔한 경로의 **가장 오른쪽 이름만** 돌려주는데, 우리 리포 구조가 `manifests/applications/<app>/overlays/prd`처럼 한 겹 더 들어가 있다 보니 앱이 몇 개든 전부 `"prd"`라는 이름으로 잡혀버린 거다. 결론부터 말하면, 이런 구조에선 `{{path.basename}}` 대신 `{{path[2]}}`처럼 인덱스로 원하는 세그먼트를 콕 집어야 한다.

## 증상: Application이 하나로 합쳐졌다

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
      source:
        path: '{{path}}'
      destination:
        namespace: '{{path[2]}}'
```

`app-a`만 있을 때는 Application 이름이 `prd`로 잡혀도 딱히 티가 안 났다. 어차피 리포에 앱이 하나뿐이니 이름이 뭐가 됐든 화면엔 그거 하나만 뜨니까.

## 첫 삽질: 삭제된 줄 알았다

`app-b` 디렉토리를 만들고 커밋 push까지 했는데, ArgoCD Applications 목록엔 여전히 `prd` 하나뿐이었다. 처음엔 ApplicationSet 컨트롤러가 아직 리포를 못 읽은 줄 알고 `argocd app list`를 몇 번 다시 돌렸다. 그다음엔 Git 제너레이터의 `directories.path` 패턴이 `app-b` 쪽을 못 매칭하는 줄 알고 glob 패턴을 의심했다. 두 경로 다 `manifests/applications/*/overlays/prd` 패턴에 정확히 걸리는 걸 확인하고 나서야, "매칭은 두 번 됐는데 이름이 같아서 하나로 합쳐지고 있다"는 쪽으로 방향을 틀었다.

`{{path.basename}}`을 다시 들여다보니 이유가 바로 보였다. `manifests/applications/app-a/overlays/prd`도, `manifests/applications/app-b/overlays/prd`도 마지막 세그먼트는 똑같이 `prd`다. ArgoCD 입장에서는 이름이 같은 Application을 두 번 정의하려는 상황이니, 둘 중 하나가 다른 하나를 덮어쓰는 게 당연한 동작이었다.

## 원리: basename은 항상 맨 끝만 본다

ArgoCD 공식 문서를 보면 Git 디렉토리 제너레이터의 템플릿 변수는 이렇다.[^1]

| 변수                          | 반환값 (`manifests/applications/app-a/overlays/prd` 기준) |
| ----------------------------- | --------------------------------------------------------- |
| `{{path}}`                    | `manifests/applications/app-a/overlays/prd` (전체 경로)   |
| `{{path.basename}}`           | `prd` (경로 최하위 세그먼트, 항상 오른쪽 끝)              |
| `{{path[0]}}` ~ `{{path[4]}}` | `manifests`, `applications`, `app-a`, `overlays`, `prd`   |

문서에는 "the right-most path name always becomes basename"이라고 명시돼 있다. 경로가 몇 겹이든 무조건 맨 끝 세그먼트만 준다는 뜻이라, `<app>/overlays/prd`처럼 한 겹 더 파고든 구조에서는 앱 이름이 아니라 환경 이름(`prd`)이 잡힐 수밖에 없다. 반면 `path[2]`는 세그먼트를 배열로 쪼개 인덱스로 찍는 거라 몇 겹이 있든 원하는 자리를 정확히 가져온다. 그래서 답은 `name: '{{path[2]}}'`다.

재밌는 건 같은 템플릿 안에서 `destination.namespace`는 이미 `{{path[2]}}`를 쓰고 있었다는 거다. 네임스페이스는 인덱스로 정확히 잡아놓고, 정작 Application 이름만 basename을 썼던 거라 둘을 나란히 놓고 보면 실수가 꽤 명확하다. 공식 예시를 그대로 베낄 때 필드마다 뭘 참조하는지 안 따져본 게 원인이었다.

## 덤: 이 문법 자체가 곧 구식이 된다

여기 쓴 `{{path}}`, `{{path.basename}}`, `{{path[n]}}` 문법은 ArgoCD의 예전 템플릿 엔진인 fasttemplate 방식이다. ApplicationSet에 `goTemplate: true`를 켜면 문법이 Go 템플릿 방식으로 바뀐다.[^2]

| 항목            | fasttemplate (`goTemplate: false`, 기본값) | Go Template (`goTemplate: true`) |
| --------------- | ------------------------------------------ | --------------------------------- |
| 전체 경로       | `{{path}}`                                 | `{{.path.path}}`                 |
| 최하위 세그먼트 | `{{path.basename}}`                        | `{{.path.basename}}`             |
| 인덱스 참조     | `{{path[2]}}`                              | `{{index .path.segments 2}}`     |

공식 문서엔 이런 문구도 있다.

> ApplicationSet is using fasttemplate but will be soon deprecated in favor of Go Template.[^3]

지금 설정은 전부 fasttemplate 문법으로 짜여 있다. 당장 깨지는 건 아니지만, 로드맵상 언젠가는 옮겨야 할 기술 부채다.

## 교훈

- 스캔 경로가 2단 이상 중첩되면 `path.basename`을 이름으로 쓰면 안 된다. 무조건 겹친다.
- Application이 "안 만들어졌다"고 착각하기 쉽다. 실제로는 만들어졌는데 이름이 겹쳐서 하나가 다른 하나를 덮어쓴 것 — 목록에 개수가 안 맞으면 제너레이터 매칭보다 템플릿의 name 필드부터 의심하는 게 빠르다.
- `path[n]`은 인덱스가 디렉토리 depth에 그대로 묶인다. 나중에 `overlays/prd` 앞뒤로 폴더 하나만 추가/삭제해도 인덱스가 밀려서 조용히 깨진다. 구조를 최대한 고정하거나, 바뀔 걸 감안해서 리뷰 체크리스트에 넣어두는 게 낫다.
- `goTemplate: true` + `{{index .path.segments 2}}`로 미리 옮겨두는 걸 다음 개선 항목으로 잡아뒀다. fasttemplate가 deprecated 예정이라는 걸 알고 나니 더 미룰 이유가 없어졌다.

## 출처

[^1]: ArgoCD 공식 문서 - ApplicationSet Git Generator (디렉토리 제너레이터 템플릿 변수): https://github.com/argoproj/argo-cd/blob/master/docs/operator-manual/applicationset/Generators-Git.md

[^2]: ArgoCD 공식 문서 - ApplicationSet Go Template (fasttemplate ↔ Go Template 문법 비교): https://github.com/argoproj/argo-cd/blob/master/docs/operator-manual/applicationset/GoTemplate.md

[^3]: ArgoCD 공식 문서 - ApplicationSet Template (fasttemplate deprecated 예고 문구): https://github.com/argoproj/argo-cd/blob/master/docs/operator-manual/applicationset/Template.md
