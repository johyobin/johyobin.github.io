(() => {
  const initial = { checked: new Set(), action: null };
  let state = { ...initial, checked: new Set() };
  const $ = (id) => document.getElementById(id);

  const evidence = {
    deploy: '<strong>배포 이벤트</strong><br>14:02 · <code>2026.07.25-2</code>가 배포됐습니다. 직전 버전은 <code>2026.07.18-1</code>입니다. 오류율 증가는 배포 90초 뒤부터 시작했습니다.',
    logs: '<strong>오류 로그</strong><br><code>PaymentClient: connect ETIMEDOUT payment-gateway</code><br>새 버전에서 결제 게이트웨이 연결 timeout 값이 3초에서 500ms로 변경됐습니다.',
    metrics: '<strong>의존성 지표</strong><br>CPU 41%, 메모리 58%, pod 재시작 0회입니다. 반면 payment-gateway 호출 timeout은 분당 186건입니다. 용량 포화 신호는 보이지 않습니다.'
  };

  function renderEvidence(kind) {
    state.checked.add(kind);
    $('evidence-output').innerHTML = evidence[kind];
    document.querySelector(`[data-action="${kind}"]`).classList.add('is-checked');
  }

  function debrief(title, body, success) {
    $('debrief').hidden = false;
    $('debrief').classList.toggle('is-success', success);
    $('debrief-output').innerHTML = `<h4>${title}</h4><p>${body}</p>`;
  }

  function respond(action) {
    state.action = action;
    const exploredCause = state.checked.has('deploy') && state.checked.has('logs');
    if (action === 'rollback') {
      $('incident-status').textContent = '복구됨';
      $('incident-status').className = 'incident-badge is-healthy';
      $('error-rate').textContent = '0.3%'; $('error-note').textContent = 'SLO 범위 내';
      $('latency').textContent = '260ms'; $('latency-note').textContent = '정상 범위';
      $('impact').textContent = '1,341'; $('impact-note').textContent = '복구 전 누적';
      $('version').textContent = '2026.07.18-1'; $('version-note').textContent = '14:15 롤백 완료';
      $('timeline').textContent = '14:15 · 이전 검증 버전으로 롤백, 오류율 정상화';
      debrief(exploredCause ? '근거 있는 롤백입니다.' : '복구는 됐지만, 근거를 남기세요.', exploredCause ? '배포 직후 시작된 timeout 변경과 오류 로그를 연결해 변경을 되돌렸습니다. 후속 조치로 timeout 변경의 검증, 의존성 호출 SLI, 배포 후 오류율 알림 기준을 점검할 수 있습니다.' : '롤백은 영향을 줄였지만 원인을 확인하지 않은 대응입니다. 다음에는 배포 이벤트와 오류 로그를 함께 확인해 변경과 증상의 관계를 남겨 보세요.', true);
    } else if (action === 'restart') {
      $('timeline').textContent = '14:12 · 서비스 재시작 완료, 오류율이 다시 증가함';
      debrief('재시작은 원인을 해결하지 못했습니다.', '프로세스는 다시 뜨지만 새 버전의 500ms timeout 설정도 그대로입니다. 오류율은 잠시 낮아졌다가 다시 증가합니다. 변경·로그를 확인한 뒤 롤백 여부를 판단하세요.', false);
    } else {
      $('timeline').textContent = '14:12 · 인스턴스 2개 추가, payment-gateway timeout 지속';
      debrief('용량을 늘렸지만 병목 신호가 아닙니다.', 'CPU·메모리 여유가 있고 timeout이 핵심 신호입니다. 스케일 아웃은 비용만 늘릴 수 있습니다. 의존성 오류와 최근 변경을 먼저 비교해 보세요.', false);
    }
  }

  function reset() {
    state = { ...initial, checked: new Set() };
    $('incident-status').textContent = '조사 필요'; $('incident-status').className = 'incident-badge is-critical';
    $('error-rate').textContent = '12.8%'; $('error-note').textContent = 'SLO 1% 초과';
    $('latency').textContent = '1.9s'; $('latency-note').textContent = '평소 240ms';
    $('impact').textContent = '1,284'; $('impact-note').textContent = '최근 10분';
    $('version').textContent = '2026.07.25-2'; $('version-note').textContent = '14:02 배포';
    $('evidence-output').textContent = '아직 확인한 신호가 없습니다. 증상만으로 대응하지 말고, 근거부터 좁혀 보세요.';
    $('timeline').textContent = '14:02 · checkout-api 2026.07.25-2 배포 완료';
    $('debrief').hidden = true;
    document.querySelectorAll('.is-checked').forEach((item) => item.classList.remove('is-checked'));
  }

  document.querySelector('.incident-simulator').addEventListener('click', (event) => {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (!action) return;
    if (evidence[action]) renderEvidence(action);
    else if (action === 'reset') reset();
    else respond(action);
  });
})();
