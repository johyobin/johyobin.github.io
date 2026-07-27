+++
date = '2026-07-22T00:00:00+09:00'
draft = false
title = 'Git에서 Argo CD가 참조하는 매니페스트 디렉터리를 삭제하면 어디까지 삭제되는가'
+++

운영 중인 서비스의 매니페스트 디렉터리 하나를 Git에서 삭제했다. 그러면 Argo CD는 Application만 정리할까, 아니면 해당 Application의 관리 대상 리소스(workload)까지 정리할까?

결론부터 말하면, 삭제 범위는 `prune: true` 하나로 결정되지 않는다. 어떤 controller가 어떤 리소스를 조정하는지, generated `Application`에 finalizer가 있는지, workload를 보존하는 정책이 켜져 있는지를 함께 봐야 한다. 이번 글에서는 ApplicationSet과 App-of-Apps를 같은 “상위 관리 구조”로 뭉뚱그리지 않고, Git 변경이 각 계층을 어떻게 통과하는지 따라가 본다.

여기서 매니페스트 디렉터리는 Git 저장소 안에서 Argo CD `Application`의 `spec.source.path`가 가리키는 디렉터리를 뜻한다.

## 대표 글과 이 글의 역할

[대표 글](/posts/argocd-application-lifecycle-design/)은 새 서비스 생성, 이미지 갱신, drift 복구, 삭제를 통틀어 어떤 controller가 무엇을 관리하는지 설명한다. 이 글은 그중 **삭제**만 더 깊게 다룬다. `prune`, `Application` 삭제, finalizer, `preserveResourcesOnDeletion`, 삭제 순서와 승인 절차가 각각 무엇을 결정하는지 확인할 때 참고하는 글이다.

삭제를 읽는 데 필요한 전제는 세 가지다.

- ApplicationSet은 generator 결과에 맞춰 generated `Application`을 조정한다.
- App-of-Apps에서는 parent `Application`이 child `Application`을 조정한다.
- 각 `Application`의 workload는 Argo CD application controller가 sync·삭제한다.

삭제 결과를 이해하려면 리소스 이름보다 이 관리 경계를 먼저 봐야 한다.

```text
Git 경로 변경
  ├─ ApplicationSet generator → generated Application
  │                              └─ Argo CD application controller → workload
  └─ App-of-Apps parent Application → child Application
                                         └─ Argo CD application controller → workload
```

생성 단계에서는 ApplicationSet generator나 parent `Application`이 다음 계층의 `Application`을 만든다. 갱신 단계에서는 child `Application`이 source의 desired state를 대상 클러스터에 반영한다. 삭제 단계에 들어서면 `Application` 자체의 삭제와 그 Application이 관리하던 workload의 삭제가 서로 다른 정책으로 갈린다.

ApplicationSet controller는 대상 클러스터의 Deployment나 Service를 직접 조정하지 않는다. ApplicationSet이 하는 일은 generator 결과에 맞춰 Argo CD `Application` 리소스를 만들고, 바꾸고, 지우는 것이다.[^1] 실제 workload의 desired state를 계산하고 적용하는 책임은 child `Application`을 조정하는 Argo CD application controller에 있다.

그래서 이 글에서는 “누가 소유하는가”보다 **어느 controller가 무엇을 관리하는가**를 기준으로 본다. Kubernetes `ownerReferences`, Argo CD tracking 정보, controller별 관리 범위는 서로 다른 관계다.

## ApplicationSet 경로에서 디렉터리를 지우면

서비스 오버레이 경로를 ApplicationSet Git generator가 스캔한다고 하자.

```yaml
spec:
  generators:
    - git:
        directories:
          - path: manifests/applications/*/overlays/production
  syncPolicy:
    applicationsSync: sync
  template:
    spec:
      syncPolicy:
        automated:
          prune: true
          selfHeal: true
```

