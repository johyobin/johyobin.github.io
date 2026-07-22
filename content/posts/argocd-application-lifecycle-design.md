+++
date = '2026-07-22T00:00:00+09:00'
draft = false
title = 'Argo CD GitOps에서 애플리케이션 생명주기를 설계하는 법'
+++

> ApplicationSet과 App-of-Apps로 나뉜 Application 관리 범위와 생명주기 추적

새 서비스의 Git 디렉터리를 추가했다. 다음에는 어떤 일이 일어날까?

ApplicationSet이 새 `Application`을 만들고, 그 `Application`이 Deployment와 Service를 적용한다. 기존 서비스의 이미지 tag를 바꾸면 새 `Application`을 만들 필요 없이 그 서비스만 갱신된다. 반대로 클러스터에서 Deployment replicas를 수동으로 바꾸면, `selfHeal`이 켜진 `Application`이 Git의 값으로 되돌릴 수 있다.

문제는 이 흐름이 한 controller 안에서 끝나지 않는다는 점이다. 디렉터리 추가·삭제는 ApplicationSet이나 parent `Application`이 다루고, 실제 클러스터의 배포 리소스는 Argo CD application controller가 다룬다. 둘을 구분하지 않으면 “Git을 바꿨는데 왜 Deployment가 안 바뀌지?”나 “디렉터리를 지웠는데 어디까지 지워지지?”에 답하기 어렵다.

이 글의 결론은 하나다.

> **Git 변경이 곧바로 배포 리소스 변경을 뜻하지는 않는다. 어느 controller가 무엇을 관리하는지 나눠 봐야 애플리케이션 생명주기를 예측할 수 있다.**

## 이 글에서 따라갈 구성

한 프로젝트의 GitOps 저장소를 익명화해 단순화하면 다음과 같은 구조였다.

```text
clusters/<cluster>/apps/
├── app-of-apps.yaml       # parent Application
├── applicationset.yaml    # 서비스 ApplicationSet
├── argocd.yaml            # 정적 child Application
├── cert-manager.yaml      # 정적 child Application
├── load-balancer.yaml     # 정적 child Application
└── project-*.yaml         # AppProject를 관리하는 child Application

manifests/applications/
├── <service-a>/overlays/prd/
├── <service-b>/overlays/prd/
└── ...
```

`app-of-apps.yaml`의 source는 `clusters/<cluster>/apps`다. parent `Application`은 정적 child `Application`과 `applicationset.yaml`을 함께 관리한다. ApplicationSet의 Git generator는 `manifests/applications/*/overlays/prd`를 스캔하고, 매칭된 경로마다 generated `Application`을 만든다. 그 `Application`이 Deployment·Service·ServiceAccount·TargetGroupBinding 같은 배포 리소스를 적용한다.

```text
parent Application
├── 정적 child Application
└── ApplicationSet
     └── generated Application
          └── 배포 리소스
```

