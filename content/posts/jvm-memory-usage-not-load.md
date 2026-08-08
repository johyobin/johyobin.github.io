+++
date = '2026-07-19T00:00:00+09:00'
draft = false
title = 'ECS on EC2는 정말 Fargate보다 저렴했을까 — 고밀도 배치에서 놓친 호스트 시스템 메모리'
+++

비용을 줄이기 위해 ECS on EC2를 선택하고, `bridge`와 동적 포트 매핑으로 한 인스턴스에 태스크를 밀도 있게 배치했다. 십수 개 서비스를 동시에 배포한 뒤 호스트 메모리 압박, ECS·SSM agent 연결 단절, 서비스 전반의 504가 발생했다.

구성상 문제는 `ECS_RESERVED_MEMORY`를 설정하지 않아 ECS agent·컨테이너 런타임·운영체제가 사용할 메모리를 태스크 배치 용량에서 명시적으로 제외하지 않았다는 점이었다. 여기에 여러 태스크의 동시 기동과 일부 호스트로의 집중이 겹쳤다.

## 1. 고밀도 배치를 선택한 이유

Fargate는 태스크가 요청한 vCPU·메모리·스토리지와 실행 시간에 따라 과금되고, EC2는 선택한 인스턴스 용량을 기준으로 과금된다. 태스크를 안정적으로 높은 밀도로 배치할 수 있다면 EC2가 비용 계산상 유리했다.[^1]

ECS on EC2의 `awsvpc` 태스크는 태스크마다 ENI가 필요하다. trunking을 사용하지 않을 때 `c5.large`의 기본 ENI 한도는 3개이므로 `awsvpc` 태스크를 통상 2개까지 배치할 수 있다.[^2] `bridge`에서 `hostPort`를 비우면 동적 포트 매핑으로 같은 서비스를 한 호스트에 여러 개 실행할 수 있어 ENI 한도보다 CPU·메모리에 가깝게 태스크를 배치할 수 있다.[^3]

## 2. 배치 용량에서 빠진 시스템 메모리

ECS는 태스크 정의에 선언된 CPU와 메모리 요구량으로 태스크를 배치한다. EC2 기반 태스크에서 태스크 수준 메모리를 지정하지 않고 컨테이너에 `memoryReservation`과 `memory`를 함께 설정하면 `memoryReservation`이 인스턴스의 가용 메모리에서 차감된다. 컨테이너는 실행 중 `memory` hard limit까지 추가로 사용할 수 있다. 여러 태스크의 실제 사용량이 동시에 증가하면 호스트 메모리가 오버커밋될 수 있다.[^4]

EC2 기반 ECS의 `ECS_RESERVED_MEMORY`는 지정한 용량을 인스턴스의 등록 메모리에서 차감해 태스크 배치 대상에서 제외한다.[^5] 이 설정의 기본값은 `0`이며, 당시에는 별도로 설정하지 않았다.[^6]

`ECS_RESERVED_MEMORY`는 메모리를 물리적으로 격리하지 않는다. ECS에 보고하는 배치 가능 용량만 줄이므로, 태스크가 reservation을 초과해 사용하는 메모리는 컨테이너의 hard limit과 동시 기동 수로 함께 통제해야 한다.[^4][^6]

서비스 설정 일괄 변경과 예약 재기동으로 십수 개 서비스의 새 태스크가 짧은 시간에 시작됐다. 일부 호스트에 태스크가 집중된 직후 메모리 압박과 ECS·SSM agent 연결 단절이 관측됐고, Session Manager 접속도 실패했다.

`agentConnected=false`는 ECS container agent와 ECS 백엔드의 연결 단절을 의미할 뿐 agent 프로세스의 종료나 OOM을 입증하지 않는다.[^7] 당시 호스트에 접속하지 못해 `dmesg`, system journal, ECS agent·Docker 로그를 확인하지 못했다. OOM Killer가 agent를 종료했을 가능성은 가설로 남겼다.

## 3. Agent 단절의 영향

agent 연결이 끊긴 인스턴스에는 새 태스크를 배치할 수 없어 태스크가 `PENDING`으로 남고, Capacity Provider 관리형 스케일링과 ASG 확장이 뒤따를 수 있다.[^8] 새 인스턴스가 등록되기까지 시간이 필요하므로 이미 발생한 짧은 메모리 압박을 즉시 해소하지는 못한다.

이 사건에서는 태스크 기동과 재배치가 지연되면서 요청에 응답할 정상 타깃이 부족해졌고 504가 발생했다. agent 단절이 항상 504를 발생시키는 것은 아니며, ALB 응답은 타깃 상태와 요청 처리 상황에 따라 달라진다.[^9]

## 4. 안전한 배치 밀도의 비용

안전한 배치 밀도에는 애플리케이션 태스크의 reservation뿐 아니라 시스템 프로세스용 메모리, 동시 기동, 인스턴스 한 대의 장애를 흡수할 용량이 포함돼야 한다. `ECS_RESERVED_MEMORY`와 클러스터 예비 용량을 적용하면 인스턴스당 태스크 수가 줄 수 있다. 이는 공유 호스트 보호에 필요한 비용이며, EC2와 Fargate를 비교할 때 인스턴스 단가와 함께 계산해야 한다.

## 5. 예방책

