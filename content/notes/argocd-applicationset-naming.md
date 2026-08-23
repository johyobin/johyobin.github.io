+++
date = '2026-07-22T00:00:00+09:00'
draft = false
title = 'Argo CD ApplicationSet 자동 이름 생성에서 경로를 확인해야 하는 이유'
summary = 'ApplicationSet 이름 규칙에서 생길 수 있는 충돌과 재발 방지 검증 방법을 정리합니다.'
landmarks = ['argocd', 'gitops']
featured = false
aliases = ['/posts/argocd-applicationset-naming/']
+++

두 번째 앱을 GitOps 저장소에 추가했는데 Argo CD에는 Application이 하나만 보였다. 디렉터리는 두 개인데 `{{path.basename}}`이 두 경로 모두에서 `"prd"`를 반환해 이름이 충돌한 것이다. `manifests/applications/<app>/overlays/prd` 구조를 유지한다면 `{{path.basename}}` 대신 `{{path[2]}}`처럼 앱 세그먼트를 명시해야 한다.

## 증상: Application이 하나만 보였다

저장소는 Argo CD의 App-of-Apps 패턴을 사용했다. 루트 Application이 하위 Application을 관리하고, 실제 서비스 애플리케이션은 ApplicationSet의 Git generator가 생성·삭제했다. 앱을 추가할 때는 디렉터리를 만들고 커밋하는 구조였다.

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

앱별로 `base`와 `overlays`를 분리해 `overlays/stg` 같은 환경을 추가할 수 있게 했다. ApplicationSet은 `manifests/applications/*/overlays/prd`를 스캔하고, Application 이름에는 공식 예시와 같이 `{{path.basename}}`을 사용했다.

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

`app-a`만 있을 때는 Application 이름이 `prd`여도 문제를 알아차리기 어려웠다. 저장소에 앱이 하나뿐이라 목록에도 하나만 표시됐기 때문이다.

## 처음에는 경로 매칭 문제로 보였다

`app-b` 디렉터리를 만들고 커밋을 푸시했지만 Argo CD Applications 목록에는 여전히 `prd` 하나만 보였다. 처음에는 ApplicationSet controller가 저장소를 읽지 못했거나 Git generator의 `directories.path` 패턴이 `app-b`와 맞지 않는다고 생각했다. 두 경로가 모두 `manifests/applications/*/overlays/prd`에 맞는 것을 확인한 뒤, 경로는 매칭됐지만 생성할 Application 이름이 같아 충돌한다는 점을 확인했다.

`{{path.basename}}`은 경로의 마지막 세그먼트를 반환한다. 따라서 `manifests/applications/app-a/overlays/prd`와 `manifests/applications/app-b/overlays/prd`는 모두 `prd`가 된다. Argo CD는 같은 네임스페이스에 같은 이름의 Application을 두 개 만들 수 없으므로, 두 경로를 독립적인 Application으로 관리할 수 없다.

## 원리: basename은 항상 맨 끝만 본다

Argo CD 공식 문서를 보면 Git 디렉터리 generator의 템플릿 변수는 다음과 같다.[^1]

| 변수                          | 반환값 (`manifests/applications/app-a/overlays/prd` 기준) |
| ----------------------------- | --------------------------------------------------------- |
| `{{path}}`                    | `manifests/applications/app-a/overlays/prd` (전체 경로)   |
| `{{path.basename}}`           | `prd` (경로 최하위 세그먼트, 항상 오른쪽 끝)              |
| `{{path[0]}}` ~ `{{path[4]}}` | `manifests`, `applications`, `app-a`, `overlays`, `prd`   |

문서에는 "the right-most path name always becomes basename"이라고 명시돼 있다. 즉 경로 깊이와 관계없이 마지막 세그먼트만 반환한다. `<app>/overlays/prd` 구조에서는 앱 이름이 아니라 환경 이름(`prd`)이 선택된다. 현재 경로 계약이 `manifests/applications/<app>/overlays/prd`로 고정돼 있다면 `path[2]`로 앱 세그먼트를 선택할 수 있다. 이 구조에서는 `name: '{{path[2]}}'`로 수정한다. 다만 디렉터리 깊이가 바뀌면 인덱스도 함께 바뀐다.

