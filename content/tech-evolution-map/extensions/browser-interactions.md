+++
title = '브라우저 상호작용'
url = '/tech-evolution-map/extensions/browser-interactions/'
layout = 'tech-evolution-extension'
mainNode = 'javascript'
mainNodeTitle = 'JavaScript'
summary = '비동기 요청과 부분 갱신은 화면을 빠르게 만들지만, 클라이언트 상태·중복 요청·API 부하라는 새로운 운영 책임을 만든다.'
showTableOfContents = true
protocols = [
  { name = 'HTTP', layer = 4, layer_name = 'Application', pdu = 'message' },
]
[[next]]
title = '웹 API 설계'
url = '/tech-evolution-map/extensions/web-api-design/'
description = '브라우저의 요청이 안정적으로 동작하려면 어떤 HTTP API 계약이 필요한지 읽는다.'
+++

## 페이지 전체를 다시 받지 않는 선택

AJAX는 JavaScript와 HTTP 요청을 조합해, 페이지 이동 없이 필요한 데이터만 받아 화면 일부를 갱신하는 방식이다. 사용자는 더 짧은 대기와 끊기지 않는 상호작용을 얻는다.

그러나 화면이 가진 상태와 서버가 가진 상태가 더 자주 분리된다. 사용자가 빠르게 연속 입력하거나 네트워크가 지연되면, 늦게 도착한 응답이 최신 화면을 덮어쓸 수 있다. 비동기 상호작용은 화면 갱신 자체보다 요청의 순서와 취소를 설계 대상으로 만든다.

## API 호출량은 사용자 경험의 일부다

부분 갱신은 한 화면에서 더 많은 API 요청을 만든다. 자동 완성, 주기적 새로고침, 재시도는 응답성을 높일 수 있지만, API·데이터베이스에 순간 부하를 만들 수도 있다.

그래서 클라이언트는 입력을 묶거나 늦추고, 더 이상 필요 없는 요청은 취소하며, 실패 시 무작정 반복하지 않도록 설계한다. 서버는 중복 요청, 시간 초과, 일시적 실패가 정상적인 입력이라는 전제에서 멱등성·제한·관측을 준비한다.

## 운영에서 확인할 질문

- 사용자 행동 하나가 평균 몇 개의 API 요청을 만들며, 피크에서는 어떻게 달라지는가?
- 이전 요청의 응답이 최신 화면 상태를 덮어쓰지 않게 취소·순서 처리를 했는가?
- 재시도는 어떤 오류에만 적용하며, 중복 실행 위험은 없는가?
- 브라우저 오류와 API 지연·오류를 같은 사용자 흐름으로 연결해 볼 수 있는가?

## 출처

- [ECMA-262 — ECMAScript Language Specification](https://ecma-international.org/publications-and-standards/standards/ecma-262/)
- [XMLHttpRequest Standard](https://www.w3.org/TR/XMLHttpRequest/)
