// --- Function to load an external script only once ---
function loadScript(src, callback, checkVariable) {
  // If a global variable is provided, check if it already exists
  if (checkVariable && window[checkVariable]) {
    if (callback) {
      callback();
    }
    return;
  }

  // Use a unique ID to prevent duplicate script elements
  const scriptId = `script-loader-${src.replace(/[^a-zA-Z0-9]/g, '-')}`;

  if (document.getElementById(scriptId)) {
    return;
  }

  const script = document.createElement('script');
  script.id = scriptId;
  script.src = src;
  script.defer = true;
  script.onload = callback;
  document.head.appendChild(script);
}

// --- Function to load a CSS file only once ---
function loadCSS(url) {
  const linkId = `css-loader-${url.replace(/[^a-zA-Z0-9]/g, '-')}`;

  if (document.getElementById(linkId)) {
    return;
  }

  const link = document.createElement('link');
  link.id = linkId;
  link.rel = 'stylesheet';
  link.href = url;
  document.head.appendChild(link);
}

// --- Your main functions ---

// Function to register Iconify packs with Mermaid
function registerMermaidIcons() {
  // This check is now redundant due to the loadScript function,
  // but it's good practice to keep.
  if (window.mermaid) {
    window.mermaid.registerIconPacks([
      {
        name: 'logos',
        loader: () =>
          fetch('https://unpkg.com/@iconify-json/logos@1/icons.json').then(
            (res) => res.json(),
          ),
      },
      {
        name: 'fa7',
        loader: () =>
          fetch('https://unpkg.com/@iconify-json/fa7-regular@1/icons.json').then(
            (res) => res.json(),
          ),
      },
    ]);
    window.mermaid.init();
  }
}

// --- Main execution flow ---
document.addEventListener('DOMContentLoaded', () => {
  // Load Font Awesome 7 CSS from a public CDN
  loadCSS(
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/7.1.0/css/all.min.css',
  );

  // Load Mermaid.js conditionally based on the global 'mermaid' object
  loadScript(
    'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js',
    registerMermaidIcons,
    'mermaid', // Check for the existence of `window.mermaid`
  );
});
