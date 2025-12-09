import React, { useState, useEffect } from 'react';
import { X, Save, FolderOpen, Trash2, Download, Upload, Search, Calendar, Tag, HardDrive } from 'lucide-react';
import { StorageService, StoredProject } from '../services/storage';
import { GeneratedCode } from '../types';

interface ProjectsManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadProject: (project: StoredProject) => void;
  currentFiles?: GeneratedCode | null;
  currentProjectId?: string | null;
  currentProjectName?: string;
}

const ProjectsManager: React.FC<ProjectsManagerProps> = ({ 
  isOpen, 
  onClose, 
  onLoadProject,
  currentFiles,
  currentProjectId,
  currentProjectName
}) => {
  const [projects, setProjects] = useState<StoredProject[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectTags, setProjectTags] = useState('');
  const [storageStats, setStorageStats] = useState<any>(null);

  // Pre-fill form with current project data when opening
  useEffect(() => {
    if (isOpen && showSaveDialog && currentProjectId && currentProjectName) {
      const project = StorageService.getProject(currentProjectId);
      if (project) {
        setProjectName(project.name);
        setProjectDescription(project.description);
        setProjectTags(project.tags?.join(', ') || '');
      }
    }
  }, [isOpen, showSaveDialog, currentProjectId, currentProjectName]);

  useEffect(() => {
    if (isOpen) {
      loadProjects();
      loadStorageStats();
    }
  }, [isOpen]);

  const loadProjects = () => {
    const allProjects = StorageService.getAllProjects();
    setProjects(allProjects);
  };

  const loadStorageStats = () => {
    const stats = StorageService.getStorageStats();
    setStorageStats(stats);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const results = StorageService.searchProjects(query);
      setProjects(results);
    } else {
      loadProjects();
    }
  };

  const handleSaveProject = () => {
    if (!currentFiles || !projectName.trim()) return;

    const tags = projectTags.split(',').map(t => t.trim()).filter(Boolean);
    
    if (currentProjectId) {
      // Update existing project (no new snapshot)
      StorageService.updateProject(currentProjectId, {
        name: projectName,
        description: projectDescription,
        files: currentFiles,
        tags
      });
      console.log(`Project ${currentProjectId} updated`);
    } else {
      // Create new project with unique ID
      const projectId = StorageService.saveProject({
        name: projectName,
        description: projectDescription,
        files: currentFiles,
        tags
      });
      console.log(`New project created with ID: ${projectId}`);
    }

    setShowSaveDialog(false);
    setProjectName('');
    setProjectDescription('');
    setProjectTags('');
    loadProjects();
    loadStorageStats();
  };

  const handleLoadProject = (project: StoredProject) => {
    onLoadProject(project);
    onClose();
  };

  const handleDeleteProject = (id: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      StorageService.deleteProject(id);
      loadProjects();
      loadStorageStats();
    }
  };

  const handleExportProject = (project: StoredProject) => {
    StorageService.exportProject(project);
  };

  const handleImportProject = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await StorageService.importProject(file);
      loadProjects();
      loadStorageStats();
      e.target.value = ''; // Reset input
    } catch (error) {
      alert('Failed to import project: ' + (error as Error).message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-5xl bg-[#121214] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-indigo-400" />
              Projects Manager
            </h2>
            <p className="text-xs text-zinc-500 mt-1">Save, load, and manage your projects</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-6 py-3 border-b border-zinc-800 bg-zinc-900/30 flex items-center gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search projects..."
              className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Save Current */}
          {currentFiles && (
            <button
              onClick={() => setShowSaveDialog(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Save className="w-4 h-4" />
              Save Current
            </button>
          )}

          {/* Import */}
          <label className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm font-medium transition-colors cursor-pointer">
            <Upload className="w-4 h-4" />
            Import
            <input
              type="file"
              accept=".json"
              onChange={handleImportProject}
              className="hidden"
            />
          </label>
        </div>

        {/* Storage Stats */}
        {storageStats && (
          <div className="px-6 py-2 bg-zinc-950 border-b border-zinc-800 flex items-center gap-4 text-xs text-zinc-500">
            <div className="flex items-center gap-2">
              <HardDrive className="w-3 h-3" />
              <span>{storageStats.projectCount} projects</span>
            </div>
            <div>•</div>
            <div>{storageStats.totalSizeMB} MB used</div>
            <div>•</div>
            <div className="flex items-center gap-1">
              <span>Data Dir:</span>
              <code className="text-indigo-400">{storageStats.dataDir}</code>
            </div>
          </div>
        )}

        {/* Projects List */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {showSaveDialog ? (
            /* Save Dialog */
            <div className="max-w-2xl mx-auto">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Save Project</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Project Name *
                    </label>
                    <input
                      type="text"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      placeholder="My Awesome Project"
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={projectDescription}
                      onChange={(e) => setProjectDescription(e.target.value)}
                      placeholder="A brief description of your project..."
                      rows={3}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Tags (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={projectTags}
                      onChange={(e) => setProjectTags(e.target.value)}
                      placeholder="react, dashboard, admin"
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setShowSaveDialog(false)}
                      className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveProject}
                      disabled={!projectName.trim()}
                      className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-lg font-medium transition-colors"
                    >
                      Save Project
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : projects.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <FolderOpen className="w-16 h-16 text-zinc-700 mb-4" />
              <h3 className="text-lg font-semibold text-zinc-400 mb-2">No Projects Yet</h3>
              <p className="text-sm text-zinc-600 mb-6 max-w-md">
                {searchQuery ? 'No projects match your search.' : 'Save your current project to get started.'}
              </p>
              {currentFiles && !searchQuery && (
                <button
                  onClick={() => setShowSaveDialog(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Save Current Project
                </button>
              )}
            </div>
          ) : (
            /* Projects Grid */
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-white truncate flex-1 pr-2">
                      {project.name}
                    </h3>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleExportProject(project)}
                        className="p-1.5 rounded hover:bg-zinc-800 text-zinc-500 hover:text-indigo-400 transition-colors"
                        title="Export"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteProject(project.id)}
                        className="p-1.5 rounded hover:bg-zinc-800 text-zinc-500 hover:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-zinc-500 mb-3 line-clamp-2 min-h-[2.5rem]">
                    {project.description || 'No description'}
                  </p>

                  <div className="flex items-center gap-2 text-xs text-zinc-600 mb-3">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{Object.keys(project.files).length} files</span>
                  </div>

                  {project.tags && project.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {project.tags.map((tag, i) => (
                        <span key={i} className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-[10px] rounded-full flex items-center gap-1">
                          <Tag className="w-2.5 h-2.5" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => handleLoadProject(project)}
                    className="w-full px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Load Project
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectsManager;