- **시스템용 메모리 제외**: ECS agent·컨테이너 런타임·운영체제의 사용량을 측정해 `ECS_RESERVED_MEMORY`를 설정하고 등록 메모리를 확인한다.
- **태스크 메모리 제한**: `memoryReservation`과 `memory` hard limit을 실제 사용량에 맞게 검증한다.
- **동시 기동 제한**: rolling deployment의 `maximumPercent`와 `minimumHealthyPercent`를 조정하고, 여러 서비스 사이의 배포 동시성은 배포 파이프라인에서 제한한다. 서비스 하나의 설정만으로 여러 서비스 전체의 동시 기동 수를 제어할 수는 없다.[^10]
- **배치 분산**: `spread(AZ) + binpack(memory)`를 `spread(AZ) + spread(instanceId)`로 변경해 동일 서비스의 replica를 가능한 한 다른 인스턴스에 배치한다. placement strategy는 서비스별 best effort이므로 여러 단일 태스크 서비스 전체의 균등 분산을 보장하지 않는다.[^11]
- **예비 용량 확보**: ASG 최소 용량에 동시 기동과 인스턴스 한 대의 장애를 흡수할 용량을 반영한다.

인스턴스 분산 배치와 ASG 최소 용량 조정 뒤 같은 패턴은 관찰 범위에서 재발하지 않았다. 여러 설정을 함께 변경했으므로 어느 하나가 장애를 해소했다고 단정할 수는 없다.

재발 시에는 다음 데이터를 같은 시간대에 수집해야 한다.

- ECS agent·Docker·system journal·`dmesg`의 OOM 기록
- `agentConnected=false`, ECS 서비스 이벤트, `PENDING` 태스크, ASG lifecycle history
- ALB access log·타깃 헬스·504 비율
- 태스크별·호스트별 메모리 사용량과 동시 기동 수

## 6. EC2와 Fargate의 비교

Fargate는 태스크별로 격리된 인프라를 제공해 여러 태스크가 EC2 호스트와 ECS agent를 공유하는 장애 영역을 줄인다. 태스크 자체의 메모리 한도나 OOM까지 해결하지는 않는다.[^12] ECS on EC2도 안전한 배치 밀도를 유지하고 호스트를 운영할 수 있다면 합리적인 선택이다.

비용 비교에는 같은 리전·OS·아키텍처·구매 옵션에서 태스크 요청량과 실행 시간을 맞추고, 안전하게 유지할 수 있는 배치 밀도와 예비 용량을 반영해야 한다. EBS, public IPv4, 로그, 데이터 전송, AMI·ECS agent 관리와 장애 대응 비용도 포함해야 한다.

이 사례의 핵심은 특정 애플리케이션 런타임이 아니라, 태스크 밀도를 높이면서 시스템 프로세스가 사용할 메모리를 배치 용량에서 제외하지 않았다는 점이다. EC2와 Fargate는 인스턴스 단가가 아니라 시스템용 메모리와 실패 예산을 포함한 실제 사용 가능 용량의 총비용으로 비교해야 한다.

[^1]: [AWS Fargate Pricing](https://aws.amazon.com/fargate/pricing/) 및 [Amazon EC2 On-Demand Pricing](https://aws.amazon.com/ec2/pricing/on-demand/) — 두 서비스의 과금 방식과 비교 조건.
[^2]: [Increasing Amazon ECS Linux container instance network interfaces](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/container-instance-eni.html) — `awsvpc` 태스크의 ENI 한도와 trunking 조건.
[^3]: [Use Docker's virtual network for Amazon ECS Linux tasks](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/networking-networkmode-bridge.html) — `bridge` 모드와 동적 포트 매핑.
[^4]: [Amazon ECS task definition parameters for EC2](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_definition_parameters_ec2.html#container_definition_memory) — 컨테이너 `memoryReservation` soft limit과 `memory` hard limit의 배치·실행 동작.
[^5]: [Amazon ECS Linux 컨테이너 인스턴스 메모리 예약](https://docs.aws.amazon.com/ko_kr/AmazonECS/latest/developerguide/memory-management.html) — `ECS_RESERVED_MEMORY`로 태스크 배치 가능 메모리에서 시스템용 용량을 제외하는 방법과 시스템 프로세스 경합 위험.
[^6]: [Amazon ECS container agent configuration](https://github.com/aws/amazon-ecs-agent/blob/master/README.md#environment-variables) — `ECS_RESERVED_MEMORY`의 기본값 `0`과 실제 메모리 사용량을 물리적으로 예약하지 않는다는 설명.
[^7]: [Amazon ECS container instance state change events](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ecs_container_instance_events.html) — `agentConnected`는 agent와 ECS 백엔드의 연결 상태를 나타낸다.
[^8]: [Amazon ECS service action events](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ecs_service_events.html) — agent 연결 단절은 태스크 배치 실패 원인 중 하나다.
[^9]: [Troubleshoot your Application Load Balancers](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/load-balancer-troubleshooting.html) — HTTP 504의 원인과 점검 항목.
[^10]: [Deploy Amazon ECS services by replacing tasks](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/deployment-type-ecs.html) — rolling deployment의 `minimumHealthyPercent`와 `maximumPercent` 동작.
[^11]: [How Amazon ECS places tasks on container instances](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-placement.html) — EC2 task placement strategy의 적용 범위와 best-effort 특성.
[^12]: [AWS shared responsibility model for Amazon ECS](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/security-shared-model.html) — Fargate 태스크의 격리된 인프라와 EC2 launch type의 고객 관리 범위.
