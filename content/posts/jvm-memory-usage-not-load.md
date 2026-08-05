+++
date = '2026-07-19T00:00:00+09:00'
draft = false
title = 'ECS on EC2는 정말 Fargate보다 저렴했을까 — JVM 기동 피크를 놓친 고밀도 배치가 용량 낭비로 돌아온 과정'
+++

비용을 줄이려 ECS on EC2를 골랐다. `awsvpc` 대신 `bridge`와 동적 포트 매핑을 써서 한 인스턴스에 태스크를 더 촘촘히 넣으려 했다. 그런데 십수 개 서비스를 한꺼번에 배포한 날, 운영 중이던 서비스 전체에서 504가 나기 시작했다.

처음에는 네트워크나 보안 그룹을 의심했다. 다 정상이었다. 몇 주에 걸쳐 장애를 파고들면서 알게 된 건 단순했다. EC2의 시간당 단가가 낮아도, JVM 태스크의 기동 피크를 감당하려고 인스턴스당 태스크 수와 상시 여유 용량을 줄이면 그 선택은 더 이상 싸지 않을 수 있었다.

> **사례 요약**
>
> - **문제와 영향**: JVM 서비스가 동시에 기동한 뒤 호스트 메모리 압박과 ECS·SSM agent 연결 단절이 관측됐고, 서비스 전반에서 504가 발생했다.
> - **맥락과 제약**: 비용 최소화 요구에서 ECS on EC2를 골랐다. `awsvpc`의 태스크별 ENI 한도가 당시 인스턴스의 배치 밀도를 먼저 제한할 수 있어, 동적 포트 매핑을 쓰는 `bridge`로 CPU·메모리 자원을 더 활용하려 했다.
> - **판단**: 메모리 사용률을 부하 신호로 쓰는 문제와 동시 기동 태스크를 한 호스트에 모으는 문제를 분리했다. 스케일링 지표, 태스크 배치, ASG 최소 용량을 함께 다시 잡았다.
> - **확인한 근거와 조치**: 동시 기동 직후의 호스트 메모리 압박, agent 연결 단절, 태스크 배치 불가를 확인했다. CPU 기반 신호와 인스턴스 분산 배치로 바꿨다.
> - **검증 범위와 한계**: 이후 관찰 범위에서는 같은 동시 기동 패턴이 재발하지 않았다. 다만 호스트에 접속하지 못해 OOM Killer가 어떤 프로세스를 종료했는지는 직접 확인하지 못했다.

## 1. 비용을 줄이려면 먼저 태스크를 채워야 했다

당시 요구사항은 비용 최소화였다. 같은 리전과 당시 가정한 인스턴스 유형에서는 EC2 인스턴스를 직접 운영하는 편이 비용 계산상 유리했다. Fargate는 태스크가 요청한 vCPU·메모리·스토리지에 따라 과금되고, EC2는 선택한 인스턴스 용량을 기준으로 과금된다. 단가만으로 우열을 정할 수는 없지만, 태스크를 안정적으로 높은 밀도로 채울 수 있다면 EC2가 매력적인 선택이었다.[^1]

네트워크 모드도 이 판단에 연결돼 있었다. ECS on EC2에서 `awsvpc` 태스크는 태스크마다 ENI가 필요하다. trunking을 쓰지 않는 조건에서는 인스턴스의 ENI 한도가 CPU·메모리보다 먼저 태스크 수를 막을 수 있다. AWS 예시처럼 `c5.large`는 기본 ENI 한도가 3개라 `awsvpc` 태스크를 통상 2개까지만 배치한다.[^2]

그래서 `bridge`를 골랐다. `hostPort`를 비워 동적 포트 매핑을 쓰면 Docker가 사용 가능한 호스트 포트를 잡고, 같은 서비스를 한 호스트에 여러 개 띄울 수 있다. 태스크별 ENI 수라는 제약을 피하고 EC2의 CPU·메모리를 더 활용하려는 선택이었다.[^3]

