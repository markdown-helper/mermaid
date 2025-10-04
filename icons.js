// --- Function to load an external script only once ---
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
        loader: () => {
          console.log("Fetching logos icon pack...");
          return fetch('https://cdn.jsdelivr.net/npm/@iconify-json/logos@1/icons.json')
            .then((res) => res.json())
            .then((data) => {
              console.log("Logos icon pack fetched successfully.");
              return data;
            });
        },
      },
      {
        name: 'fas',
        loader: () => {
          console.log("Fetching FA7 solid icon pack...");
          return fetch('https://cdn.jsdelivr.net/npm/@iconify-json/fa7-solid@1/icons.json')
            .then((res) => res.json())
            .then((data) => {
              console.log("FA7 icon pack fetched successfully. Will be registered as 'fas:' icon");
              return data;
            });
        },
      },
    ]);
    console.log("Icon packs registered with Mermaid.");
  } else {
    console.error("Mermaid object not found when trying to register icons.");
  }
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


// --- Main execution flow ---
// Do not use lazy loading
// Load Font Awesome 4 CSS from a public CDN
loadCSS(
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css',
);

// Load Mermaid.js conditionally based on the global 'mermaid' object
loadScript(
  'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js',
  registerMermaidIcons,
  'mermaid', // Check for the existence of `window.mermaid`
);

// Add paddedH style
addStyle('paddedH', `
  .paddedH {
    padding: 0px 10px;
  }
`);
