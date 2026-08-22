(function () {
  var root = document.documentElement;

  function setTheme(theme) {
    root.dataset.theme = theme;
    localStorage.setItem('kedzie-atlas-appearance', theme);
    document.querySelectorAll('.theme-toggle').forEach(function (button) {
      var isNight = theme === 'night';
      button.setAttribute('aria-pressed', String(isNight));
      var text = button.querySelector('.theme-toggle-text');
      if (text) text.textContent = isNight ? 'Parchment' : 'Night Chart';
    });
  }

  function setupTheme() {
    var current = root.dataset.theme === 'night' ? 'night' : 'parchment';
    setTheme(current);
    document.querySelectorAll('.theme-toggle').forEach(function (button) {
      button.addEventListener('click', function () {
        setTheme(root.dataset.theme === 'night' ? 'parchment' : 'night');
      });
    });
  }

  function setupMenu() {
    var toggle = document.querySelector('.nav-toggle');
    var menu = document.getElementById('site-menu');
    if (!toggle || !menu) return;
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', String(open));
      menu.classList.toggle('is-open', open);
    });
    menu.addEventListener('click', function (event) {
      if (event.target.closest('a')) {
        toggle.setAttribute('aria-expanded', 'false');
        menu.classList.remove('is-open');
      }
    });
  }

  function setupAtlasMap() {
    var buttons = Array.from(document.querySelectorAll('[data-landmark]'));
    var panels = Array.from(document.querySelectorAll('[data-landmark-panel]'));
    if (!buttons.length || !panels.length) return;

    function select(id) {
      buttons.forEach(function (button) {
        button.setAttribute('aria-pressed', String(button.dataset.landmark === id));
      });
      panels.forEach(function (panel) {
        panel.hidden = panel.dataset.landmarkPanel !== id;
      });
    }

    buttons.forEach(function (button, index) {
      button.addEventListener('click', function () {
        select(button.dataset.landmark);
      });
      button.addEventListener('focus', function () {
        select(button.dataset.landmark);
      });
      button.addEventListener('keydown', function (event) {
        if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(event.key)) return;
        event.preventDefault();
        var direction = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1;
        var next = (index + direction + buttons.length) % buttons.length;
        buttons[next].focus();
        select(buttons[next].dataset.landmark);
      });
    });
  }

  function setupCodeCopy() {
    if (!navigator.clipboard && !document.queryCommandSupported('copy')) return;
    document.querySelectorAll('.article-content pre').forEach(function (pre) {
      if (pre.classList.contains('mermaid') || pre.closest('.highlight-wrapper')) return;
      var wrapper = pre.parentElement && pre.parentElement.classList.contains('highlight') ? pre.parentElement : document.createElement('div');
      if (!wrapper.classList.contains('highlight')) {
        pre.parentNode.insertBefore(wrapper, pre);
        wrapper.appendChild(pre);
      }
      wrapper.classList.add('highlight-wrapper');
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'copy-button';
      button.textContent = 'Copy';
      button.addEventListener('click', function () {
        var text = pre.innerText;
        var done = function () {
          button.textContent = 'Copied';
          setTimeout(function () { button.textContent = 'Copy'; }, 1400);
        };
        if (navigator.clipboard) {
          navigator.clipboard.writeText(text).then(done);
        } else {
          var area = document.createElement('textarea');
          area.value = text;
          area.setAttribute('readonly', '');
          area.style.position = 'fixed';
          area.style.opacity = '0';
          document.body.appendChild(area);
          area.select();
          document.execCommand('copy');
          area.remove();
          done();
        }
      });
      wrapper.insertBefore(button, wrapper.firstChild);
    });
  }

  function setupNoteFilters() {
    var filters = Array.from(document.querySelectorAll('[data-note-filter]'));
    var rows = Array.from(document.querySelectorAll('.note-row[data-landmarks]'));
    if (!filters.length || !rows.length) return;

    filters.forEach(function (filter) {
      filter.addEventListener('click', function () {
        var target = filter.dataset.noteFilter;
        filters.forEach(function (item) {
          item.setAttribute('aria-pressed', String(item === filter));
        });
        rows.forEach(function (row) {
          var landmarks = (row.dataset.landmarks || '').split(/\s+/);
          row.hidden = target !== 'all' && !landmarks.includes(target);
        });
      });
    });
  }

  function setupSearch() {
    var panel = document.getElementById('search-panel');
    var input = document.getElementById('search-query');
    var results = document.getElementById('search-results');
    var openers = document.querySelectorAll('.search-toggle');
    var closer = document.querySelector('.search-close');
    if (!panel || !input || !results || !openers.length) return;

    var indexPromise;
    var previousFocus;

    function getIndex() {
      if (!indexPromise) {
        indexPromise = fetch('/index.json')
          .then(function (response) { return response.ok ? response.json() : []; })
          .catch(function () { return []; });
      }
      return indexPromise;
    }

    function openSearch() {
      previousFocus = document.activeElement;
      panel.hidden = false;
      input.value = '';
      results.innerHTML = '<p class="search-empty">검색어를 입력하세요.</p>';
      getIndex();
      requestAnimationFrame(function () { input.focus(); });
    }

    function closeSearch() {
      panel.hidden = true;
      if (previousFocus && previousFocus.focus) previousFocus.focus();
    }

    function render(items, query) {
      var q = query.trim().toLowerCase();
      if (q.length < 2) {
        results.innerHTML = '<p class="search-empty">두 글자 이상 입력하세요.</p>';
        return;
      }
      var matches = items.filter(function (item) {
        return [item.title, item.summary, item.section, item.content].join(' ').toLowerCase().includes(q);
      }).slice(0, 10);
      if (!matches.length) {
        results.innerHTML = '<p class="search-empty">검색 결과가 없습니다.</p>';
        return;
      }
      results.innerHTML = matches.map(function (item) {
        return '<a class="search-result" role="listitem" href="' + item.url + '"><strong>' + escapeHtml(item.title) + '</strong><span>' + escapeHtml(item.summary || item.section || '') + '</span></a>';
      }).join('');
    }

    input.addEventListener('input', function () {
      getIndex().then(function (items) { render(items, input.value); });
    });
    openers.forEach(function (button) { button.addEventListener('click', openSearch); });
    if (closer) closer.addEventListener('click', closeSearch);
    panel.addEventListener('click', function (event) {
      if (event.target === panel) closeSearch();
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !panel.hidden) closeSearch();
      if (event.key === '/' && panel.hidden && !/input|textarea|select/i.test(document.activeElement.tagName)) {
        event.preventDefault();
        openSearch();
      }
    });
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (char) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char];
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    setupTheme();
    setupMenu();
    setupAtlasMap();
    setupCodeCopy();
    setupNoteFilters();
    setupSearch();
  });
})();
