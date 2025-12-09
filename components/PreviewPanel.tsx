
import React, { useState, useEffect } from 'react';
import { Eye, Code, Smartphone, Monitor, Tablet, RefreshCw, ExternalLink, Sparkles, Download, FileCode, FolderOpen, File, Menu, ChevronRight, ChevronDown } from 'lucide-react';
import { GeneratedCode } from '../types';
import { bundleProject } from '../utils/bundler';
import JSZip from 'jszip';

interface PreviewPanelProps {
  code: GeneratedCode | null;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({ code }) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [key, setKey] = useState(0); // Used to force iframe refresh
  const [viewport, setViewport] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [bundledHtml, setBundledHtml] = useState('');
  
  // File Explorer State
  const [selectedFile, setSelectedFile] = useState<string>('public/index.html');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['public', 'src']));

  useEffect(() => {
    if (code) {
      const html = bundleProject(code);
      setBundledHtml(html);
      
      // Select App.jsx by default if available and we haven't selected anything or previous selection is gone
      if (code['src/App.jsx'] && (!selectedFile || !code[selectedFile])) {
          setSelectedFile('src/App.jsx');
      } else if (!code[selectedFile]) {
          // Fallback to first file
          setSelectedFile(Object.keys(code)[0] || '');
      }
    }
  }, [code]);

  const handleRefresh = () => {
    setKey((prev) => prev + 1);
  };

  const handleOpenInNewTab = () => {
    if (!bundledHtml) return;
    const blob = new Blob([bundledHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const handleDownload = async () => {
    if (!code) return;
    const zip = new JSZip();
    
    // Add files to zip
    Object.entries(code).forEach(([path, file]) => {
        zip.file(path, file.content);
    });

    // Generate zip
    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vibe-project.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleFolder = (folder: string) => {
    const newSet = new Set(expandedFolders);
    if (newSet.has(folder)) {
        newSet.delete(folder);
    } else {
        newSet.add(folder);
    }
    setExpandedFolders(newSet);
  };

  // Build file tree structure
  const fileTree = React.useMemo(() => {
      if (!code) return {};
      const tree: Record<string, string[]> = {};
      Object.keys(code).forEach(path => {
          const parts = path.split('/');
          if (parts.length === 1) {
              // root file
              if (!tree['root']) tree['root'] = [];
              tree['root'].push(path);
          } else {
              const folder = parts[0];
              const file = parts[1];
              if (!tree[folder]) tree[folder] = [];
              tree[folder].push(path);
          }
      });
      return tree;
  }, [code]);

  // If no code is present yet
  if (!code) {
    return (
      <div className="flex-1 bg-zinc-950 flex flex-col items-center justify-center text-zinc-600 relative overflow-hidden">
        {/* Ambient Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-900/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-900/10 rounded-full blur-3xl"></div>
        </div>

        <div className="z-10 flex flex-col items-center animate-in fade-in zoom-in duration-700">
          <div className="w-24 h-24 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6 shadow-xl shadow-black/50 group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <Sparkles className="w-10 h-10 text-zinc-700 group-hover:text-indigo-400 transition-colors duration-500" />
          </div>
          <h3 className="text-xl font-medium text-zinc-300 mb-2 tracking-tight">Vibe Canvas</h3>
          <p className="max-w-md text-center text-sm px-6 text-zinc-500 leading-relaxed">
            Your generated application will appear here live. <br/>
            Use the chat to describe your dream UI.
          </p>
        </div>
      </div>
    );
  }

  const getViewportClass = () => {
    switch(viewport) {
      case 'mobile': return 'w-[375px] shadow-2xl shadow-black/50 my-8 rounded-2xl border-y-[12px] border-x-4 border-zinc-800';
      case 'tablet': return 'w-[768px] shadow-2xl shadow-black/50 my-8 rounded-xl border-4 border-zinc-800';
      default: return 'w-full';
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-zinc-950 h-full overflow-hidden border-l border-zinc-800">
      {/* Toolbar */}
      <div className="h-14 border-b border-zinc-800 flex items-center justify-between px-4 bg-zinc-900/50 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-1 bg-zinc-800/50 p-1 rounded-lg border border-zinc-700/30">
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-all ${
              activeTab === 'preview'
                ? 'bg-zinc-700 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Preview
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-all ${
              activeTab === 'code'
                ? 'bg-zinc-700 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            Code
          </button>
        </div>

        <div className="flex items-center gap-4">
          {activeTab === 'preview' && (
             <div className="flex items-center gap-1 text-zinc-500 bg-zinc-800/30 p-1 rounded-lg border border-zinc-800">
               <button onClick={() => setViewport('mobile')} className={`p-1.5 rounded hover:bg-zinc-700 transition ${viewport === 'mobile' ? 'text-indigo-400 bg-zinc-800' : ''}`} title="Mobile"><Smartphone className="w-4 h-4"/></button>
               <button onClick={() => setViewport('tablet')} className={`p-1.5 rounded hover:bg-zinc-700 transition ${viewport === 'tablet' ? 'text-indigo-400 bg-zinc-800' : ''}`} title="Tablet"><Tablet className="w-4 h-4"/></button>
               <button onClick={() => setViewport('desktop')} className={`p-1.5 rounded hover:bg-zinc-700 transition ${viewport === 'desktop' ? 'text-indigo-400 bg-zinc-800' : ''}`} title="Desktop"><Monitor className="w-4 h-4"/></button>
            </div>
          )}
          <div className="h-4 w-px bg-zinc-800"></div>
          <div className="flex items-center gap-2">
            <button onClick={handleRefresh} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition" title="Reload Preview">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={handleDownload} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition" title="Download ZIP">
              <Download className="w-4 h-4" />
            </button>
            <button onClick={handleOpenInNewTab} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition" title="Open in New Tab">
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex relative">
        {activeTab === 'preview' ? (
          <div className={`w-full flex justify-center bg-[#09090b] ${viewport !== 'desktop' ? 'items-start overflow-y-auto pt-8' : ''}`}>
             <div className={`transition-all duration-300 ease-in-out bg-white ${getViewportClass()} ${viewport === 'desktop' ? 'h-full' : 'shrink-0'}`}>
                <iframe
                  key={key}
                  title="Preview"
                  srcDoc={bundledHtml}
                  className="w-full h-full border-none"
                  sandbox="allow-scripts allow-same-origin allow-modals"
                />
             </div>
          </div>
        ) : (
          <div className="w-full h-full flex bg-[#1e1e1e]">
             {/* VSCode Sidebar */}
             <div className="w-64 bg-[#18181b] border-r border-[#27272a] flex flex-col">
                <div className="h-9 px-4 flex items-center text-[11px] font-bold text-zinc-500 tracking-wider">
                   EXPLORER
                </div>
                
                {/* Project Name */}
                <div className="px-2 py-1">
                   <div className="flex items-center gap-1 px-2 py-1 text-zinc-300 text-xs font-bold hover:bg-[#2a2d2e] cursor-pointer" onClick={() => {}}>
                      <ChevronDown className="w-4 h-4" />
                      VIBE-PROJECT
                   </div>
                   
                   <div className="mt-1">
                      {/* Folders */}
                      {Object.keys(fileTree).filter(k => k !== 'root').map(folder => (
                        <div key={folder}>
                            <div 
                                className="flex items-center gap-1 px-4 py-1 text-zinc-400 text-xs hover:bg-[#2a2d2e] cursor-pointer hover:text-zinc-100 transition-colors"
                                onClick={() => toggleFolder(folder)}
                            >
                                {expandedFolders.has(folder) ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                <div className={`flex items-center gap-1.5 ${expandedFolders.has(folder) ? 'text-zinc-300' : ''}`}>
                                    <FolderOpen className={`w-3.5 h-3.5 ${expandedFolders.has(folder) ? 'text-indigo-400' : 'text-zinc-500'}`} />
                                    {folder}
                                </div>
                            </div>
                            
                            {/* Files in Folder */}
                            {expandedFolders.has(folder) && fileTree[folder].map(path => (
                                <div 
                                    key={path}
                                    className={`flex items-center gap-2 pl-8 pr-2 py-1 text-xs cursor-pointer border-l-2 ${selectedFile === path ? 'bg-[#37373d] text-white border-indigo-500' : 'text-zinc-400 hover:bg-[#2a2d2e] hover:text-zinc-100 border-transparent'}`}
                                    onClick={() => setSelectedFile(path)}
                                >
                                    <FileCode className={`w-3.5 h-3.5 ${path.endsWith('css') ? 'text-blue-400' : path.endsWith('jsx') ? 'text-yellow-400' : 'text-orange-400'}`} />
                                    {path.split('/')[1]}
                                </div>
                            ))}
                        </div>
                      ))}

                      {/* Root Files */}
                      {fileTree['root']?.map(path => (
                         <div 
                            key={path}
                            className={`flex items-center gap-2 pl-4 pr-2 py-1 text-xs cursor-pointer border-l-2 ${selectedFile === path ? 'bg-[#37373d] text-white border-indigo-500' : 'text-zinc-400 hover:bg-[#2a2d2e] hover:text-zinc-100 border-transparent'}`}
                            onClick={() => setSelectedFile(path)}
                        >
                            <File className="w-3.5 h-3.5 text-zinc-500" />
                            {path}
                        </div>
                      ))}
                   </div>
                </div>
             </div>

             {/* Editor Area */}
             <div className="flex-1 flex flex-col min-w-0">
                {/* Tabs */}
                {selectedFile && (
                   <div className="h-9 bg-[#1e1e1e] flex items-center border-b border-[#27272a] overflow-x-auto scrollbar-hide">
                      <div className="flex items-center gap-2 px-3 py-2 bg-[#1e1e1e] text-zinc-100 text-xs border-t-2 border-indigo-500 h-full min-w-fit">
                          <FileCode className={`w-3.5 h-3.5 ${selectedFile.endsWith('css') ? 'text-blue-400' : selectedFile.endsWith('jsx') ? 'text-yellow-400' : 'text-orange-400'}`} />
                          {selectedFile}
                      </div>
                   </div>
                )}
                
                {/* Code Content */}
                <div className="flex-1 overflow-auto custom-scrollbar bg-[#1e1e1e]">
                    <div className="flex min-h-full">
                        {/* Line Numbers */}
                        <div className="w-12 bg-[#1e1e1e] text-zinc-600 text-right pr-3 pt-4 text-xs font-mono select-none">
                            {code[selectedFile]?.content.split('\n').map((_, i) => (
                                <div key={i} className="leading-6">{i + 1}</div>
                            ))}
                        </div>
                        {/* Content */}
                        <pre className="flex-1 p-4 pt-4 text-sm font-mono leading-6 text-[#d4d4d4] outline-none">
                            <code 
                                dangerouslySetInnerHTML={{
                                    __html: highlightSyntax(code[selectedFile]?.content || '', code[selectedFile]?.language || 'text')
                                }}
                            />
                        </pre>
                    </div>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Simple syntax highlighter for the vibe
const highlightSyntax = (code: string, lang: string) => {
    // Basic escaping
    let html = code
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    if (lang === 'javascript' || lang === 'jsx') {
        html = html
            .replace(/\b(import|export|from|const|let|var|function|return|if|else|switch|case|default|while|for|break|continue|try|catch|throw|async|await)\b/g, '<span class="text-purple-400">$1</span>')
            .replace(/\b(true|false|null|undefined)\b/g, '<span class="text-blue-400">$1</span>')
            .replace(/\b(this|super)\b/g, '<span class="text-red-400">$1</span>')
            .replace(/(['"`])(.*?)\1/g, '<span class="text-green-400">$&</span>') // Strings
            .replace(/\/\/.*/g, '<span class="text-zinc-500">$0</span>') // Comments
            .replace(/\b([A-Z][a-zA-Z0-9_]*)\b/g, '<span class="text-yellow-300">$1</span>') // Components/Types
            .replace(/(\w+)\(/g, '<span class="text-blue-300">$1</span>('); // Functions
    } else if (lang === 'html') {
         html = html
            .replace(/(&lt;\/?)(\w+)/g, '$1<span class="text-blue-400">$2</span>') // Tags
            .replace(/(\s)(\w+)=/g, '$1<span class="text-purple-300">$2</span>=') // Attributes
            .replace(/(['"`])(.*?)\1/g, '<span class="text-green-400">$&</span>'); // Strings
    } else if (lang === 'css') {
         html = html
            .replace(/([\.#][\w-]+)/g, '<span class="text-yellow-400">$1</span>') // Selectors
            .replace(/([\w-]+):/g, '<span class="text-blue-300">$1</span>:') // Properties
            .replace(/:(.*?);/g, ':<span class="text-green-400">$1</span>;'); // Values
    }

    return html;
};

export default PreviewPanel;
