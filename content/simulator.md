+++
title = '운영 시뮬레이터: 배포 직후 5xx 증가'
url = '/simulator/'
layout = 'single'
date = '2026-07-25T00:00:00+09:00'
draft = false
showTableOfContents = false
+++

> **프로토타입** — 한 번의 장애 상황에서 관측·가설·대응 흐름이 자연스러운지 확인하기 위한 브라우저 내 시뮬레이터입니다. 실제 서비스나 클라우드 리소스에는 연결되지 않습니다.

`checkout-api`의 배포 직후 5xx 오류가 증가했습니다. 먼저 신호를 확인하고, 가장 적절한 대응을 선택해 보세요. 모든 상태는 선택할 때마다 이 화면에서 갱신됩니다.

<section class="incident-simulator" aria-labelledby="incident-title">
  <header class="simulator-header">
    <div>
      <p class="simulator-eyebrow">INC-2026-0725 · SEV-2</p>
      <h2 id="incident-title">checkout-api 오류율 증가</h2>
      <p class="simulator-subtitle">14:02에 새 버전 배포 후 결제 요청 일부가 실패하고 있습니다.</p>
    </div>
    <span id="incident-status" class="incident-badge is-critical">조사 필요</span>
  </header>
  <div class="simulator-progress" aria-label="시나리오 진행 상태">
    <p id="simulator-instruction" class="simulator-instruction" role="status" aria-live="polite">1단계: 확인 가능한 신호를 먼저 살펴보세요. 최소 두 가지를 비교하면 대응 판단이 쉬워집니다.</p>
    <ol class="simulator-steps">
      <li class="simulator-step is-current" data-step="evidence" aria-current="step"><span class="step-number">1</span><span><strong>신호 확인</strong><small id="evidence-progress">0/3개 확인</small></span></li>
      <li class="simulator-step" data-step="decision"><span class="step-number">2</span><span><strong>대응 선택</strong><small>근거를 바탕으로 선택</small></span></li>
      <li class="simulator-step" data-step="debrief"><span class="step-number">3</span><span><strong>판단 결과</strong><small>대응의 영향을 확인</small></span></li>
    </ol>
  </div>
  <div class="simulator-summary" aria-label="현재 운영 상태">
    <article class="signal-card"><span>5xx 오류율</span><strong id="error-rate">12.8%</strong><small id="error-note">SLO 1% 초과</small></article>
    <article class="signal-card"><span>p95 응답 시간</span><strong id="latency">1.9s</strong><small id="latency-note">평소 240ms</small></article>
    <article class="signal-card"><span>영향 요청</span><strong id="impact">1,284</strong><small id="impact-note">최근 10분</small></article>
    <article class="signal-card"><span>실행 버전</span><strong id="version">2026.07.25-2</strong><small id="version-note">14:02 배포</small></article>
  </div>
  <div class="simulator-workspace">
    <div class="simulator-panel" aria-labelledby="evidence-title">
      <div class="panel-heading"><p class="simulator-eyebrow">EVIDENCE</p><h3 id="evidence-title">확인 가능한 신호</h3></div>
      <div class="evidence-actions">
        <button type="button" class="simulator-button" data-action="deploy">최근 배포 확인</button>
        <button type="button" class="simulator-button" data-action="logs">오류 로그 확인</button>
        <button type="button" class="simulator-button" data-action="metrics">의존성 지표 확인</button>
      </div>
      <div id="evidence-output" class="evidence-output" role="status" aria-live="polite">
        아직 확인한 신호가 없습니다. 증상만으로 대응하지 말고, 근거부터 좁혀 보세요.
      </div>
    </div>
    <div class="simulator-panel" aria-labelledby="decision-title">
      <div class="panel-heading"><p class="simulator-eyebrow">DECISION</p><h3 id="decision-title">대응 선택</h3></div>
      <p id="decision-guidance" class="decision-guidance">신호를 확인한 뒤, 가장 적절한 대응을 선택하세요.</p>
      <div class="decision-list">
        <button type="button" class="decision-button" data-action="restart"><span>서비스 재시작</span><small>증상을 일시적으로 완화할 수 있음</small></button>
        <button type="button" class="decision-button" data-action="scale"><span>인스턴스 확장</span><small>용량 부족일 때만 효과적</small></button>
        <button type="button" class="decision-button is-primary" data-action="rollback"><span>이전 버전으로 롤백</span><small>변경과 증상의 상관관계를 빠르게 차단</small></button>
      </div>
    </div>
  </div>
  <div id="debrief" class="simulator-debrief" hidden aria-labelledby="debrief-title" tabindex="-1">
    <p class="simulator-eyebrow">DEBRIEF</p>
    <h3 id="debrief-title">판단 결과</h3>
    <div id="outcome-summary" class="outcome-summary" aria-label="대응 결과 요약" aria-live="polite">
      <article class="outcome-card"><span>경과 시간</span><strong id="resolution-time">—</strong><small id="resolution-note">대응 후 결과</small></article>
      <article class="outcome-card"><span>최종 영향 요청</span><strong id="outcome-impact">—</strong><small id="outcome-impact-note">대응 후 누적</small></article>
      <article class="outcome-card"><span>운영 비용·낭비</span><strong id="outcome-cost">—</strong><small id="outcome-cost-note">대응에 따른 추가 부담</small></article>
    </div>
    <div id="debrief-output"></div>
  </div>
  <footer class="simulator-footer">
    <p id="timeline">14:02 · checkout-api 2026.07.25-2 배포 완료</p>
    <button type="button" class="simulator-reset" data-action="reset">시나리오 다시 시작</button>
  </footer>
</section>

<script defer src="/simulator.js"></script>
