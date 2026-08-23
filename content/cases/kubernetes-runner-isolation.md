+++
title = 'Kubernetes 러너 격리 및 보안'
date = '2026-07-24T00:00:00+09:00'
draft = false
weight = 40
summary = '공용 Kubernetes executor에서 Runner manager, Job Pod, 권한, cache 경계를 나눈 사례.'
landmarks = ['kubernetes', 'runtime', 'delivery']
featured = true
+++

여러 프로젝트가 공용 Kubernetes executor를 사용할 때 Runner manager와 빌드 Job Pod의 자원, 권한, cache 경계를 분리한 사례다. 어떤 Job이 어떤 조건에서 실행되는지 추적할 수 있도록 실행 환경을 구성했다.

## 문제

공용 Runner에서 프로젝트별 권한, cache, 순간 자원 사용량이 섞일 위험이 있었다.

## 판단

Runner manager와 Job Pod의 자원을 분리하고, tag, 보호 설정, 전용 ServiceAccount, 프로젝트별 cache로 실행 경계를 설정했다.

## 검증 범위와 한계

설정과 책임 경계는 확인했다. 피크 빌드의 대기 시간, cache 적중률, 비용 효과는 별도 관측이 필요하다.

## Evidence

- [공용 GitLab Runner를 Deployment 하나로 보면 놓치는 것](/notes/kubernetes-runner-isolation/)
