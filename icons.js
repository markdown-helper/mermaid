/**
 * icons.js
 *
 * Responsibilities:
 * - Conditionally load external assets (scripts, styles) in a robust, idempotent manner.
 * - Detect if Font Awesome is already active and only add CSS when needed.
 * - Register Iconify icon packs with Mermaid in a compact, maintainable way.
 *
 * Design notes:
 * - URL normalization avoids duplicate loads caused by relative vs absolute paths.
 * - Callbacks are queued while a given script is loading; they run once upon load.
 * - Error handling keeps the page resilient if a remote pack or asset fails to load.
 * - Mermaid icon registration is safe to call multiple times and includes lightweight logging.
 */
const loadedScripts = {};

/**
 * Load an external script exactly once with optional readiness check.
 *
 * Improvements:
 * - Normalizes to an absolute URL to avoid duplicate loads caused by relative vs absolute href/src.
 * - Deduplicates by both id and exact normalized src match.
 * - Queues multiple callbacks while the same script is loading.
 * - If checkVariable is provided and already present on window, the callback
 *   is invoked asynchronously and no loading occurs.
 *
 * Note: checkVariable supports only top-level globals (e.g., 'mermaid').
 *
 * @param {string} src - The script URL to load.
 * @param {Function} [callback] - Invoked after the script's load event.
 * @param {string} [checkVariable] - Optional window global to short-circuit loading.
 */
function loadScript(src, callback, checkVariable) {
  const absSrc = new URL(src, document.baseURI).href;
  const scriptId = `script-loader-${absSrc.replace(/[^a-zA-Z0-9]/g, '-')}`;
  const key = absSrc;

  // Ensure state bucket for this src
  if (!loadedScripts[key]) {
    loadedScripts[key] = { element: null, callbacks: [] };
  }

  // 1) If the global variable already exists, fire callback asynchronously and exit
  if (checkVariable && window[checkVariable]) {
    if (typeof callback === 'function') setTimeout(callback, 0);
    return;
  }

  // 2) If we're already loading this src, just queue the callback
  if (loadedScripts[key].element) {
    if (typeof callback === 'function') {
      loadedScripts[key].callbacks.push(callback);
    }
    return;
  }

  // 3) Check for an existing script element in the DOM (by id or identical normalized src)
  const existingById = document.getElementById(scriptId);
  const existingExact = document.querySelector(`script[src="${absSrc}"]`);
  const existingByIter = existingExact || Array.from(document.scripts).find((s) => s.src === absSrc) || null;
  const existing = existingById || existingByIter;

  if (existing) {
    loadedScripts[key].element = existing;

    if (typeof callback === 'function') {
      // If the global check is available, run immediately
      if (checkVariable && window[checkVariable]) {
        setTimeout(callback, 0);
      } else {
        // Otherwise, queue until the existing script reports 'load'
        loadedScripts[key].callbacks.push(callback);
        existing.addEventListener('load', () => {
          const q = loadedScripts[key].callbacks.splice(0);
          q.forEach((cb) => cb());
        }, { once: true });
        existing.addEventListener('error', () => {
          console.error(`Failed loading script: ${absSrc}`);
          loadedScripts[key].callbacks = [];
        }, { once: true });
      }
    }

    // Fallback: if the script is already loaded and the global becomes available soon,
    // flush queued callbacks on next tick.
    setTimeout(() => {
      if (checkVariable && window[checkVariable] && loadedScripts[key].callbacks.length) {
        const q = loadedScripts[key].callbacks.splice(0);
        q.forEach((cb) => cb());
      }
    }, 0);

    return;
  }

  // 4) Create and load the script
  const script = document.createElement('script');
  script.id = scriptId;
  script.src = absSrc;
  script.defer = true;

  const onLoad = () => {
    if (typeof callback === 'function') callback();
    const q = loadedScripts[key].callbacks.splice(0);
    q.forEach((cb) => cb());
  };

  const onError = (e) => {
    console.error(`Error loading script ${absSrc}`, e);
    loadedScripts[key].callbacks = [];
  };

  script.addEventListener('load', onLoad, { once: true });
  script.addEventListener('error', onError, { once: true });

  document.head.appendChild(script);
  loadedScripts[key].element = script;
}


// --- Function to load a CSS file only once ---
/**
 * Load a CSS stylesheet exactly once.
 *
 * Deduplicates by:
 * - our generated element id, and
 * - any existing link[rel="stylesheet"][href="normalized url"] in the document.
 * Also cross-checks via element.href property to cover cases where href is normalized by the browser.
 *
 * @param {string} url - The stylesheet URL to load.
 */
