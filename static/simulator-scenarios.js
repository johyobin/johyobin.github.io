/*
 * Add a new Incident Lab by adding one scenario object below, then create a
 * Hugo page whose #incident-simulator-root data-scenario matches its key.
 * Keep stable ids for metrics, evidence, decisions, and outcomes so the common
 * renderer can update the scenario without scenario-specific HTML or logic.
 */
window.incidentScenarios = {
  'deployment-timeout': {
    prototypeLabel: '프로토타입',
    prototypeNotice: '한 번의 장애 상황에서 관측·가설·대응 흐름이 자연스러운지 확인하기 위한 브라우저 내 시뮬레이터입니다. 실제 서비스나 클라우드 리소스에는 연결되지 않습니다.',
    intro: '<code>checkout-api</code>의 배포 직후 5xx 오류가 증가했습니다. 먼저 신호를 확인하고, 가장 적절한 대응을 선택해 보세요. 모든 상태는 선택할 때마다 이 화면에서 갱신됩니다.',
    incident: {
      code: 'INC-2026-0725 · SEV-2',
      title: 'checkout-api 오류율 증가',
      subtitle: '14:02에 새 버전 배포 후 결제 요청 일부가 실패하고 있습니다.'
    },
    steps: [
      { id: 'evidence', label: '신호 확인', note: '0/3개 확인' },
      { id: 'decision', label: '대응 선택', note: '근거를 바탕으로 선택' },
      { id: 'debrief', label: '판단 결과', note: '대응의 영향을 확인' }
    ],
    copy: {
      initialInstruction: '1단계: 확인 가능한 신호를 먼저 살펴보세요. 최소 두 가지를 비교하면 대응 판단이 쉬워집니다.',
      initialDecisionGuidance: '신호를 확인한 뒤, 가장 적절한 대응을 선택하세요.',
      decisionInstruction: (checked, total) => `2단계: 신호 ${checked}/${total}개를 확인했습니다. 이제 근거를 바탕으로 대응을 선택하세요.`,
      decisionGuidance: (checked, total) => `확인한 신호 ${checked}/${total}개. 대응을 선택하면 판단 결과를 볼 수 있습니다.`,
      debriefInstruction: '3단계: 판단 결과를 확인하세요. 시나리오를 다시 시작해 다른 대응도 비교할 수 있습니다.',
      afterDecisionGuidance: '대응을 선택했습니다. 아래 판단 결과에서 영향과 다음 확인 항목을 살펴보세요.',
      initialEvidence: '아직 확인한 신호가 없습니다. 증상만으로 대응하지 말고, 근거부터 좁혀 보세요.'
    },
    initial: {
      status: { label: '조사 필요', className: 'is-critical' },
      metrics: [
        { id: 'error-rate', label: '5xx 오류율', value: '12.8%', note: 'SLO 1% 초과' },
        { id: 'latency', label: 'p95 응답 시간', value: '1.9s', note: '평소 240ms' },
        { id: 'impact', label: '영향 요청', value: '1,284', note: '최근 10분' },
        { id: 'version', label: '실행 버전', value: '2026.07.25-2', note: '14:02 배포' }
      ],
      outcomes: [
        { id: 'elapsed', label: '경과 시간', value: '—', note: '대응 후 결과' },
        { id: 'outcome-impact', label: '최종 영향 요청', value: '—', note: '대응 후 누적' },
        { id: 'cost', label: '운영 비용·낭비', value: '—', note: '대응에 따른 추가 부담' }
      ],
      timeline: '14:02 · checkout-api 2026.07.25-2 배포 완료'
    },
    evidence: [
      { id: 'deploy', label: '최근 배포 확인', contentHtml: '<strong>배포 이벤트</strong><br>14:02 · <code>2026.07.25-2</code>가 배포됐습니다. 직전 버전은 <code>2026.07.18-1</code>입니다. 오류율 증가는 배포 90초 뒤부터 시작했습니다.' },
      { id: 'logs', label: '오류 로그 확인', contentHtml: '<strong>오류 로그</strong><br><code>PaymentClient: connect ETIMEDOUT payment-gateway</code><br>새 버전에서 결제 게이트웨이 연결 timeout 값이 3초에서 500ms로 변경됐습니다.' },
      { id: 'metrics', label: '의존성 지표 확인', contentHtml: '<strong>의존성 지표</strong><br>CPU 41%, 메모리 58%, pod 재시작 0회입니다. 반면 payment-gateway 호출 timeout은 분당 186건입니다. 용량 포화 신호는 보이지 않습니다.' }
    ],
    decisions: [
      {
        id: 'restart', label: '서비스 재시작', hint: '증상을 일시적으로 완화할 수 있음',
        result: {
          status: { label: '미복구', className: 'is-critical' },
          metrics: [
            { id: 'error-rate', value: '14.1%', note: '재시작 후 다시 증가' }, { id: 'latency', value: '2.2s', note: '의존성 timeout 지속' }, { id: 'impact', value: '2,438', note: '18분 누적' }, { id: 'version', value: '2026.07.25-2', note: '문제 버전 계속 실행' }
          ],
          outcomes: [
            { id: 'elapsed', value: '18분', note: '14:02 배포 → 14:20 미복구' }, { id: 'outcome-impact', value: '2,438건', note: '복구하지 못해 1,097건 추가' }, { id: 'cost', value: '재시작 1회', note: '18분 지연 · 운영자 대응 낭비' }
          ],
          timeline: '14:20 · 재시작 후 오류율 재증가, 원인 미해결',
          debrief: { default: { success: false, title: '재시작은 원인을 해결하지 못했습니다.', body: '프로세스는 다시 뜨지만 새 버전의 500ms timeout 설정도 그대로입니다. 18분이 지나도 복구되지 않아 영향 요청이 2,438건으로 늘었습니다. 변경·로그를 확인한 뒤 롤백 여부를 판단하세요.' } }
        }
      },
      {
        id: 'scale', label: '인스턴스 확장', hint: '용량 부족일 때만 효과적',
        result: {
          status: { label: '미복구', className: 'is-critical' },
          metrics: [
            { id: 'error-rate', value: '13.6%', note: '용량 증설에도 SLO 초과' }, { id: 'latency', value: '2.0s', note: '의존성 timeout 지속' }, { id: 'impact', value: '3,012', note: '20분 누적' }, { id: 'version', value: '2026.07.25-2', note: '문제 버전 계속 실행' }
          ],
          outcomes: [
            { id: 'elapsed', value: '20분', note: '14:02 배포 → 14:22 미복구' }, { id: 'outcome-impact', value: '3,012건', note: '복구하지 못해 1,671건 추가' }, { id: 'cost', value: '인스턴스 2개 증설', note: '10분 추가 사용 · 불필요한 인프라 비용' }
          ],
          timeline: '14:22 · 인스턴스 2개 추가, timeout 지속으로 미복구',
          debrief: { default: { success: false, title: '용량을 늘렸지만 병목 신호가 아닙니다.', body: 'CPU·메모리 여유가 있는데도 20분 동안 복구되지 않아 영향 요청이 3,012건까지 늘었습니다. 인스턴스 2개를 더 썼지만 timeout 원인은 그대로입니다. 의존성 오류와 최근 변경을 먼저 비교해 보세요.' } }
        }
      },
      {
        id: 'rollback', label: '이전 버전으로 롤백', hint: '변경과 증상의 상관관계를 빠르게 차단', primary: true,
        result: {
          status: { label: '복구됨', className: 'is-healthy' },
          metrics: [
            { id: 'error-rate', value: '0.3%', note: 'SLO 범위 내' }, { id: 'latency', value: '260ms', note: '정상 범위' }, { id: 'impact', value: '1,341', note: '복구 전 누적' }, { id: 'version', value: '2026.07.18-1', note: '14:15 롤백 완료' }
          ],
          outcomes: [
            { id: 'elapsed', value: '13분', note: '14:02 배포 → 14:15 복구' }, { id: 'outcome-impact', value: '1,341건', note: '복구 전 최종 누적' }, { id: 'cost', value: '추가 인프라 비용 없음', note: '이전 검증 버전으로 복귀' }
          ],
          timeline: '14:15 · 이전 검증 버전으로 롤백, 오류율 정상화',
          debrief: {
            default: { success: true, title: '복구는 됐지만, 근거를 남기세요.', body: '13분 안에 영향을 줄였지만 원인을 확인하지 않은 대응입니다. 다음에는 배포 이벤트와 오류 로그를 함께 확인해 변경과 증상의 관계를 남겨 보세요.' },
            whenEvidence: {
              required: ['deploy', 'logs'],
              complete: { success: true, title: '근거 있는 롤백입니다.', body: '13분 안에 영향을 차단했습니다. 배포 직후 시작된 timeout 변경과 오류 로그를 연결해 변경을 되돌렸습니다. 후속 조치로 timeout 변경의 검증, 의존성 호출 SLI, 배포 후 오류율 알림 기준을 점검할 수 있습니다.' }
            }
          }
        }
      }
    ]
  }
};
