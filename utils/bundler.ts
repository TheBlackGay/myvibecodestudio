
import { GeneratedCode } from "../types";

/**
 * Combines the virtual file system into a single HTML string 
 * that can be rendered in an iframe.
 */
export const bundleProject = (files: GeneratedCode | null): string => {
  if (!files) return '';
  
  const indexHtml = files['public/index.html']?.content || '';
  const css = files['src/index.css']?.content || '';
  const js = files['src/App.jsx']?.content || '';

  if (!indexHtml) return '';

  let bundled = indexHtml;

  // 1. Inject CSS
  if (css) {
    const styleTag = `<style>\n${css}\n</style>`;
    if (bundled.includes('</head>')) {
      bundled = bundled.replace('</head>', `${styleTag}\n</head>`);
    } else {
      bundled += styleTag;
    }
  }

  // 2. Inject React App Logic
  if (js) {
    // We need to wrap it in babel standalone script
    // We also need to handle the mounting logic if it's not present in App.jsx
    // The prompt asks App.jsx to export default App, so we need to mount it.
    
    let mountLogic = '';
    
    // Check if the JS file already contains ReactDOM.createRoot
    if (!js.includes('ReactDOM.createRoot')) {
        mountLogic = `
          const root = ReactDOM.createRoot(document.getElementById('root'));
          root.render(<App />);
        `;
    }

    const scriptTag = `
    <script type="text/babel">
      ${js}
      ${mountLogic}
    </script>
    `;

    if (bundled.includes('</body>')) {
      bundled = bundled.replace('</body>', `${scriptTag}\n</body>`);
    } else {
      bundled += scriptTag;
    }
  }

  return bundled;
};