여기서 `ApplicationSet`은 `Application`을 만들고 갱신하는 CRD와 controller 구조다. App-of-Apps는 별도 CRD가 아니라 parent `Application`의 source에 child `Application` 매니페스트를 두는 구성 패턴이다. [Git Generator 공식 문서](https://argo-cd.readthedocs.io/en/stable/operator-manual/applicationset/Generators-Git/) [App-of-Apps 공식 문서](https://argo-cd.readthedocs.io/en/stable/operator-manual/cluster-bootstrapping/)

`Application`과 배포 리소스도 분리해서 보자. `Application`은 Git source와 대상 클러스터를 연결하고 상태를 추적하는 Argo CD 리소스다. 배포 리소스는 그 source에서 렌더링되어 적용되는 전체 Kubernetes 리소스 집합이다. 여기에는 Deployment 같은 workload뿐 아니라 Service, ConfigMap, ServiceAccount도 들어간다.

이 구분을 잡고 같은 서비스가 생성·갱신·복구·삭제되는 흐름을 따라가 보자.

## 1. 생성: 새 디렉터리는 먼저 `Application`이 된다

새 서비스를 추가할 때 Git에 다음 경로를 만든다.

```text
manifests/applications/<new-service>/
├── base/
└── overlays/prd/
```

이 commit 하나가 곧바로 Deployment를 만드는 것은 아니다.

먼저 ApplicationSet의 Git generator가 새 `overlays/prd` 경로를 발견한다. generator는 경로에서 파라미터를 만들고, template에 그 값을 넣어 generated `Application`을 생성한다. Git directory generator는 저장소의 디렉터리 구조를 기반으로 `Application`을 만들 수 있다. [ApplicationSet generator 공식 문서](https://argo-cd.readthedocs.io/en/stable/operator-manual/applicationset/Generators/)

그다음 generated `Application`을 application controller가 처리한다. source를 렌더링하고 대상 클러스터와 비교한 뒤, 필요한 배포 리소스를 sync한다.

```text
새 overlay 디렉터리 추가
  → ApplicationSet이 generated Application 생성
  → Application이 source 렌더링
  → application controller가 배포 리소스 sync
```

새 서비스가 안 보일 때 Deployment부터 찾으면 한 단계를 건너뛰게 된다. 먼저 generated `Application`이 실제로 생성됐는지, 이름·`spec.source.path`·대상 namespace·`project`가 의도한 값인지 확인해야 한다. 특히 path parameter로 이름을 만들 때 마지막 segment가 `prd`처럼 환경 이름이라면 서비스별 이름이 충돌할 수 있다.

## 2. 갱신: 이미지 tag 변경은 기존 `Application`이 처리한다

이제 이미 존재하는 서비스의 `overlays/prd/kustomization.yaml`에서 이미지 tag만 바꾼다.

```yaml
images:
  - name: REPLACED-BY-KUSTOMIZE
    newName: <registry>/<service>
    newTag: "new-commit"
```

이번에는 디렉터리 집합이 바뀌지 않았다. ApplicationSet이 새 `Application`을 만들 이유도 없다. 이미 있는 generated `Application`이 같은 source 경로에서 새 desired manifest를 읽고, application controller가 Deployment rollout을 수행한다.

```text
image tag 변경
  → 기존 Application의 desired manifest 변경
  → Application OutOfSync
  → application controller가 sync
  → Deployment rollout
```

생성과 갱신을 나누면 장애를 찾는 순서도 달라진다. 새 서비스가 생성되지 않는 문제는 ApplicationSet generator·template·경로를 본다. 이미지가 바뀌지 않는 문제는 기존 `Application`의 source, sync 상태, Kustomize 렌더링 결과를 본다. 둘을 모두 “Argo CD가 배포하지 않았다”로 부르면 확인 범위만 넓어진다.

## 3. drift: `selfHeal`은 모든 변경을 되돌리는 스위치가 아니다

Git에 다음 값이 있다고 하자.

```yaml
spec:
  replicas: 1
```

클러스터에서 replicas를 3으로 바꾸면 live state와 Git desired state가 달라진다. 이 drift를 자동으로 복구하려면 generated `Application`의 automated sync에 `selfHeal: true`가 필요하다. [Automated Sync 공식 문서](https://argo-cd.readthedocs.io/en/stable/user-guide/auto_sync/)

```text
replicas 수동 변경
  → Application OutOfSync
  → selfHeal이 sync를 다시 시도
  → replicas가 Git 값으로 복구
```

복구 주체는 ApplicationSet이 아니다. ApplicationSet은 generated `Application`의 집합을 맞추고, 실제 Deployment의 desired state 복구는 application controller가 수행한다.

여기서 중요한 판단이 하나 더 있다. drift가 보인다고 항상 되돌리면 안 된다. HPA, operator, admission webhook처럼 다른 controller가 정상적으로 바꾸는 필드라면 Argo CD와 서로 값을 덮어쓰게 될 수 있다. 그런 필드는 `ignoreDifferences`로 제외할 범위를 정해야 한다.

결국 drift를 보면 먼저 이렇게 묻는다.

1. 이 값을 바꾼 주체는 사람인가, 다른 controller인가?
2. 이 필드는 Git이 관리해야 하는가?
3. Git이 관리해야 한다면 `selfHeal`로 복구할 것인가?

## 4. App-of-Apps는 부트스트랩을 단순하게 만들고, 전파 범위를 늘린다

이 구조에서 App-of-Apps는 서비스 배포 리소스를 직접 적용하는 새로운 controller가 아니다. 클러스터·플랫폼·서비스를 관리할 `Application`들을 parent 하나에서 부트스트랩하는 진입점이다.

이점은 분명하다.

- parent 하나로 정적 child `Application`과 ApplicationSet을 함께 생성할 수 있다.
- 플랫폼 구성과 서비스 관리 구성을 Git 디렉터리 구조로 묶을 수 있다.
- child마다 source, project, sync policy, 대상 namespace를 분리할 수 있다.

대신 Git 변경의 경로가 한 단계 늘어난다. parent source의 child 매니페스트가 바뀌면 parent가 child `Application`을 갱신하고, child가 자신의 배포 리소스를 처리한다. parent를 삭제하거나 prune할 때 child `Application`에 미치는 범위도 따로 확인해야 한다.

App-of-Apps parent source에 대한 push 권한은 관리자 수준으로 다뤄야 한다. child `Application`의 `project`가 허용 범위를 바꿀 수 있기 때문이다. [Cluster Bootstrapping 공식 문서](https://argo-cd.readthedocs.io/en/stable/operator-manual/cluster-bootstrapping/)

그래서 App-of-Apps는 “여러 앱을 한 번에 관리한다”는 편의성만 보고 선택하면 안 된다. parent가 어떤 child를 관리하는지, child의 sync policy가 무엇인지, 삭제가 어디까지 전파되는지 설명할 수 있을 때 쓰는 편이 안전하다.

## 5. 삭제: `prune`과 Application 삭제는 다른 일이다

이제 처음 질문으로 돌아가 보자. 서비스 디렉터리를 Git에서 지우면 배포 리소스도 같이 사라질까?

답은 “항상 그렇지는 않다”다. 먼저 사라지는 것은 ApplicationSet Git generator가 발견하던 경로다. generator 결과에서 경로가 빠지고 generated `Application` 삭제가 허용된 정책이라면, 해당 `Application`이 삭제 대상이 된다. 그 `Application`이 관리하던 배포 리소스까지 지울지는 별도의 삭제·보존 정책이 결정한다.

```yaml
spec:
  syncPolicy:
    preserveResourcesOnDeletion: true
```

`preserveResourcesOnDeletion: true`를 설정하면 ApplicationSet이 generated `Application`을 삭제할 때 child resources를 보존할 수 있다. 설정하지 않았을 때의 기본 삭제 동작과 함께 검토해야 한다. [ApplicationSet 리소스 수정·삭제 제어 공식 문서](https://argo-cd.readthedocs.io/en/stable/operator-manual/applicationset/Controlling-Resource-Modification/)

이때 `prune`과 Application 삭제를 같은 설정으로 읽으면 안 된다. `automated.prune`은 자동 sync에서 Git desired state에 없는 배포 리소스를 제거할지를 정한다. [Automated Sync 공식 문서](https://argo-cd.readthedocs.io/en/stable/user-guide/auto_sync/)

- Git source에서 Deployment나 Service 하나를 지웠을 때 `automated.prune`은 기존 `Application`이 그 배포 리소스를 sync 중 제거할지 결정한다.
- ApplicationSet generator에서 서비스 경로 자체가 빠졌을 때는 generated `Application`의 삭제와 `preserveResourcesOnDeletion`이 배포 리소스 보존에 영향을 준다.
- App-of-Apps source에서 child `Application` 매니페스트가 빠졌을 때는 parent의 prune과 child `Application`의 finalizer를 함께 봐야 한다.

삭제를 설계할 때는 “어떤 리소스를 자동으로 지울까”보다 “어떤 계층이 사라질 때 무엇을 남길까”를 먼저 정해야 한다. 이 글에서는 finalizer와 cascading deletion의 상세 동작을 반복하지 않는다. 그 내용은 [앞선 삭제 글](https://johyobin.github.io/posts/argocd-application-lifecycle/)에서 별도로 다뤘다.

## 마무리: 생명주기 설계는 controller 경계부터 시작한다

ApplicationSet과 App-of-Apps를 함께 쓰면 Git 변경 하나가 여러 계층을 지난다. 그래서 설정을 추가하기 전에 아래 질문부터 답해야 한다.

- 누가 `Application`을 생성·갱신·삭제하는가?
- 누가 배포 리소스를 sync하고 drift를 복구하는가?
- 새 서비스 추가와 기존 서비스 갱신의 확인 지점은 다른가?
- 다른 controller가 바꾸는 필드는 무엇이며, Git이 어디까지 관리할 것인가?
- 디렉터리·child `Application`·parent `Application`이 사라질 때 각각 무엇을 남길 것인가?

이 경계를 먼저 그려 두면 새 서비스가 생성되지 않거나, 이미지가 갱신되지 않거나, 수동 변경이 되돌아가거나, 디렉터리 삭제 범위가 불분명할 때도 확인할 controller와 설정을 빠르게 좁힐 수 있다. GitOps의 자동화는 Git 변경 그 자체가 아니라, 각 계층의 controller가 맡을 관리 범위를 명확히 정할 때 예측 가능해진다.
