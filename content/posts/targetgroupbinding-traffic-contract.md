+++
date = '2026-07-27T00:00:00+09:00'
draft = false
title = 'TargetGroupBinding의 포트는 왜 Service·컨테이너와 다를까'
protocols = [
  { name = 'TCP', layer = 3, layer_name = 'Transport', pdu = 'segment', section = 'ip target은 Pod 수신 포트까지 확인하게 만든다' },
  { name = 'IP', layer = 2, layer_name = 'Internet', pdu = 'packet', section = 'ip target은 Pod 수신 포트까지 확인하게 만든다' },
]
+++

기존 target group에 Kubernetes 서비스를 붙이는 매니페스트를 처음 펼쳐 봤을 때였다.

Service에는 `<service-port>`, 컨테이너에는 `<pod-port>`, `TargetGroupBinding.serviceRef`에는 다시 `<service-port>`가 있었다. 숫자를 하나로 맞춰야 할 것 같았지만, `targetType: ip`와 네트워킹 규칙까지 보니 같은 포트가 아니었다. 요청이 지나가는 서로 다른 지점이었다.

결론은 이렇다.

> **`TargetGroupBinding`은 ALB를 만드는 YAML이 아니다. 이미 있는 target group과 Kubernetes Service·Pod를 연결하는 트래픽 계약이다.**

## 대표 사례 요약

- **문제**: 기존 target group에 새 workload를 연결할 때 `Service.port`, `targetPort`, 컨테이너 포트, `serviceRef.port`를 같은 값으로 읽기 쉬웠다. 하나를 잘못 참조하면 target 등록·health check·실제 요청 경로가 갈라질 수 있다.
- **확인 범위**: GitOps에 선언된 Deployment, `ClusterIP` Service, `TargetGroupBinding`의 참조 관계와 `ip` target type을 함께 살펴봤다. ALB·listener/rule·target group 정책을 새로 만들거나, 애플리케이션 코드와 readiness 구현을 변경한 사례는 아니다.
- **판단**: target group은 네트워크·플랫폼 쪽, workload·Service·binding은 애플리케이션 배포 쪽의 변경 경계로 나눴다. binding 변경은 기존 외부 트래픽 경로가 어느 Service·Pod로 이어질지를 바꾸는 변경으로 취급했다.
- **검증 기준**: Git의 참조를 대조한 뒤 binding 상태, Service ready endpoint, target group target health, 실제 요청 응답을 순서대로 확인한다.
- **결과와 한계**: 확인 순서와 담당자 간 질문을 좁히는 기준을 만들었다. 다만 운영 target을 등록·해제하거나 트래픽 전환을 재현한 기록은 없으므로, 이 절차를 통과했다는 결과는 주장하지 않는다.

```text
외부 요청
  → 기존 ALB의 listener/rule
  → 기존 target group
  → TargetGroupBinding.serviceRef
  → Service.port → Service.targetPort
  → Pod의 named port/containerPort
  → readiness 상태와 target group health check
```

## ALB를 만든다고 착각했던 것

AWS Load Balancer Controller에서 `TargetGroupBinding`은 기존 ALB 또는 NLB target group을 Kubernetes Service로 연결해 Pod를 노출하는 CR이다. 로드밸런서 인프라는 Kubernetes 밖에서 만들고, target은 Kubernetes Service로 관리할 수 있다.[^1]

그래서 공유 ALB 환경에서는 먼저 경계를 그어야 했다. 아래는 이 매니페스트가 정한 책임 경계이며, 실제 조직의 모든 권한 체계를 증명하는 내용은 아니다.

| 경계 | 변경·확인 대상 | 주된 확인 주체 |
| --- | --- | --- |
| 네트워크·플랫폼 | ALB, listener/rule, target group, health check 정책 | 플랫폼·네트워크 담당자 |
| controller 운영 | AWS Load Balancer Controller의 IAM·reconcile 상태 | 클러스터·플랫폼 운영자 |
| 애플리케이션 배포 | Deployment, Service, TargetGroupBinding, readiness 신호 | 애플리케이션 배포 담당자와 개발팀 |

`TargetGroupBinding`을 만들었다고 ALB나 listener가 새로 생기지는 않는다. 대신 “이 target group에 이 Service의 Pod를 붙인다”는 연결이 바뀐다. 작은 YAML처럼 보여도 외부 요청의 도착점을 바꾸는 리소스다.

살펴본 GitOps 매니페스트도 애플리케이션별 `ClusterIP` Service와 `TargetGroupBinding`을 함께 선언하고, binding이 기존 target group과 Service 포트를 참조하는 구조였다. 실제 ARN, 보안 그룹, 서비스명과 포트는 모두 뺐다. 이 확인은 선언의 정합성을 본 것이지, 운영 ALB의 listener/rule 또는 target group health 정책을 직접 변경·검증한 것은 아니다.