같은 템플릿에서 `destination.namespace`는 이미 `{{path[2]}}`를 사용하고 있었다. 네임스페이스에는 앱 세그먼트를 쓰면서 Application 이름에는 `basename`을 쓴 것이 충돌의 원인이었다. 공식 예시를 적용할 때 각 필드가 어떤 경로 값을 참조하는지도 함께 확인해야 한다.

## 이름은 화면에 보이는 문자열이 아니라 운영 식별자다

여기서 이름을 고치는 일은 화면에 앱을 두 개 보이게 만드는 수준의 수정이 아니다. Application 이름은 배포 상태 조회, 알림 라벨, 권한 정책, 장애 대상 식별에 계속 사용되는 운영 식별자다. 앱 디렉토리 이름과 환경 디렉토리 이름을 어떤 규칙으로 조합할지 먼저 정해야 한다.

이번 구조에서는 `overlays/prd`를 직접 스캔하므로 Application의 실제 단위는 앱 하나가 아니라 **앱-환경 조합**이다. 운영과 스테이징을 각각 독립적으로 배포한다면 이름도 `app-a-prd`, `app-a-stg`처럼 조합하는 편이 의미가 분명하다. 반대로 Application을 앱 단위로만 운영할 계획이라면 환경을 디렉터리 경로에 넣는 방식과 ApplicationSet 구성을 다시 설계해야 한다.

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
- 앱·환경 디렉터리 이름은 Kubernetes 이름 제약을 만족해야 한다.
- 경로 깊이를 바꾸면 템플릿 인덱스와 Application 이름이 함께 바뀌는지 리뷰한다.

## 재발 방지는 PR에서 경로와 이름을 같이 검증하는 일이다

이번 문제는 두 번째 앱을 추가한 뒤 Argo CD 화면에서 발견했다. 당시 이 검증을 CI로 구현했다는 기록은 남아 있지 않다. 아래는 이 경로 계약을 다시 쓴다면 PR에 넣을 **재발 방지 규칙**이다. 운영에 적용한 통제로 보아서는 안 된다.

ApplicationSet YAML만 lint하는 데서 그치지 않고, Git에 있는 경로를 모두 읽어 **경로 → 생성될 Application 이름** 목록을 만들어야 한다. Git 디렉터리 generator는 wildcard에 맞은 디렉터리마다 경로 파라미터를 만들므로, CI도 같은 입력 집합을 검사해야 한다.[^1]

```text
입력 경로: manifests/applications/<app>/overlays/<environment>
이름 규칙: <app>-<environment>

manifests/applications/app-a/overlays/prd  → app-a-prd
manifests/applications/app-b/overlays/prd  → app-b-prd
```

PR CI는 아래 순서로 실패시키면 된다.

1. `manifests/applications/*/overlays/*`에 맞는 디렉터리를 저장소 전체에서 수집한다. 변경 파일만 보면 기존 경로와의 충돌을 놓칠 수 있다.
2. 각 경로가 정확히 `<app>/overlays/<environment>` 깊이인지 확인하고, `<app>-<environment>`를 계산한다. 빈 세그먼트나 허용하지 않는 이름 형식도 여기서 막는다.
3. 계산된 이름을 정렬해 중복을 검사한다. 중복이면 **계산된 이름과 충돌한 두 경로를 모두** 로그에 출력하고 실패한다.
4. 검사 결과의 `경로 | Application 이름` 표를 CI 요약 또는 PR 코멘트에 남긴다. 리뷰어가 glob 매칭과 이름 규칙을 한 번에 대조할 수 있다.

예를 들어 `app-a/overlays/prd`와 `app-b/overlays/prd`가 모두 `prd`로 계산되면, 실패 메시지는 `Application name prd: .../app-a/overlays/prd, .../app-b/overlays/prd`처럼 원인을 보여줘야 한다. "중복됨"만 표시하면 generator 문제인지 템플릿 문제인지 다시 추적해야 한다.

이 규칙은 템플릿과 같은 이름 계약을 써야 한다. fasttemplate을 유지한다면 `{{path[2]}}-{{path.basename}}`, Go Template으로 전환한다면 `{{index .path.segments 2}}-{{.path.basename}}`처럼 CI의 계산식과 `metadata.name`을 함께 바꾼다. Go Template은 `goTemplate: true`로 활성화하며, 공식 문서도 정의되지 않은 값이 조용히 무시되지 않도록 `goTemplateOptions: ["missingkey=error"]`를 권장한다.[^2]