이 선택에 대가가 없었던 건 아니다. `bridge`는 태스크별 security group을 쓸 수 있는 `awsvpc`보다 네트워크 제어가 거칠어진다. 동적 포트를 쓰면 호스트 사이에 더 넓은 포트 범위를 열어야 할 수도 있다.[^4] 그래도 당시에는 비용과 태스크 밀도가 더 큰 제약이었다.

## 2. 고밀도 배치가 놓친 건 기동 순간이었다

고밀도 배치는 태스크의 reservation과 실제 사용량이 크게 다르지 않다는 전제를 깔고 있다. 하지만 이 워크로드는 JVM(Spring Boot) 애플리케이션이었다. JVM과 애플리케이션 초기화 과정에서는 일시적으로 메모리 사용량이 늘 수 있다. 평소의 평균 사용률이나 reservation만 보고 배치하면, 동시에 기동하는 순간의 호스트 메모리 피크가 빠진다.

평소에는 서비스를 한꺼번에 배포할 일이 많지 않았다. 그러나 ECS 서비스 설정을 일괄 변경하거나 예약으로 서비스를 다시 띄우는 날에는 관련 서비스 전체가 새 태스크로 교체됐다. 십수 개 서비스가 동시에 바뀌면 짧은 시간에 컨테이너가 한꺼번에 기동했다.

이 환경에서는 여러 태스크가 같은 호스트에 몰린 직후 호스트 메모리 압박이 관측됐다. ECS on EC2에서는 태스크뿐 아니라 ECS agent, Docker, 운영체제도 같은 호스트 메모리를 쓴다. 그 직후 ECS agent와 SSM agent 연결이 함께 끊겼고, Session Manager로 인스턴스에 접속할 수도 없었다.

여기서 확인한 사실과 원인 가설은 나눠야 했다. `agentConnected=false`는 ECS container agent가 ECS 백엔드와 연결돼 있지 않다는 뜻이다. agent 프로세스가 죽었거나 OOM으로 종료됐다는 뜻까지는 아니다.[^5] 당시에는 인스턴스에 들어갈 수 없어 `dmesg`, system journal, ECS agent·Docker 로그를 확인하지 못했다. 메모리 압박과 agent 연결 단절이 같은 동시 기동 패턴에서 반복됐기에, 커널 OOM Killer가 agent를 종료했을 가능성을 원인 가설로 남겼다.

## 3. agent가 끊기자 남은 용량도 쓸 수 없었다

agent 연결이 끊긴 인스턴스에는 새 태스크를 배치할 수 없다.[^6] 그래서 배치 가능한 인스턴스가 줄고, 필요한 태스크가 `PENDING`으로 남을 수 있다. 이 상태에서 태스크를 배치하지 못하면 Capacity Provider의 관리형 스케일링과 ASG 확장이 뒤따를 수 있다. 다만 AWS가 `CapacityProviderReservation` 내부 계산에서 단절 인스턴스를 정확히 어떻게 다루는지는 공개하지 않는다. 이 사건에서 확인한 범위도 “agent 단절 뒤 배치가 불가능해지고, 추가 용량 요청과 재배치가 이어졌다”까지다.

504도 agent 단절만으로 항상 생기는 결과는 아니다. 이 사건에서는 기동·재배치가 지연되면서 충분히 건강하고 요청에 응답하는 타깃을 확보하지 못했고, 그 결과 사용자 요청이 gateway timeout으로 끝났다. ALB의 응답은 타깃 상태와 요청 처리 상황에 따라 달라지므로, 다른 장애에서는 다른 상태 코드나 동작이 나올 수 있다.[^7]

