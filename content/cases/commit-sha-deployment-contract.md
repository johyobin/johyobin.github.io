+++
title = 'GitOps 배포 버전 계약과 커밋 SHA'
date = '2026-07-24T00:00:00+09:00'
draft = false
weight = 20
summary = '가변 이미지 태그 대신 커밋 SHA를 배포 기준으로 남긴 사례.'
landmarks = ['gitops', 'delivery', 'argocd']
featured = true
+++

가변 태그인 `latest`만으로는 실제 배포 버전과 롤백 대상을 재현하기 어렵다는 문제에서 출발했다. 이미지 빌드와 GitOps desired state 갱신을 나누고, 커밋 SHA를 배포 계약으로 남기는 방식을 정리했다.

## 문제

Git 기록만으로 실행 중인 이미지와 이전 배포 버전을 확실히 식별하기 어려웠다.

## 판단

이미지 생성과 배포 결정은 별도 책임이며, 배포 버전은 변경 불가능한 값으로 Git에 선언해야 한다고 봤다.

## 결과

이미지, GitOps 태그, Argo CD sync를 따라 배포와 롤백을 확인하는 흐름을 정리했다.

## Evidence

- [GitOps 배포 버전은 누가 결정할까](/notes/commit-sha-deployment-contract/)
- [Argo CD drift와 sync 실패](/labs/argo-cd-drift-sync/)
