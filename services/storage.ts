// Project storage service for persistent file management

import { GeneratedCode } from '../types';

export interface StoredProject {
  id: string;
  name: string;
  description: string;
  files: GeneratedCode;
  createdAt: number;
  updatedAt: number;
  tags?: string[];
}

const STORAGE_KEY_PREFIX = 'vibecode_project_';
const PROJECTS_INDEX_KEY = 'vibecode_projects_index';
const DATA_DIR = (import.meta as any).env?.VITE_DATA_DIR || './vibecode-projects';

export class StorageService {
  // Get all projects
  static getAllProjects(): StoredProject[] {
    try {
      const indexStr = localStorage.getItem(PROJECTS_INDEX_KEY);
      if (!indexStr) return [];
      
      const projectIds: string[] = JSON.parse(indexStr);
      const projects: StoredProject[] = [];
      
      for (const id of projectIds) {
        const project = this.getProject(id);
        if (project) projects.push(project);
      }
      
      return projects.sort((a, b) => b.updatedAt - a.updatedAt);
    } catch (error) {
      console.error('Error loading projects:', error);
      return [];
    }
  }

  // Get a specific project
  static getProject(id: string): StoredProject | null {
    try {
      const projectStr = localStorage.getItem(STORAGE_KEY_PREFIX + id);
      if (!projectStr) return null;
      
      return JSON.parse(projectStr);
    } catch (error) {
      console.error('Error loading project:', error);
      return null;
    }
  }

  // Save a project
  static saveProject(project: Omit<StoredProject, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): string {
    try {
      const id = project.id || this.generateId();
      const now = Date.now();
      
      const existingProject = project.id ? this.getProject(project.id) : null;
      
      const storedProject: StoredProject = {
        id,
        name: project.name,
        description: project.description,
        files: project.files,
        createdAt: existingProject?.createdAt || now,
        updatedAt: now,
        tags: project.tags
      };
      
      // Save project
      localStorage.setItem(STORAGE_KEY_PREFIX + id, JSON.stringify(storedProject));
      
      // Update index
      this.addToIndex(id);
      
      console.log(`Project "${project.name}" saved to: ${DATA_DIR}/${id}`);
      
      return id;
    } catch (error) {
      console.error('Error saving project:', error);
      throw error;
    }
  }

  // Delete a project
  static deleteProject(id: string): boolean {
    try {
      localStorage.removeItem(STORAGE_KEY_PREFIX + id);
      this.removeFromIndex(id);
      return true;
    } catch (error) {
      console.error('Error deleting project:', error);
      return false;
    }
  }

  // Auto-save current project
  static autoSave(name: string, files: GeneratedCode): string {
    const autoSaveName = name || `Untitled Project ${new Date().toLocaleDateString()}`;
    return this.saveProject({
      name: autoSaveName,
      description: 'Auto-saved project',
      files,
      tags: ['auto-save']
    });
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
