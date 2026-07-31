+++
date = '2026-08-01T00:00:00+09:00'
draft = false
title = '공용 CI Runner를 Deployment 하나로 보면 놓치는 것'
+++

처음에는 CI Runner도 애플리케이션 하나처럼 보였다. Helm chart로 설치하고 `Deployment`가 뜨면 끝일 것 같았다. 그런데 Runner는 요청을 직접 처리하는 서버가 아니었다. Job이 들어올 때마다 새 Pod를 만들고, 그 Pod가 소스·변수·cache·클러스터 권한을 만진다. Runner를 공용으로 운영한다는 건 Deployment 하나를 운영하는 게 아니라 **빌드 실행면의 경계를 설계하는 일**이었다.

## 대표 사례 요약

- **문제**: 여러 프로젝트의 빌드를 공용 Kubernetes executor에서 실행해야 했다. 편하게 한 Runner에 다 받으면 권한·cache·순간 자원 사용량이 섞일 위험이 있었다.
- **확인 범위**: GitOps values에서 non-root controller 실행, Job Pod의 CPU/메모리 request·limit, 전용 namespace와 ServiceAccount, untagged job 비허용, protected·locked Runner, 프로젝트 비공유 object-storage cache 설정을 확인했다.
- **판단**: Runner controller와 Job Pod의 자원을 분리하고, 태그·보호 설정·전용 ServiceAccount·프로젝트별 cache로 실행 경계를 나눴다.
- **검증 기준**: controller와 Job Pod의 resource pressure, tag별 대기 시간·실패율, cache hit/miss, ServiceAccount–IAM association과 RBAC를 각각 확인해야 한다.
- **결과와 한계**: 설정 구조와 책임 경계는 확인했다. 피크 빌드의 대기 시간·cache 적중률·비용 효과와 IAM association의 실제 적용 상태는 이 글의 자료만으로 확인하지 못했다.

## Runner Pod와 Job Pod는 같은 일을 하지 않는다

Kubernetes executor에서 Runner manager는 Job을 받으면 빌드마다 별도의 Pod를 만든다.[^1] 그래서 controller가 안정적으로 떠 있다는 사실만으로 빌드가 안전하다고 말할 수 없다.

```text
GitLab Job
  → Runner controller Pod: Job 수신·Pod 생성
  → Job Pod: 소스 다운로드·빌드·artifact/cache 처리
  → object storage cache: 다음 빌드가 재사용할 데이터
```

controller는 계속 살아 있어야 하는 제어면이다. 반대로 Maven 빌드나 이미지 빌드는 짧은 시간에 CPU·메모리를 크게 쓸 수 있는 실행면이다. 둘에 같은 resource 값을 주면 무거운 빌드가 controller까지 밀어낼 수 있고, controller만 작게 잡으면 Job Pod의 실제 요구량이 사라지는 것도 아니다.

그래서 확인한 values에서는 controller와 Job Pod의 resource request·limit을 따로 뒀다. 이 설정이 곧 적정 용량을 증명하지는 않는다. 적정값은 동시 실행 수, 빌드 종류, cluster 여유 용량을 관측해서 다시 정해야 한다. 다만 **제어면의 안정성과 빌드 자원 소비를 같은 문제로 취급하지 않겠다**는 경계는 먼저 코드로 남겼다.

## 태그는 편의 기능이 아니라 실행 경로다

공용 Runner에서 untagged job을 받으면, 작성자가 명시적으로 고르지 않은 Job도 이 실행 환경으로 들어올 수 있다. 확인한 구성에서는 untagged job을 받지 않고, 파이프라인 단계별 Runner tag로 Maven 빌드와 이미지 빌드를 나눴다. protected·locked 설정도 함께 뒀다.

이 선택은 “빌드가 어디서 실행되는지”를 파이프라인에서 읽을 수 있게 한다. 동시에 Runner를 늘릴 때도 모든 Job을 같은 권한·같은 크기의 Pod에서 실행해야 한다는 가정을 피할 수 있다. 다만 tag만으로 격리가 완성되지는 않는다. 해당 Runner를 쓸 수 있는 프로젝트·브랜치와 Kubernetes RBAC가 같이 맞아야 한다.

