
import React, { useState } from 'react';
import { X, Sparkles, Loader2, Cpu, Globe, Github, FileCode, ImageIcon, Folder, Briefcase, Calendar, Upload, File as FileIcon, Image as ImageIconLucide, Film, Copy, Check, Trash2, AlertTriangle, Tag, User as UserIcon, GitBranch, Search, ExternalLink } from 'lucide-react';
import { Project, ProjectFormData, ProjectStatus, User, UserRole, GitState } from '../types';
import { generateProjectDetails, analyzeTechStack, SearchResult } from '../services/geminiService';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ProjectFormData, gitState?: GitState) => void;
  initialData?: Project;
  currentUser: User | null;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({ isOpen, onClose, onSave, initialData, currentUser }) => {
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    description: '',
    status: ProjectStatus.IDEA,
    websiteUrl: '',
    repoUrl: '',
    imageUrl: '',
    techStack: '',
    files: '',
    itemType: 'app',
    changeReason: '',
    gitUrl: ''
  });

  const [dateInput, setDateInput] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [stackAnalysis, setStackAnalysis] = useState<SearchResult | null>(null);
  const [isCloning, setIsCloning] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [reasonError, setReasonError] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          name: initialData.name,
          description: initialData.description,
          status: initialData.status,
          websiteUrl: initialData.websiteUrl || '',
          repoUrl: initialData.repoUrl || '',
          imageUrl: initialData.imageUrl || '',
          techStack: initialData.techStack.join(', '),
          files: initialData.files,
          itemType: initialData.itemType || 'app',
          changeReason: '',
          gitUrl: initialData.repoUrl || ''
        });
        try {
           const dateStr = new Date(initialData.createdAt).toISOString().split('T')[0];
           setDateInput(dateStr);
        } catch (e) {
           setDateInput(new Date().toISOString().split('T')[0]);
        }
      } else {
        setFormData({
          name: '',
          description: '',
          status: ProjectStatus.IDEA,
          websiteUrl: '',
          repoUrl: '',
          imageUrl: '',
          techStack: '',
          files: '',
          itemType: 'app',
          changeReason: '',
          gitUrl: ''
        });
        setDateInput(new Date().toISOString().split('T')[0]);
      }
      setReasonError(false);
      setStackAnalysis(null);
    }
  }, [isOpen, initialData, currentUser]);

  const isEditor = currentUser?.role === UserRole.EDITOR;
  const isAdmin = currentUser?.role === UserRole.ADMIN;
  const isDev = currentUser?.role === UserRole.DEVELOPER;

  const canEditTechnical = !isEditor; 
  const canEditMetadata = currentUser?.role !== UserRole.VIEWER;

  const handleGenerate = async () => {
    if (!canEditTechnical) return;
    if (!formData.name || !formData.techStack) {
      alert("Please enter Name and Tech Stack first.");
      return;
    }
    setIsGenerating(true);
    const result = await generateProjectDetails(formData.name, formData.techStack);
    setIsGenerating(false);

    if (result) {
      setFormData(prev => ({
        ...prev,
        description: result.description,
        files: prev.files || result.suggestedFiles
      }));
    }
  };

  const handleAnalyzeStack = async () => {
    if (!formData.techStack) return;
    setIsAnalyzing(true);
    setStackAnalysis(null);
    const result = await analyzeTechStack(formData.techStack);
    setStackAnalysis(result);
    setIsAnalyzing(false);
  };

  const handleClone = () => {
    if (!formData.gitUrl) return;
    setIsCloning(true);
    
    // Simulate cloning delay
    setTimeout(() => {
        // Parse Repo Name from URL
        const parts = formData.gitUrl!.split('/');
        const repoName = parts[parts.length - 1]?.replace('.git', '') || 'cloned-project';
        
        setFormData(prev => ({
            ...prev,
            name: repoName.charAt(0).toUpperCase() + repoName.slice(1).replace(/-/g, ' '),
            repoUrl: prev.gitUrl!,
            techStack: 'Auto-Detected: React, Node.js', // Mock detection
            files: 'src/\n  components/\n    App.tsx\n  utils/\n    api.ts\nREADME.md',
            description: `Imported from git repository: ${prev.gitUrl}`
        }));
        setIsCloning(false);
    }, 1500);
  };

  const handleCopyCode = () => {
    if (formData.files) {
      navigator.clipboard.writeText(formData.files);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleRemoveImage = () => {
    if (window.confirm("Are you sure you want to remove this cover image?")) {
       setFormData(prev => ({ ...prev, imageUrl: '' }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isCoverPhoto: boolean = false, isAssetAppend: boolean = false) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      if (isCoverPhoto) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
        };
        reader.readAsDataURL(file);
        return;
      }

      if (isAssetAppend) {
         const assetInfo = `\n[Asset Uploaded] ${file.name} | ${(file.size/1024).toFixed(1)}KB | ${new Date().toLocaleDateString()}`;
         setFormData(prev => ({ 
            ...prev, 
            files: prev.files ? prev.files + assetInfo : assetInfo
         }));
         return;
      }
      
      if (!formData.name) {
        setFormData(prev => ({ ...prev, name: file.name }));
      }
      
      if (!formData.techStack) {
         const ext = file.name.split('.').pop()?.toUpperCase() || 'FILE';
         setFormData(prev => ({ ...prev, techStack: ext }));
      }

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
        };
        reader.readAsDataURL(file);
      }
      
      setFormData(prev => ({ 
        ...prev, 
        files: `Uploaded: ${new Date().toLocaleString()}\nFile Name: ${file.name}\nSize: ${(file.size / 1024).toFixed(2)} KB\nMIME Type: ${file.type}` 
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
        alert("Project/File Name is required.");
        return;
    }

    let finalChangeReason = formData.changeReason;
    if (initialData && !finalChangeReason?.trim()) {
        if (formData.imageUrl !== initialData.imageUrl) {
            finalChangeReason = "Updated cover image";
        } else {
            setReasonError(true);
            const reasonInput = document.getElementById('changeReason');
            if(reasonInput) reasonInput.focus();
            return;
        }
    }

    const finalData = {
      ...formData,
      changeReason: finalChangeReason,
      createdAt: new Date(dateInput).getTime() || Date.now(),
      status: formData.itemType === 'file' ? ProjectStatus.COMPLETED : formData.status
    };
    
    // Create simulated Git State if we cloned or if it's a new app with a repo URL
    let gitState: GitState | undefined = initialData?.gitState;
    
    if ((!initialData && formData.repoUrl) || (formData.repoUrl && !gitState)) {
        gitState = {
            remoteUrl: formData.repoUrl,
            branch: 'main',
            commits: [
                { id: 'init', hash: '8f2a1d', message: 'Initial Commit', author: currentUser?.name || 'User', date: new Date().toISOString() }
            ],
            lastSync: Date.now(),
            status: 'clean'
        };
    }
    
    onSave(finalData, gitState);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-[#181818] border border-[#333] rounded-md w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#333] sticky top-0 bg-[#181818] z-10">
          <div className="flex items-center gap-3">
            {formData.itemType === 'app' ? (
              <Cpu style={{ color: 'var(--primary-color)' }} size={28} aria-hidden="true" />
            ) : (
              <Folder className="text-blue-500" size={28} aria-hidden="true" />
            )}
            <h2 id="modal-title" className="text-2xl font-bold text-white tracking-tight">
              {initialData ? `CONFIGURE ${formData.itemType === 'app' ? 'APP' : 'FILE'}` : `NEW ${formData.itemType === 'app' ? 'APP' : 'FILE'}`}
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white rounded"
            aria-label="Close Modal"
          >
            <X size={24} aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 flex-1">
          
          {/* Item Type Selector */}
          {(!initialData || isAdmin) && (
            <div className="flex gap-4 mb-4" role="group" aria-label="Item Type Selection">
              <button 
                type="button"
                onClick={() => setFormData({...formData, itemType: 'app'})}
                className={`flex-1 py-3 rounded border flex items-center justify-center gap-2 transition-all focus:outline-none focus:ring-2 focus:ring-white ${formData.itemType === 'app' ? 'bg-[var(--primary-color)] border-[var(--primary-color)] text-white' : 'bg-[#333] border-transparent text-gray-400 hover:bg-[#444]'}`}
                aria-pressed={formData.itemType === 'app'}
              >
                <Cpu size={18} aria-hidden="true" /> Software App
              </button>
              <button 
                type="button"
                onClick={() => setFormData({...formData, itemType: 'file'})}
                className={`flex-1 py-3 rounded border flex items-center justify-center gap-2 transition-all focus:outline-none focus:ring-2 focus:ring-white ${formData.itemType === 'file' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-[#333] border-transparent text-gray-400 hover:bg-[#444]'}`}
                aria-pressed={formData.itemType === 'file'}
              >
                <Folder size={18} aria-hidden="true" /> Office File
              </button>
            </div>
          )}

          {/* Dedicated Git Clone Section for New Apps */}
          {(!initialData && formData.itemType === 'app') && (
            <div className="bg-[#1a1a1a] border border-[#333] rounded-md p-4 mb-6 shadow-inner relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 opacity-5 pointer-events-none">
                    <GitBranch size={64} />
                </div>
                
                <div className="flex items-center gap-2 mb-3 relative z-10">
                    <div className="p-1.5 bg-[#333] rounded text-[var(--primary-color)]">
                        <GitBranch size={16} />
                    </div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Clone Repository</h3>
                </div>

                <div className="flex gap-2 relative z-10">
                    <input 
                        type="text" 
                        value={formData.gitUrl || ''} 
                        onChange={(e) => setFormData({...formData, gitUrl: e.target.value})}
                        placeholder="https://github.com/username/repo.git"
                        className="flex-1 bg-[#0a0a0a] border border-[#444] rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-[var(--primary-color)] font-mono transition-colors"
                    />
                    <button 
                        type="button"
                        onClick={handleClone}
                        disabled={isCloning || !formData.gitUrl}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-bold uppercase text-xs disabled:opacity-50 min-w-[80px] flex justify-center items-center transition-all shadow-lg hover:shadow-blue-900/20"
                    >
                        {isCloning ? <Loader2 className="animate-spin" size={14} /> : 'Clone'}
                    </button>
                </div>
                <p className="text-[10px] text-gray-500 mt-2 relative z-10">
                    Auto-fills project name, tech stack, and file structure from the repository.
                </p>
            </div>
          )}

          {/* === CHANGE LOGGING (Required for Edits) === */}
          {initialData && (
             <div className={`p-4 rounded-sm transition-colors duration-300 ${reasonError ? 'bg-red-900/20 border border-red-500 animate-pulse' : 'bg-yellow-900/10 border border-yellow-900/30'}`}>
                <label htmlFor="changeReason" className={`block text-xs font-bold mb-1 uppercase tracking-wider flex items-center gap-2 ${reasonError ? 'text-red-400' : 'text-yellow-500'}`}>
                   <AlertTriangle size={14} aria-hidden="true" /> Reason for Update {reasonError ? '(REQUIRED)' : '(Required)'}
                </label>
                <input 
                  id="changeReason"
                  type="text"
                  value={formData.changeReason}
                  onChange={e => {
                      setFormData({...formData, changeReason: e.target.value});
                      if(e.target.value) setReasonError(false);
                  }}
                  placeholder="e.g. Updated feature descriptions, Fixed typo, Changed status..."
                  className={`w-full bg-[#0a0a0a] border rounded-sm px-3 py-2 text-white text-sm focus:outline-none ${reasonError ? 'border-red-500 focus:border-red-500' : 'border-yellow-900/30 focus:border-yellow-500'}`}
                />
             </div>
          )}

          {/* === OFFICE FILE FORM === */}
          {formData.itemType === 'file' && (
            <div className="space-y-6 animate-in fade-in">
               {/* File Name */}
               <div>
                  <label htmlFor="fileName" className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">File Name</label>
                  <input
                    id="fileName"
                    type="text"
                    required
                    disabled={!canEditMetadata}
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-[#333] border border-transparent focus:border-blue-500 rounded-sm px-4 py-3 text-white focus:outline-none font-mono"
                    placeholder="e.g. Q1_Financial_Report.pdf"
                  />
               </div>

               {/* Use (Description) */}
               <div>
                  <label htmlFor="fileDesc" className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Use / Purpose</label>
                  <textarea
                    id="fileDesc"
                    rows={3}
                    disabled={!canEditMetadata}
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className="w-full bg-[#333] border border-transparent focus:border-blue-500 rounded-sm px-4 py-3 text-white focus:outline-none resize-none"
                    placeholder="Describe the purpose of this file..."
                  />
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Type (TechStack) */}
                  <div>
                    <label htmlFor="fileType" className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Type / Format</label>
                    <input
                      id="fileType"
                      type="text"
                      disabled={!canEditTechnical}
                      value={formData.techStack}
                      onChange={e => setFormData({...formData, techStack: e.target.value})}
                      className="w-full bg-[#333] border border-transparent focus:border-blue-500 rounded-sm px-4 py-3 text-white focus:outline-none font-mono uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="e.g. PDF, DOCX, MP4"
                    />
                  </div>

                  {/* Date */}
                  <div>
                    <label htmlFor="fileDate" className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider flex items-center gap-2">
                      <Calendar size={14} aria-hidden="true" /> Date
                    </label>
                    <input
                      id="fileDate"
                      type="date"
                      disabled={!canEditMetadata}
                      value={dateInput}
                      onChange={e => setDateInput(e.target.value)}
                      className="w-full bg-[#333] border border-transparent focus:border-blue-500 rounded-sm px-4 py-3 text-white focus:outline-none [color-scheme:dark]"
                    />
                  </div>
               </div>

               {/* Upload Option */}
               <div>
                 <span className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider flex items-center gap-2">
                    <Upload size={14} aria-hidden="true" /> Upload File, Image, or Video
                 </span>
                 <div className="relative group cursor-pointer mt-2">
                   <input 
                      type="file" 
                      aria-label="Upload File"
                      onChange={(e) => handleFileChange(e, false, false)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                    />
                   <div className="border-2 border-dashed border-[#444] group-hover:border-blue-500 rounded-md p-8 flex flex-col items-center justify-center text-gray-400 group-hover:text-white transition-colors bg-[#222]">
                      <FileIcon size={32} className="mb-2" aria-hidden="true" />
                      <span className="text-sm font-medium">Click or Drag to upload</span>
                      <span className="text-xs text-gray-500 mt-1">Supports Images, Videos, Docs</span>
                   </div>
                 </div>
                 {formData.imageUrl && formData.imageUrl.startsWith('data:') && (
                   <div className="mt-4">
                     <p className="text-xs text-green-500 mb-2">Preview:</p>
                     <img src={formData.imageUrl} alt="Preview" className="h-20 w-auto rounded border border-[#444]" />
                   </div>
                 )}
               </div>
            </div>
          )}

          {/* === APP FORM === */}
          {formData.itemType === 'app' && (
            <div className="space-y-6 animate-in fade-in">
               {/* Top Row: Name & Status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <label htmlFor="appName" className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">
                    Application Name
                  </label>
                  <input
                    id="appName"
                    type="text"
                    required
                    disabled={!canEditMetadata}
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-[#333] border border-transparent focus:border-gray-500 rounded-sm px-4 py-3 text-white focus:outline-none placeholder-gray-600 font-mono disabled:opacity-50"
                    placeholder="e.g. FETS_HUB_CORE"
                  />
                </div>
                <div>
                  <label htmlFor="appStatus" className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Status</label>
                  <select
                    id="appStatus"
                    value={formData.status}
                    disabled={!canEditMetadata}
                    onChange={e => setFormData({...formData, status: e.target.value as ProjectStatus})}
                    className="w-full bg-[#333] border border-transparent focus:border-gray-500 rounded-sm px-4 py-3 text-white focus:outline-none appearance-none font-mono disabled:opacity-50"
                  >
                    {Object.values(ProjectStatus).map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tech Stack & AI */}
              <div>
                <div className="flex justify-between items-end mb-1">
                  <label htmlFor="techStack" className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Tech Stack / Dependencies
                  </label>
                  {canEditTechnical && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleAnalyzeStack}
                        disabled={isAnalyzing || !formData.techStack}
                        className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 px-2 py-1 rounded transition-all border border-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                         {isAnalyzing ? <Loader2 className="animate-spin" size={12} /> : <Search size={12} />}
                         Analyze Stack
                      </button>
                      <button
                        type="button"
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="flex items-center gap-2 text-xs text-[var(--primary-color)] hover:opacity-80 hover:bg-white/5 px-2 py-1 rounded transition-all border border-[var(--primary-color)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
                      >
                        {isGenerating ? <Loader2 className="animate-spin" size={12} aria-hidden="true" /> : <Sparkles size={12} aria-hidden="true" />}
                        AI Auto-Fill
                      </button>
                    </div>
                  )}
                </div>
                <input
                  id="techStack"
                  type="text"
                  disabled={!canEditTechnical}
                  value={formData.techStack}
                  onChange={e => setFormData({...formData, techStack: e.target.value})}
                  className="w-full bg-[#333] border border-transparent focus:border-gray-500 rounded-sm px-4 py-3 text-white focus:outline-none placeholder-gray-600 font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="e.g. React, Node.js"
                />
                
                {/* Tech Stack Analysis Result */}
                {stackAnalysis && (
                  <div className="mt-2 bg-[#121212] border border-blue-900/50 rounded-sm p-3 relative animate-in fade-in">
                      <button onClick={() => setStackAnalysis(null)} className="absolute top-2 right-2 text-gray-500 hover:text-white"><X size={12} /></button>
                      <h4 className="text-xs font-bold text-blue-400 uppercase mb-2 flex items-center gap-2"><Globe size={12}/> Analysis Result</h4>
                      <p className="text-xs text-gray-300 leading-relaxed">{stackAnalysis.text}</p>
                      {stackAnalysis.sources.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                           {stackAnalysis.sources.slice(0,2).map((src, i) => (
                             <a key={i} href={src.uri} target="_blank" className="text-[10px] text-gray-500 hover:text-white flex items-center gap-1 border-b border-dashed border-gray-600 hover:border-white">
                                <ExternalLink size={8} /> {src.title}
                             </a>
                           ))}
                        </div>
                      )}
                  </div>
                )}
              </div>

              {/* URLs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="websiteUrl" className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider flex items-center gap-2">
                    <Globe size={14} aria-hidden="true" /> Launch URL / App URI
                  </label>
                  <input
                    id="websiteUrl"
                    type="url"
                    disabled={!canEditMetadata}
                    value={formData.websiteUrl}
                    onChange={e => setFormData({...formData, websiteUrl: e.target.value})}
                    className="w-full bg-[#333] border border-transparent focus:border-gray-500 rounded-sm px-4 py-3 text-white focus:outline-none placeholder-gray-600 font-mono text-sm disabled:opacity-50"
                    placeholder="https://... or myapp://..."
                  />
                </div>
                <div>
                  <label htmlFor="repoUrl" className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider flex items-center gap-2">
                    <Github size={14} aria-hidden="true" /> Repository
                  </label>
                  <input
                    id="repoUrl"
                    type="url"
                    disabled={!canEditTechnical}
                    value={formData.repoUrl}
                    onChange={e => setFormData({...formData, repoUrl: e.target.value})}
                    className="w-full bg-[#333] border border-transparent focus:border-gray-500 rounded-sm px-4 py-3 text-white focus:outline-none placeholder-gray-600 font-mono text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="https://github.com/..."
                  />
                </div>
              </div>

              {/* Cover Photo Upload */}
              <div>
                  <span className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider flex items-center gap-2">
                    <ImageIcon size={14} aria-hidden="true" /> Cover Photo
                  </span>
                  <div className="mt-2 flex items-center gap-4">
                     {/* Preview */}
                     <div className="w-32 h-20 bg-[#222] rounded border border-[#444] overflow-hidden flex items-center justify-center shrink-0 relative group">
                        {formData.imageUrl ? (
                           <>
                             <img src={formData.imageUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                             {isAdmin && (
                               <button 
                                 type="button"
                                 onClick={handleRemoveImage}
                                 className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-red-500 transition-opacity focus:opacity-100 focus:outline-none"
                                 title="Remove Image (Admin Only)"
                                 aria-label="Remove Cover Image"
                               >
                                 <Trash2 size={20} aria-hidden="true" />
                               </button>
                             )}
                           </>
                        ) : (
                           <span className="text-xs text-gray-500">No Image</span>
                        )}
                     </div>
                     {/* Upload Button */}
                     {canEditMetadata && (
                        <div className="flex-1">
                           <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-[#333] hover:bg-[#444] text-white text-sm rounded transition-colors border border-transparent hover:border-gray-500 focus-within:ring-2 focus-within:ring-white">
                              <Upload size={16} aria-hidden="true" />
                              <span>Upload Cover Image</span>
                              <input 
                                type="file" 
                                accept="image/*"
                                className="hidden" 
                                onChange={(e) => handleFileChange(e, true, false)}
                              />
                           </label>
                           <p className="text-[10px] text-gray-500 mt-1">
                             {formData.imageUrl && formData.imageUrl !== initialData?.imageUrl && (
                               <span className="text-green-500 font-bold mr-2">New image selected!</span>
                             )}
                             Recommended: 16:9 Aspect Ratio (1920x1080)
                           </p>
                        </div>
                     )}
                  </div>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">
                  System Overview
                </label>
                <textarea
                  id="description"
                  rows={3}
                  disabled={!canEditMetadata}
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-[#333] border border-transparent focus:border-gray-500 rounded-sm px-4 py-3 text-white focus:outline-none resize-none placeholder-gray-600 font-sans disabled:opacity-50"
                  placeholder="Brief description..."
                />
              </div>

              {/* Related Assets Upload */}
              {canEditMetadata && (
                <div>
                  <span className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider flex items-center gap-2">
                     <Film size={14} aria-hidden="true" /> Upload Related Assets
                  </span>
                  <div className="mt-1 p-4 bg-[#222] border border-dashed border-[#444] rounded flex items-center justify-between group hover:border-gray-500 transition-colors">
                     <div className="flex items-center gap-3 text-gray-400">
                        <div className="bg-[#333] p-2 rounded-full"><Upload size={16} aria-hidden="true" /></div>
                        <div className="text-sm">
                           <p className="text-gray-300 font-medium">Add Files / Images / Videos</p>
                           <p className="text-xs text-gray-500">Assets will be logged in the file structure below.</p>
                        </div>
                     </div>
                     <label className="cursor-pointer px-3 py-1.5 bg-[#333] hover:bg-[#444] text-xs text-white rounded uppercase font-bold tracking-wide transition-colors focus-within:ring-2 focus-within:ring-white">
                        Browse
                        <input 
                           type="file" 
                           multiple
                           className="hidden" 
                           onChange={(e) => handleFileChange(e, false, true)}
                        />
                     </label>
                  </div>
                </div>
              )}

              {/* Files */}
              <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="files" className="block text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                      <FileCode size={14} aria-hidden="true" /> Source Code / Asset Log
                    </label>
                    <button 
                      type="button"
                      onClick={handleCopyCode}
                      className="text-[10px] flex items-center gap-1 text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white rounded"
                      aria-label="Copy Code"
                    >
                      {isCopied ? <Check size={10} className="text-green-500" aria-hidden="true" /> : <Copy size={10} aria-hidden="true" />}
                      {isCopied ? 'COPIED' : 'COPY LOG'}
                    </button>
                  </div>
                  <textarea
                    id="files"
                    rows={6}
                    disabled={!canEditTechnical}
                    value={formData.files}
                    onChange={e => setFormData({...formData, files: e.target.value})}
                    className="w-full bg-[#0d0d0d] border border-[#333] focus:border-gray-500 rounded-sm px-4 py-3 text-green-500 font-mono text-xs focus:outline-none placeholder-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="src/\n  components/\n    App.tsx"
                  />
                </div>
            </div>
          )}

        </form>

        {/* Footer */}
        <div className="p-6 border-t border-[#333] flex justify-end gap-3 sticky bottom-0 bg-[#181818] rounded-b-md">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 text-gray-400 hover:text-white hover:bg-[#333] rounded-sm transition-colors font-medium text-sm tracking-wide uppercase focus:outline-none focus:ring-2 focus:ring-white"
          >
            Cancel
          </button>
          {canEditMetadata && (
            <button
              type="submit"
              onClick={(e) => handleSubmit(e as any)}
              style={formData.itemType === 'app' ? { backgroundColor: 'var(--primary-color)' } : {}}
              className={`px-8 py-2 text-white rounded-sm font-bold shadow-md transition-all text-sm tracking-wide uppercase hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-white ${formData.itemType !== 'app' ? 'bg-blue-600 hover:bg-blue-500' : ''}`}
            >
              {initialData ? 'Save Changes' : (formData.itemType === 'app' ? 'Deploy App' : 'Upload File')}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
