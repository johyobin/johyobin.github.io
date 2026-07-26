+++
title = '구성 관리 자동화·IaC'
url = '/tech-evolution-map/extensions/configuration-management-and-iac/'
layout = 'tech-evolution-extension'
mainNode = 'iaas'
mainNodeTitle = 'IaaS'
summary = '인프라 변경을 콘솔의 기억에 맡기지 않고, 원하는 상태를 선언·검토·재현해 변경 위험과 드리프트를 다룬다.'
showTableOfContents = true
[[next]]
title = 'CI/CD'
url = '/tech-evolution-map/extensions/ci-cd/'
description = '인프라 변경을 포함한 모든 변경을 검증하고 복구 가능한 전달 흐름으로 만드는 방법을 읽는다.'
+++

## 구성 관리와 IaC는 같은 문제를 다른 층에서 다룬다

구성 관리 자동화는 서버 안의 패키지, 설정 파일, 실행 상태를 원하는 상태로 맞추는 데 초점을 둔다. IaC는 네트워크, 컴퓨팅, 권한, 저장소처럼 인프라 리소스를 코드로 선언하고 변경 이력을 남긴다.

둘 다 수동 변경에서 생기는 환경 차이와 재현 불가능성을 줄인다. 하지만 선언 파일이 있다는 사실만으로 실제 상태가 항상 맞는 것은 아니다. 적용 실패, 권한 차이, 콘솔의 긴급 변경은 선언과 실제의 차이인 드리프트를 만든다.

## 상태와 권한은 운영 대상이다

IaC 도구가 참조하는 상태는 민감한 구성과 리소스 식별자를 담을 수 있다. 상태 접근 권한, 잠금, 백업, 변경 검토를 설계하지 않으면 자동화가 더 큰 변경 범위를 빠르게 만들 수 있다.

변경 전에는 계획을 검토하고, 적용 뒤에는 실제 상태와 서비스 지표를 확인한다. 인프라 코드도 애플리케이션 아키텍처의 서비스 경계·통신 방식·확장 요구를 뒷받침해야 한다.

## 운영에서 확인할 질문

- 선언한 원하는 상태와 실제 상태의 차이를 어떻게 감지·복구하는가?
- 상태 파일과 비밀값에 접근할 수 있는 주체를 최소화했는가?
- 변경 계획을 검토하고 영향 범위와 복구 경로를 확인하는가?
- 인프라 변경이 애플리케이션의 배포·통신·확장 경계와 맞는가?

## 출처

- [Terraform: Infrastructure as Code](https://developer.hashicorp.com/terraform/intro)
- [Puppet: Declarative Language](https://www.puppet.com/docs/puppet/latest/lang_summary.html)