## ServiceAccount 권한은 Job Pod 기준으로 다시 본다

GitLab 문서는 Kubernetes executor가 만드는 Pod가 Job 변수에 접근할 수 있으므로 cluster 접근 권한을 최소화해야 한다고 안내한다.[^1] controller의 권한만 좁혀도 Job Pod가 더 넓은 ServiceAccount를 쓰면 경계는 무너진다.

확인한 구성에는 전용 namespace와 ServiceAccount가 있었다. 여기서 다음 질문을 분리해 점검해야 한다.

1. Runner controller가 Pod 생성·상태 조회에 필요한 Kubernetes 권한은 어디까지인가?
2. 각 Job Pod가 cluster API나 외부 object storage에 접근해야 하는가?
3. 필요하다면 그 권한은 namespace·resource·action 단위로 제한됐는가?
4. AWS 자격 증명을 쓴다면 ServiceAccount와 IAM role의 연결이 GitOps manifest 밖의 Pod Identity association으로 관리되는가?

4번은 특히 중요하다. EKS Pod Identity는 namespace의 ServiceAccount와 IAM role을 association으로 연결할 수 있다.[^3] 따라서 매니페스트에 annotation이 없다고 권한이 없다고 결론 내리거나, 반대로 ServiceAccount가 있다고 IAM 최소 권한이 보장된다고 말할 수 없다. 이 글의 자료에서는 association의 실제 상태를 확인하지 못했으므로 적용 여부를 주장하지 않는다.

## cache는 빨라지는 대신 경계를 가져야 한다

빌드 cache를 object storage에 두면 Runner Pod가 매번 사라져도 의존성·중간 산출물을 재사용할 수 있다.[^2] 하지만 여러 프로젝트가 같은 cache를 쓰게 두면 데이터 격리와 오염 원인을 추적하기 어려워진다.

확인한 구성은 프로젝트별 비공유 cache를 사용했다. 이는 재사용 범위를 좁히는 대신 cache hit가 줄고 저장소 객체가 늘 수 있다는 선택이다. 그래서 cache를 설계할 때는 “얼마나 빨라졌나”만이 아니라 다음도 함께 확인해야 한다.

- cache key가 프로젝트와 보호된 ref를 넘나들지 않는가
- 읽기·쓰기 권한이 필요한 Job에만 있는가
- TTL·용량·객체 정리 정책이 있는가
- cache 오류가 빌드 실패인지 성능 저하인지 구분 가능한가

GitLab도 protected ref와 non-protected ref의 cache 분리를 지원한다.[^2] 기능을 켜는 것보다, 어떤 빌드끼리 재사용해도 되는지를 먼저 정하는 편이 안전하다.

## 남은 검증 항목

이 구성에서 확인한 것은 의도와 설정의 경계다. 운영 효과는 별도의 기록으로 검증해야 한다.

- 동시 빌드 때 controller와 Job Pod가 각각 어떤 resource pressure를 받는가
- tag별로 대기 시간·실패율이 달라지는가
- cache hit/miss와 저장소 비용이 어떤 트레이드오프를 만드는가
- ServiceAccount–IAM association과 RBAC가 실제 최소 권한인가

공용 Runner의 목표는 모든 빌드를 한곳에 몰아넣는 게 아니다. 어떤 Job이 어떤 권한과 자원으로 실행되는지 설명할 수 있게 만드는 것이다. 그래야 새 프로젝트를 붙이거나 빌드가 실패했을 때, controller·Job Pod·cache·권한 중 어디를 확인할지 바로 좁힐 수 있다.

[^1]: [GitLab Runner — Kubernetes executor](https://docs.gitlab.com/runner/executors/kubernetes/) — Job별 Pod 생성과 Kubernetes 권한 주의사항.
[^2]: [GitLab CI/CD — cache](https://docs.gitlab.com/ci/caching/) — 분산 cache와 protected/non-protected ref cache 분리.
[^3]: [Amazon EKS — Pod Identity](https://docs.aws.amazon.com/eks/latest/userguide/pod-identities.html) — ServiceAccount와 IAM role association.