## Service 포트와 컨테이너 포트는 같은 값일 필요가 없다

아래 선언에서 `<service-port>`와 `<pod-port>`은 충돌하지 않는다.

```yaml
# Deployment
containers:
  - name: <app>
    ports:
      - name: http
        containerPort: <pod-port>

---
# Service
ports:
  - name: http
    port: <service-port>
    targetPort: http

---
# TargetGroupBinding
spec:
  serviceRef:
    name: <service>
    port: <service-port>
  targetGroupARN: <target-group-arn>
  targetType: ip
```

`serviceRef`는 Kubernetes `Service`와 그 `ServicePort`를 참조한다.[^2] 따라서 `serviceRef.port`에는 컨테이너 포트가 아니라 `Service.port`가 온다. `targetPort: http`는 Service가 선택한 Pod의 named port를 가리키고, 그 이름이 컨테이너의 `<pod-port>`까지 이어 준다.[^5]

```text
TargetGroupBinding이 Service의 <service-port>를 참조
  → Service가 Pod의 http 포트를 참조
    → http라는 이름이 컨테이너의 <pod-port>에 연결
```

Deployment의 named port를 없애거나 다른 포트에 붙여 놓고 Service의 `targetPort: http`를 그대로 두면 이 연결은 끊긴다. Service selector label이 어긋나 Pod를 고르지 못해도 같다. 포트만 맞춰 보는 대신 selector와 named port까지 한 계약으로 확인해야 하는 이유다.

## `ip` target은 Pod 수신 포트까지 확인하게 만든다

`TargetGroupBinding`은 `instance`와 `ip` target type을 지원한다. `instance`에서는 Service의 `nodePort`를 가진 node가, `ip`에서는 Service의 `containerPort`를 가진 Pod가 target으로 등록된다.[^2]

이번 선언은 `targetType: ip`였다. 그래서 Service가 `<service-port>`를 노출한다는 사실만으로는 충분하지 않았다. ALB에서 target으로 등록될 Pod의 실제 수신 포트까지 TCP 연결이 닿아야 한다.

```yaml
networking:
  ingress:
    - from:
        - securityGroup:
            groupID: <load-balancer-security-group>
      ports:
        - protocol: TCP
          port: <pod-port>
```

`networking`은 ELB가 target group의 target에 접근하게 하는 규칙이다.[^2] `ip` target에서 이 포트는 숫자나 Pod의 named port가 될 수 있다.[^2] 그러므로 Service port, `targetPort`, target group의 target·health check port, 인바운드 규칙을 같은 숫자라고 단정하면 안 된다. target type부터 확인한다.

## readiness와 target health는 다른 신호다

readiness probe가 실패하면 Kubernetes는 Pod를 unready로 보고 Service의 ready endpoint에서 제외한다.[^4] 반면 target group health check는 ALB가 등록한 target으로 요청을 보낼 수 있는지를 target group 정책으로 판단한다.

```text
readiness probe        → Kubernetes가 Service에 넣어도 되는지 판단
target group health    → ALB가 target에 보내도 되는지 판단
```

둘 다 “이 Pod로 보내도 되나?”를 묻지만 같은 검사는 아니다. 앱 초기화보다 readiness가 먼저 성공하거나, target group health check가 앱이 제공하지 않는 경로·포트를 보면 판단이 갈린다.

`ip` target에서는 Pod readiness gate를 선택해 쓸 수 있다. 이를 설정하면 target group에서 target이 `Healthy`가 된 뒤 추가 readiness condition이 통과한다.[^3] 다만 namespace label, Pod 생성 시점, Service와 TargetGroupBinding의 생성 순서가 맞아야 한다. 이번 자료에서는 이 설정 사용 여부와 readiness·health check의 실제 경로·성공 코드를 확인하지 못했다. 그래서 “이 설정으로 무중단 전환을 보장했다”고 쓰지 않는다.

## 변경 전·후에는 이 순서로 대조한다

“ALB가 문제인가?”부터 묻지 않는다. 먼저 Git 선언을 대조하고, 배포 환경의 관측값으로 실제 연결을 확인한다. 아래는 변경 리뷰와 비운영 검증에 쓸 기준이다. 실제 운영 target 등록·해제나 트래픽 전환을 이 순서로 수행해 검증한 기록은 아니다.

