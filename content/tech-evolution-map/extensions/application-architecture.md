+++
title = '애플리케이션 아키텍처'
url = '/tech-evolution-map/extensions/application-architecture/'
layout = 'tech-evolution-extension'
mainNode = 'cgi'
mainNodeTitle = '동적 서버 처리'
summary = '모놀리스·계층형·마이크로서비스는 시대의 필연적 단계가 아니라, 책임·배포·통신 경계를 어떤 비용으로 나눌지에 대한 선택이다.'
showTableOfContents = true
[[next]]
title = '로드 밸런싱'
url = '/tech-evolution-map/extensions/load-balancing/'
description = '애플리케이션을 여러 실행 단위로 나눌 때 트래픽·상태·장애를 어떻게 분산하는지 읽는다.'
+++

## 배포 단위와 책임 경계는 다르다

모놀리스는 하나의 배포 단위 안에 기능을 함께 담는 방식이다. 작은 팀이나 명확한 제품 경계에서는 전달 경로가 단순해질 수 있다. 그렇다고 내부 모듈 경계까지 없애야 하는 것은 아니다.

계층형 애플리케이션은 표현, 업무, 데이터 접근처럼 책임을 나누는 언어를 제공한다. 논리 계층이 항상 별도 서버 티어를 뜻하지는 않는다. 물리 분리는 격리와 독립 확장을 줄 수 있지만, 네트워크 지연과 장애 전파라는 비용도 만든다.

## 마이크로서비스는 복잡성을 없애지 않는다

마이크로서비스는 기능별로 독립 배포·확장할 수 있는 경계를 만들 수 있다. 대신 이전에 프로세스 안에서 끝나던 호출이 네트워크 계약이 되고, 관측·인증·재시도·데이터 정합성의 책임이 늘어난다.

따라서 서비스 분해는 팀의 변경 속도, 업무 경계, 통신 빈도, 장애 격리 요구가 실제로 있는지부터 판단한다. 도구나 인프라를 먼저 고르고 아키텍처를 맞추는 순서는 비용만 키우기 쉽다.

## 운영에서 확인할 질문

- 독립 배포가 필요한 기능 경계와 단지 코드 정리가 필요한 모듈 경계를 구분했는가?
- 통신 실패·지연·계약 변경을 어느 팀과 어느 계층이 책임지는가?
- 데이터의 소유·변경 경계가 서비스 경계와 맞는가?
- 배포 단위를 나누어 얻는 이점이 관측·보안·운영 복잡성보다 큰가?

## 출처

- [Azure Architecture Center: Architecture Styles](https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/)
- [Azure Architecture Center: N-tier Architecture Style](https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/n-tier)
