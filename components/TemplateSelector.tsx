import React, { useState } from 'react';
import { X, FileCode, CheckSquare, Globe, LayoutDashboard, Sparkles } from 'lucide-react';
import { projectTemplates, ProjectTemplate } from '../templates';

interface TemplateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (template: ProjectTemplate) => void;
}

const iconMap: Record<string, React.ElementType> = {
  FileCode,
  CheckSquare,
  Globe,
  LayoutDashboard,
  Sparkles
};

const TemplateSelector: React.FC<TemplateSelectorProps> = ({ isOpen, onClose, onSelect }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);

  if (!isOpen) return null;

  const handleSelect = () => {
    if (selectedTemplate) {
      onSelect(selectedTemplate);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-[#121214] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              Choose a Template
            </h2>
            <p className="text-xs text-zinc-500 mt-1">Start with a pre-built project template</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Templates Grid */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          <div className="grid md:grid-cols-2 gap-4">
            {projectTemplates.map((template) => {
              const Icon = iconMap[template.icon] || FileCode;
              const isSelected = selectedTemplate?.id === template.id;
              
              return (
                <div
                  key={template.id}
                  onClick={() => setSelectedTemplate(template)}
                  className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-600/10 border-indigo-500 shadow-lg shadow-indigo-900/20'
                      : 'bg-zinc-900/50 border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-indigo-500/20' : 'bg-zinc-800'
                    }`}>
                      <Icon className={`w-6 h-6 ${isSelected ? 'text-indigo-400' : 'text-zinc-400'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-semibold mb-1 ${isSelected ? 'text-white' : 'text-zinc-200'}`}>
                        {template.name}
                      </h3>
                      <p className="text-sm text-zinc-500 leading-relaxed">
                        {template.description}
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <span className="px-2 py-1 rounded-md bg-zinc-800 text-[10px] text-zinc-400 uppercase tracking-wider">
                          {template.category}
                        </span>
                        <span className="text-[10px] text-zinc-600">
                          {Object.keys(template.files).length} files
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-zinc-800 bg-zinc-900/50 flex justify-between items-center">
          <div className="text-xs text-zinc-500">
            {selectedTemplate ? (
              <span>Selected: <span className="text-white font-medium">{selectedTemplate.name}</span></span>
            ) : (
              <span>Select a template to get started</span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSelect}
              disabled={!selectedTemplate}
              className="flex items-center gap-2 px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white text-sm font-medium transition-all shadow-lg shadow-indigo-900/20 disabled:shadow-none"
            >
              <Sparkles className="w-4 h-4" />
              Use Template
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateSelector;