```text
Git 선언 대조
1. TargetGroupBinding이 의도한 Service와 Service.port를 참조하는가
2. Service selector가 의도한 Pod를 고르고, targetPort가 Pod의 named port/containerPort와 이어지는가
3. ip target의 인바운드 규칙이 Pod 수신 포트와 맞는가

배포 환경 관측
4. TargetGroupBinding controller가 해당 generation을 관측했고 오류 없이 reconcile했는가
5. Service의 ready endpoint 수와 target group의 healthy target 수를 함께 확인했는가
6. listener/rule의 의도한 경로로 요청했을 때 기대한 상태 코드·응답이 나오는가
```

4~6은 Deployment가 생성됐다고 생략하면 안 되는 확인이다. 4에서 controller 상태와 이벤트를, 5에서 Kubernetes와 ELB의 서로 다른 health 신호를, 6에서 사용자 요청 경로를 본다. 어느 단계에서 불일치가 났는지에 따라 플랫폼 담당자, controller 운영자, 애플리케이션 담당자가 함께 확인할 범위를 좁힐 수 있다.

## binding 생성 권한은 트래픽 변경 권한이다

`targetGroupARN`은 문자열 하나지만, 바꾸는 일은 어느 외부 트래픽 경로에 Service를 연결할지 바꾸는 일이다. AWS Load Balancer Controller 문서도 다중 테넌트 cluster에서 신뢰할 수 없는 사용자가 임의 target group을 연결하지 못하도록 `TargetGroupBinding`의 `create`·`update` 권한을 Kubernetes RBAC로 제한하라고 안내한다.[^1]

그래서 권한을 검토할 때는 다음을 따로 확인한다.

- 어느 namespace에서 binding을 만들거나 갱신할 수 있는가.
- 허용되지 않은 target group 참조를 GitOps 변경 권한·리뷰·admission 정책으로 어떻게 막는가.
- `serviceRef`가 같은 애플리케이션 경계의 Service를 가리키는가.
- target 등록·health 확인·롤백 판단은 누가 맡는가.

Kubernetes RBAC만으로 target group ARN별 허용 목록을 만들기는 어렵다. namespace RBAC, GitOps 저장소 변경 권한과 리뷰, 필요하면 admission 정책을 같이 둬야 한다. controller에는 AWS API로 target을 등록·해제하고 health를 조회할 IAM 권한도 필요하다. 반대로 애플리케이션 배포 권한이 listener/rule·target group 정책 변경 권한까지 넓어질 필요는 없다. 이 경계를 문서화하지 않으면 장애 때는 확인 주체가 겹치고, 변경 때는 권한이 과도해진다.

## 남은 위험

- Deployment가 Ready여도 target group이 healthy라는 뜻은 아니다. 두 health 신호와 실제 요청을 함께 확인해야 한다.
- binding이 잘못된 Service·포트·target group을 참조하면 controller가 정상 reconcile해도 의도하지 않은 경로로 트래픽이 갈 수 있다.
- `ip` target의 네트워크 규칙이 Pod 수신 포트와 다르면 target 등록 후에도 health check가 실패할 수 있다.
- readiness gate는 조건이 맞는 새 Pod에만 주입된다. 이미 만들어진 Pod나 설정 순서까지 자동으로 보완하지 않는다.[^3]
- 이번 사례에서는 운영 전환 결과, target health 추이, 오류율·전환 시간 같은 수치를 기록하지 않았다. 따라서 안정성 향상이나 장애 감소를 수치로 주장할 근거는 없다.

`TargetGroupBinding`을 YAML 하나가 아니라 트래픽 계약으로 보면, ALB·target group·Service·Pod가 사용자 요청 하나에 어떻게 함께 참여하는지 보인다. 그때부터는 포트 하나를 고치는 대신, 어느 계층의 어떤 값과 health 신호를 누구와 확인해야 하는지부터 정리할 수 있다.

[^1]: [AWS Load Balancer Controller — TargetGroupBinding](https://kubernetes-sigs.github.io/aws-load-balancer-controller/latest/guide/targetgroupbinding/targetgroupbinding/)
[^2]: [AWS Load Balancer Controller — TargetGroupBinding API specification](https://kubernetes-sigs.github.io/aws-load-balancer-controller/latest/guide/targetgroupbinding/spec/)
[^3]: [AWS Load Balancer Controller — Pod readiness gate](https://kubernetes-sigs.github.io/aws-load-balancer-controller/latest/deploy/pod_readiness_gate/)
[^4]: [Kubernetes — Liveness, Readiness, and Startup Probes](https://kubernetes.io/docs/concepts/configuration/liveness-readiness-startup-probes/)
[^5]: [Kubernetes — Service](https://kubernetes.io/docs/concepts/services-networking/service/)
