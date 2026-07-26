+++
title = '로드 밸런싱'
url = '/tech-evolution-map/extensions/load-balancing/'
layout = 'tech-evolution-extension'
mainNode = 'cdn'
mainNodeTitle = '콘텐츠 전송 네트워크'
summary = '로드 밸런싱은 요청을 여러 실행 단위에 나누지만, 세션·헬스 체크·장애 감지의 기준을 애플리케이션 의미와 맞춰야 한다.'
showTableOfContents = true
[[next]]
title = '구성 관리 자동화·IaC'
url = '/tech-evolution-map/extensions/configuration-management-and-iac/'
description = '실행 단위와 전달 경로가 늘어날 때, 원하는 인프라 상태를 어떻게 재현·검토할지 읽는다.'
+++

## 분산은 가용성을 자동으로 만들지 않는다

로드 밸런서는 들어오는 요청을 여러 대상에 분산하고, 정상 대상만 선택하도록 도울 수 있다. 이로써 한 인스턴스의 용량과 장애가 전체 서비스에 미치는 영향을 줄일 수 있다.

하지만 대상이 여러 개라고 해서 서비스가 항상 복구 가능한 것은 아니다. 모든 대상이 같은 데이터베이스·외부 의존성·잘못된 배포에 묶여 있다면, 트래픽만 더 넓게 같은 실패로 보낼 수 있다.

## 헬스 체크는 업무 의미를 알아야 한다

헬스 체크가 포트가 열렸는지만 확인하면, 실제 요청을 처리할 수 없는 대상을 정상으로 볼 수 있다. 반대로 데이터베이스의 일시 지연을 즉시 비정상으로 판단하면, 정상 인스턴스까지 한꺼번에 제외하는 연쇄 장애를 만들 수 있다.

세션 고정은 상태를 가진 애플리케이션을 당장 운영하는 데 도움이 될 수 있지만, 특정 인스턴스 의존성과 불균형을 만든다. 상태를 어디에 둘지, 재시도는 어느 요청에 안전한지, 장애 전환 중 무엇을 허용할지를 함께 설계해야 한다.

## 운영에서 확인할 질문

- 헬스 체크 성공이 사용자 요청 성공을 충분히 대표하는가?
- 대상 제외·재등록의 속도가 장애 전파와 복구에 어떤 영향을 주는가?
- 세션·업로드·장기 연결 같은 상태가 분산 정책과 충돌하지 않는가?
- 지연, 오류율, 대상별 부하를 사용자 영향과 연결해 관측하는가?

## 출처

- [AWS: Health Checks for Your Target Groups](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/target-group-health-checks.html)
- [RFC 9110 — HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110.html)