새 overlay 디렉터리가 생기면 generator가 경로를 발견해 generated `Application`을 만든다. 기존 경로의 source나 template이 바뀌면 ApplicationSet controller가 generated `Application`을 갱신하고, child `Application`이 그 변경을 workload에 반영한다. 디렉터리가 사라질 때부터는 삭제 전파 정책이 개입한다.

Git에서 `app-a/overlays/production`을 삭제하면 첫 번째 변화는 workload가 아니다. Git generator가 더 이상 해당 경로를 매칭하지 않으면서 ApplicationSet이 만들어야 할 Application 목록에서 `app-a`가 빠진다. `applicationsSync` 정책이 generator 결과에서 빠진 Application의 삭제를 허용하고 있다면 generated `Application`이 삭제 대상이 된다.[^2]

여기서 `automated.prune: true`를 ApplicationSet의 삭제 스위치로 읽으면 안 된다. 이 값은 template으로 전달된 generated `Application`의 sync policy다. generated `Application`이 자신의 source에서 더 이상 보이지 않는 리소스를 발견했을 때 자동 prune하도록 하는 설정이다. ApplicationSet controller가 generated `Application` 자체를 삭제할 수 있는지는 `applicationsSync` 정책과 별도다.[^3]

## Application 삭제가 workload 삭제로 이어지는 조건

ApplicationSet이 만든 `Application`에는 parent ApplicationSet을 가리키는 Kubernetes `ownerReferences`가 붙는다. 또 `preserveResourcesOnDeletion: false`인 경우에는 Argo CD resources finalizer가 generated `Application`에 붙는다.[^4]

```yaml
spec:
  syncPolicy:
    preserveResourcesOnDeletion: true
```

이 설정은 generated `Application`이 삭제될 때 그 Application이 관리하던 workload까지 삭제하지 않도록 finalizer 생성을 막는다. 반대로 보존 정책을 켜지 않은 상태에서 Application이 cascading delete되면, Argo CD application controller가 finalizer를 처리하며 관리 대상 리소스도 삭제한다.

여기서 두 삭제 경로를 분리해야 한다.

| 상황 | 주로 작동하는 메커니즘 | 결정되는 것 |
| --- | --- | --- |
| Git에서 workload 매니페스트가 사라짐 | child Application의 `automated.prune` | sync 중 해당 리소스를 제거할지 |
| generated/child Application 자체가 삭제됨 | Kubernetes 삭제 전파 + Argo CD finalizer | Application의 관리 대상 리소스까지 삭제할지 |

`prune=false`라고 해서 Application 삭제 시 workload가 항상 보존되는 것은 아니다. 반대로 `prune=true`라고 해서 Application 리소스 자체가 반드시 삭제되는 것도 아니다. 서로 다른 controller와 서로 다른 생명주기 단계의 설정이기 때문이다.

## App-of-Apps에서는 parent가 바뀐다

App-of-Apps에서는 ApplicationSet 대신 parent `Application`이 상위 관리 단위다. parent의 source 경로에 child `Application` 매니페스트가 있고, parent에 automated prune이 켜져 있다면 Git에서 child 매니페스트를 삭제했을 때 parent가 child `Application`을 정리한다.[^5]

```yaml
spec:
  syncPolicy:
    automated:
      prune: true
```

parent source에 새 child 매니페스트를 추가하면 parent가 child `Application`을 생성한다. child의 source나 parent template이 바뀌면 parent가 child `Application`을 갱신하고, child `Application`이 자신의 workload를 동기화한다. child 매니페스트를 삭제하는 순간에는 parent의 prune과 child의 삭제 전파 정책이 차례로 작동한다.

그 다음 단계는 ApplicationSet과 같다. child `Application`이 삭제될 때 workload까지 지울지는 child Application의 finalizer와 삭제 전파 정책에 달려 있다. child 매니페스트에 `resources-finalizer.argocd.argoproj.io`가 있으면 cascading deletion이 활성화된다.[^6]

