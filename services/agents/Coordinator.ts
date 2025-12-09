// Coordinator Agent - Orchestrates the multi-agent system

import { Agent } from './Agent';
import { AgentRole, AgentTask, MultiAgentRequest, MultiAgentResponse } from './types';
import { extractCodeBlock } from '../../utils/codeParser';
import { AISettings } from '../../types';

export class Coordinator extends Agent {
  private agents: Map<AgentRole, Agent>;
  private tasks: AgentTask[];

  constructor(settings: AISettings) {
    super('coordinator', 'Coordinator', settings);
    this.agents = new Map();
    this.tasks = [];
    
    // Initialize other agents with settings
    this.agents.set('architect', new Agent('architect', 'Architect', settings));
    this.agents.set('frontend', new Agent('frontend', 'Frontend Developer', settings));
    this.agents.set('backend', new Agent('backend', 'Backend Developer', settings));
    this.agents.set('reviewer', new Agent('reviewer', 'Code Reviewer', settings));
  }

  async orchestrate(request: MultiAgentRequest, onProgress?: (status: string, progress: number) => void): Promise<MultiAgentResponse> {
    try {
      onProgress?.('Planning project structure...', 10);
      
      // Step 1: Coordinator creates the plan
      const planPrompt = `Analyze this request and create a development plan: "${request.userPrompt}"
      
      Break it down into specific tasks for the Architect, Frontend, and Backend agents.
      Respond with a JSON object containing the plan and task assignments.`;
      
      const planResponse = await this.execute(planPrompt);
      const plan = this.extractJSON(planResponse);

      onProgress?.('Architect designing structure...', 25);
      
      // Step 2: Architect designs the structure
      const architectAgent = this.agents.get('architect')!;
      const architectTask = `Design the architecture for: ${request.userPrompt}
      
      Plan the component hierarchy, file structure, and data flow.
      List all files that need to be created with their purposes.`;
      
      const architectResponse = await architectAgent.execute(architectTask);
      const architecture = this.extractJSON(architectResponse) || { files: [] };

      onProgress?.('Frontend building UI components...', 40);
      
      // Step 3: Frontend builds UI components
      const frontendAgent = this.agents.get('frontend')!;
      const frontendTask = `Build the React components for: ${request.userPrompt}
      
      Architecture plan:
      ${JSON.stringify(architecture, null, 2)}
      
      Create the main App.jsx component and any other necessary components.
      Use Tailwind CSS for styling and lucide-react for icons.
      Make it beautiful and functional.`;
      
      const frontendResponse = await frontendAgent.execute(frontendTask);

      onProgress?.('Backend implementing logic...', 60);
      
      // Step 4: Backend implements supporting logic (if needed)
      const backendAgent = this.agents.get('backend')!;
      const backendTask = `Create utility functions and logic for: ${request.userPrompt}
      
      Architecture plan:
      ${JSON.stringify(architecture, null, 2)}
      
      If the app needs utility functions, data processing, or helpers, create them.
      If not needed, respond with "No backend logic required for this project."`;
      
      const backendResponse = await backendAgent.execute(backendTask);

      onProgress?.('Reviewer checking code quality...', 80);
      
      // Step 5: Reviewer checks everything
      const reviewerAgent = this.agents.get('reviewer')!;
      const reviewTask = `Review the generated code for: ${request.userPrompt}
      
      Frontend code:
      ${frontendResponse}
      
      Backend code:
      ${backendResponse}
      
      Check for bugs, suggest improvements, and ensure best practices.`;
      
      const reviewResponse = await reviewerAgent.execute(reviewTask);
      const review = this.extractJSON(reviewResponse);

      onProgress?.('Synthesizing final project...', 90);
      
      // Step 6: Extract and organize all code files
      const files = this.extractAllFiles(frontendResponse, backendResponse, review);

      onProgress?.('Complete!', 100);
      
      // Collect all agent messages
      const allMessages = [
        ...this.getMessages(),
        ...architectAgent.getMessages(),
        ...frontendAgent.getMessages(),
        ...backendAgent.getMessages(),
        ...reviewerAgent.getMessages()
      ];

      return {
        success: true,
        files,
        agentMessages: allMessages,
        tasks: this.tasks,
        summary: `Project created successfully with ${Object.keys(files).length} files. ${review?.approved ? 'Code review passed.' : 'Code review completed with suggestions.'}`
      };

    } catch (error) {
      return {
        success: false,
        files: {},
        agentMessages: [],
        tasks: [],
        summary: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private extractJSON(text: string): any {
    try {
      // Try to find JSON in code blocks
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }
      
      // Try to find JSON in the text
      const jsonObjectMatch = text.match(/\{[\s\S]*\}/);
      if (jsonObjectMatch) {
        return JSON.parse(jsonObjectMatch[0]);
      }
      
      return null;
    } catch {
      return null;
    }
  }

  private extractAllFiles(frontendCode: string, backendCode: string, review: any): Record<string, { language: string; content: string }> {
    const files: Record<string, { language: string; content: string }> = {};

    // Extract files from frontend response
    const frontendFiles = this.extractFilesFromResponse(frontendCode);
    Object.assign(files, frontendFiles);

    // Extract files from backend response (if any)
    if (!backendCode.includes('No backend logic required')) {
      const backendFiles = this.extractFilesFromResponse(backendCode);
      Object.assign(files, backendFiles);
    }

    // Ensure we have the standard files
    if (!files['public/index.html']) {
      files['public/index.html'] = {
        language: 'html',
        content: this.getDefaultHTML()
      };
    }

    if (!files['src/index.css']) {
      files['src/index.css'] = {
        language: 'css',
        content: this.getDefaultCSS()
      };
    }

    if (!files['README.md']) {
      files['README.md'] = {
        language: 'markdown',
        content: '# Multi-Agent Generated Project\n\nGenerated by VibeCode Studio Multi-Agent System'
      };
    }

    return files;
  }

  private extractFilesFromResponse(response: string): Record<string, { language: string; content: string }> {
    const files: Record<string, { language: string; content: string }> = {};
    
    // Try to extract code blocks
    const codeBlocks = extractCodeBlock(response);
    
    if (codeBlocks) {
      // If it's a multi-file response, use the extracted structure
      Object.assign(files, codeBlocks);
    }

    return files;
  }

  private getDefaultHTML(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Multi-Agent App</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
</head>
<body>
  <div id="root"></div>
</body>
</html>`;
  }

  private getDefaultCSS(): string {
    return `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

body {
  font-family: 'Inter', sans-serif;
  margin: 0;
  padding: 0;
}`;
  }

  reset() {
    super.reset();
    this.tasks = [];
    this.agents.forEach(agent => agent.reset());
  }

  getAgent(role: AgentRole): Agent | undefined {
    return this.agents.get(role);
  }

  getAllAgents(): Agent[] {
    return Array.from(this.agents.values());
  }
}
