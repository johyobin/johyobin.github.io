+++
title = '운영 시뮬레이터: HPA가 잘못된 지표를 따른다'
url = '/labs/hpa-wrong-signal/'
layout = 'single'
date = '2026-07-27T00:00:00+09:00'
draft = false
weight = 30
showTableOfContents = false
summary = '부하 상황에서도 autoscaling이 지연될 때 HPA 지표와 실제 수요 신호를 비교합니다.'
landmarks = ['runtime', 'kubernetes', 'observability', 'reliability']
signals = ['CPU/MEM Metrics', 'Scale Target', 'Metric Server']
featured = true
+++

<div id="incident-simulator-root" data-scenario="hpa-wrong-signal"></div>

<script defer src="/simulator-scenarios.js"></script>
<script defer src="/simulator.js"></script>
