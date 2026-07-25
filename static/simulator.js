(() => {
  const initial = { checked: new Set(), action: null };
  let state = { ...initial, checked: new Set() };
  const $ = (id) => document.getElementById(id);

  function setStep(current) {
    const order = ['evidence', 'decision', 'debrief'];
    const currentIndex = order.indexOf(current);
    document.querySelectorAll('.simulator-step').forEach((step) => {
      const index = order.indexOf(step.dataset.step);
      step.classList.toggle('is-complete', index < currentIndex);
      step.classList.toggle('is-current', index === currentIndex);
      if (index === currentIndex) step.setAttribute('aria-current', 'step');
      else step.removeAttribute('aria-current');
    });
  }

  function updateGuidance() {
    const checkedCount = state.checked.size;
    $('evidence-progress').textContent = `${checkedCount}/3개 확인`;
    if (state.action) {
      setStep('debrief');
      $('simulator-instruction').textContent = '3단계: 판단 결과를 확인하세요. 시나리오를 다시 시작해 다른 대응도 비교할 수 있습니다.';
      $('decision-guidance').textContent = '대응을 선택했습니다. 아래 판단 결과에서 영향과 다음 확인 항목을 살펴보세요.';
    } else if (checkedCount > 0) {
      setStep('decision');
      $('simulator-instruction').textContent = `2단계: 신호 ${checkedCount}/3개를 확인했습니다. 이제 근거를 바탕으로 대응을 선택하세요.`;
      $('decision-guidance').textContent = `확인한 신호 ${checkedCount}/3개. 대응을 선택하면 판단 결과를 볼 수 있습니다.`;
    } else {
      setStep('evidence');
      $('simulator-instruction').textContent = '1단계: 확인 가능한 신호를 먼저 살펴보세요. 최소 두 가지를 비교하면 대응 판단이 쉬워집니다.';
      $('decision-guidance').textContent = '신호를 확인한 뒤, 가장 적절한 대응을 선택하세요.';
    }
  }

  function setOutcome({ elapsed, elapsedNote, impact, impactNote, cost, costNote }) {
    $('resolution-time').textContent = elapsed;
    $('resolution-note').textContent = elapsedNote;
    $('outcome-impact').textContent = impact;
    $('outcome-impact-note').textContent = impactNote;
    $('outcome-cost').textContent = cost;
    $('outcome-cost-note').textContent = costNote;
  }

  const evidence = {
    deploy: '<strong>배포 이벤트</strong><br>14:02 · <code>2026.07.25-2</code>가 배포됐습니다. 직전 버전은 <code>2026.07.18-1</code>입니다. 오류율 증가는 배포 90초 뒤부터 시작했습니다.',
    logs: '<strong>오류 로그</strong><br><code>PaymentClient: connect ETIMEDOUT payment-gateway</code><br>새 버전에서 결제 게이트웨이 연결 timeout 값이 3초에서 500ms로 변경됐습니다.',
    metrics: '<strong>의존성 지표</strong><br>CPU 41%, 메모리 58%, pod 재시작 0회입니다. 반면 payment-gateway 호출 timeout은 분당 186건입니다. 용량 포화 신호는 보이지 않습니다.'
  };

  function renderEvidence(kind) {
    state.checked.add(kind);
    $('evidence-output').innerHTML = evidence[kind];
    document.querySelector(`[data-action="${kind}"]`).classList.add('is-checked');
    updateGuidance();
  }

  function debrief(title, body, success) {
    $('debrief').hidden = false;
    $('debrief').classList.toggle('is-success', success);
    $('debrief-output').innerHTML = `<h4>${title}</h4><p>${body}</p>`;
    updateGuidance();
    $('debrief').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    $('debrief').focus({ preventScroll: true });
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
      setOutcome({ elapsed: '13분', elapsedNote: '14:02 배포 → 14:15 복구', impact: '1,341건', impactNote: '복구 전 최종 누적', cost: '추가 인프라 비용 없음', costNote: '이전 검증 버전으로 복귀' });
      debrief(exploredCause ? '근거 있는 롤백입니다.' : '복구는 됐지만, 근거를 남기세요.', exploredCause ? '13분 안에 영향을 차단했습니다. 배포 직후 시작된 timeout 변경과 오류 로그를 연결해 변경을 되돌렸습니다. 후속 조치로 timeout 변경의 검증, 의존성 호출 SLI, 배포 후 오류율 알림 기준을 점검할 수 있습니다.' : '13분 안에 영향을 줄였지만 원인을 확인하지 않은 대응입니다. 다음에는 배포 이벤트와 오류 로그를 함께 확인해 변경과 증상의 관계를 남겨 보세요.', true);
    } else if (action === 'restart') {
      $('incident-status').textContent = '미복구';
      $('error-rate').textContent = '14.1%'; $('error-note').textContent = '재시작 후 다시 증가';
      $('latency').textContent = '2.2s'; $('latency-note').textContent = '의존성 timeout 지속';
      $('impact').textContent = '2,438'; $('impact-note').textContent = '18분 누적';
      $('version').textContent = '2026.07.25-2'; $('version-note').textContent = '문제 버전 계속 실행';
      $('timeline').textContent = '14:20 · 재시작 후 오류율 재증가, 원인 미해결';
      setOutcome({ elapsed: '18분', elapsedNote: '14:02 배포 → 14:20 미복구', impact: '2,438건', impactNote: '복구하지 못해 1,097건 추가', cost: '재시작 1회', costNote: '18분 지연 · 운영자 대응 낭비' });
      debrief('재시작은 원인을 해결하지 못했습니다.', '프로세스는 다시 뜨지만 새 버전의 500ms timeout 설정도 그대로입니다. 18분이 지나도 복구되지 않아 영향 요청이 2,438건으로 늘었습니다. 변경·로그를 확인한 뒤 롤백 여부를 판단하세요.', false);
    } else {
      $('incident-status').textContent = '미복구';
      $('error-rate').textContent = '13.6%'; $('error-note').textContent = '용량 증설에도 SLO 초과';
      $('latency').textContent = '2.0s'; $('latency-note').textContent = '의존성 timeout 지속';
      $('impact').textContent = '3,012'; $('impact-note').textContent = '20분 누적';
      $('version').textContent = '2026.07.25-2'; $('version-note').textContent = '문제 버전 계속 실행';
      $('timeline').textContent = '14:22 · 인스턴스 2개 추가, timeout 지속으로 미복구';
      setOutcome({ elapsed: '20분', elapsedNote: '14:02 배포 → 14:22 미복구', impact: '3,012건', impactNote: '복구하지 못해 1,671건 추가', cost: '인스턴스 2개 증설', costNote: '10분 추가 사용 · 불필요한 인프라 비용' });
      debrief('용량을 늘렸지만 병목 신호가 아닙니다.', 'CPU·메모리 여유가 있는데도 20분 동안 복구되지 않아 영향 요청이 3,012건까지 늘었습니다. 인스턴스 2개를 더 썼지만 timeout 원인은 그대로입니다. 의존성 오류와 최근 변경을 먼저 비교해 보세요.', false);
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
    setOutcome({ elapsed: '—', elapsedNote: '대응 후 결과', impact: '—', impactNote: '대응 후 누적', cost: '—', costNote: '대응에 따른 추가 부담' });
    $('debrief').hidden = true;
    document.querySelectorAll('.is-checked').forEach((item) => item.classList.remove('is-checked'));
    updateGuidance();
  }

  document.querySelector('.incident-simulator').addEventListener('click', (event) => {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (!action) return;
    if (evidence[action]) renderEvidence(action);
    else if (action === 'reset') reset();
    else respond(action);
  });
})();
