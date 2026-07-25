(() => {
  const root = document.getElementById('tech-evolution-map-root');
  const data = window.techEvolutionMap;
  if (!root || !data) return;

  const types = { solves: '한계를 해결함', enables: '다음을 가능하게 함', transforms: '운영 방식을 전환함' };
  const referenceById = new Map(data.references.map((reference) => [reference.id, reference]));
  const nodeById = new Map(data.nodes.map((node) => [node.id, node]));
  let state = { selected: 'http', era: 'all', detailed: false };
  const escape = (value) => String(value).replace(/[&<>"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[character]);

  function nodeButton(node) {
    return `<button type="button" class="tem-node domain-${node.domain}" data-node="${node.id}" aria-pressed="${node.id === state.selected}"><span class="tem-node-year">${node.year}</span><strong>${escape(node.title)}</strong><span>${escape(node.english)}</span></button>`;
  }

  function timeline() {
    return data.eras.filter((era) => state.era === 'all' || era.id === state.era).map((era) => {
      const nodes = data.nodes.filter((node) => node.era === era.id);
      return `<section class="tem-era" id="era-${era.id}" aria-labelledby="era-title-${era.id}"><header><p>${era.years}</p><h3 id="era-title-${era.id}">${era.title}</h3><span>${era.question}</span></header><div class="tem-node-grid">${nodes.map(nodeButton).join('')}</div></section>`;
    }).join('');
  }

  function architectureLane() {
    const nodes = data.nodes.filter((node) => node.domain === 'application').sort((a, b) => a.year.localeCompare(b.year));
    return `<section class="tem-architecture-lane" aria-labelledby="tem-architecture-title"><header><div><p class="tem-eyebrow">APPLICATION ARCHITECTURE LANE</p><h2 id="tem-architecture-title">애플리케이션 아키텍처</h2><p>같은 시간축의 한 레인이다. 배포 단위와 책임 경계가 바뀌며, 인프라·운영의 요구도 함께 바뀐다.</p></div><span>시간 →</span></header><div class="tem-lane-track">${nodes.map((node, index) => `<div class="tem-lane-stop"><span class="tem-lane-year">${node.year}</span>${nodeButton(node)}${index < nodes.length - 1 ? '<i aria-hidden="true">→</i>' : ''}</div>`).join('')}</div><p class="tem-lane-note">모놀리스와 3계층은 배타적 선택지가 아니다. 하나의 모놀리스 안에도 논리 계층을 둘 수 있다.</p></section>`;
  }

  function detail() {
    const node = nodeById.get(state.selected);
    const reference = referenceById.get(node.sourceId);
    const related = data.links.filter((link) => link.from === node.id || link.to === node.id);
    const grouped = ['why', 'solved', 'enabled'].map((field) => `<div><dt>${({ why: '왜 등장했나', solved: '무엇을 해결했나', enabled: '무엇을 가능하게 했나' })[field]}</dt><dd>${escape(node[field])}</dd></div>`).join('');
    return `<aside class="tem-detail" aria-live="polite" aria-labelledby="tem-detail-title"><div class="tem-detail-kicker"><span class="tem-domain">${node.domain}</span><span>${node.year}</span></div><h2 id="tem-detail-title">${escape(node.title)} <small>${escape(node.english)}</small></h2><dl class="tem-story">${grouped}</dl><section class="tem-ops"><h3>DevOps 관점</h3><div><strong>운영 질문</strong><p>${escape(node.ops)}</p></div><div><strong>도구·관행</strong><p>${escape(node.tools)}</p></div><div><strong>아키텍처·트레이드오프</strong><p>${escape(node.architecture)}</p></div></section><section class="tem-connections"><h3>이 노드의 연결</h3><ul>${related.map((link) => { const other = nodeById.get(link.from === node.id ? link.to : link.from); const direction = link.from === node.id ? '→' : '←'; return `<li><button type="button" data-node="${other.id}"><span class="tem-edge ${link.type}">${types[link.type]}</span>${direction} ${escape(other.title)}</button></li>`; }).join('')}</ul></section><p class="tem-reference"><strong>출처</strong><a href="${reference.url}" target="_blank" rel="noopener noreferrer">${escape(reference.title)} <span aria-hidden="true">↗</span></a></p></aside>`;
  }

  function graph() {
    const selected = nodeById.get(state.selected);
    const visibleLinks = data.links.filter((link) => state.detailed || link.core).filter((link) => link.from === selected.id || link.to === selected.id);
    const relatedIds = [...new Set(visibleLinks.flatMap((link) => [link.from, link.to]))];
    const graphNodes = relatedIds.map((id) => nodeById.get(id));
    const positions = new Map();
    positions.set(selected.id, { x: 300, y: 150 });
    graphNodes.filter((node) => node.id !== selected.id).forEach((node, index) => {
      const angle = ((index / Math.max(1, graphNodes.length - 1)) * Math.PI * 1.6) + 0.75;
      positions.set(node.id, { x: 300 + Math.cos(angle) * 210, y: 150 + Math.sin(angle) * 108 });
    });
    const lines = visibleLinks.map((link) => { const a = positions.get(link.from); const b = positions.get(link.to); return `<line class="tem-graph-edge ${link.type}" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" marker-end="url(#arrow-${link.type})"><title>${types[link.type]}</title></line>`; }).join('');
    const circles = graphNodes.map((node) => { const point = positions.get(node.id); return `<g class="tem-graph-node${node.id === selected.id ? ' is-selected' : ''}" data-node="${node.id}" transform="translate(${point.x} ${point.y})" tabindex="0" role="button" aria-label="${escape(node.title)} 선택"><circle r="${node.id === selected.id ? 37 : 29}"></circle><text y="5">${escape(node.title)}</text></g>`; }).join('');
    const empty = visibleLinks.length === 0 ? '<p class="tem-graph-empty">핵심 경로에서 직접 연결된 노드가 없습니다. 상세 연결을 켜 보세요.</p>' : '';
    return `<section class="tem-graph-panel" aria-labelledby="tem-graph-title"><header><div><p class="tem-eyebrow">CAUSAL GRAPH</p><h2 id="tem-graph-title">선택 그래프</h2><p>선은 “관련 있음”이 아니라, 설명 가능한 인과 주장입니다.</p></div><label class="tem-toggle"><input type="checkbox" data-detailed ${state.detailed ? 'checked' : ''}><span>상세 연결 보기</span></label></header>${empty}<svg class="tem-graph" viewBox="0 0 600 300" role="img" aria-label="${escape(selected.title)}의 인과 관계 그래프"><defs>${Object.keys(types).map((type) => `<marker id="arrow-${type}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z"></path></marker>`).join('')}</defs>${lines}${circles}</svg><div class="tem-legend">${Object.entries(types).map(([type, label]) => `<span><i class="${type}"></i>${label}</span>`).join('')}</div></section>`;
  }

  function render() {
    root.innerHTML = `<section class="tech-evolution-map" aria-label="기술 진화 지도"><header class="tem-hero"><p class="tem-eyebrow">TECH EVOLUTION MAP · ${data.nodes.length} NODES</p><h1>기술은 목록이 아니라,<br><em>제약에 대한 다음 선택</em>이다.</h1><p>웹의 탄생부터 AI 에이전트까지. 시간축을 따라 읽고, 한 노드가 해결한 한계와 다음 변화를 탐색하세요.</p><div class="tem-metrics"><span><strong>6</strong> 시대</span><span><strong>${data.nodes.length}</strong> 기술 노드</span><span><strong>${data.links.length}</strong> 인과 연결</span></div></header><nav class="tem-era-filter" aria-label="시대 필터"><button type="button" data-era="all" aria-pressed="${state.era === 'all'}">전체</button>${data.eras.map((era) => `<button type="button" data-era="${era.id}" aria-pressed="${state.era === era.id}">${era.years}</button>`).join('')}</nav>${architectureLane()}<div class="tem-layout"><main class="tem-timeline"><div class="tem-section-head"><p class="tem-eyebrow">READ THE PATH</p><h2>시간을 따라, 원인을 읽기</h2><p>각 노드를 선택하면 인과와 운영 연결점이 열립니다.</p></div>${timeline()}</main><div class="tem-sticky">${detail()}</div></div>${graph()}<section class="tem-method"><p class="tem-eyebrow">HOW TO READ</p><h2>세 가지 질문으로 읽는다</h2><div><article><strong>1</strong><h3>이전의 한계는 무엇이었나?</h3><p>기술은 기존 시스템의 비용·규모·복잡성·신뢰성 문제에 대한 응답으로 읽습니다.</p></article><article><strong>2</strong><h3>무엇을 가능하게 했나?</h3><p>시간 순서가 아닌, 다음 기술의 조건을 만든 연결만 표시합니다.</p></article><article><strong>3</strong><h3>운영 책임은 어디로 갔나?</h3><p>편의가 늘어난 자리에는 관측·보안·비용·복구의 새로운 책임이 생깁니다.</p></article></div></section><section class="tem-bibliography"><p class="tem-eyebrow">REFERENCES</p><h2>전체 참고문헌</h2><ol>${data.references.map((reference) => `<li><a href="${reference.url}" target="_blank" rel="noopener noreferrer">${escape(reference.title)} <span aria-hidden="true">↗</span></a></li>`).join('')}</ol></section></section>`;
  }

  function select(nodeId) { state.selected = nodeId; render(); requestAnimationFrame(() => root.querySelector('.tem-detail')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })); }
  root.addEventListener('click', (event) => { const node = event.target.closest('[data-node]'); const era = event.target.closest('[data-era]'); if (node) select(node.dataset.node); else if (era) { state.era = era.dataset.era; render(); } });
  root.addEventListener('change', (event) => { if (event.target.matches('[data-detailed]')) { state.detailed = event.target.checked; render(); } });
  root.addEventListener('keydown', (event) => { const node = event.target.closest('.tem-graph-node'); if (node && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); select(node.dataset.node); } });
  render();
})();
