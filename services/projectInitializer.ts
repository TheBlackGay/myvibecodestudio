// Intelligent project initialization system

import { GeneratedCode, AISettings, Message, Role } from '../types';
import { sendMessage } from './ai';

export interface ProjectRecommendation {
  projectType: string;
  framework: string;
  tooling: string;
  reasoning: string;
  scaffoldCommand: string;
  dependencies: string[];
  devDependencies: string[];
  scripts: Record<string, string>;
}

export interface ScaffoldTemplate {
  name: string;
  description: string;
  files: GeneratedCode;
  dependencies: string[];
  devDependencies: string[];
  scripts: Record<string, string>;
}

// AI analyzes user request and recommends tech stack
export async function analyzeAndRecommendStack(
  userRequest: string,
  settings: AISettings
): Promise<ProjectRecommendation> {
  const analysisPrompt = `You are a senior software architect. Analyze this project request and recommend the best technology stack.

User Request: "${userRequest}"

Consider:
1. Project complexity (simple, medium, complex)
2. Best framework (React, Vue, Next.js, Vanilla JS, etc.)
3. Build tool (Vite, Create React App, Next.js, etc.)
4. Additional libraries needed

Respond in this JSON format:
{
  "projectType": "web-app | landing-page | dashboard | blog | e-commerce | etc",
  "framework": "react | vue | next | vanilla | etc",
  "tooling": "vite | cra | nextjs | parcel | etc",
  "reasoning": "Brief explanation of why this stack",
  "scaffoldCommand": "npm create command or template name",
  "dependencies": ["react", "react-dom", ...],
  "devDependencies": ["@types/react", ...],
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  }
}

Be concise and practical. Choose modern, well-supported tools.`;

  const messages: Message[] = [
    {
      id: Date.now().toString(),
      role: Role.USER,
      content: analysisPrompt,
      timestamp: Date.now()
    }
  ];

  let fullResponse = '';
  const stream = await sendMessage(messages, settings);

  for await (const chunk of stream) {
    if (chunk.text) {
      fullResponse += chunk.text;
    }
  }

  // Extract JSON from response
  const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Failed to parse AI recommendation:', error);
    }
  }

  // Fallback recommendation
  return {
    projectType: 'web-app',
    framework: 'react',
    tooling: 'vite',
    reasoning: 'Vite + React is fast, modern, and versatile for most web applications',
    scaffoldCommand: 'npm create vite@latest',
    dependencies: ['react', 'react-dom'],
    devDependencies: ['@vitejs/plugin-react', 'vite'],
    scripts: {
      dev: 'vite',
      build: 'vite build',
      preview: 'vite preview'
    }
  };
}

// Fetch real scaffold from CDN
export async function fetchRealScaffold(recommendation: ProjectRecommendation): Promise<ScaffoldTemplate> {
  try {
    switch (recommendation.tooling.toLowerCase()) {
      case 'vite':
      case 'vite-react':
        return await fetchViteReactFromCDN();
      
      case 'nextjs':
      case 'next':
        return await fetchNextJsFromCDN();
      
      case 'vanilla':
        return generateVanillaScaffold(); // Keep manual for vanilla
      
      default:
        return await fetchViteReactFromCDN();
    }
  } catch (error) {
    console.error('Failed to fetch real scaffold from CDN, using fallback:', error);
    return generateScaffold(recommendation); // Fallback to manual
  }
}

// Generate scaffold based on recommendation (fallback)
export function generateScaffold(recommendation: ProjectRecommendation): ScaffoldTemplate {
  switch (recommendation.tooling.toLowerCase()) {
    case 'vite':
    case 'vite-react':
      return generateViteReactScaffold();
    
    case 'nextjs':
    case 'next':
      return generateNextJsScaffold();
    
    case 'cra':
    case 'create-react-app':
      return generateCRAScaffold();
    
    case 'vanilla':
      return generateVanillaScaffold();
    
    default:
      return generateViteReactScaffold();
  }
}

