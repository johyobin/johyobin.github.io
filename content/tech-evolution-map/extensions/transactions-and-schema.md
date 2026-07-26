+++
title = '트랜잭션·스키마 설계'
url = '/tech-evolution-map/extensions/transactions-and-schema/'
layout = 'tech-evolution-extension'
mainNode = 'relational-data'
mainNodeTitle = '관계형 데이터베이스'
summary = '트랜잭션은 동시 변경의 경계를 정하고, 스키마는 데이터가 바뀌는 속도를 견딜 수 있는 계약을 만든다.'
showTableOfContents = true
[[next]]
title = '애플리케이션 아키텍처'
url = '/tech-evolution-map/extensions/application-architecture/'
description = '데이터 경계가 애플리케이션의 책임·배포·통신 경계와 어떻게 맞물리는지 읽는다.'
+++

## 트랜잭션은 변경을 묶는 경계다

한 업무가 여러 데이터를 함께 바꾼다면, 일부만 반영된 상태가 남지 않아야 한다. 트랜잭션은 이 변경 묶음이 모두 반영되거나 모두 취소되도록 경계를 만든다. 하지만 동시 요청이 같은 데이터를 바꾸는 상황까지 자동으로 해결해 주지는 않는다.

격리 수준은 다른 트랜잭션의 변경을 어느 시점까지 보게 할지 정한다. 강한 격리는 예측하기 쉬운 대신 대기·충돌·처리량 비용을 키울 수 있다. 반대로 느슨한 격리는 성능에 유리할 수 있지만, 애플리케이션이 허용할 수 없는 읽기·갱신 결과가 생기지 않는지 확인해야 한다.

## 스키마 변경도 배포의 일부다

스키마는 저장 구조가 아니라 애플리케이션과 데이터 사이의 계약이다. 새 필드를 읽는 코드와 새 필드를 쓰는 코드를 한 번에 배포할 수 없을 때가 있으므로, 호환되는 변경을 먼저 적용하고 데이터 이관·검증 뒤 이전 구조를 제거하는 순서를 설계한다.

이때 백필 작업의 부하, 긴 트랜잭션, 잠금 범위, 롤백 가능성을 함께 본다. 인프라 용량을 늘리는 것만으로는 업무 정합성과 배포 순서에서 생기는 문제를 해결할 수 없다.

## 운영에서 확인할 질문

- 어떤 변경 묶음이 반드시 함께 성공하거나 실패해야 하는가?
- 동시 갱신 시 애플리케이션이 허용하는 결과와 허용하지 않는 결과는 무엇인가?
- 스키마 변경은 이전·새 애플리케이션 버전이 함께 동작하는 기간을 견디는가?
- 잠금 대기, 쿼리 지연, 이관 처리량을 제품 영향과 연결해 보고 있는가?

## 출처

- [PostgreSQL: Transaction Isolation](https://www.postgresql.org/docs/current/transaction-iso.html)
- [PostgreSQL: DDL Constraints](https://www.postgresql.org/docs/current/ddl-constraints.html)