경로 depth 또는 `directories.path`, `template.metadata.name`을 바꾸는 PR에는 위 CI와 별도로 플랫폼 담당자의 리뷰를 요구하는 게 좋다. 이 세 항목은 따로 보면 평범한 디렉터리 정리나 문자열 수정처럼 보이지만, 합쳐지면 생성되는 Application의 집합을 바꾸기 때문이다.

### 이 검증이 보장하지 않는 것

이 CI는 이 글의 단일 Git 디렉터리 generator와 이름 규칙만 확인한다. 실제 ApplicationSet controller가 클러스터에서 렌더링·적용되는지, 다른 generator와 Matrix/Merge 조합에서 파라미터가 충돌하는지, 권한·Project·대상 클러스터가 맞는지는 확인하지 못한다. 그런 변경은 별도 환경에서 generated `Application`의 이름, source path, destination을 확인해야 한다.

이 경로 계약에서는 비용이 적은 방어선이다. 디렉터리 매칭과 Application 이름의 불일치를 배포 뒤 화면이 아니라, 경로와 이름을 함께 볼 수 있는 PR에서 찾을 수 있다.

## Go Template으로 옮길 때 함께 확인할 점

여기 쓴 `{{path}}`, `{{path.basename}}`, `{{path[n]}}` 문법은 Argo CD의 이전 템플릿 엔진인 fasttemplate 방식이다. ApplicationSet에 `goTemplate: true`를 켜면 문법이 Go 템플릿 방식으로 바뀐다.[^2]

| 항목            | fasttemplate (`goTemplate: false`, 기본값) | Go Template (`goTemplate: true`) |
| --------------- | ------------------------------------------ | --------------------------------- |
| 전체 경로       | `{{path}}`                                 | `{{.path.path}}`                 |
| 최하위 세그먼트 | `{{path.basename}}`                        | `{{.path.basename}}`             |
| 인덱스 참조     | `{{path[2]}}`                              | `{{index .path.segments 2}}`     |

공식 문서엔 이런 문구도 있다.

> ApplicationSet is using fasttemplate but will be soon deprecated in favor of Go Template.[^3]

현재 설정은 fasttemplate 문법을 사용한다. Go Template으로 옮길 때는 문법과 인덱스 참조를 함께 바꿔야 한다. 새 설정이라면 Go Template과 `missingkey=error` 사용을 검토할 수 있다.

## 교훈

- 스캔 경로의 마지막 세그먼트가 여러 대상에서 같다면 `path.basename`을 이름으로 쓰면 안 된다. 중첩 깊이보다 이름에 쓸 세그먼트가 실제로 유일한지를 확인해야 한다.
- Application이 생성되지 않았다고 판단하기 쉽다. 실제로는 generator가 경로를 매칭했지만 템플릿의 name이 겹쳐 독립적인 리소스를 만들지 못했을 수 있다. 목록의 개수가 맞지 않으면 generator 매칭뿐 아니라 템플릿의 name 필드도 확인해야 한다.
- `path[n]`은 디렉터리 깊이에 묶인다. 나중에 `overlays/prd` 앞뒤에 폴더를 추가하거나 삭제하면 인덱스가 달라질 수 있다. 구조를 고정하거나 변경 여부를 리뷰 체크리스트에 포함해야 한다.
- `goTemplate: true` + `{{index .path.segments 2}}`로 옮길 때는 이름 규칙, 정규화, 누락 키 처리까지 함께 검토한다. 단순히 문법만 치환하면 같은 충돌을 새 템플릿에서도 반복할 수 있다.

## 출처

[^1]: Argo CD 공식 문서 - ApplicationSet Git Generator (디렉터리 generator 템플릿 변수): https://argo-cd.readthedocs.io/en/stable/operator-manual/applicationset/Generators-Git/

[^2]: Argo CD 공식 문서 - ApplicationSet Go Template (fasttemplate ↔ Go Template 문법 비교): https://argo-cd.readthedocs.io/en/stable/operator-manual/applicationset/GoTemplate/

[^3]: Argo CD 공식 문서 - ApplicationSet Template (fasttemplate deprecated 예고 문구): https://argo-cd.readthedocs.io/en/stable/operator-manual/applicationset/Template/
