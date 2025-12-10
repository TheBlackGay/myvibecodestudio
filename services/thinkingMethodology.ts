// Structured thinking methodology for transparent AI development

import { AISettings, Message, Role } from '../types';
import { sendMessage } from './ai';

export interface ThinkingPhase {
  phase: 'understanding' | 'planning' | 'implementation' | 'verification';
  title: string;
  content: string;
  status: 'thinking' | 'complete';
}

export interface ThinkingPlan {
  understanding: string;
  currentState: string[];
  missing: string[];
  goal: string;
  steps: string[];
  estimatedIterations: number;
  successCriteria: string[];
  tradeoffs?: string[];
}

// Generate structured thinking for a user request
export async function generateThinkingPlan(
  userRequest: string,
  context: {
    hasExistingCode: boolean;
    projectType?: string;
    currentFiles?: string[];
  },
  settings: AISettings
): Promise<ThinkingPlan> {
  
  const thinkingPrompt = `You are an expert software architect. Analyze this development request using a structured methodology.

User Request: "${userRequest}"

Context:
- Has existing code: ${context.hasExistingCode}
- Project type: ${context.projectType || 'New project'}
- Current files: ${context.currentFiles?.join(', ') || 'None'}

Analyze using this framework:

1. UNDERSTANDING
   - What exactly does the user want?
   - What are the requirements?
   - What are potential edge cases?

2. CURRENT STATE ANALYSIS
   - What exists already?
   - What can be reused?
   - What needs to change?

3. GOAL & PLAN
   - Clear objective
   - Step-by-step plan
   - Estimated complexity

4. SUCCESS CRITERIA
   - How do we know it's done?
   - What should work?

Respond in this JSON format:
{
  "understanding": "Clear description of what user wants",
  "currentState": ["What exists", "What we have"],
  "missing": ["What needs to be built", "What's lacking"],
  "goal": "Clear, specific goal statement",
  "steps": [
    "Step 1: Do this",
    "Step 2: Then this",
    "Step 3: Finally this"
  ],
  "estimatedIterations": 3,
  "successCriteria": [
    "User can do X",
    "Feature Y works",
    "No errors in Z"
  ],
  "tradeoffs": ["Optional: Any trade-offs to consider"]
}

Be practical, clear, and actionable.`;

  const messages: Message[] = [
    {
      id: Date.now().toString(),
      role: Role.USER,
      content: thinkingPrompt,
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
      console.error('Failed to parse thinking plan:', error);
    }
  }

  // Fallback plan
  return {
    understanding: userRequest,
    currentState: context.hasExistingCode ? ['Existing project with code'] : ['New project'],
    missing: ['Features to implement'],
    goal: `Implement: ${userRequest}`,
    steps: [
      'Analyze requirements',
      'Implement solution',
      'Test and verify'
    ],
    estimatedIterations: 3,
    successCriteria: ['Feature works as expected']
  };
}

// Format thinking plan as a readable message
export function formatThinkingPlan(plan: ThinkingPlan): string {
  return `🧠 **Thinking Process**

## 📋 Understanding
${plan.understanding}

## 📊 Current State
${plan.currentState.map(item => `✅ ${item}`).join('\n')}

## ⚠️ What's Missing
${plan.missing.map(item => `❌ ${item}`).join('\n')}

## 🎯 Goal
${plan.goal}

## 📝 Implementation Plan
${plan.steps.map((step, i) => `${i + 1}. ${step}`).join('\n')}

## ⏱️ Estimated Complexity
~${plan.estimatedIterations} iterations

## ✅ Success Criteria
${plan.successCriteria.map(item => `• ${item}`).join('\n')}

${plan.tradeoffs && plan.tradeoffs.length > 0 ? `\n## ⚖️ Trade-offs\n${plan.tradeoffs.map(item => `• ${item}`).join('\n')}` : ''}

---
**Ready to proceed with this plan?** I'll now implement it step by step.`;
}

// Create phase update message
export function createPhaseMessage(phase: ThinkingPhase): string {
  const icons = {
    understanding: '🤔',
    planning: '📋',
    implementation: '💻',
    verification: '✅'
  };

  const icon = icons[phase.phase];
  const status = phase.status === 'thinking' ? '⏳' : '✓';

  return `${status} **${icon} ${phase.title}**\n\n${phase.content}`;
}

// Generate implementation steps message
export function formatImplementationSteps(steps: string[], currentStep: number): string {
  return `📝 **Implementation Progress**

${steps.map((step, i) => {
  if (i < currentStep) return `✅ ${step}`;
  if (i === currentStep) return `⏳ **${step}** ← Current`;
  return `⏸️ ${step}`;
}).join('\n')}`;
}
