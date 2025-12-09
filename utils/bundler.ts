
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

  // 1. Inject console capture script
  const consoleScript = `
    <script>
      (function() {
        const originalConsole = {
          log: console.log,
          warn: console.warn,
          error: console.error,
          info: console.info
        };

        function sendToParent(level, args) {
          try {
            const message = Array.from(args).map(arg => {
              if (typeof arg === 'object') {
                try {
                  return JSON.stringify(arg, null, 2);
                } catch (e) {
                  return String(arg);
                }
              }
              return String(arg);
            }).join(' ');

            window.parent.postMessage({
              type: 'console',
              level: level,
              message: message
            }, '*');
          } catch (e) {
            // Ignore errors in console capture
          }
        }

        console.log = function(...args) {
          originalConsole.log.apply(console, args);
          sendToParent('log', args);
        };

        console.warn = function(...args) {
          originalConsole.warn.apply(console, args);
          sendToParent('warn', args);
        };

        console.error = function(...args) {
          originalConsole.error.apply(console, args);
          sendToParent('error', args);
        };

        console.info = function(...args) {
          originalConsole.info.apply(console, args);
          sendToParent('info', args);
        };

        // Capture uncaught errors
        window.addEventListener('error', function(event) {
          sendToParent('error', [event.message + ' at ' + event.filename + ':' + event.lineno]);
        });

        // Capture unhandled promise rejections
        window.addEventListener('unhandledrejection', function(event) {
          sendToParent('error', ['Unhandled Promise Rejection: ' + event.reason]);
        });
      })();
    </script>
  `;

  if (bundled.includes('</head>')) {
    bundled = bundled.replace('</head>', `${consoleScript}\n</head>`);
  } else {
    bundled = consoleScript + bundled;
  }

  // 2. Inject CSS
  if (css) {
    const styleTag = `<style>\n${css}\n</style>`;
    if (bundled.includes('</head>')) {
      bundled = bundled.replace('</head>', `${styleTag}\n</head>`);
    } else {
      bundled += styleTag;
    }
  }

  // 3. Inject React App Logic
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
