
import React, { useState, useRef, useEffect } from 'react';
import { X, Play, Plus, Check, ThumbsUp, Github, Code, FileText, Terminal, Edit, Trash2, Folder, Copy, Tag, User as UserIcon, Share2, GitBranch, GitCommit, GitPullRequest, ArrowUpCircle, ArrowDownCircle, RefreshCw, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { Project, User, UserRole, Commit } from '../types';

interface ProjectDetailViewProps {
  project: Project | null;
  onClose: () => void;
  isLiked: boolean;
  isInList: boolean;
  onToggleLike: (id: string) => void;
  onToggleList: (id: string) => void;
  onEdit?: (project: Project) => void;
  onSaveProject?: (project: Project) => void;
  currentUser: User | null;
}

export const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({ 
  project, 
  onClose,
  isLiked,
  isInList,
  onToggleLike,
  onToggleList,
  onEdit,
  onSaveProject,
  currentUser
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isShareCopied, setIsShareCopied] = useState(false);
  const [gitLoading, setGitLoading] = useState<'pull' | 'push' | 'sync' | null>(null);

  if (!project) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleCopyCode = () => {
    if (project.files) {
      navigator.clipboard.writeText(project.files);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleShareProject = () => {
    const shareText = project.websiteUrl 
       ? `${project.name} - ${project.websiteUrl}` 
       : `Check out ${project.name} on FETS HUB`;
    
    navigator.clipboard.writeText(shareText);
    setIsShareCopied(true);
    setTimeout(() => setIsShareCopied(false), 2000);
  };

  // Git Actions
  const handleGitPull = () => {
    setGitLoading('pull');
    setTimeout(() => {
        if (!project.gitState) return;
        // Simulate pulling a new commit
        const newCommit: Commit = {
            id: `cmt-${Date.now()}`,
            hash: Math.random().toString(16).substring(2, 10),
            message: "Merge branch 'feature/update' into main",
            author: "System",
            date: new Date().toISOString()
        };
        const updatedProject = {
            ...project,
            gitState: {
                ...project.gitState,
                commits: [newCommit, ...project.gitState.commits],
                lastSync: Date.now(),
                status: 'clean' as const,
                pendingChanges: 0
            }
        };
        onSaveProject?.(updatedProject);
        setGitLoading(null);
    }, 2000);
  };

  const handleGitPush = () => {
    setGitLoading('push');
    setTimeout(() => {
        if (!project.gitState) return;
        const updatedProject = {
            ...project,
            gitState: {
                ...project.gitState,
                lastSync: Date.now(),
                status: 'clean' as const,
                pendingChanges: 0
            }
        };
        onSaveProject?.(updatedProject);
        setGitLoading(null);
    }, 2000);
  };

  const handleCreateWork = () => {
     // Simulate local work (creating a pending commit state)
     if (!project.gitState) return;
     const updatedProject = {
        ...project,
        gitState: {
            ...project.gitState,
            status: 'ahead' as const,
            pendingChanges: (project.gitState.pendingChanges || 0) + 1
        }
     };
     onSaveProject?.(updatedProject);
  };

  const imageSrc = project.imageUrl || `https://picsum.photos/seed/${project.id}/1200/600`;

  const canEdit = currentUser && (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.DEVELOPER || currentUser.role === UserRole.EDITOR);
  const isFile = project.itemType === 'file';

  const handleOpen = () => {
    if (project.websiteUrl) {
      window.open(project.websiteUrl, '_blank');
    } else {
      alert(`No launch configuration found for "${project.name}".\n\nPlease add a Website URL or App URI in the project settings.`);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[60] bg-black/80 overflow-y-auto flex justify-center py-8 animate-in fade-in duration-300 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-[#121212] w-full max-w-5xl rounded-md overflow-hidden shadow-2xl relative animate-in slide-in-from-bottom-10 duration-500 mt-8 mb-8 min-h-[800px] border border-[#333] selection:bg-white selection:text-black">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-10 h-10 bg-[#121212] rounded-full flex items-center justify-center text-white hover:bg-[#333] transition-colors border border-[#333] shadow-lg focus:outline-none focus:ring-2 focus:ring-white"
          aria-label="Close details view"
        >
          <X size={20} />
        </button>

        {/* Hero Section */}
        <div className="relative h-[500px] w-full group">
          <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/30 to-transparent z-10" />
          <img 
             src={imageSrc}
             alt={`Cover for ${project.name}`}
             className="w-full h-full object-cover grayscale brightness-75"
          />
          
          <div className="absolute bottom-0 left-0 w-full p-12 z-20">
            <div className="mb-4 flex items-center gap-2">
               {isFile ? <Folder className="text-gray-300" size={24} aria-hidden="true" /> : <Terminal className="text-gray-300" size={24} aria-hidden="true" />}
               <span className="text-gray-300 font-mono text-xs tracking-[0.3em] uppercase shadow-black drop-shadow-md">
                 {isFile ? 'Document' : 'Application'}
               </span>
            </div>
            <h1 id="modal-title" className="text-5xl md:text-6xl font-black text-white mb-8 drop-shadow-2xl tracking-tighter uppercase">{project.name}</h1>
            
            <div className="flex items-center gap-4">
              <button 
                onClick={handleOpen}
                className="flex items-center gap-3 bg-white text-black px-8 py-3 rounded-sm font-bold hover:bg-gray-200 transition-all text-lg uppercase tracking-wide shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] hover:scale-105 transform duration-200 animate-pulse-slow focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
                aria-label="Open Project"
              >
                <Play fill="currentColor" size={20} aria-hidden="true" />
                <span>OPEN</span>
              </button>

              {project.repoUrl && !isFile && (
                <a 
                   href={project.repoUrl}
                   target="_blank"
                   rel="noopener noreferrer"
                   className="flex items-center gap-3 bg-gray-800/50 text-white px-6 py-3 rounded-sm font-bold hover:bg-gray-700 transition-colors text-lg backdrop-blur-sm border border-white/10 uppercase tracking-wide focus:outline-none focus:ring-2 focus:ring-white"
                   aria-label="View Source Code"
                >
                   <Github size={20} aria-hidden="true" />
                   <span>CODE</span>
                </a>
              )}

              {canEdit && onEdit && (
                <button 
                  onClick={() => onEdit(project)}
                  className="flex items-center gap-3 bg-gray-800/50 text-white px-6 py-3 rounded-sm font-bold hover:bg-gray-700 transition-colors text-lg backdrop-blur-sm border border-white/10 uppercase tracking-wide focus:outline-none focus:ring-2 focus:ring-white"
                  aria-label="Edit Project"
                >
                  <Edit size={20} aria-hidden="true" />
                  <span>EDIT</span>
                </button>
              )}

              <button 
                onClick={() => onToggleList(project.id)}
                className={`w-12 h-12 rounded-full border-2 hover:border-white flex items-center justify-center transition-colors backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white ${isInList ? 'border-white text-white bg-black/60' : 'border-gray-500 text-gray-400 hover:text-white bg-black/30'}`}
                title={isInList ? "Remove from List" : "Add to My List"}
              >
                {isInList ? <Check size={20} aria-hidden="true" /> : <Plus size={20} aria-hidden="true" />}
              </button>

              <button 
                onClick={() => onToggleLike(project.id)}
                className={`w-12 h-12 rounded-full border-2 hover:border-white flex items-center justify-center transition-colors backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white ${isLiked ? 'border-white text-white bg-black/60' : 'border-gray-500 text-gray-400 hover:text-white bg-black/30'}`}
                title={isLiked ? "Unlike" : "Like"}
              >
                <ThumbsUp size={20} fill={isLiked ? "currentColor" : "none"} aria-hidden="true" />
              </button>

              <button 
                onClick={handleShareProject}
                className={`w-12 h-12 rounded-full border-2 hover:border-white flex items-center justify-center transition-colors backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white ${isShareCopied ? 'border-green-500 text-green-500 bg-black/60' : 'border-gray-500 text-gray-400 hover:text-white bg-black/30'}`}
                title="Share Project"
              >
                {isShareCopied ? <Check size={20} aria-hidden="true" /> : <Share2 size={20} aria-hidden="true" />}
              </button>
            </div>
          </div>
        </div>

        {/* Details Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 p-12 pt-6 bg-[#121212]">
          
          {/* Left Column: Meta, Git & Desc */}
          <div className="md:col-span-2 space-y-8">
             <div className="flex items-center gap-4 text-white font-semibold text-lg">
                <span className="text-gray-400">{new Date(project.createdAt).getFullYear()}</span>
                <span className="border border-gray-600 px-2 py-0.5 text-xs rounded-sm uppercase bg-[#222] text-gray-300 tracking-wider">
                  {project.status}
                </span>
             </div>

             <p className="text-gray-200 text-lg leading-relaxed font-light">
               {project.description}
             </p>
             
             {/* Git / Version Control Section */}
             {!isFile && project.gitState && (
                <div className="border border-[#333] bg-[#0f0f0f] rounded-sm overflow-hidden mt-8">
                    {/* Git Header */}
                    <div className="bg-[#1a1a1a] px-5 py-3 border-b border-[#333] flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <div className="flex items-center gap-2 text-white">
                              <GitBranch size={18} className="text-[var(--primary-color)]" />
                              <span className="font-mono font-bold tracking-tight">{project.gitState.branch}</span>
                           </div>
                           
                           {/* Enhanced Git Status Badge */}
                           {project.gitState.status === 'ahead' && (
                              <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-yellow-500 bg-yellow-500/10 text-yellow-400 text-xs font-bold uppercase tracking-wide shadow-[0_0_10px_rgba(234,179,8,0.2)]">
                                  <ArrowUpCircle size={14} />
                                  <span>{project.gitState.pendingChanges} Commits Ahead</span>
                              </div>
                           )}
                           {project.gitState.status === 'behind' && (
                              <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-red-500 bg-red-500/10 text-red-400 text-xs font-bold uppercase tracking-wide shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                                  <ArrowDownCircle size={14} />
                                  <span>Behind Remote</span>
                              </div>
                           )}
                           {project.gitState.status === 'clean' && (
                              <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-green-500 bg-green-500/10 text-green-400 text-xs font-bold uppercase tracking-wide shadow-[0_0_10px_rgba(34,197,94,0.2)]">
                                  <CheckCircle size={14} />
                                  <span>Up to Date</span>
                              </div>
                           )}
                           {project.gitState.status === 'diverged' && (
                              <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-orange-500 bg-orange-500/10 text-orange-400 text-xs font-bold uppercase tracking-wide shadow-[0_0_10px_rgba(249,115,22,0.2)]">
                                  <AlertTriangle size={14} />
                                  <span>Branches Diverged</span>
                              </div>
                           )}
                        </div>
                        <div className="flex items-center gap-3">
                           {onSaveProject && (
                             <button onClick={handleCreateWork} className="text-xs bg-[#252525] hover:bg-[#333] text-gray-300 px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 border border-[#333]" title="Simulate adding code">
                               <Plus size={12} /> Work
                             </button>
                           )}
                           <span className="text-xs text-gray-500 font-mono">
                             Synced: {new Date(project.gitState.lastSync).toLocaleTimeString()}
                           </span>
                        </div>
                    </div>

                    {/* Git History Console */}
                    <div className="h-48 overflow-y-auto p-4 font-mono text-xs space-y-3 bg-black">
                       {project.gitState.commits.map((commit) => (
                          <div key={commit.id} className="flex gap-3 group">
                             <span className="text-[var(--primary-color)] opacity-70 w-16 shrink-0">{commit.hash}</span>
                             <div className="flex-1">
                                <p className="text-gray-300 group-hover:text-white transition-colors">{commit.message}</p>
                                <p className="text-gray-600 text-[10px]">{commit.author} • {new Date(commit.date).toLocaleString()}</p>
                             </div>
                          </div>
                       ))}
                       <div className="text-gray-700 italic border-t border-gray-800 pt-2 mt-2 text-[10px]">
                          --- End of History ---
                       </div>
                    </div>

                    {/* Git Actions */}
                    <div className="bg-[#1a1a1a] px-4 py-3 border-t border-[#333] flex gap-3">
                       <button 
                         onClick={handleGitPull}
                         disabled={!!gitLoading}
                         className="flex-1 bg-[#222] hover:bg-[#333] text-white py-2 rounded text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors border border-[#333] disabled:opacity-50"
                       >
                         {gitLoading === 'pull' ? <Loader2 size={14} className="animate-spin" /> : <ArrowDownCircle size={14} className="text-blue-500" />}
                         Pull Origin
                       </button>
                       <button 
                         onClick={handleGitPush}
                         disabled={!!gitLoading || project.gitState.status === 'clean'}
                         className="flex-1 bg-[#222] hover:bg-[#333] text-white py-2 rounded text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors border border-[#333] disabled:opacity-50 disabled:cursor-not-allowed"
                       >
                         {gitLoading === 'push' ? <Loader2 size={14} className="animate-spin" /> : <ArrowUpCircle size={14} className="text-green-500" />}
                         Push Origin
                       </button>
                    </div>
                </div>
             )}

             <div className="border-t border-[#333] pt-8 mt-8">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-wider">
                  <Code size={20} className="text-gray-400" aria-hidden="true" />
                  {isFile ? 'File Properties' : 'Technology Stack'}
                </h3>
                <div className="flex flex-wrap gap-3">
                  {project.techStack.map(tech => (
                    <div key={tech} className="bg-[#222] border border-[#333] px-4 py-2 rounded-sm text-gray-300 hover:text-white transition-colors cursor-default hover:border-gray-500 font-mono text-xs uppercase tracking-wide">
                      {tech}
                    </div>
                  ))}
                </div>
             </div>

             <div className="border-t border-[#333] pt-8 mt-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                    <FileText size={20} className="text-gray-400" aria-hidden="true" />
                    {isFile ? 'Location / Content' : 'Source Architecture'}
                  </h3>
                  <button 
                    onClick={handleCopyCode}
                    className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white transition-colors bg-[#222] hover:bg-[#333] px-3 py-1 rounded border border-[#333] focus:outline-none focus:ring-2 focus:ring-white"
                    aria-label="Copy source code or content"
                  >
                    {isCopied ? <Check size={14} className="text-green-500" aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
                    {isCopied ? 'COPIED' : 'COPY'}
                  </button>
                </div>
                <div className="bg-[#0a0a0a] p-6 rounded-sm border border-[#333] font-mono text-xs text-gray-400 whitespace-pre overflow-x-auto shadow-inner leading-relaxed" tabIndex={0}>
                  {project.files || (isFile ? "// No content note available." : "// No file structure defined.")}
                </div>
             </div>
          </div>

          {/* Right Column: Attributes */}
          <div className="space-y-8 text-sm">
             <div>
               <span className="text-gray-500 block mb-2 uppercase tracking-widest font-bold text-[10px]">{isFile ? 'Format' : 'Core Technologies'}</span>
               <span className="text-white leading-snug font-mono text-gray-300">
                 {project.techStack.join(', ')}
               </span>
             </div>
             <div>
               <span className="text-gray-500 block mb-2 uppercase tracking-widest font-bold text-[10px]">Date Added</span>
               <span className="text-white font-mono text-gray-300">{new Date(project.createdAt).toLocaleDateString()}</span>
             </div>
             {project.websiteUrl && (
               <div>
                 <span className="text-gray-500 block mb-2 uppercase tracking-widest font-bold text-[10px]">{isFile ? 'Download Link' : 'Live Endpoint'}</span>
                 <a href={project.websiteUrl} className="text-white hover:underline break-all font-mono text-xs text-gray-300 focus:outline-none focus:ring-1 focus:ring-white rounded-sm">{project.websiteUrl}</a>
               </div>
             )}
             {project.repoUrl && (
                <div>
                  <span className="text-gray-500 block mb-2 uppercase tracking-widest font-bold text-[10px]">Repository</span>
                  <a href={project.repoUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-white hover:underline break-all font-mono text-xs text-gray-300">
                    <Github size={12} /> {project.repoUrl}
                  </a>
                </div>
             )}
          </div>

        </div>
      </div>
    </div>
  );
};
