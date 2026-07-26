+++
title = 'CI/CD'
url = '/tech-evolution-map/extensions/ci-cd/'
layout = 'tech-evolution-extension'
mainNode = 'dvcs'
mainNodeTitle = '분산 버전 관리'
summary = 'CI/CD는 자동 배포 버튼이 아니라, 작은 변경을 자주 검증하고 언제든 배포 가능한 상태로 유지하는 전달 규율이다.'
showTableOfContents = true
[[next]]
title = 'SLO·오류 예산'
url = '/tech-evolution-map/extensions/slo-and-error-budget/'
description = '변경을 계속할지 멈출지를 사용자 관점 신뢰성 목표로 판단하는 방식을 읽는다.'
+++

## 통합과 전달은 다른 책임이다

CI는 변경을 자주 합치고 자동 빌드·테스트로 빠른 피드백을 얻는 실천이다. CD는 검증된 변경이 언제든 배포 가능한 상태를 유지하도록 전달 경로를 설계한다. 둘을 묶어 부르지만, 자동으로 프로덕션에 배포한다는 뜻은 아니다.

작은 변경은 실패 범위를 줄이고 원인을 좁히기 쉽다. 대신 테스트가 실제 계약과 다르거나, 아티팩트가 환경마다 달라지거나, 복구 경로가 없다면 배포 빈도만 높아질 수 있다.

## 파이프라인은 복구를 포함해야 한다

좋은 파이프라인은 통과 여부만 판단하지 않는다. 어떤 아티팩트를 배포했는지, 어떤 검증을 거쳤는지, 문제가 생기면 어느 버전으로 어떻게 되돌릴지 남긴다. 배포 뒤에도 오류율·지연·업무 지표를 확인해 다음 단계로 진행할지 결정해야 한다.

인프라와 애플리케이션이 함께 바뀌는 경우에는 적용 순서와 호환성도 전달 계약의 일부다. 코드 저장소는 변경 이력의 출발점이지만, 실행 환경의 실제 상태까지 보장하지는 않는다.

## 운영에서 확인할 질문

- 변경이 통합된 뒤 어떤 자동 검증이 사용자·업무 계약을 확인하는가?
- 배포 아티팩트와 실행된 버전을 추적할 수 있는가?
- 단계적 배포에서 다음 단계로 진행하거나 롤백하는 기준은 무엇인가?
- 인프라·스키마·애플리케이션 변경의 호환 순서를 검증하는가?

## 출처

- [Continuous Delivery](https://martinfowler.com/bliki/ContinuousDelivery.html)
- [Google SRE: Production Services Best Practices](https://sre.google/sre-book/service-best-practices/)
