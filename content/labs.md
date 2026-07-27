+++
title = 'Incident Labs'
url = '/labs/'
layout = 'single'
date = '2026-07-27T00:00:00+09:00'
draft = false
showTableOfContents = false
+++

<div class="lab-catalog">
  <header class="lab-catalog-header"><p class="lab-eyebrow">INCIDENT LABS</p><h2>운영 사례의 확인 흐름</h2><p>각 Lab은 이 블로그의 장애·배포·GitOps 사례와 연결된 판단 기록입니다. 신호, 대응 범위, 영향을 비교해 사례에서 사용한 확인 기준을 보완합니다. 실제 서비스나 클라우드 리소스에는 연결되지 않습니다.</p></header>
  <div class="lab-grid">
    <article class="lab-card"><div class="lab-card-head"><p class="lab-eyebrow">CASE NOTE · 01</p><span class="lab-status is-available">사례 확인</span></div><h3>배포 직후 5xx 증가</h3><p>결제 의존성 timeout 변경 뒤 오류율이 증가했습니다. 증상보다 근거를 먼저 좁혀 봅니다.</p><dl class="lab-meta"><div><dt>관련 영역</dt><dd>배포 안정성</dd></div><div><dt>확인 범위</dt><dd>3개 신호</dd></div><div><dt>판단 기준</dt><dd>변경·로그·지표</dd></div></dl><a class="lab-launch" href="/simulator/">사례 흐름 보기 <span aria-hidden="true">→</span></a></article>
    <article class="lab-card"><div class="lab-card-head"><p class="lab-eyebrow">CASE NOTE · 02</p><span class="lab-status is-available">사례 확인</span></div><h3>DB connection pool 고갈</h3><p>연결 수와 지연이 함께 증가하는 상황에서 포화 지점과 대응 범위를 비교합니다.</p><dl class="lab-meta"><div><dt>관련 영역</dt><dd>장애 대응</dd></div><div><dt>확인 범위</dt><dd>3개 신호</dd></div><div><dt>판단 기준</dt><dd>포화·대기열·격리</dd></div></dl><a class="lab-launch" href="/labs/db-connection-pool/">사례 흐름 보기 <span aria-hidden="true">→</span></a></article>
    <article class="lab-card"><div class="lab-card-head"><p class="lab-eyebrow">CASE NOTE · 03</p><span class="lab-status is-available">사례 확인</span></div><h3>HPA가 잘못된 지표를 따른다</h3><p>메모리 사용률과 실제 요청 수요를 비교해 스케일링 기준을 다시 확인합니다.</p><dl class="lab-meta"><div><dt>관련 영역</dt><dd>신뢰성</dd></div><div><dt>확인 범위</dt><dd>3개 신호</dd></div><div><dt>판단 기준</dt><dd>수요·용량·검증</dd></div></dl><a class="lab-launch" href="/labs/hpa-wrong-signal/">사례 흐름 보기 <span aria-hidden="true">→</span></a></article>
    <article class="lab-card"><div class="lab-card-head"><p class="lab-eyebrow">CASE NOTE · 04</p><span class="lab-status is-available">사례 확인</span></div><h3>Argo CD drift와 sync 실패</h3><p>선언한 상태와 실제 워크로드가 어긋났을 때, controller 경계와 복구 범위를 추적합니다.</p><dl class="lab-meta"><div><dt>관련 영역</dt><dd>GitOps</dd></div><div><dt>확인 범위</dt><dd>3개 근거</dd></div><div><dt>판단 기준</dt><dd>desired·drift·sync</dd></div></dl><a class="lab-launch" href="/labs/argo-cd-drift-sync/">사례 흐름 보기 <span aria-hidden="true">→</span></a></article>
  </div>
</div>