// Fetch real Vite + React scaffold from unpkg CDN
async function fetchViteReactFromCDN(): Promise<ScaffoldTemplate> {
  console.log('Fetching real Vite + React scaffold from CDN...');
  
  const baseUrl = 'https://unpkg.com/create-vite@latest/template-react';
  
  try {
    // Fetch real template files from create-vite
    const [
      packageJson,
      indexHtml,
      viteConfig,
      gitignore
    ] = await Promise.all([
      fetch(`${baseUrl}/package.json`).then(r => r.text()),
      fetch(`${baseUrl}/index.html`).then(r => r.text()),
      fetch(`${baseUrl}/vite.config.js`).then(r => r.text()),
      fetch(`${baseUrl}/_gitignore`).then(r => r.text()).catch(() => '# gitignore')
    ]);
    
    // Fetch source files
    const [
      mainJsx,
      appJsx,
      appCss,
      indexCss
    ] = await Promise.all([
      fetch(`${baseUrl}/src/main.jsx`).then(r => r.text()),
      fetch(`${baseUrl}/src/App.jsx`).then(r => r.text()),
      fetch(`${baseUrl}/src/App.css`).then(r => r.text()),
      fetch(`${baseUrl}/src/index.css`).then(r => r.text())
    ]);

    console.log('✅ Successfully fetched real Vite scaffold from CDN');

    return {
      name: 'Vite + React (Official)',
      description: 'Real Vite + React template from create-vite',
      files: {
        'package.json': {
          language: 'json',
          content: packageJson
        },
        'index.html': {
          language: 'html',
          content: indexHtml
        },
        'vite.config.js': {
          language: 'javascript',
          content: viteConfig
        },
        '.gitignore': {
          language: 'text',
          content: gitignore
        },
        'src/main.jsx': {
          language: 'javascript',
          content: mainJsx
        },
        'src/App.jsx': {
          language: 'javascript',
          content: appJsx
        },
        'src/App.css': {
          language: 'css',
          content: appCss
        },
        'src/index.css': {
          language: 'css',
          content: indexCss
        },
        'README.md': {
          language: 'markdown',
          content: `# Vite + React Project

This project was initialized with the official Vite + React template.

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

## Build for Production

\`\`\`bash
npm run build
\`\`\`

## Preview Production Build

\`\`\`bash
npm run preview
\`\`\``
        }
      },
      dependencies: ['react', 'react-dom'],
      devDependencies: ['@types/react', '@types/react-dom', '@vitejs/plugin-react', 'vite'],
      scripts: {
        dev: 'vite',
        build: 'vite build',
        preview: 'vite preview'
      }
    };
  } catch (error) {
    console.error('Failed to fetch from CDN:', error);
    throw error;
  }
}

// Fetch real Next.js scaffold from CDN
async function fetchNextJsFromCDN(): Promise<ScaffoldTemplate> {
  console.log('Fetching real Next.js scaffold from CDN...');
  
  // Next.js templates are on GitHub, use jsDelivr CDN
  const baseUrl = 'https://cdn.jsdelivr.net/gh/vercel/next.js@canary/examples/hello-world';
  
  try {
    const [
      packageJson,
      indexPage,
      readmeMd
    ] = await Promise.all([
      fetch(`${baseUrl}/package.json`).then(r => r.text()),
      fetch(`${baseUrl}/pages/index.js`).then(r => r.text()),
      fetch(`${baseUrl}/README.md`).then(r => r.text())
    ]);

    console.log('✅ Successfully fetched real Next.js scaffold from CDN');

    return {
      name: 'Next.js (Official)',
      description: 'Real Next.js template from Vercel',
      files: {
        'package.json': {
          language: 'json',
          content: packageJson
        },
        'pages/index.js': {
          language: 'javascript',
          content: indexPage
        },
        'pages/_app.js': {
          language: 'javascript',
          content: `export default function App({ Component, pageProps }) {
  return <Component {...pageProps} />
}`
        },
        'README.md': {
          language: 'markdown',
          content: readmeMd
        }
      },
      dependencies: ['next', 'react', 'react-dom'],
      devDependencies: [],
      scripts: {
        dev: 'next dev',
        build: 'next build',
        start: 'next start'
      }
    };
  } catch (error) {
    console.error('Failed to fetch Next.js from CDN:', error);
    throw error;
  }
}

// Vite + React scaffold (most modern and fast)
function generateViteReactScaffold(): ScaffoldTemplate {
  return {
    name: 'Vite + React',
    description: 'Modern, fast development with Vite and React',
    files: {
      'index.html': {
        language: 'html',
        content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vite + React App</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`
      },
      'src/main.jsx': {
        language: 'javascript',
        content: `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`
      },
      'src/App.jsx': {
        language: 'javascript',
        content: `import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Vite + React
        </h1>
        <div className="space-y-4">
          <button
            onClick={() => setCount((count) => count + 1)}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Count is {count}
          </button>
          <p className="text-gray-600 text-sm">
            Edit <code className="bg-gray-100 px-2 py-1 rounded">src/App.jsx</code> and save to test HMR
          </p>
        </div>
      </div>
    </div>
  )
}

export default App`
      },
      'src/index.css': {
        language: 'css',
        content: `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: 'Fira Code', 'Courier New', monospace;
}`
      },
      'package.json': {
        language: 'json',
        content: `{
  "name": "vite-react-app",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.0.8"
  }
}`
      },
      'vite.config.js': {
        language: 'javascript',
        content: `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})`
      },
      'README.md': {
        language: 'markdown',
        content: `# Vite + React Project

