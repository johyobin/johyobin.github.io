+++
title = 'Incident Labs'
url = '/labs/'
layout = 'single'
date = '2026-07-27T00:00:00+09:00'
draft = false
showTableOfContents = false
+++

<div class="lab-catalog">
  <header class="lab-catalog-header"><p class="lab-eyebrow">INCIDENT LABS</p><h2>운영 판단을 직접 연습하세요</h2><p>각 Lab은 짧은 장애 상황에서 신호를 비교하고, 대응의 영향까지 확인하는 브라우저 내 시뮬레이션입니다. 실제 서비스나 클라우드 리소스에는 연결되지 않습니다.</p></header>
  <div class="lab-grid">
    <article class="lab-card"><div class="lab-card-head"><p class="lab-eyebrow">AVAILABLE · LAB 01</p><span class="lab-status is-available">진행 가능</span></div><h3>배포 직후 5xx 증가</h3><p>결제 의존성 timeout 변경 뒤 오류율이 증가했습니다. 증상보다 근거를 먼저 좁혀 보세요.</p><dl class="lab-meta"><div><dt>난이도</dt><dd>입문</dd></div><div><dt>예상 시간</dt><dd>3분</dd></div><div><dt>판단</dt><dd>변경·로그·지표 비교</dd></div></dl><a class="lab-launch" href="/simulator/">Lab 시작하기 <span aria-hidden="true">→</span></a></article>
    <article class="lab-card is-planned"><div class="lab-card-head"><p class="lab-eyebrow">UP NEXT · LAB 02</p><span class="lab-status">준비 중</span></div><h3>DB connection pool 고갈</h3><p>연결 수와 지연이 함께 증가하는 상황에서 포화 지점과 우선 대응을 판단합니다.</p><dl class="lab-meta"><div><dt>난이도</dt><dd>중급</dd></div><div><dt>예상 시간</dt><dd>5분</dd></div><div><dt>판단</dt><dd>포화 신호·대기열·격리</dd></div></dl></article>
    <article class="lab-card is-planned"><div class="lab-card-head"><p class="lab-eyebrow">PLANNED · LAB 03</p><span class="lab-status">준비 중</span></div><h3>HPA가 잘못된 지표를 따른다</h3><p>스케일링 신호가 실제 부하를 설명하지 못할 때, 무엇을 측정해야 하는지 점검합니다.</p><dl class="lab-meta"><div><dt>난이도</dt><dd>중급</dd></div><div><dt>예상 시간</dt><dd>5분</dd></div><div><dt>판단</dt><dd>수요 신호·용량·검증</dd></div></dl></article>
    <article class="lab-card is-planned"><div class="lab-card-head"><p class="lab-eyebrow">PLANNED · LAB 04</p><span class="lab-status">준비 중</span></div><h3>Argo CD drift와 sync 실패</h3><p>선언한 상태와 실제 워크로드가 어긋났을 때, controller 경계와 복구 범위를 추적합니다.</p><dl class="lab-meta"><div><dt>난이도</dt><dd>중급</dd></div><div><dt>예상 시간</dt><dd>6분</dd></div><div><dt>판단</dt><dd>desired state·drift·sync</dd></div></dl></article>
  </div>
</div>
