import React, { useState, useEffect } from 'react';
import { FolderOpen, Plus, MessageSquare, Calendar, Trash2, Search, X, ChevronRight, ChevronDown } from 'lucide-react';
import { StorageService, StoredProject } from '../services/storage';

interface ProjectsSidebarProps {
  onSelectProject: (project: StoredProject) => void;
  onNewProject: () => void;
  currentProjectId: string | null;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const ProjectsSidebar: React.FC<ProjectsSidebarProps> = ({
  onSelectProject,
  onNewProject,
  currentProjectId,
  isCollapsed = false,
  onToggleCollapse
}) => {
  const [projects, setProjects] = useState<StoredProject[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProjects, setFilteredProjects] = useState<StoredProject[]>([]);
  const [expandedProject, setExpandedProject] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
    
    // Refresh projects every 5 seconds to catch auto-saves
    const interval = setInterval(loadProjects, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const results = StorageService.searchProjects(searchQuery);
      setFilteredProjects(results);
    } else {
      setFilteredProjects(projects);
    }
  }, [searchQuery, projects]);

  const loadProjects = () => {
    const allProjects = StorageService.getAllProjects();
    setProjects(allProjects);
  };

  const handleDeleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Delete this project?')) {
      StorageService.deleteProject(id);
      loadProjects();
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getFileCount = (project: StoredProject) => {
    return Object.keys(project.files).length;
  };

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedProject(expandedProject === id ? null : id);
  };

  if (isCollapsed) {
    return (
      <div className="w-12 bg-[#0a0a0b] border-r border-zinc-800 flex flex-col items-center py-4 gap-2">
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          title="Expand sidebar"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        <button
          onClick={onNewProject}
          className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          title="New project"
        >
          <Plus className="w-5 h-5" />
        </button>
        <div className="flex-1" />
        <div className="text-xs text-zinc-600 transform -rotate-90 whitespace-nowrap">
          {projects.length}
        </div>
      </div>
    );
  }

  return (
    <div className="w-72 bg-[#0a0a0b] border-r border-zinc-800 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-semibold text-white">Projects</h2>
            <span className="px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-500 text-[10px]">
              {projects.length}
            </span>
          </div>
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-white transition-colors"
              title="Collapse sidebar"
            >
              <ChevronDown className="w-4 h-4 transform rotate-[-90deg]" />
            </button>
          )}
        </div>

        {/* New Project Button */}
        <button
          onClick={onNewProject}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-zinc-800">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects..."
            className="w-full pl-9 pr-8 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-zinc-800 rounded"
            >
              <X className="w-3 h-3 text-zinc-500" />
            </button>
          )}
        </div>
      </div>

      {/* Projects List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <FolderOpen className="w-12 h-12 text-zinc-800 mb-3" />
            <p className="text-sm text-zinc-600">
              {searchQuery ? 'No projects found' : 'No projects yet'}
            </p>
            {!searchQuery && (
              <button
                onClick={onNewProject}
                className="mt-3 text-xs text-indigo-400 hover:text-indigo-300"
              >
                Create your first project
              </button>
            )}
          </div>
        ) : (
          <div className="p-2">
            {filteredProjects.map((project) => {
              const isActive = currentProjectId === project.id;
              const isExpanded = expandedProject === project.id;
              const fileCount = getFileCount(project);

              return (
                <div
                  key={project.id}
                  className={`mb-1 rounded-lg overflow-hidden transition-all ${
                    isActive ? 'bg-indigo-600/20 border border-indigo-500/50' : 'hover:bg-zinc-900'
                  }`}
                >
                  {/* Project Header */}
                  <div
                    onClick={() => onSelectProject(project)}
                    className="flex items-start gap-2 p-3 cursor-pointer group"
                  >
                    <button
                      onClick={(e) => toggleExpand(project.id, e)}
                      className="shrink-0 p-0.5 rounded hover:bg-zinc-800 transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-3 h-3 text-zinc-500" />
                      ) : (
                        <ChevronRight className="w-3 h-3 text-zinc-500" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className={`text-sm font-medium truncate ${
                          isActive ? 'text-white' : 'text-zinc-300'
                        }`}>
                          {project.name}
                        </h3>
                        <button
                          onClick={(e) => handleDeleteProject(project.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded text-zinc-500 hover:text-red-400 transition-all"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      {project.description && (
                        <p className="text-xs text-zinc-600 mb-2 line-clamp-1">
                          {project.description}
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-[10px] text-zinc-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(project.updatedAt)}
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {fileCount} files
                        </div>
                      </div>

                      {project.tags && project.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {project.tags.slice(0, 3).map((tag, i) => (
                            <span
                              key={i}
                              className="px-1.5 py-0.5 bg-zinc-800 text-zinc-500 text-[9px] rounded"
                            >
                              {tag}
                            </span>
                          ))}
                          {project.tags.length > 3 && (
                            <span className="text-[9px] text-zinc-600">
                              +{project.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-3 pb-3 pl-9 border-t border-zinc-800 mt-2 pt-2">
                      <div className="text-[10px] text-zinc-600 space-y-1">
                        <div>Created: {new Date(project.createdAt).toLocaleString()}</div>
                        <div>Updated: {new Date(project.updatedAt).toLocaleString()}</div>
                        <div>Files: {fileCount}</div>
                        {project.tags && project.tags.length > 0 && (
                          <div>Tags: {project.tags.join(', ')}</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="p-3 border-t border-zinc-800 bg-zinc-950">
        <div className="text-[10px] text-zinc-600 space-y-1">
          <div className="flex justify-between">
            <span>Total Projects:</span>
            <span className="text-zinc-400">{projects.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Storage Used:</span>
            <span className="text-zinc-400">{StorageService.getStorageStats().totalSizeMB} MB</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectsSidebar;
