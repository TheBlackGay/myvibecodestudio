
import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import ChatInterface from './components/ChatInterface';
import PreviewPanel from './components/PreviewPanel';
import SettingsModal from './components/SettingsModal';
import TemplateSelector from './components/TemplateSelector';
import AgentProgressPanel from './components/AgentProgressPanel';
import ProjectsManager from './components/ProjectsManager';
import ProjectsSidebar from './components/ProjectsSidebar';
import { sendMessage } from './services/ai';
import { extractCodeBlock } from './utils/codeParser';
import { Message, Role, GeneratedCode, AISettings } from './types';
import { DEFAULT_SETTINGS } from './constants';
import { ProjectTemplate } from './templates';
import { multiAgentService, AgentState } from './services/agents';
import { StoredProject, StorageService } from './services/storage';
import { getDefaultScaffold, getScaffoldDescription, getScaffoldTags } from './templates/scaffold';

function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode | null>(null);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [currentProjectName, setCurrentProjectName] = useState<string>('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Multi-agent state
  const [isMultiAgentMode, setIsMultiAgentMode] = useState(false);
  const [agentStates, setAgentStates] = useState<AgentState[]>([]);
  const [agentProgress, setAgentProgress] = useState(0);
  const [agentPhase, setAgentPhase] = useState('');
  const [isAgentActive, setIsAgentActive] = useState(false);
  
  // Handle code changes from Monaco Editor
  const handleCodeChange = (filePath: string, content: string) => {
    if (!generatedCode) return;
    
    setGeneratedCode(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        [filePath]: {
          ...prev[filePath],
          content
        }
      };
    });
  };

  // Handle file creation
  const handleFileCreate = (path: string, content: string, language: string) => {
    setGeneratedCode(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        [path]: {
          language,
          content
        }
      };
    });
  };

  // Handle file deletion
  const handleFileDelete = (path: string) => {
    setGeneratedCode(prev => {
      if (!prev) return prev;
      const newCode = { ...prev };
      delete newCode[path];
      return newCode;
    });
  };

  // Handle template selection
  const handleTemplateSelect = (template: ProjectTemplate) => {
    setGeneratedCode(template.files);
    
    // Create a new project ID for this template
    const projectId = `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setCurrentProjectId(projectId);
    setCurrentProjectName(template.name);
  };

  // Handle project load from sidebar
  const handleSelectProject = (project: StoredProject) => {
    setGeneratedCode(project.files);
    setCurrentProjectId(project.id);
    setCurrentProjectName(project.name);
    
    // Restore chat history if available
    if (project.chatHistory && project.chatHistory.length > 0) {
      setMessages(project.chatHistory);
    } else {
      // Add a message to chat indicating project loaded
      const loadMessage: Message = {
        id: Date.now().toString(),
        role: Role.MODEL,
        content: `📂 **Project Loaded:** ${project.name}\n\n${project.description}\n\n${Object.keys(project.files).length} files loaded. You can now preview and edit the project!`,
        timestamp: Date.now()
      };
      setMessages([loadMessage]);
    }
  };

  // Handle project load from manager (backwards compatibility)
  const handleLoadProject = (project: StoredProject) => {
    handleSelectProject(project);
  };

  // Handle new project
  const handleNewProject = () => {
    if (generatedCode && messages.length > 0) {
      // Save current project before starting new one
      if (currentProjectId) {
        StorageService.updateProject(currentProjectId, {
          files: generatedCode,
          chatHistory: messages
        });
      }
    }
    
    // Create a new project record immediately with scaffold code
    const timestamp = new Date().toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: 'numeric', 
      minute: '2-digit' 
    });
    const projectName = `New Project - ${timestamp}`;
    const scaffoldCode = getDefaultScaffold();
    
    // Create project with unique ID and scaffold
    const projectId = StorageService.saveProject({
      name: projectName,
      description: getScaffoldDescription(),
      files: scaffoldCode,
      chatHistory: [],
      tags: getScaffoldTags()
    });
    
    // Set up the new project
    setGeneratedCode(scaffoldCode);
    setMessages([]);
    setCurrentProjectId(projectId);
    setCurrentProjectName(projectName);
    
    console.log(`New project created: ${projectName} (ID: ${projectId})`);
  };

  // Auto-save current project (every 30 seconds if there's code)
  useEffect(() => {
    if (!generatedCode) return;
    
    const autoSaveInterval = setInterval(() => {
      if (currentProjectId) {
        // Update existing project (no new snapshots)
        StorageService.updateProject(currentProjectId, {
          files: generatedCode,
          chatHistory: messages
        });
        console.log(`Project ${currentProjectId} updated (auto-save)`);
      } else {
        // First save: Create new project with unique ID
        const projectName = currentProjectName || `Project ${new Date().toLocaleDateString()}`;
        const projectId = StorageService.saveProject({
          name: projectName,
          description: 'Auto-saved project',
          files: generatedCode,
          chatHistory: messages,
          tags: ['auto-save']
        });
        setCurrentProjectId(projectId);
        setCurrentProjectName(projectName);
        console.log(`New project created with ID: ${projectId}`);
      }
    }, 30000); // 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [generatedCode, messages, currentProjectId, currentProjectName]);
  
  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<AISettings>(DEFAULT_SETTINGS);
  
  // Ref to track if the current request should be stopped
  const stopRef = useRef(false);

  // Load settings and initialize on mount
  useEffect(() => {
    // Load Settings
    const savedSettings = localStorage.getItem('vibe_ai_settings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
    
    // Initialize with default project if no projects exist
    const allProjects = StorageService.getAllProjects();
    if (allProjects.length === 0) {
      // First time user - create welcome project
      const scaffoldCode = getDefaultScaffold();
      const projectId = StorageService.saveProject({
        name: 'Welcome Project',
        description: getScaffoldDescription(),
        files: scaffoldCode,
        chatHistory: [{
          id: Date.now().toString(),
          role: Role.MODEL,
          content: `👋 **Welcome to VibeCode Studio!**\n\nYou're all set to start building amazing applications with AI.\n\n**Quick Start:**\n1. Describe what you want to build in the chat\n2. AI will generate the code for you\n3. Edit the code in Monaco Editor\n4. See live preview on the right\n\n**Tips:**\n- Use the Multi-Agent mode (🧠) for complex projects\n- Browse templates for quick starts\n- All projects auto-save every 30 seconds\n\nLet's build something awesome! ✨`,
          timestamp: Date.now()
        }],
        tags: getScaffoldTags()
      });
      
      setGeneratedCode(scaffoldCode);
      setCurrentProjectId(projectId);
      setCurrentProjectName('Welcome Project');
      setMessages([{
        id: Date.now().toString(),
        role: Role.MODEL,
        content: `👋 **Welcome to VibeCode Studio!**\n\nYou're all set to start building amazing applications with AI.\n\n**Quick Start:**\n1. Describe what you want to build in the chat\n2. AI will generate the code for you\n3. Edit the code in Monaco Editor\n4. See live preview on the right\n\n**Tips:**\n- Use the Multi-Agent mode (🧠) for complex projects\n- Browse templates for quick starts\n- All projects auto-save every 30 seconds\n\nLet's build something awesome! ✨`,
        timestamp: Date.now()
      }]);
      
      console.log('Welcome project created for first-time user');
    }
  }, []);

  const handleSettingsSave = (newSettings: AISettings) => {
    setSettings(newSettings);
    localStorage.setItem('vibe_ai_settings', JSON.stringify(newSettings));
    
    // If saving valid settings, clear any error messages about missing keys
    if (newSettings.apiKey) {
      setMessages(prev => prev.filter(m => !m.isError));
    }
  };

  const handleReset = () => {
    handleNewProject();
  };

  const handleStop = () => {
    stopRef.current = true;
    setIsLoading(false);
  };

  const handleSend = async (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim() || isLoading) return;
    
    // Check if key is configured
    if (!settings.apiKey) {
      setIsSettingsOpen(true);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: Role.MODEL,
        content: "Please configure your API Key in the settings to start vibe coding.",
        timestamp: Date.now(),
        isError: true
      }]);
      return;
    }

    // Reset stop flag for new request
    stopRef.current = false;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      content: messageText,
      timestamp: Date.now(),
    };

    // Update state with user message
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      // Check if multi-agent mode is enabled
      if (isMultiAgentMode) {
        // Use multi-agent system
        setIsAgentActive(true);
        setAgentProgress(0);
        setAgentPhase('Initializing multi-agent system...');

        const result = await multiAgentService.executeRequest(
          { userPrompt: messageText },
          settings,
          (status, progress, agents) => {
            setAgentPhase(status);
            setAgentProgress(progress);
            setAgentStates(agents);
          }
        );

        setIsAgentActive(false);

        if (result.success) {
          // Add agent summary message
          const summaryMessage: Message = {
            id: Date.now().toString(),
            role: Role.MODEL,
            content: `✨ **Multi-Agent System Complete**\n\n${result.summary}\n\n**Agents Involved:**\n- 🧠 Coordinator: Orchestrated the workflow\n- 🏗️ Architect: Designed the structure\n- 🎨 Frontend: Built the UI components\n- ⚙️ Backend: Implemented logic\n- 🔍 Reviewer: Ensured code quality\n\nYou can now preview and edit the generated code!`,
            timestamp: Date.now()
          };
          
          setMessages(prev => [...prev, summaryMessage]);
          setGeneratedCode(result.files);
          
          // Create new project ID if not exists
          if (!currentProjectId) {
            const projectId = `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            setCurrentProjectId(projectId);
            setCurrentProjectName(`AI Project ${new Date().toLocaleDateString()}`);
          }
        } else {
          const errorMessage: Message = {
            id: Date.now().toString(),
            role: Role.MODEL,
            content: `❌ Multi-agent system encountered an error: ${result.summary}`,
            timestamp: Date.now(),
            isError: true
          };
          setMessages(prev => [...prev, errorMessage]);
        }
      } else {
        // Use single-agent system (original behavior)
        const botMessageId = (Date.now() + 1).toString();
        setMessages((prev) => [
          ...prev,
          { id: botMessageId, role: Role.MODEL, content: '', timestamp: Date.now() },
        ]);

        const stream = await sendMessage(newMessages, settings);
        let fullContent = '';

        for await (const chunk of stream) {
          // Check if user pressed stop
          if (stopRef.current) {
            break;
          }

          const text = chunk.text;
          if (text) {
            fullContent += text;
            
            // Update message in real-time
            setMessages((prev) => 
              prev.map(msg => 
                msg.id === botMessageId ? { ...msg, content: fullContent } : msg
              )
            );

            // Try to extract code in real-time (even partial) for the preview
            const extracted = extractCodeBlock(fullContent);
            if (extracted) {
               setGeneratedCode(extracted);
               
               // Create new project ID if not exists (first code generation)
               if (!currentProjectId) {
                 const projectId = `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                 setCurrentProjectId(projectId);
                 setCurrentProjectName(`AI Project ${new Date().toLocaleDateString()}`);
               }
            }
          }
        }
      }

    } catch (error: any) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        { 
            id: Date.now().toString(), 
            role: Role.MODEL, 
            content: `Error: ${error.message || "Failed to connect to the AI model."}`, 
            timestamp: Date.now(),
            isError: true
        },
      ]);
    } finally {
      setIsLoading(false);
      stopRef.current = false;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans selection:bg-indigo-500/30">
      <Header 
        onReset={handleNewProject} 
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenTemplates={() => setIsTemplatesOpen(true)}
        onOpenProjects={() => setIsProjectsOpen(true)}
        isMultiAgentMode={isMultiAgentMode}
        onToggleMultiAgent={() => setIsMultiAgentMode(!isMultiAgentMode)}
      />
      
      <main className="flex-1 flex overflow-hidden relative">
        <ProjectsSidebar
          onSelectProject={handleSelectProject}
          onNewProject={handleNewProject}
          currentProjectId={currentProjectId}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          <ChatInterface
            messages={messages}
            input={input}
            setInput={setInput}
            onSend={handleSend}
            onStop={handleStop}
            isLoading={isLoading}
          />
          <PreviewPanel 
            code={generatedCode} 
            onCodeChange={handleCodeChange}
            onFileCreate={handleFileCreate}
            onFileDelete={handleFileDelete}
          />
        </div>
      </main>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={handleSettingsSave}
      />

      <TemplateSelector
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        onSelect={handleTemplateSelect}
      />

      <ProjectsManager
        isOpen={isProjectsOpen}
        onClose={() => setIsProjectsOpen(false)}
        onLoadProject={handleLoadProject}
        currentFiles={generatedCode}
        currentProjectId={currentProjectId}
        currentProjectName={currentProjectName}
      />

      <AgentProgressPanel
        agents={agentStates}
        currentPhase={agentPhase}
        overallProgress={agentProgress}
        isActive={isAgentActive}
      />
    </div>
  );
}

export default App;