function loadCSS(url) {
  const absHref = new URL(url, document.baseURI).href;
  const linkId = `css-loader-${absHref.replace(/[^a-zA-Z0-9]/g, '-')}`;

  // Skip if our id already exists
  if (document.getElementById(linkId)) return;

  // Skip if an identical normalized href already exists (selector)
  if (document.querySelector(`link[rel="stylesheet"][href="${absHref}"]`)) return;

  // Skip if any existing link resolves to the same absolute href (property)
  if (Array.from(document.querySelectorAll('link[rel="stylesheet"]')).some((l) => l.href === absHref)) return;

  const link = document.createElement('link');
  link.id = linkId;
  link.rel = 'stylesheet';
  link.href = absHref;
  document.head.appendChild(link);
}

/**
 * Detect whether a Font Awesome stylesheet is already active.
 *
 * Strategy:
 * 1) Try document.fonts.check against known FA font-family names (v4, v5, v6).
 * 2) Fallback: create an invisible element using common FA classes (fa/fas/far/fab)
 *    and inspect computed font-family for FA signatures.
 *
 * This does not rely on specific link IDs and works even if FA was loaded elsewhere.
 *
 * @returns {boolean} true if Font Awesome appears to be loaded; false otherwise.
 */
function isFontAwesomeLoaded() {
  const families = [
    'FontAwesome',           // v4
    'Font Awesome 5 Free',   // v5 Free
    'Font Awesome 5 Brands', // v5 Brands
    'Font Awesome 6 Free',   // v6 Free
    'Font Awesome 6 Brands', // v6 Brands
  ];

  // 1) Prefer modern FontFaceSet when available
  try {
    if (document.fonts && typeof document.fonts.check === 'function') {
      for (const fam of families) {
        if (document.fonts.check(`1em "${fam}"`)) {
          return true;
        }
      }
    }
  } catch (_) {
    // Ignore any errors from fonts.check in older browsers
  }

  // 2) Fallback: test multiple FA classes to improve detection reliability across FA versions
  const classesToTest = ['fa', 'fas', 'far', 'fab']; // v4/v5/v6 variants
  const parent = document.body || document.documentElement;

  for (const cls of classesToTest) {
    const el = document.createElement('i');
    el.className = cls;
    el.style.position = 'absolute';
    el.style.opacity = '0';
    el.style.pointerEvents = 'none';
    parent.appendChild(el);

    const fontFamily = (window.getComputedStyle(el).fontFamily || '').toLowerCase();
    parent.removeChild(el);

    if (families.some((fam) => fontFamily.includes(fam.toLowerCase()))) {
      return true;
    }
  }

  return false;
}

// --- Your main functions ---

/**
 * Build an Iconify pack descriptor for Mermaid.
 * - name: The short pack name used in diagrams, e.g., 'logos', 'fa', 'fa7-solid'
 * - pkg: The npm package under @iconify-json containing icons.json
 *
 * @param {string} name
 * @param {string} pkg
 * @returns {{name: string, loader: () => Promise<object>}}
 */
/**
 * Resolve and fetch icons.json for an Iconify pack, with version negotiation.
 *
 * Not all @iconify-json packs publish the same major version. Many are at @1,
 * but some may publish at @2 (or newer) depending on the collection. This helper:
 * - Tries specific majors (e.g., @1, @2) and finally falls back to the unpinned latest (no @major),
 * - Caches per package+version-candidate list to avoid repeated network fetches.
 *
 * This avoids hardcoding '@1' so packs that publish at '@2' or newer still work.
 */
const iconsJsonCache = new Map();

/**
 * @param {string} pkg - NPM package under @iconify-json (e.g., '@iconify-json/logos')
 * @param {string[]} [versionCandidates=['1','2','']] - Major versions to try; '' means latest.
 *   Note: Order reflects preference for stability first (@1), then newer (@2), then latest (no pin).
 * @returns {Promise<object>} icons.json payload or {} on failure
 */
function fetchIconsJson(pkg, versionCandidates = ['1', '2', '']) {
  const cacheKey = `${pkg}|${versionCandidates.join(',')}`;
  if (iconsJsonCache.has(cacheKey)) return iconsJsonCache.get(cacheKey);

  const urls = versionCandidates.map((v) =>
    v
      ? `https://cdn.jsdelivr.net/npm/${pkg}@${v}/icons.json`
      : `https://cdn.jsdelivr.net/npm/${pkg}/icons.json`
  );

  const promise = (async () => {
    for (const url of urls) {
      try {
        const res = await fetch(url);
        if (!res.ok) continue;
        return await res.json();
      } catch (_) {
        // Try next candidate
      }
    }
    throw new Error(`Unable to fetch icons.json for ${pkg} from: ${urls.join(' | ')}`);
  })().catch((err) => {
    console.error(`Failed to fetch icon pack '${pkg}'`, err);
    // Return empty object to keep registration robust if a single pack fails
    return {};
  });

  iconsJsonCache.set(cacheKey, promise);
  return promise;
}

