
import React, { useState, useEffect, useRef } from 'react';
import { Eye, Code, Smartphone, Monitor, Tablet, RefreshCw, ExternalLink, Sparkles, Download, FileCode, FolderOpen, File, Menu, ChevronRight, ChevronDown, Save, Edit3, Plus, Trash2, X } from 'lucide-react';
import { GeneratedCode, FileData } from '../types';
import { bundleProject } from '../utils/bundler';
import JSZip from 'jszip';
import Editor from '@monaco-editor/react';
import ConsolePanel, { ConsoleMessage } from './ConsolePanel';

interface PreviewPanelProps {
  code: GeneratedCode | null;
  onCodeChange: (filePath: string, content: string) => void;
  onFileCreate?: (path: string, content: string, language: string) => void;
  onFileDelete?: (path: string) => void;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({ code, onCodeChange, onFileCreate, onFileDelete }) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [key, setKey] = useState(0); // Used to force iframe refresh
  const [viewport, setViewport] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [bundledHtml, setBundledHtml] = useState('');
  
  // File Explorer State
  const [selectedFile, setSelectedFile] = useState<string>('public/index.html');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['public', 'src']));
  
  // Editor State
  const [isEditorReady, setIsEditorReady] = useState(false);
  const editorRef = useRef<any>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [editingContent, setEditingContent] = useState<string>('');
  
  // Console State
  const [consoleMessages, setConsoleMessages] = useState<ConsoleMessage[]>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  // File management state
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileFolder, setNewFileFolder] = useState('src');

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

  // Setup console message listener
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Only accept messages from our iframe
      if (event.data && event.data.type === 'console') {
        const newMessage: ConsoleMessage = {
          id: Date.now().toString() + Math.random(),
          type: event.data.level || 'log',
          message: event.data.message,
          timestamp: Date.now(),
        };
        setConsoleMessages(prev => [...prev, newMessage]);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Update editing content when selected file changes
  useEffect(() => {
    if (code && selectedFile && code[selectedFile]) {
      setEditingContent(code[selectedFile].content);
      setHasUnsavedChanges(false);
    }
  }, [selectedFile, code]);

  const handleEditorMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    setIsEditorReady(true);
    
    // Configure Monaco theme
    monaco.editor.defineTheme('vibe-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955' },
        { token: 'keyword', foreground: 'C586C0' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'type', foreground: '4EC9B0' },
        { token: 'class', foreground: '4EC9B0' },
        { token: 'function', foreground: 'DCDCAA' },
      ],
      colors: {
        'editor.background': '#1e1e1e',
        'editor.foreground': '#d4d4d4',
        'editor.lineHighlightBackground': '#2a2d2e',
        'editorLineNumber.foreground': '#858585',
        'editor.selectionBackground': '#264f78',
        'editor.inactiveSelectionBackground': '#3a3d41',
      },
    });
    monaco.editor.setTheme('vibe-dark');
    
    // Add keyboard shortcut for saving (Cmd/Ctrl + S)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSaveChanges();
    });
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setEditingContent(value);
      setHasUnsavedChanges(value !== code?.[selectedFile]?.content);
    }
  };

  const handleSaveChanges = () => {
    if (selectedFile && editingContent !== undefined) {
      onCodeChange(selectedFile, editingContent);
      setHasUnsavedChanges(false);
    }
  };

  const handleDiscardChanges = () => {
    if (code && selectedFile && code[selectedFile]) {
      setEditingContent(code[selectedFile].content);
      setHasUnsavedChanges(false);
    }
  };

  const handleRefresh = () => {
    setKey((prev) => prev + 1);
    setConsoleMessages([]); // Clear console on refresh
  };

  const handleClearConsole = () => {
    setConsoleMessages([]);
  };

  const handleCreateFile = () => {
    if (!newFileName.trim() || !onFileCreate) return;
    
    const extension = newFileName.split('.').pop() || '';
    let language = 'plaintext';
    if (extension === 'html') language = 'html';
    else if (extension === 'css') language = 'css';
    else if (extension === 'js' || extension === 'jsx') language = 'javascript';
    else if (extension === 'ts' || extension === 'tsx') language = 'typescript';
    else if (extension === 'md') language = 'markdown';
    
    const filePath = `${newFileFolder}/${newFileName}`;
    onFileCreate(filePath, '', language);
    
    setNewFileName('');
    setIsCreatingFile(false);
    setSelectedFile(filePath);
  };

  const handleDeleteFile = (path: string) => {
    if (!onFileDelete) return;
    
    const confirmed = window.confirm(`Are you sure you want to delete ${path}?`);
    if (confirmed) {
      onFileDelete(path);
      // Select another file if we deleted the current one
      if (selectedFile === path && code) {
        const otherFiles = Object.keys(code).filter(p => p !== path);
        if (otherFiles.length > 0) {
          setSelectedFile(otherFiles[0]);
        }
      }
    }
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
    Object.entries(code).forEach(([path, fileData]: [string, FileData]) => {
        zip.file(path, fileData.content);
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
            title="Edit code with Monaco Editor"
          >
            <Edit3 className="w-3.5 h-3.5" />
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
            {hasUnsavedChanges && (
              <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-orange-500/10 border border-orange-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                <span className="text-[10px] text-orange-400 font-medium">Unsaved Changes</span>
              </div>
            )}
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
      <div className="flex-1 overflow-hidden flex relative flex-col">
        {activeTab === 'preview' ? (
          <>
            <div className={`flex-1 flex justify-center bg-[#09090b] overflow-hidden ${viewport !== 'desktop' ? 'items-start overflow-y-auto pt-8' : ''}`}>
              <div className={`transition-all duration-300 ease-in-out bg-white ${getViewportClass()} ${viewport === 'desktop' ? 'h-full' : 'shrink-0'}`}>
                <iframe
                  ref={iframeRef}
                  key={key}
                  title="Preview"
                  srcDoc={bundledHtml}
                  className="w-full h-full border-none"
                  sandbox="allow-scripts allow-same-origin allow-modals"
                />
              </div>
            </div>
            <ConsolePanel messages={consoleMessages} onClear={handleClearConsole} />
          </>
        ) : (
          <div className="w-full h-full flex bg-[#1e1e1e]">
             {/* VSCode Sidebar */}
             <div className="w-64 bg-[#18181b] border-r border-[#27272a] flex flex-col">
                <div className="h-9 px-4 flex items-center justify-between text-[11px] font-bold text-zinc-500 tracking-wider">
                   <span>EXPLORER</span>
                   <button
                     onClick={() => setIsCreatingFile(true)}
                     className="p-1 rounded hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                     title="New File"
                   >
                     <Plus className="w-3.5 h-3.5" />
                   </button>
                </div>
                
                {/* New File Modal */}
                {isCreatingFile && (
                  <div className="mx-2 my-2 p-3 bg-zinc-800 rounded-lg border border-zinc-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-zinc-300">New File</span>
                      <button
                        onClick={() => setIsCreatingFile(false)}
                        className="p-0.5 rounded hover:bg-zinc-700 text-zinc-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <select
                      value={newFileFolder}
                      onChange={(e) => setNewFileFolder(e.target.value)}
                      className="w-full mb-2 px-2 py-1 text-xs bg-zinc-900 border border-zinc-700 rounded text-zinc-300 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="src">src/</option>
                      <option value="public">public/</option>
                      <option value="">root</option>
                    </select>
                    <input
                      type="text"
                      value={newFileName}
                      onChange={(e) => setNewFileName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateFile()}
                      placeholder="filename.jsx"
                      className="w-full mb-2 px-2 py-1 text-xs bg-zinc-900 border border-zinc-700 rounded text-zinc-300 focus:outline-none focus:border-indigo-500"
                      autoFocus
                    />
                    <button
                      onClick={handleCreateFile}
                      disabled={!newFileName.trim()}
                      className="w-full px-2 py-1 text-xs bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded transition-colors"
                    >
                      Create File
                    </button>
                  </div>
                )}

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
                                    className={`group flex items-center justify-between gap-2 pl-8 pr-2 py-1 text-xs cursor-pointer border-l-2 ${selectedFile === path ? 'bg-[#37373d] text-white border-indigo-500' : 'text-zinc-400 hover:bg-[#2a2d2e] hover:text-zinc-100 border-transparent'}`}
                                >
                                    <div className="flex items-center gap-2 flex-1 min-w-0" onClick={() => setSelectedFile(path)}>
                                        <FileCode className={`w-3.5 h-3.5 shrink-0 ${path.endsWith('css') ? 'text-blue-400' : path.endsWith('jsx') ? 'text-yellow-400' : 'text-orange-400'}`} />
                                        <span className="truncate">{path.split('/')[1]}</span>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteFile(path);
                                        }}
                                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition-all"
                                        title="Delete file"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                      ))}

                      {/* Root Files */}
                      {fileTree['root']?.map(path => (
                         <div 
                            key={path}
                            className={`group flex items-center justify-between gap-2 pl-4 pr-2 py-1 text-xs cursor-pointer border-l-2 ${selectedFile === path ? 'bg-[#37373d] text-white border-indigo-500' : 'text-zinc-400 hover:bg-[#2a2d2e] hover:text-zinc-100 border-transparent'}`}
                        >
                            <div className="flex items-center gap-2 flex-1 min-w-0" onClick={() => setSelectedFile(path)}>
                                <File className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                                <span className="truncate">{path}</span>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteFile(path);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition-all"
                                title="Delete file"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </div>
                      ))}
                   </div>
                </div>
             </div>

             {/* Editor Area */}
             <div className="flex-1 flex flex-col min-w-0">
                {/* Tabs */}
                {selectedFile && (
                   <div className="h-9 bg-[#1e1e1e] flex items-center justify-between border-b border-[#27272a] overflow-x-auto scrollbar-hide">
                      <div className="flex items-center gap-2 px-3 py-2 bg-[#1e1e1e] text-zinc-100 text-xs border-t-2 border-indigo-500 h-full min-w-fit">
                          <FileCode className={`w-3.5 h-3.5 ${selectedFile.endsWith('css') ? 'text-blue-400' : selectedFile.endsWith('jsx') ? 'text-yellow-400' : 'text-orange-400'}`} />
                          {selectedFile}
                          {hasUnsavedChanges && (
                            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse ml-1" title="Unsaved changes" />
                          )}
                      </div>
                      
                      {/* Save/Discard buttons */}
                      {hasUnsavedChanges && (
                        <div className="flex items-center gap-2 px-3">
                          <button
                            onClick={handleDiscardChanges}
                            className="px-2 py-1 text-[10px] rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all border border-zinc-700"
                          >
                            Discard
                          </button>
                          <button
                            onClick={handleSaveChanges}
                            className="flex items-center gap-1 px-2 py-1 text-[10px] rounded bg-indigo-600 hover:bg-indigo-500 text-white transition-all"
                          >
                            <Save className="w-3 h-3" />
                            Save
                          </button>
                        </div>
                      )}
                   </div>
                )}
                
                {/* Monaco Editor */}
                <div className="flex-1 overflow-hidden bg-[#1e1e1e]">
                    <Editor
                      height="100%"
                      language={code?.[selectedFile]?.language || 'plaintext'}
                      value={editingContent}
                      onChange={handleEditorChange}
                      onMount={handleEditorMount}
                      theme="vibe-dark"
                      options={{
                        minimap: { enabled: false },
                        fontSize: 13,
                        lineNumbers: 'on',
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        tabSize: 2,
                        wordWrap: 'on',
                        fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', monospace",
                        fontLigatures: true,
                        formatOnPaste: true,
                        formatOnType: true,
                        padding: { top: 16, bottom: 16 },
                        smoothScrolling: true,
                        cursorBlinking: 'smooth',
                        cursorSmoothCaretAnimation: 'on',
                        renderLineHighlight: 'all',
                        bracketPairColorization: { enabled: true },
                      }}
                    />
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PreviewPanel;
