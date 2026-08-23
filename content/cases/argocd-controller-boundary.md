+++
title = 'Argo CD 애플리케이션 수명 주기 및 controller 경계'
date = '2026-07-24T00:00:00+09:00'
draft = false
weight = 30
summary = 'ApplicationSet과 App-of-Apps에서 controller별 관리 범위와 확인 지점을 분리한 사례.'
landmarks = ['argocd', 'gitops', 'kubernetes']
featured = true
+++

ApplicationSet과 App-of-Apps를 함께 쓸 때 Git 변경이 어떤 controller를 거쳐 배포 리소스까지 이어지는지 정리했다. 생성, 갱신, drift 복구, 삭제에 서로 다른 설정이 관여하는 이유도 구분했다.

## 문제

Git 변경 뒤 새 서비스 생성, 기존 서비스 갱신, 삭제 범위의 확인 지점이 섞였다.

## 판단

ApplicationSet의 generated `Application` 관리와 application controller의 workload sync를 분리했다. `prune`, Application 삭제, 리소스 보존 정책을 같은 스위치로 보지 않았다.

## 결과

생성, 갱신, 삭제마다 확인할 controller와 정책을 좁혔다. 삭제 전에는 비운영 환경 검증과 변경 리뷰가 필요하다는 기준도 남겼다.

## Evidence

- [Argo CD GitOps에서 애플리케이션 생명주기를 설계하는 법](/notes/argocd-application-lifecycle-design/)
- [Git에서 Argo CD가 참조하는 매니페스트 디렉터리를 삭제하면 어디까지 삭제되는가](/notes/argocd-application-lifecycle/)
