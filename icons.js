// --- Function to load an external script only once (refactored) ---
const loadedScripts = {};

function loadScript(src, callback, checkVariable) {
  const scriptId = `script-loader-${src.replace(/[^a-zA-Z0-9]/g, '-')}`;
  let scriptElement = document.getElementById(scriptId);

  // Use a map to track loaded scripts more robustly and handle callbacks
  if (!loadedScripts[src]) {
    loadedScripts[src] = { element: null, callbacks: [] };
  }

  // 1. Check if the script is already loaded and the global variable exists
  if (checkVariable && window[checkVariable]) {
    if (callback) {
      // Execute the callback asynchronously to prevent potential timing issues
      setTimeout(callback, 0);
    }
    return;
  }

  // 2. Check if the script element is already being loaded
  if (loadedScripts[src].element) {
    if (callback) {
      loadedScripts[src].callbacks.push(callback);
    }
    return;
  }

  // 3. Script not loaded: Create and load the script
  const script = document.createElement('script');
  script.id = scriptId;
  script.src = src;
  script.defer = true;

  // Use addEventListener to support multiple callbacks
  const handleLoad = () => {
    if (callback) {
      callback();
    }
    loadedScripts[src].callbacks.forEach(cb => cb());
    loadedScripts[src].callbacks = []; // Clear the queue
  };

  script.addEventListener('load', handleLoad);
  document.head.appendChild(script);
  loadedScripts[src].element = script;
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
  if (window.mermaid) {
    // 1. Register the icon packs
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
  } else {
    console.error("Mermaid object not found when trying to register icons.");
  }
}

// --- Main execution flow ---
// Do not use lazy loading
// Load Font Awesome 7 CSS from a public CDN
loadCSS(
  'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@7.1.0/css/fontawesome.min.css',
);

// Load Mermaid.js conditionally based on the global 'mermaid' object
loadScript(
  'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js',
  registerMermaidIcons,
  'mermaid', // Check for the existence of `window.mermaid`
);
