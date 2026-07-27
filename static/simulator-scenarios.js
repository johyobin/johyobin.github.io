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
  },
  'db-connection-pool': {
    prototypeLabel: '프로토타입',
    prototypeNotice: '한 번의 장애 상황에서 관측·가설·대응 흐름이 자연스러운지 확인하기 위한 브라우저 내 시뮬레이터입니다. 실제 서비스나 클라우드 리소스에는 연결되지 않습니다.',
    intro: '<code>orders-api</code>의 요청 지연과 5xx 오류가 증가했습니다. DB가 느리다는 가정부터 확인하지 말고, 연결을 누가 오래 점유하는지 먼저 좁혀 보세요.',
    incident: {
      code: 'INC-2026-0727 · SEV-2',
      title: 'orders-api DB connection pool 고갈',
      subtitle: '10:12 이후 주문 조회 요청이 대기하고 있으며, 일부 요청이 connection timeout으로 실패합니다.'
    },
    steps: [
      { id: 'evidence', label: '신호 확인', note: '0/3개 확인' },
      { id: 'decision', label: '대응 선택', note: '근거를 바탕으로 선택' },
      { id: 'debrief', label: '판단 결과', note: '대응의 영향을 확인' }
    ],
    copy: {
      initialInstruction: '1단계: 요청량, 연결 대기열, worker 동시성을 비교해 포화 지점을 찾으세요.',
      initialDecisionGuidance: '증상만 완화하는 대응보다, 연결을 점유하는 원인을 먼저 확인하세요.',
      decisionInstruction: (checked, total) => `2단계: 신호 ${checked}/${total}개를 확인했습니다. 이제 포화 원인을 줄일 대응을 선택하세요.`,
      decisionGuidance: (checked, total) => `확인한 신호 ${checked}/${total}개. 대응을 선택하면 연결 대기열과 영향 변화를 볼 수 있습니다.`,
      debriefInstruction: '3단계: 판단 결과를 확인하세요. 시나리오를 다시 시작해 다른 대응의 비용도 비교할 수 있습니다.',
      afterDecisionGuidance: '대응을 선택했습니다. 아래 결과에서 연결 점유와 사용자 영향이 어떻게 바뀌었는지 살펴보세요.',
      initialEvidence: '아직 확인한 신호가 없습니다. 요청량, connection pool, worker 동시성을 순서대로 비교해 보세요.'
    },
    initial: {
      status: { label: '조사 필요', className: 'is-critical' },
      metrics: [
        { id: 'db-connections', label: 'DB 연결 점유', value: '100/120', note: '대기 37건' },
        { id: 'latency', label: 'p95 응답 시간', value: '4.8s', note: '평소 420ms' },
        { id: 'error-rate', label: '5xx 오류율', value: '6.4%', note: 'SLO 1% 초과' },
        { id: 'db-cpu', label: 'DB CPU', value: '46%', note: '포화 신호 없음' }
      ],
      outcomes: [
        { id: 'elapsed', label: '경과 시간', value: '—', note: '대응 후 결과' },
        { id: 'outcome-impact', label: '최종 영향 요청', value: '—', note: '대응 후 누적' },
        { id: 'cost', label: '운영 비용·낭비', value: '—', note: '대응에 따른 추가 부담' }
      ],
      timeline: '10:12 · bulk-export worker 동시성 증가, orders-api 대기열 상승'
    },
    evidence: [
      { id: 'traffic', label: '요청량 확인', contentHtml: '<strong>요청 추이</strong><br>주문 조회 요청량은 평소와 비슷합니다. 다만 10:12에 <code>bulk-export</code> worker 동시성이 4에서 32로 증가했습니다.' },
      { id: 'pool', label: 'connection pool 확인', contentHtml: '<strong>연결 대기열</strong><br><code>active=100, idle=0, pending=37</code><br>DB CPU 46%, 디스크 대기 2ms입니다. DB 자체 포화보다 애플리케이션의 연결 대기가 핵심 신호입니다.' },
      { id: 'worker', label: 'worker 로그 확인', contentHtml: '<strong>worker 로그</strong><br><code>bulk-export: transaction held 28s · concurrency=32</code><br>대량 export가 트랜잭션을 오래 유지해 API와 같은 DB 연결 예산을 점유하고 있습니다.' }
    ],
    decisions: [
      {
        id: 'restart-api', label: 'orders-api 재시작', hint: '일시적으로 연결을 비울 수 있음',
        result: {
          status: { label: '미복구', className: 'is-critical' },
          metrics: [
            { id: 'db-connections', value: '106/120', note: '대기 44건으로 재증가' }, { id: 'latency', value: '5.2s', note: 'worker 점유 지속' }, { id: 'error-rate', value: '7.1%', note: 'SLO 초과 지속' }, { id: 'db-cpu', value: '47%', note: '여전히 포화 아님' }
          ],
          outcomes: [
            { id: 'elapsed', value: '18분', note: '10:12 → 10:30 미복구' }, { id: 'outcome-impact', value: '2,246건', note: '복구하지 못해 1,184건 추가' }, { id: 'cost', value: '재시작 1회', note: '18분 지연 · worker 원인 미해결' }
          ],
          timeline: '10:30 · orders-api 재시작 뒤 대기열 재증가, worker 연결 점유 지속',
          debrief: { default: { success: false, title: '재시작은 연결을 잠시 비울 뿐입니다.', body: 'API 프로세스가 다시 시작해도 bulk-export worker는 트랜잭션을 계속 잡고 있습니다. DB CPU가 낮다는 신호와 connection 대기열을 함께 확인했다면, 연결을 점유하는 작업부터 격리해야 합니다.' } }
        }
      },
      {
        id: 'scale-api', label: 'orders-api 인스턴스 확장', hint: '연결 수를 더 늘릴 수 있음',
        result: {
          status: { label: '악화됨', className: 'is-critical' },
          metrics: [
            { id: 'db-connections', value: '120/120', note: 'DB 최대 연결 수 도달' }, { id: 'latency', value: '6.1s', note: '새 인스턴스도 대기' }, { id: 'error-rate', value: '9.3%', note: 'connection timeout 증가' }, { id: 'db-cpu', value: '49%', note: 'CPU가 원인이 아님' }
          ],
          outcomes: [
            { id: 'elapsed', value: '21분', note: '10:12 → 10:33 미복구' }, { id: 'outcome-impact', value: '3,108건', note: '복구하지 못해 2,046건 추가' }, { id: 'cost', value: '인스턴스 2개 증설', note: 'DB 연결 경쟁과 인프라 비용 증가' }
          ],
          timeline: '10:33 · orders-api 2개 증설, DB 최대 연결 수 도달',
          debrief: { default: { success: false, title: '확장은 연결 경쟁을 키웠습니다.', body: '요청 처리 인스턴스를 늘리면 DB 연결을 더 요구합니다. 이미 worker가 연결 예산을 점유한 상태에서는 새 인스턴스도 대기열에 합류할 뿐입니다. DB CPU가 낮고 pending 연결이 늘었다면, 먼저 점유 작업을 줄여야 합니다.' } }
        }
      },
      {
        id: 'isolate-worker', label: 'bulk-export worker 격리', hint: '긴 트랜잭션의 연결 점유를 먼저 차단', primary: true,
        result: {
          status: { label: '복구됨', className: 'is-healthy' },
          metrics: [
            { id: 'db-connections', value: '54/120', note: '대기 0건으로 정상화' }, { id: 'latency', value: '420ms', note: '정상 범위' }, { id: 'error-rate', value: '0.4%', note: 'SLO 범위 내' }, { id: 'db-cpu', value: '42%', note: '정상 범위' }
          ],
          outcomes: [
            { id: 'elapsed', value: '12분', note: '10:12 → 10:24 복구' }, { id: 'outcome-impact', value: '1,426건', note: '복구 전 최종 누적' }, { id: 'cost', value: 'worker 1개 격리', note: 'export 지연 · API 영향 차단' }
          ],
          timeline: '10:24 · bulk-export worker 격리, connection 대기열 정상화',
          debrief: {
            default: { success: true, title: '영향은 줄였지만, 근거를 남기세요.', body: 'worker를 격리해 12분 안에 API 영향을 차단했습니다. 다음에는 connection 대기열, 트랜잭션 보유 시간, worker 동시성을 함께 기록해 격리 기준을 명확히 하세요.' },
            whenEvidence: {
              required: ['pool', 'worker'],
              complete: { success: true, title: '연결 점유를 근거로 격리했습니다.', body: 'DB CPU가 낮은데 pending 연결이 늘고, bulk-export가 긴 트랜잭션을 유지한다는 근거를 연결했습니다. worker를 격리해 12분 안에 대기열과 API 오류를 정상화했습니다. 후속 조치로 worker 전용 연결 예산, 동시성 상한, 장기 트랜잭션 알림을 검토하세요.' }
            }
          }
        }
      }
    ]
  }
};
