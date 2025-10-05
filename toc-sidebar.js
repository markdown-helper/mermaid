/**
 * Sidebar Collapsible Table of Contents
 * Dynamically injects a toggle button and sidebar ToC, builds nested structure
 * from document headings, supports collapsible groups and highlights current section.
 */

(function () {
  const LEVELS = { H1: 1, H2: 2, H3: 3, H4: 4, H5: 5, H6: 6 };
  const BODY_ATTR = 'html-show-sidebar-toc';
  const TOC_NAV_ID = 'generated-toc';
  const TOC_BTN_ID = 'sidebar-toc-btn';
  const STORAGE_KEY = 'html-show-sidebar-toc';

  function ensureIds(headings) {
    headings.forEach(h => {
      const text = (h.textContent || '').trim();
      if (!h.id) {
        const id = text.toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^\w\-]+/g, '');
        h.id = id || `section-${Math.random().toString(36).slice(2)}`;
      }
    });
    return headings;
  }

  function buildTree(headings) {
    const root = { children: [], level: 0 };
    const stack = [root];
    headings.forEach(h => {
      const level = LEVELS[h.tagName] || 6;
      const node = { level, text: (h.textContent || '').trim(), id: h.id, children: [] };
      while (stack.length && stack[stack.length - 1].level >= level) stack.pop();
      stack[stack.length - 1].children.push(node);
      stack.push(node);
    });
    return root.children;
  }

  function renderNodes(nodes) {
    const ul = document.createElement('ul');
    nodes.forEach(n => {
      const li = document.createElement('li');
      if (n.children.length > 0) {
        const details = document.createElement('details');
        details.open = n.level <= 2; // open top levels by default
        const summary = document.createElement('summary');
        const a = document.createElement('a');
        a.href = '#' + n.id;
        a.textContent = n.text;
        summary.appendChild(a);
        details.appendChild(summary);
        details.appendChild(renderNodes(n.children));
        li.appendChild(details);
      } else {
        const a = document.createElement('a');
        a.href = '#' + n.id;
        a.textContent = n.text;
        li.appendChild(a);
      }
      ul.appendChild(li);
    });
    return ul;
  }

  function createToggleButton() {
    let btn = document.getElementById(TOC_BTN_ID);
    if (!btn) {
      btn = document.createElement('div');
      btn.id = TOC_BTN_ID;
      btn.setAttribute('aria-label', 'Toggle Table of Contents');
      btn.setAttribute('title', 'Tampilkan/Sembunyikan Daftar Isi');
      btn.textContent = '☰';
      document.body.appendChild(btn);
    }
    return btn;
  }

  function createSidebar() {
    let aside = document.querySelector('aside.md-sidebar-toc');
    let nav = document.getElementById(TOC_NAV_ID);

    if (!aside) {
      aside = document.createElement('aside');
      aside.className = 'md-sidebar-toc';
      document.body.appendChild(aside);
    }
    if (!nav) {
      nav = document.createElement('nav');
      nav.className = 'md-toc';
      nav.id = TOC_NAV_ID;
      aside.appendChild(nav);
    }
    return nav;
  }

  function restoreState() {
    const show = localStorage.getItem(STORAGE_KEY) === 'true';
    if (show) document.body.setAttribute(BODY_ATTR, '');
  }

  function setupToggle(btn) {
    btn.addEventListener('click', () => {
      const isShown = document.body.hasAttribute(BODY_ATTR);
      if (isShown) {
        document.body.removeAttribute(BODY_ATTR);
        localStorage.setItem(STORAGE_KEY, 'false');
      } else {
        document.body.setAttribute(BODY_ATTR, '');
        localStorage.setItem(STORAGE_KEY, 'true');
      }
    });
  }

  function setupHighlight(headings, tocEl) {
    let lastActiveId = null;

    function setActive(id) {
      if (lastActiveId === id) return;
      // Clear previous actives
      tocEl.querySelectorAll('a.active').forEach(a => a.classList.remove('active'));
      // Set new active
      if (id) {
        tocEl.querySelectorAll('a[href="#' + id + '"]').forEach(a => a.classList.add('active'));
      }
      lastActiveId = id;
    }

    function computeActive() {
      const scrollPos = window.scrollY || document.documentElement.scrollTop || 0;
      // Pick the last heading whose top is above the current scroll position (+ small offset)
      let active = null;
      for (let i = 0; i < headings.length; i++) {
        const h = headings[i];
        if (h.offsetTop <= scrollPos + 10) {
          active = h.id;
        } else {
          break;
        }
      }
      // Fallback to the first heading
      if (!active && headings.length) active = headings[0].id;
      setActive(active);
    }

    // Initialize and bind listeners (throttled via rAF)
    computeActive();
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          computeActive();
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });

    window.addEventListener('resize', computeActive);
  }

  function init() {
    const container = document.querySelector('.crossnote.markdown-preview');
    if (!container) return;

    restoreState();

    const btn = createToggleButton();
    setupToggle(btn);

    const tocNav = createSidebar();

    // Collect and ensure IDs
    const allHeadings = ensureIds(Array.from(container.querySelectorAll('h1, h2, h3, h4, h5, h6')));
    // Exclude the inline "Daftar Isi" section from the sidebar ToC
    const headings = allHeadings.filter(h => h.id !== 'daftar-isi' && (h.textContent || '').trim().toLowerCase() !== 'daftar isi');
    const tree = buildTree(headings);

    // Render ToC
    tocNav.innerHTML = '';
    tocNav.appendChild(renderNodes(tree));

    // Live highlight
    setupHighlight(headings, tocNav);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();