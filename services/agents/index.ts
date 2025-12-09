// Multi-Agent System orchestration service

import { Coordinator } from './Coordinator';
import { AgentState, MultiAgentRequest, MultiAgentResponse } from './types';
import { AISettings } from '../../types';

export class MultiAgentService {
  private coordinator: Coordinator | null = null;
  private onProgressCallback?: (status: string, progress: number, agents: AgentState[]) => void;

  async executeRequest(
    request: MultiAgentRequest,
    settings: AISettings,
    onProgress?: (status: string, progress: number, agents: AgentState[]) => void
  ): Promise<MultiAgentResponse> {
    this.onProgressCallback = onProgress;
    
    // Create new coordinator with current settings
    this.coordinator = new Coordinator(settings);

    // Execute the multi-agent workflow
    const result = await this.coordinator.orchestrate(request, (status, progress) => {
      this.updateProgress(status, progress);
    });

    return result;
  }

  private updateProgress(status: string, progress: number) {
    const agents = this.getAgentStates(progress);
    this.onProgressCallback?.(status, progress, agents);
  }

  private getAgentStates(overallProgress: number): AgentState[] {
    const coordinator = this.coordinator;
    const agents = [
      {
        role: 'coordinator' as const,
        name: 'Coordinator',
        status: this.determineAgentStatus('coordinator', overallProgress),
        currentTask: this.getAgentTask('coordinator', overallProgress),
        progress: this.calculateAgentProgress('coordinator', overallProgress),
        icon: 'Brain',
        color: 'text-purple-400'
      },
      {
        role: 'architect' as const,
        name: 'Architect',
        status: this.determineAgentStatus('architect', overallProgress),
        currentTask: this.getAgentTask('architect', overallProgress),
        progress: this.calculateAgentProgress('architect', overallProgress),
        icon: 'Layers',
        color: 'text-blue-400'
      },
      {
        role: 'frontend' as const,
        name: 'Frontend Developer',
        status: this.determineAgentStatus('frontend', overallProgress),
        currentTask: this.getAgentTask('frontend', overallProgress),
        progress: this.calculateAgentProgress('frontend', overallProgress),
        icon: 'Palette',
        color: 'text-pink-400'
      },
      {
        role: 'backend' as const,
        name: 'Backend Developer',
        status: this.determineAgentStatus('backend', overallProgress),
        currentTask: this.getAgentTask('backend', overallProgress),
        progress: this.calculateAgentProgress('backend', overallProgress),
        icon: 'Database',
        color: 'text-green-400'
      },
      {
        role: 'reviewer' as const,
        name: 'Code Reviewer',
        status: this.determineAgentStatus('reviewer', overallProgress),
        currentTask: this.getAgentTask('reviewer', overallProgress),
        progress: this.calculateAgentProgress('reviewer', overallProgress),
        icon: 'CheckCircle',
        color: 'text-yellow-400'
      }
    ];

    return agents;
  }

  private determineAgentStatus(role: string, progress: number): 'idle' | 'thinking' | 'working' | 'done' | 'error' {
    // Coordinator: 0-25%
    if (role === 'coordinator') {
      if (progress === 0) return 'idle';
      if (progress < 25) return 'working';
      if (progress >= 90) return 'working';
      return 'done';
    }

    // Architect: 25-40%
    if (role === 'architect') {
      if (progress < 25) return 'idle';
      if (progress >= 25 && progress < 40) return 'working';
      return 'done';
    }

    // Frontend: 40-60%
    if (role === 'frontend') {
      if (progress < 40) return 'idle';
      if (progress >= 40 && progress < 60) return 'working';
      return 'done';
    }

    // Backend: 60-80%
    if (role === 'backend') {
      if (progress < 60) return 'idle';
      if (progress >= 60 && progress < 80) return 'working';
      return 'done';
    }

    // Reviewer: 80-90%
    if (role === 'reviewer') {
      if (progress < 80) return 'idle';
      if (progress >= 80 && progress < 90) return 'working';
      return 'done';
    }

    return 'idle';
  }

  private getAgentTask(role: string, progress: number): string {
    const status = this.determineAgentStatus(role, progress);
    
    if (status === 'idle') return 'Waiting...';
    if (status === 'done') return 'Task complete';

    switch (role) {
      case 'coordinator':
        if (progress < 25) return 'Analyzing request and creating plan...';
        return 'Synthesizing final output...';
      case 'architect':
        return 'Designing component architecture...';
      case 'frontend':
        return 'Building React components...';
      case 'backend':
        return 'Implementing business logic...';
      case 'reviewer':
        return 'Reviewing code quality...';
      default:
        return 'Working...';
    }
  }

  private calculateAgentProgress(role: string, overallProgress: number): number {
    // Calculate individual agent progress based on their work phase
    if (role === 'coordinator') {
      if (overallProgress < 25) return (overallProgress / 25) * 100;
      if (overallProgress >= 90) return ((overallProgress - 90) / 10) * 100;
      return 100;
    }

    if (role === 'architect') {
      if (overallProgress < 25) return 0;
      if (overallProgress >= 40) return 100;
      return ((overallProgress - 25) / 15) * 100;
    }

    if (role === 'frontend') {
      if (overallProgress < 40) return 0;
      if (overallProgress >= 60) return 100;
      return ((overallProgress - 40) / 20) * 100;
    }

    if (role === 'backend') {
      if (overallProgress < 60) return 0;
      if (overallProgress >= 80) return 100;
      return ((overallProgress - 60) / 20) * 100;
    }

    if (role === 'reviewer') {
      if (overallProgress < 80) return 0;
      if (overallProgress >= 90) return 100;
      return ((overallProgress - 80) / 10) * 100;
    }

    return 0;
  }

  getCoordinator(): Coordinator | null {
    return this.coordinator;
  }
}

// Export singleton instance
export const multiAgentService = new MultiAgentService();

// Export types
export * from './types';
