+++
title = 'ECS on EC2 런타임 메모리 및 용량 관리'
date = '2026-07-24T00:00:00+09:00'
draft = false
weight = 10
summary = '인스턴스 타입별 예약 메모리 임계값 설정과 태스크 배치 전략을 통한 가용성 확보 사례.'
landmarks = ['runtime', 'reliability']
featured = true
+++

비용을 줄이기 위해 ECS on EC2의 고밀도 배치를 선택했지만, 시스템 프로세스용 메모리를 태스크 배치 용량에서 명시적으로 제외하지 않은 상태에서 동시 기동이 겹쳤다. EC2와 Fargate의 비교 기준을 인스턴스 단가가 아니라 시스템용 메모리와 실패 예산까지 포함한 실제 사용 가능 용량으로 다시 잡았다.

## 문제

동시 기동 뒤 호스트 메모리 압박과 ECS, SSM agent 연결 단절이 관측됐고, 태스크 재배치 지연으로 서비스 전반에 504가 발생했다.

## 판단

`ECS_RESERVED_MEMORY` 미설정을 구성상 취약점으로 보고, 동시 기동 수, 태스크 메모리 설정, 배치 전략, 클러스터 예비 용량을 다층 방어로 검토했다.

## 결과와 한계

인스턴스 분산 배치와 ASG 최소 용량 조정 뒤 동일 패턴은 관찰 범위에서 재발하지 않았다. 당시 호스트 로그 부재로 OOM Killer의 직접 원인은 확정하지 않았다.

## Evidence

- [ECS on EC2는 정말 Fargate보다 저렴했을까](/notes/jvm-memory-usage-not-load/)
