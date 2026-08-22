+++
title = '운영 시뮬레이터: DB connection pool 고갈'
url = '/labs/db-connection-pool/'
layout = 'single'
date = '2026-07-27T00:00:00+09:00'
draft = false
weight = 20
showTableOfContents = false
summary = '트래픽 증가 상황에서 connection pool 대기열, worker 동시성, DB 부하를 비교합니다.'
landmarks = ['kubernetes', 'observability', 'reliability']
signals = ['Connection Count', 'Wait Time', 'DB Load']
featured = true
+++

<div id="incident-simulator-root" data-scenario="db-connection-pool"></div>

<script defer src="/simulator-scenarios.js"></script>
<script defer src="/simulator.js"></script>
