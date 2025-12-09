// Project storage service for persistent file management

import { GeneratedCode, Message, AISettings } from '../types';

export interface StoredProject {
  id: string;
  name: string;
  description: string;
  files: GeneratedCode;
  chatHistory?: Message[];  // Store chat conversation
  settings?: AISettings;    // Project-specific AI settings
  createdAt: number;
  updatedAt: number;
  tags?: string[];
}

// Storage structure:
// vibecode_project_{projectId}          - Project metadata
// vibecode_project_{projectId}_files    - Project files
// vibecode_project_{projectId}_chat     - Chat history
// vibecode_project_{projectId}_settings - Project settings

const STORAGE_KEY_PREFIX = 'vibecode_project_';
const PROJECTS_INDEX_KEY = 'vibecode_projects_index';
const DATA_DIR = (import.meta as any).env?.VITE_DATA_DIR || './vibecode-projects';

export class StorageService {
  // Get all projects (metadata only)
  static getAllProjects(): StoredProject[] {
    try {
      const indexStr = localStorage.getItem(PROJECTS_INDEX_KEY);
      if (!indexStr) return [];
      
      const projectIds: string[] = JSON.parse(indexStr);
      const projects: StoredProject[] = [];
      
      for (const id of projectIds) {
        const metadata = this.getProjectMetadata(id);
        if (metadata) projects.push(metadata);
      }
      
      return projects.sort((a, b) => b.updatedAt - a.updatedAt);
    } catch (error) {
      console.error('Error loading projects:', error);
      return [];
    }
  }

  // Get project metadata only (for list view)
  static getProjectMetadata(id: string): StoredProject | null {
    try {
      const metadataStr = localStorage.getItem(STORAGE_KEY_PREFIX + id);
      if (!metadataStr) return null;
      
      const metadata = JSON.parse(metadataStr);
      // Return metadata without heavy data (files, chat)
      return {
        id: metadata.id,
        name: metadata.name,
        description: metadata.description,
        createdAt: metadata.createdAt,
        updatedAt: metadata.updatedAt,
        tags: metadata.tags,
        files: {}, // Empty for metadata
        chatHistory: [],
        settings: undefined
      };
    } catch (error) {
      console.error('Error loading project metadata:', error);
      return null;
    }
  }

  // Get complete project with all data
  static getProject(id: string): StoredProject | null {
    try {
      // Load metadata
      const metadataStr = localStorage.getItem(STORAGE_KEY_PREFIX + id);
      if (!metadataStr) return null;
      const metadata = JSON.parse(metadataStr);
      
      // Load files (stored separately for isolation)
      const filesStr = localStorage.getItem(STORAGE_KEY_PREFIX + id + '_files');
      const files = filesStr ? JSON.parse(filesStr) : {};
      
      // Load chat history (stored separately)
      const chatStr = localStorage.getItem(STORAGE_KEY_PREFIX + id + '_chat');
      const chatHistory = chatStr ? JSON.parse(chatStr) : [];
      
      // Load settings (stored separately)
      const settingsStr = localStorage.getItem(STORAGE_KEY_PREFIX + id + '_settings');
      const settings = settingsStr ? JSON.parse(settingsStr) : undefined;
      
      return {
        ...metadata,
        files,
        chatHistory,
        settings
      };
    } catch (error) {
      console.error('Error loading project:', error);
      return null;
    }
  }

  // Get project files only
  static getProjectFiles(id: string): GeneratedCode | null {
    try {
      const filesStr = localStorage.getItem(STORAGE_KEY_PREFIX + id + '_files');
      return filesStr ? JSON.parse(filesStr) : null;
    } catch (error) {
      console.error('Error loading project files:', error);
      return null;
    }
  }

  // Get project chat history only
  static getProjectChat(id: string): Message[] | null {
    try {
      const chatStr = localStorage.getItem(STORAGE_KEY_PREFIX + id + '_chat');
      return chatStr ? JSON.parse(chatStr) : null;
    } catch (error) {
      console.error('Error loading project chat:', error);
      return null;
    }
  }

  // Get project settings only
  static getProjectSettings(id: string): AISettings | null {
    try {
      const settingsStr = localStorage.getItem(STORAGE_KEY_PREFIX + id + '_settings');
      return settingsStr ? JSON.parse(settingsStr) : null;
    } catch (error) {
      console.error('Error loading project settings:', error);
      return null;
    }
  }

  // Save a project (isolated storage)
  static saveProject(project: Omit<StoredProject, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): string {
    try {
      const id = project.id || this.generateId();
      const now = Date.now();
      
      const existingMetadata = project.id ? this.getProjectMetadata(project.id) : null;
      
      // Store metadata separately
      const metadata = {
        id,
        name: project.name,
        description: project.description,
        createdAt: existingMetadata?.createdAt || now,
        updatedAt: now,
        tags: project.tags
      };
      localStorage.setItem(STORAGE_KEY_PREFIX + id, JSON.stringify(metadata));
      
      // Store files separately (project isolation)
      localStorage.setItem(STORAGE_KEY_PREFIX + id + '_files', JSON.stringify(project.files || {}));
      
      // Store chat history separately
      localStorage.setItem(STORAGE_KEY_PREFIX + id + '_chat', JSON.stringify(project.chatHistory || []));
      
      // Store settings separately
      if (project.settings) {
        localStorage.setItem(STORAGE_KEY_PREFIX + id + '_settings', JSON.stringify(project.settings));
      }
      
      // Update index
      this.addToIndex(id);
      
      console.log(`Project "${project.name}" saved with isolated storage: ${DATA_DIR}/${id}/`);
      
      return id;
    } catch (error) {
      console.error('Error saving project:', error);
      throw error;
    }
  }