스케일인도 같은 문제를 다른 모습으로 보여줬다. 관리형 종료 보호는 태스크가 실행 중인 인스턴스를 스케일인에서 보호하고, 비 daemon 태스크가 모두 멈춘 뒤에야 그 보호를 해제한다.[^8] 반면 관리형 draining은 종료가 시작된 인스턴스에서 서비스 태스크를 안전하게 옮기거나 멈추게 하는 별도 흐름이다. ECS agent 연결이 끊기면 ECS가 태스크 상태와 종료 진행을 관찰하는 일이 늦어져, 보호 해제나 draining 완료가 지연될 수 있다. 영구히 멈춘다고 단정할 수는 없고 lifecycle hook의 timeout·기본 동작과 실제 agent·시스템 로그를 함께 봐야 한다.[^9]

## 4. 낮은 단가가 용량 낭비로 바뀌는 순간

고밀도 배치를 택한 이유는 같은 인스턴스 수로 더 많은 태스크를 돌리기 위해서였다. 그런데 장애를 피하려면 현실의 밀도는 reservation만으로 정할 수 없었다. 동시 기동 피크, ECS agent·Docker·운영체제가 쓸 메모리, 인스턴스 하나가 배치 대상에서 빠졌을 때 버틸 여유까지 남겨야 했다.

그러면 호스트에는 CPU나 메모리가 남아 보여도, 안전하게 추가 태스크를 넣을 수는 없다. scale-out 때는 이미 여유가 필요한데 새 인스턴스가 뜨는 시간까지 기다려야 하고, scale-in 때는 너무 공격적으로 줄인 용량이 다음 기동 피크에서 다시 위험해진다. 이때 EC2의 낮은 인스턴스 단가만 비교하면, 실제로는 쓰지 못하는 headroom과 장애 중 늘어난 컴퓨팅 용량을 놓치게 된다.

## 5. 예방은 지표 하나를 바꾸는 일이 아니었다

먼저 스케일링 신호를 다시 봤다. Java 기반 서버는 메모리 사용률이 요청량이나 동시성과 비례하지 않을 수 있다. JVM은 컨테이너 메모리 한도에 맞춰 힙 크기를 크게 잡을 수 있어서, AWS도 일반적으로 Java 서버를 메모리 사용률로 스케일링하지 말고 CPU 사용률을 쓰라고 안내한다. heap 고갈이 먼저라면 연결 수나 요청률처럼 부하와의 상관관계를 부하 테스트로 확인한 지표가 더 낫다.[^10]

그다음 태스크 배치를 봤다. `spread(AZ) + binpack(memory)`는 예약 메모리를 더 채울 수 있는 인스턴스를 우선하는 방향으로 태스크를 배치한다. 여러 태스크가 동시에 기동하면 실제 기동 중 메모리 피크가 reservation만으로 보이지 않을 수 있고, 일부 호스트의 여유가 먼저 사라질 수 있다. 배치 전략을 `spread(AZ) + spread(instanceId)`로 바꿔 태스크를 인스턴스 전체에 흩어지게 했다. 이후 관찰한 범위에서는 같은 동시 기동 패턴이 재발하지 않았다. 다만 이 관찰만으로 모든 워크로드에 분산 배치가 정답이라고 일반화할 수는 없다.

ASG의 최소 용량도 같은 맥락에서 잡아야 한다. 평균 태스크 수가 아니라, 동시 기동 중 필요한 여유와 한 인스턴스가 배치 대상에서 빠져도 서비스가 버틸 실패 예산을 포함해야 한다. 정답이 되는 고정 숫자는 없고, 인스턴스 시작 시간·태스크 기동 피크·배포 한 번에 교체되는 태스크 수를 측정해 정해야 한다.

재발 때는 다음 신호를 같은 시간대에 남기기로 했다.

- ECS agent 로그, Docker의 OOM 상태, `dmesg`·system journal
- `agentConnected=false` 뒤의 ECS 서비스 이벤트, `PENDING` 태스크, 추가 인스턴스 요청
- ALB access log·타깃 헬스와 실제 5xx/504 비율
- 태스크별·호스트별 메모리 피크, 동시 기동 수, 인스턴스별 남은 headroom
- ASG lifecycle history와 managed termination protection·draining 진행 상태

