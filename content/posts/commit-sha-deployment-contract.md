+++
date = '2026-07-23T00:00:00+09:00'
draft = false
title = '배포할 이미지는 누가 결정할까 — GitOps에 커밋 SHA를 남긴 이유'
+++

이미지를 빌드해서 레지스트리에 올렸다. 그런데 그 다음 배포 버전은 누가 결정해야 할까?

처음에는 이미지에 `latest` 태그만 붙이면 충분해 보였다. 하지만 나중에 장애를 확인하거나 이전 버전으로 되돌릴 때는 "현재 `latest`가 정확히 어떤 코드인가"부터 다시 찾아야 했다. 이미지 저장소의 가변 태그를 배포 기준으로 삼으면, Git에는 **무엇을 배포하겠다는 선언**이 남지 않는다.

그래서 배포 파이프라인을 다음처럼 나눴다.

```text
수동 실행
  → 애플리케이션 빌드
  → 커밋 SHA 태그 이미지 생성
  → GitOps 저장소의 이미지 태그 변경
  → Argo CD가 Git의 선언을 동기화
```

이 글의 결론은 간단하다.

> **이미지를 만들었다는 사실과 그 이미지를 배포하겠다는 결정은 다르다. 배포 결정은 변경 불가능한 커밋 SHA를 Git의 desired state에 남겨야 한다.**

## 이 글에서 실제로 적용한 범위

적용한 범위는 소스 저장소의 빌드·이미지 push와 GitOps 저장소의 서비스별 overlay였다. 수동으로 시작한 파이프라인이 소스 커밋 SHA 태그 이미지를 만들고, CI는 해당 서비스의 `newTag` 한 필드만 바꿨다. Argo CD는 그 Git 변경을 동기화했다.

반대로 애플리케이션 코드, Deployment의 다른 필드, Argo CD controller 설정은 이 흐름에서 바꾸지 않았다. ECR 태그 불변성은 이 계약을 강제하기 위해 필요한 조건으로 검토한 것이며, 이 글은 특정 레지스트리 설정값이나 권한 정책을 바꾼 사례를 기록한 것은 아니다.

{{< mermaid >}}
flowchart LR
  source[소스 커밋<br/>commit-sha] --> build[CI 빌드·push]
  build --> latest[latest<br/>편의용 별칭]
  build --> image[이미지<br/>commit-sha 태그]
  image -->|태그 불변성| gitops[GitOps 저장소<br/>newTag = commit-sha]
  gitops -->|desired state| argo[Argo CD sync]
  argo --> pod[실행 중인 Pod]

  classDef contract fill:#e8f2ff,stroke:#2563eb,color:#1e3a8a
  class image,gitops,pod contract
{{< /mermaid >}}

## `latest`는 편하지만 배포 이력은 아니다

가변 태그는 사람이 최근 이미지를 찾을 때 편하다. 하지만 같은 이름이 다음 빌드에서 다른 이미지를 가리킬 수 있다. 이 상태에서 Deployment가 `latest`를 참조하면, Git의 매니페스트만 보고는 어떤 소스 버전이 실행 중인지 알 수 없다.

반면 커밋 SHA는 빌드 입력과 연결된 식별자다. 예를 들어 파이프라인은 다음 두 태그를 함께 만들 수 있다.

```text
<registry>/<service>:latest
<registry>/<service>:<commit-sha>
```

여기서 실제 배포 선언에는 두 번째만 쓴다.

```yaml
images:
  - name: REPLACED-BY-KUSTOMIZE
    newName: <registry>/<service>
    newTag: <commit-sha>
```

`latest`는 확인·개발 편의를 위한 별칭으로 남기고, 실행 중인 버전을 판단하거나 롤백할 때는 SHA를 기준으로 삼는다. 그러면 Git 커밋 하나만으로 "어떤 이미지가 배포 대상이었는가"를 역추적할 수 있다.

## SHA 태그도 덮어쓸 수 있으면 배포 이력을 믿을 수 없다

SHA라는 이름만으로 이미지를 불변으로 만들 수는 없다. 레지스트리가 같은 태그의 재푸시를 허용하면, `<commit-sha>`가 나중에 다른 이미지 digest를 가리킬 수 있다. 그러면 Git에는 같은 SHA가 남아 있는데, 배포 시점에 따라 실제 실행 코드가 달라진다.