반대로 parent에 automated prune이 없다면 Git에서 child 매니페스트를 지워도 parent가 child `Application`을 자동 삭제하지 않는다. 복구한 설정을 실제로 대조해 보니 이 차이가 분명했다. ApplicationSet template에는 자동 prune과 self-heal이 있었지만, App-of-Apps root에는 자동 prune이 활성화되어 있지 않았다. “상위에서 관리한다”는 한 문장만으로는 실제 삭제 결과를 예측할 수 없었던 이유다.

## 삭제 범위와 순서는 서로 다른 문제다

삭제 범위를 정한 다음에는 삭제 순서를 통제해야 한다. `PruneLast=true`는 prune을 sync operation의 마지막 implicit wave로 미룬다. 다른 리소스가 적용되고 healthy 상태가 된 뒤에야 불필요한 리소스를 삭제하도록 만드는 옵션이다.[^7]

`ApplyOutOfSyncOnly=true`는 이름이 비슷해 보여도 다른 문제를 푼다. out-of-sync 리소스만 apply하는 selective sync 옵션이지, prune의 순서를 정하는 옵션이 아니다. 고위험 리소스에는 `Prune=confirm`으로 수동 승인을 요구할 수도 있다.[^7]

즉, 운영 정책은 한 줄짜리 “prune on/off”가 아니다.

1. 어떤 controller가 Application을 조정하는지 정한다.
2. Application이 workload를 자동 prune할지 정한다.
3. Application 삭제 시 workload를 보존할지 정한다.
4. 삭제 순서와 승인 절차를 정한다.
5. 비연쇄 삭제 후 남은 리소스는 orphaned resource monitoring으로 관찰한다.[^8]

## 삭제 전 확인 순서

1. Git에서 사라지는 대상이 workload 매니페스트인지, 서비스 디렉터리인지, child `Application`인지 확인한다.
2. 그 계층을 삭제할 controller와 `applicationsSync` 또는 parent `Application`의 prune 정책을 확인한다.
3. 삭제되는 `Application`에 finalizer가 있는지와 `preserveResourcesOnDeletion` 값을 확인한다.
4. workload를 지우는 것이 맞다면 `PruneLast`와 `Prune=confirm`으로 순서·승인 조건을 정한다.
5. workload를 남긴다면 orphaned resource monitoring으로 남은 리소스를 관찰한다.

이 체크 순서는 대표 글의 controller 경계를 실제 삭제 판단으로 옮긴 것이다. 생성·갱신·drift까지 포함한 전체 흐름은 [Argo CD GitOps에서 애플리케이션 생명주기를 설계하는 법](/posts/argocd-application-lifecycle-design/)에서 이어서 볼 수 있다.

## 출처

[^1]: [How ApplicationSet controller interacts with Argo CD](https://argo-cd.readthedocs.io/en/stable/operator-manual/applicationset/Argo-CD-Integration/)
[^2]: [Git Generator](https://argo-cd.readthedocs.io/en/stable/operator-manual/applicationset/Generators-Git/)
[^3]: [Controlling Resource Modification](https://argo-cd.readthedocs.io/en/stable/operator-manual/applicationset/Controlling-Resource-Modification/)
[^4]: [Application Pruning & Resource Deletion](https://argo-cd.readthedocs.io/en/stable/operator-manual/applicationset/Application-Deletion/)
[^5]: [Cluster Bootstrapping — App Of Apps Pattern](https://argo-cd.readthedocs.io/en/stable/operator-manual/cluster-bootstrapping/)
[^6]: [App Deletion](https://argo-cd.readthedocs.io/en/stable/user-guide/app_deletion/)
[^7]: [Sync Options](https://argo-cd.readthedocs.io/en/stable/user-guide/sync-options/)
[^8]: [Orphaned Resources Monitoring](https://argo-cd.readthedocs.io/en/stable/user-guide/orphaned-resources/)
