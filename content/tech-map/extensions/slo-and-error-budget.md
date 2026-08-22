+++
title = 'SLO·오류 예산'
url = '/tech-map/extensions/slo-and-error-budget/'
aliases = ['/tech-evolution-map/extensions/slo-and-error-budget/']
layout = 'tech-evolution-extension'
mainNode = 'kubernetes'
mainNodeTitle = '컨테이너 오케스트레이션'
summary = 'SLO와 오류 예산은 안정성과 변경 속도의 충돌을 사용자에게 중요한 신뢰성 목표와 허용 실패량으로 판단하게 한다.'
showTableOfContents = true
+++

## SLO는 사용자가 느끼는 품질 목표다

SLI는 서비스 품질의 측정값이고, SLO는 그 측정값에 대한 목표다. CPU 사용률처럼 시스템이 쉽게 내보내는 값이 아니라, 사용자가 요청을 성공했는지와 얼마나 기다렸는지 같은 경험에서 출발해야 한다.

목표를 100%로 두면 모든 변경과 비용을 안정성에만 쓰게 될 수 있다. 반대로 너무 느슨하면 사용자가 기대한 서비스를 제공하지 못한다. 목표의 값과 측정 창은 제품 요구와 운영 제약을 함께 반영하는 선택이다.

## 오류 예산은 배포 위험의 공통 언어다

오류 예산은 SLO를 놓칠 수 있는 허용 실패량이다. 예산이 남아 있으면 변경을 계속할 여지가 있고, 예산을 빠르게 쓰고 있다면 원인 분석·복구·신뢰성 작업에 우선순위를 둘 근거가 생긴다.

오류 예산은 배포를 자동으로 금지하는 규칙이 아니다. 어떤 오류가 예산에 포함되는지, 긴급 보안 변경을 어떻게 다루는지, 측정 데이터가 믿을 만한지를 팀이 먼저 합의해야 한다.

## 운영에서 확인할 질문

- SLI가 서버 내부 지표가 아니라 사용자 성공·지연을 충분히 대표하는가?
- SLO의 측정 창, 대상 요청, 제외 조건을 명확히 정의했는가?
- 오류 예산 소진 속도가 배포 단계·롤백·신뢰성 투자 판단에 반영되는가?
- 목표를 지키는 비용과 사용자가 얻는 가치를 함께 검토하는가?

## 출처

- [Google SRE Book: Service Level Objectives](https://sre.google/sre-book/service-level-objectives/)
- [Google SRE Book: Embracing Risk](https://sre.google/sre-book/embracing-risk/)
