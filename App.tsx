
import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import ChatInterface from './components/ChatInterface';
import PreviewPanel from './components/PreviewPanel';
import SettingsModal from './components/SettingsModal';
import TemplateSelector from './components/TemplateSelector';
import AgentProgressPanel from './components/AgentProgressPanel';
import ProjectsManager from './components/ProjectsManager';
import ProjectsSidebar from './components/ProjectsSidebar';
import GenerationProgress from './components/GenerationProgress';
import { sendMessage } from './services/ai';
import { extractCodeBlock } from './utils/codeParser';
import { Message, Role, GeneratedCode, AISettings } from './types';
import { DEFAULT_SETTINGS } from './constants';
import { ProjectTemplate } from './templates';
import { multiAgentService, AgentState } from './services/agents';
import { StoredProject, StorageService } from './services/storage';
import { getDefaultScaffold, getScaffoldDescription, getScaffoldTags } from './templates/scaffold';
import { analyzeAndRecommendStack, fetchRealScaffold, generateScaffold, ProjectRecommendation } from './services/projectInitializer';
import { generateThinkingPlan, formatThinkingPlan, createPhaseMessage, formatImplementationSteps } from './services/thinkingMethodology';

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
  
  // Settings State (must be declared early for use in other functions)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<AISettings>(DEFAULT_SETTINGS);
  
  // Multi-agent state
  const [isMultiAgentMode, setIsMultiAgentMode] = useState(false);
  const [agentStates, setAgentStates] = useState<AgentState[]>([]);
  const [agentProgress, setAgentProgress] = useState(0);
  const [agentPhase, setAgentPhase] = useState('');
  const [isAgentActive, setIsAgentActive] = useState(false);
  
  // Generation progress state
  const [generationStage, setGenerationStage] = useState<'thinking' | 'generating' | 'parsing' | 'complete'>('thinking');
  const [tokensGenerated, setTokensGenerated] = useState(0);
  const [currentFile, setCurrentFile] = useState<string>('');
  const [estimatedTime, setEstimatedTime] = useState(30);
  
  // Smart initialization state
  const [showStackRecommendation, setShowStackRecommendation] = useState(false);
  const [stackRecommendation, setStackRecommendation] = useState<ProjectRecommendation | null>(null);
  
  // Thinking methodology state
  const [showThinkingProcess, setShowThinkingProcess] = useState(true); // Enable by default
  const [currentImplementationStep, setCurrentImplementationStep] = useState(0);
  
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
    // Save current project state before switching
    if (currentProjectId && currentProjectId !== project.id) {
      StorageService.updateProject(currentProjectId, {
        files: generatedCode || {},
        chatHistory: messages,
        settings: settings
      });
      console.log(`Saved state for project ${currentProjectId} before switching`);
    }
    
    // Load complete project data with isolated storage
    const fullProject = StorageService.getProject(project.id);
    if (!fullProject) {
      console.error(`Failed to load project ${project.id}`);
      return;
    }
    
    // Load project files
    setGeneratedCode(fullProject.files);
    setCurrentProjectId(fullProject.id);
    setCurrentProjectName(fullProject.name);
    
    // Restore chat history
    if (fullProject.chatHistory && fullProject.chatHistory.length > 0) {
      setMessages(fullProject.chatHistory);
      console.log(`Restored ${fullProject.chatHistory.length} messages for project ${fullProject.id}`);
    } else {
      // Add a message to chat indicating project loaded
      const loadMessage: Message = {
        id: Date.now().toString(),
        role: Role.MODEL,
        content: `📂 **Project Loaded:** ${fullProject.name}\n\n${fullProject.description}\n\n${Object.keys(fullProject.files).length} files loaded. You can now preview and edit the project!`,
        timestamp: Date.now()
      };
      setMessages([loadMessage]);
    }
    
    // Restore project-specific settings if available
    if (fullProject.settings) {
      setSettings(fullProject.settings);
      console.log(`Restored project-specific settings for ${fullProject.id}`);
    }
    
    console.log(`Project ${fullProject.id} loaded with isolated data from: ${(import.meta as any).env?.VITE_DATA_DIR || './vibecode-projects'}/${fullProject.id}/`);
  };

  // Handle project load from manager (backwards compatibility)
  const handleLoadProject = (project: StoredProject) => {
    handleSelectProject(project);
  };

  // Handle new project
  const handleNewProject = () => {
    if (generatedCode && messages.length > 0) {
      // Save current project with all data before starting new one
      if (currentProjectId) {
        StorageService.updateProject(currentProjectId, {
          files: generatedCode,
          chatHistory: messages,
          settings: settings
        });
        console.log(`Saved project ${currentProjectId} before creating new project`);
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
        // Update existing project with all isolated data
        StorageService.updateProject(currentProjectId, {
          files: generatedCode,
          chatHistory: messages,
          settings: settings  // Save project-specific settings
        });
        console.log(`Project ${currentProjectId} updated (auto-save) in isolated storage`);
      } else {
        // First save: Create new project with unique ID and isolated storage
        const projectName = currentProjectName || `Project ${new Date().toLocaleDateString()}`;
        const projectId = StorageService.saveProject({
          name: projectName,
          description: 'Auto-saved project',
          files: generatedCode,
          chatHistory: messages,
          settings: settings,
          tags: ['auto-save']
        });
        setCurrentProjectId(projectId);
        setCurrentProjectName(projectName);
        console.log(`New project created with isolated storage: ${projectId}`);
      }
    }, 30000); // 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [generatedCode, messages, currentProjectId, currentProjectName, settings]);
  
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
      // Check if this is a new project request (heuristic: contains "build", "create", "make")
      const isNewProjectRequest = /\b(build|create|make|develop|generate|design)\b/i.test(messageText) && 
                                  !generatedCode; // No code yet = new project
      
      // PHASE 1: THINKING PROCESS (if enabled)
      if (showThinkingProcess && isNewProjectRequest) {
        setGenerationStage('thinking');
        
        // Show thinking phase message
        const thinkingStartMessage: Message = {
          id: Date.now().toString(),
          role: Role.MODEL,
          content: createPhaseMessage({
            phase: 'understanding',
            title: 'Understanding Requirements',
            content: 'Analyzing your request to understand exactly what you need...',
            status: 'thinking'
          }),
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, thinkingStartMessage]);
        
        // Generate structured thinking plan
        const thinkingPlan = await generateThinkingPlan(
          messageText,
          {
            hasExistingCode: !!generatedCode,
            projectType: currentProjectName || 'New project',
            currentFiles: generatedCode ? Object.keys(generatedCode) : []
          },
          settings
        );
        
        // Show the complete thinking plan
        const planMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: Role.MODEL,
          content: formatThinkingPlan(thinkingPlan),
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, planMessage]);
        
        // Show implementation steps
        const stepsMessage: Message = {
          id: (Date.now() + 2).toString(),
          role: Role.MODEL,
          content: formatImplementationSteps(thinkingPlan.steps, 0),
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, stepsMessage]);
        
        // Small delay to let user read the plan
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
      
      // Smart initialization: Analyze and recommend stack first
      if (isNewProjectRequest) {
        setGenerationStage('thinking');
        
        // AI analyzes and recommends tech stack
        const recommendation = await analyzeAndRecommendStack(messageText, settings);
        
        // Show recommendation to user
        const recommendationMessage: Message = {
          id: Date.now().toString(),
          role: Role.MODEL,
          content: `🎯 **Project Analysis Complete**\n\n**Recommended Tech Stack:**\n- **Framework:** ${recommendation.framework}\n- **Build Tool:** ${recommendation.tooling}\n- **Project Type:** ${recommendation.projectType}\n\n**Reasoning:** ${recommendation.reasoning}\n\n**Next Steps:**\nI'll initialize your project with industry-standard scaffolding (${recommendation.scaffoldCommand}), then customize it based on your requirements.\n\nInitializing project...`,
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, recommendationMessage]);
        
        // Fetch real scaffold from CDN
        setGenerationStage('parsing');
        setCurrentFile('Fetching from CDN...');
        const scaffold = await fetchRealScaffold(recommendation);
        
        // Load scaffold into editor
        setGeneratedCode(scaffold.files);
        
        // Create project ID
        if (!currentProjectId) {
          const projectId = `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          setCurrentProjectId(projectId);
          setCurrentProjectName(`${recommendation.projectType} - ${new Date().toLocaleDateString()}`);
        }
        
        // Notify user that scaffold is ready
        const scaffoldReadyMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: Role.MODEL,
          content: `✅ **Project Initialized!**\n\n**Scaffold:** ${scaffold.name}\n**Files Created:** ${Object.keys(scaffold.files).length}\n\nYour project is now set up with:\n${Object.keys(scaffold.files).map(f => `- ${f}`).join('\n')}\n\nNow I'll customize it based on your request: "${messageText}"`,
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, scaffoldReadyMessage]);
        
        setGenerationStage('complete');
        
        // Now continue with AI customization based on the original request
        // This will build on top of the scaffold
        const customizationPrompt = `Using the initialized ${scaffold.name} project scaffold, customize it to: ${messageText}. 

The project already has these files:
${Object.keys(scaffold.files).join(', ')}

Focus on customizing the App component and adding any additional features needed. Keep the existing project structure.`;
        
        // Continue with normal AI generation for customization
        const userMessage: Message = {
          id: (Date.now() + 2).toString(),
          role: Role.USER,
          content: customizationPrompt,
          timestamp: Date.now(),
        };
        
        const customizationMessages = [...messages, recommendationMessage, scaffoldReadyMessage, userMessage];
        setMessages(customizationMessages);
      }
      
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
        // Use single-agent system with progress tracking
        setGenerationStage('thinking');
        setTokensGenerated(0);
        setEstimatedTime(30);
        
        const botMessageId = (Date.now() + 1).toString();
        setMessages((prev) => [
          ...prev,
          { id: botMessageId, role: Role.MODEL, content: '', timestamp: Date.now() },
        ]);

        const stream = await sendMessage(newMessages, settings);
        let fullContent = '';
        let tokenCount = 0;
        let hasStartedGenerating = false;

        for await (const chunk of stream) {
          // Check if user pressed stop
          if (stopRef.current) {
            setGenerationStage('complete');
            break;
          }

          const text = chunk.text;
          if (text) {
            if (!hasStartedGenerating) {
              setGenerationStage('generating');
              hasStartedGenerating = true;
            }
            
            fullContent += text;
            tokenCount += text.split(/\s+/).length; // Rough token estimate
            setTokensGenerated(tokenCount);
            
            // Update message in real-time
            setMessages((prev) => 
              prev.map(msg => 
                msg.id === botMessageId ? { ...msg, content: fullContent } : msg
              )
            );

            // Try to extract code in real-time (even partial) for the preview
            const extracted = extractCodeBlock(fullContent);
            if (extracted) {
               setGenerationStage('parsing');
               setCurrentFile(Object.keys(extracted)[0] || '');
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
        
        setGenerationStage('complete');
        setTimeout(() => setGenerationStage('thinking'), 2000); // Reset after 2s
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

      <GenerationProgress
        isActive={isLoading && !isMultiAgentMode}
        stage={generationStage}
        tokensGenerated={tokensGenerated}
        estimatedTime={estimatedTime}
        currentFile={currentFile}
      />
    </div>
  );
}

export default App;