이 문제는 단순한 태그 관리 문제가 아니다.

- 장애 분석에서 "이 버전을 배포했다"는 Git 기록과 실제 컨테이너가 어긋난다.
- 같은 SHA로 다시 배포해도 이전과 같은 결과를 재현할 수 없다.
- 이전 SHA로 되돌려도, 당시 검증한 이미지가 다시 실행된다는 보장이 없다.

그래서 배포용 이미지 저장소에서는 SHA 태그의 덮어쓰기를 막아야 한다. Amazon ECR의 태그 불변성을 켜면 기존 태그로 이미지를 다시 push할 때 `ImageTagAlreadyExistsException`을 반환한다.[^1] 이 설정은 **Git의 배포 선언 → 이미지 → 실행 코드** 연결을 고정한다.

`latest`는 예외로 둘 수 있다. 최신 이미지를 조회하는 편의용 태그라면 계속 바뀌어야 하기 때문이다. ECR은 `IMMUTABLE_WITH_EXCLUSION`으로 SHA 태그는 불변으로 유지하면서 `latest`만 mutable 예외로 둘 수 있다.[^1] 다만 운영 Deployment가 참조하는 값은 언제나 불변 SHA여야 한다. `latest`는 편의용, SHA는 배포 계약, 태그 불변성은 그 계약을 강제하는 장치로 각각의 역할이 다르다.

## 빌드와 배포 선언을 한 단계로 뭉치지 않았다

파이프라인에서는 Maven이나 Gradle 같은 애플리케이션 빌드 도구가 산출물을 만들고, 다음 단계가 Kaniko나 BuildKit 같은 컨테이너 이미지 빌드 도구로 이미지를 만든다.

이미지 push 뒤에는 배포 선언 갱신 단계가 이미지 태그만 SHA로 바꾼다. Kustomize를 쓴다면 overlay의 `newTag`가 그 지점이다. 애플리케이션 코드나 Deployment 전체를 CI가 건드리는 대신, 배포 버전을 뜻하는 한 필드만 바꾸도록 범위를 좁혔다.

```text
소스 저장소                 GitOps 저장소
-----------                ----------------
코드 커밋
  → 이미지 <commit-sha>    overlay의 newTag = <commit-sha>
                                      ↓
                                Argo CD sync
```

이 분리가 중요한 이유는 Argo CD가 레지스트리의 새 태그를 추측하지 않게 하기 위해서다. Argo CD는 Git에 적힌 desired state와 클러스터의 live state 차이를 감지해 동기화하고, CI는 검증된 이미지의 버전을 Git에 기록한다.[^2] 역할이 나뉘니 배포가 안 됐을 때도 확인 순서가 명확해진다.

- 이미지가 없으면 빌드·push 단계와 레지스트리를 본다.
- 이미지가 있는데 배포되지 않으면 GitOps 태그 커밋과 Argo CD sync 상태를 본다.
- 배포된 버전이 기대와 다르면 overlay의 SHA와 이미지 digest를 대조한다.

## 배포가 실제로 끝났는지는 세 곳을 대조했다

GitOps 커밋이 생겼다고 배포가 끝난 것은 아니다. 배포 확인은 아래 세 값을 같은 순서로 대조하는 절차로 정리했다.

1. 빌드가 만든 이미지 태그가 소스 커밋 SHA와 같은지 확인한다.
2. GitOps 커밋의 overlay `newTag`가 그 SHA인지 확인한다.
3. Argo CD가 그 Git revision을 `Synced` 상태로 반영했고, 실행 워크로드의 이미지 태그와 image digest가 의도한 이미지인지 확인한다.

세 번째 확인이 빠지면 Git의 선언만 맞고 실제 클러스터가 아직 이전 버전일 수 있다. 반대로 실행 중인 이미지 한 번만 보면, 누가 어떤 근거로 그 버전을 배포 대상으로 골랐는지 Git에서 추적하기 어렵다. SHA, GitOps 커밋, 실행 이미지가 연결돼야 검증이 끝난다.

## CI가 Git을 바꾼다면 변경 범위를 좁혀야 한다

CI가 GitOps 저장소를 갱신하는 구조에서는, 파이프라인이 바꿀 수 있는 범위를 좁혀야 한다. 이 흐름에서 CI는 서비스별 overlay의 이미지 태그만 바꾼다. Job이 임의의 매니페스트나 Argo CD 설정까지 고칠 수 있으면, 배포 자동화 권한이 플랫폼 설정 변경 권한까지 커진다.

