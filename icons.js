mermaid.registerIconPacks([
  {
    // https://icones.js.org/collection/logos
    name: 'logos',
    loader: () =>
      fetch('https://unpkg.com/@iconify-json/logos@1/icons.json').then((res) => res.json()),
  },
  {
    // https://icones.js.org/collection/fa7-regular
    name: 'fa',
    loader: () =>
      fetch('https://unpkg.com/@iconify-json/fa7-regular@1/icons.json').then((res) => res.json()),
  },
]);
