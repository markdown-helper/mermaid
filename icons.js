// --- Function to load an external script only once ---
function loadScript(src, callback, checkVariable) {
  const scriptId = `script-loader-${src.replace(/[^a-zA-Z0-9]/g, '-')}`;
  let scriptElement = document.getElementById(scriptId);

  // 1. Check if the script is already present AND the global variable exists
  if (checkVariable && window[checkVariable]) {
    // If the variable exists, we assume the script is loaded.
    // Run the callback immediately as a simple workaround for the timing issue.
    // If this STILL fails, the solution is more complex (e.g., polling).
    if (callback) {
      callback();
    }
    return;
  }

  // 2. Check if the script element is in the DOM (but not yet loaded)
  if (scriptElement) {
    // If it's already being loaded, attach the callback to the existing element's load event.
    // NOTE: If multiple calls try to attach, only the last one will work, but for a single-use
    // scenario like this, it's sufficient.
    scriptElement.onload = callback; 
    return;
  }

  // 3. Script not loaded, variable not defined: Load the script
  const script = document.createElement('script');
  script.id = scriptId;
  script.src = src;
  script.defer = true;
  
  // The onload event guarantees the script has downloaded and executed, 
  // which is the most reliable moment to interact with the new global variable.
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
  // This check is now redundant because it runs after the script loads,
  // but it's kept as a safety measure.
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
    
    // 2. Initialize (this step is crucial after any configuration change)
    window.mermaid.init();
  } else {
    console.error("Mermaid object not found when trying to register icons.");
  }
}

// --- Main execution flow ---
document.addEventListener('DOMContentLoaded', () => {
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
});
