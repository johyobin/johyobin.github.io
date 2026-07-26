+++
title = '웹 API 설계'
url = '/tech-evolution-map/extensions/web-api-design/'
layout = 'tech-evolution-extension'
mainNode = 'http'
mainNodeTitle = 'HTTP'
summary = 'HTTP의 제약을 그대로 복사하는 것이 아니라, 리소스·무상태성·캐시라는 선택이 API 계약과 운영에 무엇을 요구하는지 읽는다.'
showTableOfContents = true
[[next]]
title = '브라우저 상호작용'
url = '/tech-evolution-map/extensions/browser-interactions/'
description = '비동기 요청과 부분 갱신이 API 계약을 어떻게 더 자주, 더 복잡하게 만드는지 이어서 읽는다.'
+++

## HTTP 위에서 API를 설계한다는 뜻

HTTP는 리소스, 메서드, 상태 코드, 캐시처럼 중간 계층도 이해할 수 있는 공통 의미를 제공한다. REST는 이 HTTP 기반 상호작용을 설명하는 아키텍처 제약이다. 그래서 REST를 단순한 URL 규칙이나 JSON 응답 형식으로 축소하면, 왜 그런 제약을 선택하는지 놓치기 쉽다.

API 경계는 애플리케이션의 책임과 변경 가능한 범위를 드러낸다. 리소스를 어떻게 식별하고 표현할지, 오류를 어떤 의미로 전달할지, 누가 상태를 보관할지를 먼저 정해야 인프라의 캐시·프록시·관측 설정도 그 계약을 뒷받침할 수 있다.

## 무상태성은 서버의 기억을 없애라는 말이 아니다

무상태성은 각 요청이 처리에 필요한 정보를 담아 서버가 특정 클라이언트의 이전 요청 순서에 묶이지 않게 하는 제약이다. 이 제약은 서버를 수평 확장하거나 장애 난 인스턴스를 교체할 때 유리하다.

대신 상태가 사라지는 것은 아니다. 사용자 세션, 장바구니, 작업 진행 상태처럼 제품에 필요한 상태는 데이터 저장소, 토큰, 또는 별도 리소스의 계약으로 명시해야 한다. 상태의 위치를 감추면 로드 밸런싱·재시도·장애 복구에서 의도하지 않은 결합이 드러난다.

## 캐시는 성능 기능이면서 계약이다

HTTP 캐시는 같은 표현을 다시 가져오는 비용과 원본 부하를 줄일 수 있다. 하지만 사용자별 응답, 권한, 갱신 직후의 최신성처럼 캐시와 충돌하는 요구도 있다. `Cache-Control`, 검증자, 무효화 전략은 애플리케이션이 허용하는 오래된 데이터의 범위를 드러내는 계약이다.

따라서 캐시 적중률만 보고 성공으로 판단하지 않는다. 원본 부하와 지연이 줄었는지, 잘못된 사용자 데이터가 섞이지 않는지, 갱신 뒤 허용할 수 없는 오래된 응답이 남지 않는지를 함께 확인해야 한다.

## 운영에서 확인할 질문

- API의 상태 코드 비율은 사용자 실패와 어떤 관계가 있는가?
- 재시도 가능한 요청과 중복 실행이 위험한 요청을 계약에서 구분했는가?
- 캐시 키와 권한·언어·버전 같은 표현 차이를 함께 고려했는가?
- 변경 전후의 호환성, 지연, 오류율을 배포 판단에 사용하고 있는가?

## 출처

- [RFC 9110 — HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110.html)
- [Roy T. Fielding, Architectural Styles and the Design of Network-based Software Architectures](https://www.ics.uci.edu/~fielding/pubs/dissertation/fielding_dissertation.pdf)
