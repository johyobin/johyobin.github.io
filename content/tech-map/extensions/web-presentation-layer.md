+++
title = '웹 표현 계층'
url = '/tech-map/extensions/web-presentation-layer/'
aliases = ['/tech-evolution-map/extensions/web-presentation-layer/']
layout = 'tech-evolution-extension'
mainNode = 'html'
mainNodeTitle = 'HTML'
summary = 'HTML로 문서의 의미와 구조를 표현하고 CSS로 표현을 분리하면, 화면 변경의 영향 범위를 더 분명하게 관리할 수 있다.'
showTableOfContents = true
[[next]]
title = '브라우저 상호작용'
url = '/tech-map/extensions/browser-interactions/'
description = '구조와 표현 위에 비동기 상호작용이 더해질 때 생기는 상태·성능 문제를 읽는다.'
+++

## 구조와 표현은 다른 변경 이유를 가진다

HTML은 문서의 제목, 목록, 입력처럼 콘텐츠의 구조와 의미를 표현한다. CSS는 그 구조를 어떤 화면 크기와 매체에서 어떻게 보일지 정한다. 둘을 나누면 디자인 변경이 문서 의미를 바꾸지 않고, 콘텐츠 구조 변경도 모든 표현 규칙을 함께 흔들지 않게 된다.

이 분리는 재사용의 출발점이지만 자동으로 좋은 UI를 보장하지는 않는다. 의미 없는 컨테이너와 특정 화면에만 맞춘 선택자는 결국 변경 비용을 다시 키운다.

## 접근성과 성능도 표현 계층의 품질이다

구조가 의미를 담으면 보조 기술과 검색 도구가 문서를 해석할 기반이 생긴다. 표현을 숨기거나 재배치해도 키보드 탐색 순서와 읽기 순서가 달라지지 않는지 확인해야 한다.

스타일시트는 렌더링에 필요한 자원이다. 사용하지 않는 규칙, 큰 글꼴, 화면 전환 효과는 사용자 경험에 영향을 준다. 따라서 UI 배포는 화면 모양뿐 아니라 접근성 회귀와 성능 예산을 함께 검증해야 한다.

## 운영에서 확인할 질문

- 구조를 나타내는 HTML과 시각적 배치를 위한 CSS 책임이 섞이지 않았는가?
- 키보드·보조 기술의 탐색 순서가 화면에서 이해되는 순서와 맞는가?
- 스타일·글꼴 자원이 초기 렌더링과 상호작용 지연에 미치는 영향은 무엇인가?
- 화면 변경을 자동 접근성·성능 검증에 포함했는가?

## 출처

- [HTML Design Principles](https://www.w3.org/TR/html-design-principles/)
- [CSS 2.1 Specification](https://www.w3.org/TR/CSS2/)