CI가 만든 태그 커밋에는 `[ci skip]`을 붙였다. 매니페스트 변경 커밋이 다시 동일 파이프라인을 시작하는 루프를 막기 위한 장치다. 다만 이 표시는 검증을 생략해도 된다는 뜻이 아니다. GitOps 저장소에는 별도의 manifest lint·정책 검증 경로를 두는 편이 안전하다.

## 롤백은 새 이미지를 만드는 일이 아니었다

문제가 생겼을 때 롤백은 `latest`를 다시 붙이는 일이 아니다. 이전에 검증한 SHA로 GitOps overlay를 되돌리는 일이다.

{{< mermaid >}}
sequenceDiagram
  participant Operator as 작업자
  participant GitOps as GitOps 저장소
  participant Argo as Argo CD
  participant Cluster as 클러스터

  Note over GitOps,Cluster: 현재 desired state: commit-sha-b
  Operator->>GitOps: newTag를 commit-sha-a로 변경
  GitOps->>Argo: 변경된 desired state
  Argo->>Cluster: commit-sha-a 이미지로 동기화
  Note over GitOps,Cluster: 이전에 검증한 버전 실행
{{< /mermaid >}}

```text
현재 desired state:  <commit-sha-b>
되돌릴 desired state: <commit-sha-a>
```

이 방식은 이미지가 레지스트리에 남아 있다는 보존 정책을 전제로 한다. 따라서 이미지 수명 주기 정책은 CI/CD 바깥의 저장소 운영 문제로 남는다. 운영 중인 SHA 태그가 정리되지 않게 하고, 어떤 SHA가 실제 운영에 있었는지는 Git 이력과 함께 확인할 수 있어야 한다.

롤백도 같은 확인 순서를 따른다. 먼저 Git 이력에서 이전에 검증한 SHA를 고르고, 레지스트리에 해당 태그와 image digest가 남아 있는지 확인한다. 그 다음 overlay의 `newTag`만 이전 SHA로 바꾼다. Argo CD sync와 실행 워크로드의 이미지까지 확인한 뒤에야 롤백 완료로 판단한다. `latest`를 다시 가리키게 하거나 이미지를 새로 빌드하는 것은 이 절차의 롤백이 아니다.

## 운영 효과와 측정 한계

이 흐름으로 확인할 수 있게 된 변화는 배포 대상의 추적 범위다. 이전에는 `latest`가 가리키는 실제 이미지를 레지스트리에서 다시 찾아야 했지만, 이제는 GitOps 커밋의 `newTag`에서 배포 대상으로 선언한 SHA를 바로 확인하고, 그 SHA를 실행 이미지와 대조할 수 있다. 롤백 후보도 Git 이력에서 같은 방식으로 찾는다.

다만 이 글에서는 배포 시간, 장애 복구 시간, 롤백 성공률을 수치로 측정하지 않았다. 그래서 이 방식을 적용해 배포가 몇 분 빨라졌거나 장애가 몇 건 줄었다고 말할 근거는 없다. 다음 개선 효과를 확인하려면 배포 시작부터 `Synced`·`Healthy`까지 걸린 시간, 롤백 시 SHA 변경부터 정상 응답까지 걸린 시간, 배포 후 image digest 불일치 건수를 계속 기록해야 한다.

## 남은 교훈

- `latest`는 편의용 별칭으로 두고, 배포 기준은 변경 불가능한 SHA로 고정한다.
- 이미지 생성과 Git desired state 변경을 분리해 각 단계의 책임과 장애 확인 지점을 좁힌다.
- CI의 Git 쓰기 권한은 배포 자동화 권한이다. 변경 경로를 좁히고, 매니페스트 검증 경로를 분리한다.
- 롤백은 이전 SHA를 Git에 다시 선언하는 절차여야 한다.
- GitOps는 자동 배포 도구가 아니라, **무슨 버전을 왜 배포하는지 남기는 운영 기록**이기도 하다.

[^1]: [Amazon ECR 태그 불변성](https://docs.aws.amazon.com/ko_kr/AmazonECR/latest/userguide/image-tag-mutability.html)

[^2]: [Argo CD Automated Sync Policy](https://argo-cd.readthedocs.io/en/stable/user-guide/auto_sync/)