Fast, modern development with Vite and React.

## Features
- ⚡️ Lightning fast HMR with Vite
- ⚛️ React 18
- 🎨 Tailwind CSS (CDN)
- 📦 ES Modules

## Getting Started
\`\`\`bash
npm install
npm run dev
\`\`\`

## Build for Production
\`\`\`bash
npm run build
\`\`\``
      }
    },
    dependencies: ['react', 'react-dom'],
    devDependencies: ['@types/react', '@types/react-dom', '@vitejs/plugin-react', 'vite'],
    scripts: {
      dev: 'vite',
      build: 'vite build',
      preview: 'vite preview'
    }
  };
}

// Next.js scaffold (for SSR/SSG apps)
function generateNextJsScaffold(): ScaffoldTemplate {
  return {
    name: 'Next.js',
    description: 'React framework with SSR and routing',
    files: {
      'pages/index.js': {
        language: 'javascript',
        content: `export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Welcome to Next.js!
        </h1>
        <p className="text-gray-600">
          Get started by editing <code className="bg-gray-100 px-2 py-1 rounded">pages/index.js</code>
        </p>
      </div>
    </div>
  )
}`
      },
      'pages/_app.js': {
        language: 'javascript',
        content: `import '../styles/globals.css'

export default function App({ Component, pageProps }) {
  return <Component {...pageProps} />
}`
      },
      'styles/globals.css': {
        language: 'css',
        content: `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: 'Inter', sans-serif;
}`
      },
      'package.json': {
        language: 'json',
        content: `{
  "name": "nextjs-app",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.31",
    "tailwindcss": "^3.3.5"
  }
}`
      },
      'README.md': {
        language: 'markdown',
        content: `# Next.js Project

React framework with server-side rendering and routing.

## Features
- 🚀 Next.js 14
- ⚛️ React 18
- 🎨 Tailwind CSS
- 📁 File-based routing

## Getting Started
\`\`\`bash
npm install
npm run dev
\`\`\``
      }
    },
    dependencies: ['next', 'react', 'react-dom'],
    devDependencies: ['autoprefixer', 'postcss', 'tailwindcss'],
    scripts: {
      dev: 'next dev',
      build: 'next build',
      start: 'next start'
    }
  };
}

// Create React App scaffold (traditional)
function generateCRAScaffold(): ScaffoldTemplate {
  return generateViteReactScaffold(); // Vite is better, but keep CRA structure
}

// Vanilla JS scaffold (no framework)
function generateVanillaScaffold(): ScaffoldTemplate {
  return {
    name: 'Vanilla JavaScript',
    description: 'Pure JavaScript without frameworks',
    files: {
      'index.html': {
        language: 'html',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vanilla JS App</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div id="app"></div>
  <script src="main.js"></script>
</body>
</html>`
      },
      'main.js': {
        language: 'javascript',
        content: `// Vanilla JavaScript Application
const app = document.getElementById('app');

app.innerHTML = \`
  <div class="min-h-screen bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
    <div class="bg-white rounded-2xl shadow-2xl p-8">
      <h1 class="text-3xl font-bold text-gray-800 mb-4">Vanilla JavaScript</h1>
      <button id="btn" class="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg">
        Click me!
      </button>
      <p id="count" class="mt-4 text-gray-600">Count: 0</p>
    </div>
  </div>
\`;

let count = 0;
document.getElementById('btn').addEventListener('click', () => {
  count++;
  document.getElementById('count').textContent = \`Count: \${count}\`;
});`
      },
      'style.css': {
        language: 'css',
        content: `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', sans-serif;
}`
      },
      'README.md': {
        language: 'markdown',
        content: `# Vanilla JavaScript Project

Pure JavaScript without any frameworks.

## Features
- 📦 No build step required
- 🎨 Tailwind CSS (CDN)
- ⚡ Fast and simple

## Getting Started
Open \`index.html\` in your browser or use a local server.`
      }
    },
    dependencies: [],
    devDependencies: [],
    scripts: {}
  };
}