## 6. 그래서 Fargate보다 정말 저렴했을까

이 사례 뒤에는 질문을 바꿨다. “EC2 한 대의 시간당 단가가 더 낮은가?”가 아니라, “같은 가용성 목표를 만족하려면 두 방식에서 얼마를 내야 하는가?”를 물어야 했다.

Fargate는 태스크별로 격리된 인프라를 제공하므로, EC2 호스트와 ECS agent를 여러 태스크가 공유하면서 생기는 이 장애 영역을 좁힌다. 그렇다고 태스크 자신의 메모리 한도나 OOM을 해결해 주는 건 아니다.[^11] 반대로 ECS on EC2는 워크로드가 안정적으로 높은 밀도를 낼 수 있고, 호스트 운영을 감당할 수 있다면 여전히 합리적일 수 있다.

비교할 때는 같은 리전·OS·아키텍처·구매 옵션에서 태스크 요청량과 가동 시간을 맞추고, 안정적으로 가능한 배치 밀도와 상시 headroom을 넣어야 한다. EBS, public IPv4, 로그, 데이터 전송 같은 부가 비용도 따로 계산한다. 여기에 장애 대응과 AMI·ECS agent 관리처럼 EC2 운영에서만 드는 비용까지 더해야 한다. EC2가 항상 싸거나 Fargate가 항상 비싸다는 결론은 이 비교를 생략했을 때만 나온다.[^1]

비용 최소화는 처음 선택의 이유로 충분히 타당했다. 다만 JVM 기동 피크를 무시한 고밀도는 그 비용 가정을 깨뜨렸다. 다음에는 인스턴스 단가가 아니라, 워크로드의 피크와 실패 예산까지 버티는 **실제 사용 가능 용량의 총비용**으로 계산하려 한다.

[^1]: [AWS Fargate Pricing](https://aws.amazon.com/fargate/pricing/) 및 [Amazon EC2 On-Demand Pricing](https://aws.amazon.com/ec2/pricing/on-demand/) — 두 서비스의 과금 방식과 비교 조건.
[^2]: [Increasing Amazon ECS Linux container instance network interfaces](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/container-instance-eni.html) — `awsvpc` 태스크의 ENI 한도와 trunking 조건.
[^3]: [Use Docker's virtual network for Amazon ECS Linux tasks](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/networking-networkmode-bridge.html) — `bridge` 모드와 동적 포트 매핑.
[^4]: [Network security best practices for Amazon ECS](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/security-network.html) — 태스크별 security group과 네트워크 모드의 보안 고려 사항.
[^5]: [Amazon ECS container instance state change events](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ecs_container_instance_events.html) — `agentConnected`는 agent와 ECS 백엔드의 연결 상태를 나타낸다.
[^6]: [Amazon ECS service action events](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ecs_service_events.html) — agent 연결 단절은 태스크 배치 실패 원인 중 하나다.
[^7]: [Troubleshoot your Application Load Balancers](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/load-balancer-troubleshooting.html) — HTTP 504의 원인과 점검 항목.
[^8]: [Control the instances Amazon ECS terminates](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/managed-termination-protection.html) — 관리형 종료 보호와 보호 해제 조건.
[^9]: [Safely stop Amazon ECS workloads running on EC2 instances](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/managed-instance-draining.html) — 관리형 draining과 ASG lifecycle hook의 동작.
[^10]: [Optimizing Amazon ECS service auto scaling](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/capacity-autoscaling-best-practice.html) — Java 기반 서버의 스케일링 지표 권장 사항.
[^11]: [AWS shared responsibility model for Amazon ECS](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/security-shared-model.html) — Fargate 태스크의 격리된 인프라와 EC2 launch type의 고객 관리 범위.