/**
 * Build an Iconify pack descriptor for Mermaid.
 * Accepts optional versions override to pin preferred majors.
 *
 * Not all packs are '@1': some may publish '@2' or later. By default we try
 * ['1','2',''] to prefer stability first, then newer majors, then latest.
 * Override per pack if you want to prefer a different order, e.g. ['2','1',''].
 *
 * @param {string} name - Short pack name ('logos', 'fa', etc.)
 * @param {string} pkg - '@iconify-json/<pack>'
 * @param {{versions?: string[]}} [options] - e.g., { versions: ['2', '1', ''] }
 * @returns {{name: string, loader: () => Promise<object>}}
 */
function buildIconPack(name, pkg, options = {}) {
  const versions = options.versions || ['1', '2', '']; // stability-first default
  return {
    name,
    loader: () => fetchIconsJson(pkg, versions),
  };
}

/**
 * Register Iconify icon packs with Mermaid.
 * Idempotent: safe to call multiple times; Mermaid internally deduplicates by pack name.
 */
function registerMermaidIcons() {
  if (!window.mermaid || typeof window.mermaid.registerIconPacks !== 'function') {
    console.error("Mermaid object or registerIconPacks() not found when trying to register icons.");
    return;
  }

  // icones.js.org names: fa, fa7-solid, material-symbols, mdi, fluent
  // Note on versions:
  // - Many @iconify-json packs are published at @1.
  // - Some collections may publish at @2 or newer.
  // The builder below negotiates versions by default ['1','2',''] (stability-first).
  // You can override per-pack with { versions: ['2','1',''] } to prefer newer majors.
  const packs = [
    buildIconPack('logos', '@iconify-json/logos'),              // default: ['1','2','']
    buildIconPack('fa', '@iconify-json/fa'),                     // FA (legacy names) commonly @1
    buildIconPack('fa7-solid', '@iconify-json/fa7-solid'),       // negotiates as needed
    buildIconPack('mdi', '@iconify-json/mdi'),
    buildIconPack('material-symbols', '@iconify-json/material-symbols'),
    buildIconPack('fluent', '@iconify-json/fluent'),
    // Examples (uncomment to include):
    // buildIconPack('mdi', '@iconify-json/mdi', { versions: ['1', ''] }),
    // buildIconPack('material-symbols', '@iconify-json/material-symbols', { versions: ['2', '1', ''] }),
  ];

  window.mermaid.registerIconPacks(packs);
  console.log("Icon packs registered with Mermaid:", packs.map((p) => p.name).join(', '));
}

/**
 * Dynamically adds a new <style> element to the document head with the specified CSS.
 * Prevents adding duplicate styles by checking for an existing element with the given ID.
 *
 * @param {string} id The unique ID for the <style> element.
 * @param {string} css The CSS content to be added.
 */
function addStyle(id, css) {
  // Check if the style element already exists to prevent duplicates
  if (document.getElementById(id)) {
    return;
  }

  const style = document.createElement('style');
  style.id = id;
  style.textContent = css;
  document.head.appendChild(style);
}


/**
 * --- URL resolver helpers ---
 * Resolve a URL relative to this script file (icons.js) rather than the HTML document.
 */
function resolveFromScript(url) {
  try {
    const current = document.currentScript && document.currentScript.src;
    let base = current;
    if (!base) {
      const guessed = Array.from(document.scripts).find((s) => /(^|\/)icons\.js(\?|#|$)/.test(s.src));
      base = guessed && guessed.src;
    }
    const finalBase = base || document.baseURI;
    return new URL(url, finalBase).href;
  } catch (_) {
    return new URL(url, document.baseURI).href;
  }
}

/**
 * --- Main execution flow ---
 * Ensures FA CSS present only if needed, then loads Mermaid and registers icons.
 */
const FA_CSS_URL = 'https://cdn.jsdelivr.net/npm/font-awesome@4/css/font-awesome.min.css';

// Load Font Awesome CSS (only if not already applied)
if (!isFontAwesomeLoaded()) {
  loadCSS(FA_CSS_URL);
}

// Load Mermaid.js conditionally based on the global 'mermaid' object
loadScript(
  'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js',
  registerMermaidIcons,
  'mermaid' // If Mermaid already exists, callback executes asynchronously
);

// Add paddedH style to fix label truncation issue.
// Not used for now, padding set in mermaid init
/*
addStyle('paddedH', `
  .paddedH {
    padding-right: 10px;
  }
`);
*/

// Add ToC sidebar (paths resolved relative to this icons.js)
loadCSS(resolveFromScript('./toc-sidebar.min.css'));
loadScript(resolveFromScript('./toc-sidebar.min.js'));
