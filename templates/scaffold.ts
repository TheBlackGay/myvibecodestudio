// Default scaffold/boilerplate code for new projects

import { GeneratedCode } from '../types';

export const getDefaultScaffold = (): GeneratedCode => {
  return {
    'public/index.html': {
      language: 'html',
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VibeCode Project</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
</head>
<body>
  <div id="root"></div>
</body>
</html>`
    },
    'src/App.jsx': {
      language: 'javascript',
      content: `const { useState } = React;
const { Sparkles } = lucide.icons;

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950 text-white flex items-center justify-center p-8">
      <div className="text-center max-w-2xl">
        <div className="mb-8 flex justify-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center animate-pulse">
            <Sparkles className="w-12 h-12" />
          </div>
        </div>
        
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          Welcome to Your Project
        </h1>
        
        <p className="text-xl text-gray-300 mb-8">
          Start building something amazing with AI-powered development
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <div className="px-6 py-3 bg-white/10 backdrop-blur-lg rounded-lg border border-white/20">
            <div className="text-sm text-gray-400 mb-1">Ready to code</div>
            <div className="text-lg font-semibold">Chat with AI to build →</div>
          </div>
        </div>
        
        <div className="mt-12 text-sm text-gray-500">
          💡 Tip: Describe what you want to build and let AI generate the code
        </div>
      </div>
    </div>
  );
}`
    },
    'src/index.css': {
      language: 'css',
      content: `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

body {
  font-family: 'Inter', sans-serif;
  margin: 0;
  padding: 0;
}

/* Custom animations */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}`
    },
    'README.md': {
      language: 'markdown',
      content: `# VibeCode Project

Created with VibeCode Studio - AI-Powered Development Platform

## Getting Started

This project is initialized with a basic React setup. Start chatting with the AI to build your application!

## Features

- React 18
- Tailwind CSS
- Lucide Icons
- Live Preview
- AI-Powered Development

## Next Steps

1. Describe what you want to build in the chat
2. AI will generate the code for you
3. Edit in Monaco Editor
4. See live preview instantly

Happy coding! ✨`
    }
  };
};

export const getScaffoldDescription = (): string => {
  return 'A modern React project with Tailwind CSS, ready for AI-powered development';
};

export const getScaffoldTags = (): string[] => {
  return ['scaffold', 'react', 'starter'];
};
