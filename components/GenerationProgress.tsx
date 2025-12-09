import React, { useEffect, useState } from 'react';
import { Loader2, Sparkles, Code, CheckCircle, Clock } from 'lucide-react';

interface GenerationProgressProps {
  isActive: boolean;
  stage: 'thinking' | 'generating' | 'parsing' | 'complete';
  tokensGenerated?: number;
  estimatedTime?: number;
  currentFile?: string;
}

const GenerationProgress: React.FC<GenerationProgressProps> = ({
  isActive,
  stage,
  tokensGenerated = 0,
  estimatedTime = 0,
  currentFile
}) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isActive) {
      setElapsedTime(0);
      setProgress(0);
      return;
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedTime(elapsed);

      // Simulate progress based on stage and time
      let targetProgress = 0;
      if (stage === 'thinking') targetProgress = 20;
      else if (stage === 'generating') {
        // Progress based on tokens (estimate ~2000 tokens total)
        const tokenProgress = Math.min((tokensGenerated / 2000) * 60, 60);
        targetProgress = 20 + tokenProgress;
      } else if (stage === 'parsing') targetProgress = 90;
      else if (stage === 'complete') targetProgress = 100;

      // Smooth progress animation
      setProgress(prev => {
        if (prev < targetProgress) {
          return Math.min(prev + 2, targetProgress);
        }
        return prev;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isActive, stage, tokensGenerated]);

  if (!isActive) return null;

  const getStageInfo = () => {
    switch (stage) {
      case 'thinking':
        return {
          icon: Sparkles,
          text: 'AI is analyzing your request...',
          color: 'text-purple-400'
        };
      case 'generating':
        return {
          icon: Code,
          text: currentFile ? `Generating ${currentFile}...` : 'Generating code...',
          color: 'text-indigo-400'
        };
      case 'parsing':
        return {
          icon: Loader2,
          text: 'Organizing files...',
          color: 'text-blue-400'
        };
      case 'complete':
        return {
          icon: CheckCircle,
          text: 'Generation complete!',
          color: 'text-green-400'
        };
    }
  };

  const stageInfo = getStageInfo();
  const Icon = stageInfo.icon;
  const remainingTime = Math.max(0, (estimatedTime || 30) - elapsedTime);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden w-[420px]">
        {/* Header */}
        <div className="px-4 py-3 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border-b border-zinc-700">
          <div className="flex items-center gap-3">
            <div className={`${stageInfo.color}`}>
              <Icon className={`w-5 h-5 ${stage !== 'complete' ? 'animate-spin' : ''}`} />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-white">{stageInfo.text}</div>
              <div className="text-xs text-zinc-500 mt-0.5">
                {stage === 'complete' 
                  ? `Completed in ${elapsedTime}s`
                  : `${elapsedTime}s elapsed`
                }
              </div>
            </div>
            {remainingTime > 0 && stage !== 'complete' && (
              <div className="flex items-center gap-1 text-xs text-zinc-500">
                <Clock className="w-3 h-3" />
                <span>~{remainingTime}s</span>
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-4 py-3 bg-zinc-950">
          <div className="mb-2 flex justify-between text-xs">
            <span className="text-zinc-400">Progress</span>
            <span className="text-zinc-300 font-medium">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            >
              <div className="h-full w-full bg-white/20 animate-pulse" />
            </div>
          </div>

          {/* Stats */}
          {tokensGenerated > 0 && stage === 'generating' && (
            <div className="mt-3 flex items-center justify-between text-xs text-zinc-500">
              <div className="flex items-center gap-4">
                <span>{tokensGenerated.toLocaleString()} tokens</span>
                {currentFile && (
                  <>
                    <span>•</span>
                    <span className="text-zinc-400">{currentFile}</span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Tip */}
        {stage === 'generating' && (
          <div className="px-4 py-2 bg-zinc-900 border-t border-zinc-800 text-[10px] text-zinc-600">
            💡 Tip: You can stop generation anytime by clicking the Stop button
          </div>
        )}
      </div>
    </div>
  );
};

export default GenerationProgress;
