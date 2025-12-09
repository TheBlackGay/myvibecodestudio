import { GeneratedCode } from '../types';

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  files: GeneratedCode;
}

export const projectTemplates: ProjectTemplate[] = [
  {
    id: 'blank',
    name: 'Blank Canvas',
    description: 'Start with a minimal setup',
    icon: 'FileCode',
    category: 'basic',
    files: {
      'public/index.html': {
        language: 'html',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>My Vibe App</title>
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

export default function App() {
  return (
    <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
      <h1 className="text-4xl font-bold">Hello, Vibe! 🎨</h1>
    </div>
  );
}`
      },
      'src/index.css': {
        language: 'css',
        content: `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');

body {
  font-family: 'Inter', sans-serif;
  margin: 0;
  padding: 0;
}`
      },
      'README.md': {
        language: 'markdown',
        content: `# My Vibe App

A blank canvas for your creative ideas.`
      }
    }
  },
  {
    id: 'todo-app',
    name: 'Todo App',
    description: 'Classic todo list with dark theme',
    icon: 'CheckSquare',
    category: 'productivity',
    files: {
      'public/index.html': {
        language: 'html',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Todo App</title>
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
const { Plus, Trash2, Check } = lucide.icons;

export default function App() {
  const [todos, setTodos] = useState([]);
  const [input, setInput] = useState('');

  const addTodo = () => {
    if (input.trim()) {
      setTodos([...todos, { id: Date.now(), text: input, done: false }]);
      setInput('');
    }
  };

  const toggleTodo = (id) => {
    setTodos(todos.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const deleteTodo = (id) => {
    setTodos(todos.filter(t => t.id !== id));
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 flex items-center gap-2">
          <Check className="w-8 h-8 text-indigo-400" />
          Todo App
        </h1>
        
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addTodo()}
            placeholder="Add a new task..."
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={addTodo}
            className="bg-indigo-600 hover:bg-indigo-500 px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add
          </button>
        </div>

        <div className="space-y-2">
          {todos.map(todo => (
            <div key={todo.id} className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 flex items-center gap-3">
              <button
                onClick={() => toggleTodo(todo.id)}
                className={\`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors \${todo.done ? 'bg-indigo-600 border-indigo-600' : 'border-zinc-600'}\`}
              >
                {todo.done && <Check className="w-4 h-4" />}
              </button>
              <span className={\`flex-1 \${todo.done ? 'line-through text-zinc-500' : ''}\`}>
                {todo.text}
              </span>
              <button
                onClick={() => deleteTodo(todo.id)}
                className="text-zinc-500 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}`
      },
      'src/index.css': {
        language: 'css',
        content: `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');

body {
  font-family: 'Inter', sans-serif;
  margin: 0;
  padding: 0;
}`
      },
      'README.md': {
        language: 'markdown',
        content: `# Todo App

A sleek dark-themed todo list application.`
      }
    }
  },
  {
    id: 'landing-page',
    name: 'Landing Page',
    description: 'Modern landing page with hero section',
    icon: 'Globe',
    category: 'marketing',
    files: {
      'public/index.html': {
        language: 'html',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Product Landing</title>
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
        content: `const { Sparkles, Zap, Shield } = lucide.icons;

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white">
      {/* Hero Section */}
      <div className="container mx-auto px-6 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-block mb-6">
            <span className="bg-indigo-500/20 text-indigo-300 px-4 py-2 rounded-full text-sm font-semibold">
              ✨ New Release
            </span>
          </div>
          <h1 className="text-6xl font-bold mb-6 leading-tight">
            Build Amazing Things
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400">
              With Our Platform
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            The fastest way to create, deploy, and scale your ideas. 
            Join thousands of developers building the future.
          </p>
          <div className="flex gap-4 justify-center">
            <button className="bg-white text-purple-900 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              Get Started Free
            </button>
            <button className="border-2 border-white/30 px-8 py-4 rounded-lg font-semibold hover:bg-white/10 transition-colors">
              View Demo
            </button>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl border border-white/20">
            <Sparkles className="w-12 h-12 text-indigo-400 mb-4" />
            <h3 className="text-2xl font-bold mb-3">Beautiful Design</h3>
            <p className="text-gray-300">
              Stunning components that make your app stand out from the crowd.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl border border-white/20">
            <Zap className="w-12 h-12 text-yellow-400 mb-4" />
            <h3 className="text-2xl font-bold mb-3">Lightning Fast</h3>
            <p className="text-gray-300">
              Optimized performance to deliver the best user experience.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl border border-white/20">
            <Shield className="w-12 h-12 text-green-400 mb-4" />
            <h3 className="text-2xl font-bold mb-3">Secure by Default</h3>
            <p className="text-gray-300">
              Enterprise-grade security built into every layer.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}`
      },
      'src/index.css': {
        language: 'css',
        content: `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');

body {
  font-family: 'Inter', sans-serif;
  margin: 0;
  padding: 0;
}`
      },
      'README.md': {
        language: 'markdown',
        content: `# Landing Page

A modern, gradient-themed landing page with hero section and features.`
      }
    }
  },
  {
    id: 'dashboard',
    name: 'Dashboard',
    description: 'Analytics dashboard with charts',
    icon: 'LayoutDashboard',
    category: 'business',
    files: {
      'public/index.html': {
        language: 'html',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Dashboard</title>
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
        content: `const { BarChart3, Users, DollarSign, TrendingUp, ArrowUp, ArrowDown } = lucide.icons;

export default function App() {
  const stats = [
    { label: 'Total Users', value: '12,543', change: '+12%', up: true, icon: Users },
    { label: 'Revenue', value: '$43,281', change: '+8%', up: true, icon: DollarSign },
    { label: 'Conversion', value: '3.24%', change: '-2%', up: false, icon: TrendingUp },
    { label: 'Active Now', value: '1,234', change: '+5%', up: true, icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-zinc-900 border-r border-zinc-800 p-6">
        <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-indigo-400" />
          Dashboard
        </h2>
        <nav className="space-y-2">
          {['Overview', 'Analytics', 'Reports', 'Settings'].map((item) => (
            <a key={item} href="#" className="block px-4 py-2 rounded-lg hover:bg-zinc-800 transition-colors">
              {item}
            </a>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-8">
        <h1 className="text-3xl font-bold mb-8">Analytics Overview</h1>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <stat.icon className="w-8 h-8 text-indigo-400" />
                <div className={\`flex items-center gap-1 text-sm \${stat.up ? 'text-green-400' : 'text-red-400'}\`}>
                  {stat.up ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                  {stat.change}
                </div>
              </div>
              <div className="text-3xl font-bold mb-1">{stat.value}</div>
              <div className="text-sm text-zinc-500">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Chart Placeholder */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-xl font-bold mb-4">Revenue Over Time</h3>
          <div className="h-64 flex items-end justify-around gap-2">
            {[40, 70, 45, 80, 60, 90, 75, 85, 65, 95, 70, 100].map((height, i) => (
              <div key={i} className="flex-1 bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t" style={{height: \`\${height}%\`}}></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}`
      },
      'src/index.css': {
        language: 'css',
        content: `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');

body {
  font-family: 'Inter', sans-serif;
  margin: 0;
  padding: 0;
}`
      },
      'README.md': {
        language: 'markdown',
        content: `# Dashboard

A modern analytics dashboard with stats and charts.`
      }
    }
  }
];

export const getTemplateById = (id: string): ProjectTemplate | undefined => {
  return projectTemplates.find(t => t.id === id);
};