  // Delete a project (remove all isolated data)
  static deleteProject(id: string): boolean {
    try {
      // Remove metadata
      localStorage.removeItem(STORAGE_KEY_PREFIX + id);
      // Remove files
      localStorage.removeItem(STORAGE_KEY_PREFIX + id + '_files');
      // Remove chat history
      localStorage.removeItem(STORAGE_KEY_PREFIX + id + '_chat');
      // Remove settings
      localStorage.removeItem(STORAGE_KEY_PREFIX + id + '_settings');
      
      // Update index
      this.removeFromIndex(id);
      
      console.log(`Project ${id} and all its data deleted from: ${DATA_DIR}/${id}/`);
      return true;
    } catch (error) {
      console.error('Error deleting project:', error);
      return false;
    }
  }

  // Auto-save current project
  static autoSave(name: string, files: GeneratedCode, chatHistory?: Message[]): string {
    const autoSaveName = name || `Untitled Project ${new Date().toLocaleDateString()}`;
    return this.saveProject({
      name: autoSaveName,
      description: 'Auto-saved project',
      files,
      chatHistory,
      tags: ['auto-save']
    });
  }
  
  // Update project (for incremental saves with isolation)
  static updateProject(id: string, updates: Partial<Omit<StoredProject, 'id' | 'createdAt'>>): boolean {
    try {
      const existing = this.getProjectMetadata(id);
      if (!existing) return false;
      
      const now = Date.now();
      
      // Update metadata if needed
      if (updates.name || updates.description || updates.tags) {
        const metadata = {
          id,
          name: updates.name || existing.name,
          description: updates.description || existing.description,
          tags: updates.tags || existing.tags,
          createdAt: existing.createdAt,
          updatedAt: now
        };
        localStorage.setItem(STORAGE_KEY_PREFIX + id, JSON.stringify(metadata));
      } else {
        // Just update timestamp
        const metadataStr = localStorage.getItem(STORAGE_KEY_PREFIX + id);
        if (metadataStr) {
          const metadata = JSON.parse(metadataStr);
          metadata.updatedAt = now;
          localStorage.setItem(STORAGE_KEY_PREFIX + id, JSON.stringify(metadata));
        }
      }
      
      // Update files if provided
      if (updates.files) {
        localStorage.setItem(STORAGE_KEY_PREFIX + id + '_files', JSON.stringify(updates.files));
      }
      
      // Update chat history if provided
      if (updates.chatHistory) {
        localStorage.setItem(STORAGE_KEY_PREFIX + id + '_chat', JSON.stringify(updates.chatHistory));
      }
      
      // Update settings if provided
      if (updates.settings) {
        localStorage.setItem(STORAGE_KEY_PREFIX + id + '_settings', JSON.stringify(updates.settings));
      }
      
      console.log(`Project ${id} updated in isolated storage: ${DATA_DIR}/${id}/`);
      return true;
    } catch (error) {
      console.error('Error updating project:', error);
      return false;
    }
  }

  // Export project as JSON file
  static exportProject(project: StoredProject): void {
    const dataStr = JSON.stringify(project, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.name.replace(/\s+/g, '_')}_${project.id}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  }

  // Import project from JSON file
  static async importProject(file: File): Promise<StoredProject> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const project = JSON.parse(e.target?.result as string);
          
          // Generate new ID for imported project
          const newId = this.generateId();
          const importedProject: StoredProject = {
            ...project,
            id: newId,
            name: `${project.name} (Imported)`,
            createdAt: Date.now(),
            updatedAt: Date.now()
          };
          
          this.saveProject(importedProject);
          resolve(importedProject);
        } catch (error) {
          reject(new Error('Invalid project file'));
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  // Search projects
  static searchProjects(query: string): StoredProject[] {
    const allProjects = this.getAllProjects();
    const lowerQuery = query.toLowerCase();
    
    return allProjects.filter(project => 
      project.name.toLowerCase().includes(lowerQuery) ||
      project.description.toLowerCase().includes(lowerQuery) ||
      project.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  // Get storage stats
  static getStorageStats() {
    const projects = this.getAllProjects();
    let totalSize = 0;
    
    projects.forEach(project => {
      const projectStr = JSON.stringify(project);
      totalSize += new Blob([projectStr]).size;
    });
    
    return {
      projectCount: projects.length,
      totalSize,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
      dataDir: DATA_DIR
    };
  }

  // Private helper methods
  private static generateId(): string {
    return `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static addToIndex(id: string): void {
    const indexStr = localStorage.getItem(PROJECTS_INDEX_KEY);
    const index: string[] = indexStr ? JSON.parse(indexStr) : [];
    
    if (!index.includes(id)) {
      index.push(id);
      localStorage.setItem(PROJECTS_INDEX_KEY, JSON.stringify(index));
    }
  }

  private static removeFromIndex(id: string): void {
    const indexStr = localStorage.getItem(PROJECTS_INDEX_KEY);
    if (!indexStr) return;
    
    const index: string[] = JSON.parse(indexStr);
    const newIndex = index.filter(i => i !== id);
    localStorage.setItem(PROJECTS_INDEX_KEY, JSON.stringify(newIndex));
  }

  // Clear all projects (for testing/debugging)
  static clearAllProjects(): void {
    const projects = this.getAllProjects();
    projects.forEach(p => this.deleteProject(p.id));
    localStorage.removeItem(PROJECTS_INDEX_KEY);
    console.log('All projects cleared');
  }
}
