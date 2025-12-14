
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Info, Play, Plus, ChevronDown, Folder, Loader2, Database, CloudOff, Settings } from 'lucide-react';
import { INITIAL_PROJECTS, MOCK_USERS } from './constants';
import { Project, ProjectFormData, ProjectStatus, User, UserRole, AppSettings, ChangeLogEntry, Category, GitState } from './types';
import { ProjectModal } from './components/ProjectModal';
import { ProjectDetailView } from './components/ProjectDetailView';
import { Row } from './components/Row';
import { SettingsView } from './components/SettingsView';
import { ResourceView } from './components/ResourceView';
import { SOPView } from './components/SOPView';
import { fetchProjects, createProject, updateProject, deleteProject, seedInitialProjects } from './services/projectService';

const App = () => {
  // Auth State - Default to Admin User immediately to bypass login
  const [currentUser, setCurrentUser] = useState<User | null>(MOCK_USERS[0]);
  // Users State for RBAC Management
  const [users, setUsers] = useState<User[]>(MOCK_USERS);

  // Settings State with Persistence
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [appSettings, setAppSettings] = useState<AppSettings>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('fets_settings');
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.warn("Failed to load settings", e);
      }
    }
    return {
      accentColor: '#E50914', // Default Netflix Red
      reduceMotion: false,
      enableNotifications: true,
    };
  });

  // Persist Settings
  useEffect(() => {
    localStorage.setItem('fets_settings', JSON.stringify(appSettings));
  }, [appSettings]);

  // Data State
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>(undefined);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [featuredProject, setFeaturedProject] = useState<Project | null>(null);
  const [selectedResourceName, setSelectedResourceName] = useState<string | null>(null);
  const [selectedSopId, setSelectedSopId] = useState<string | null>(null);

  // User Preference State
  const [myList, setMyList] = useState<string[]>([]);
  const [likedProjects, setLikedProjects] = useState<string[]>([]);

  // Navigation State
  const [activeCategory, setActiveCategory] = useState<Category>('Home');

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Initial Data Fetch
  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const data = await fetchProjects();
        if (!mounted) return;

        // Use fetched data or fallback to INITIAL_PROJECTS if empty (for demo/review purposes)
        const finalProjects = data && data.length > 0 ? data : INITIAL_PROJECTS;
        setProjects(finalProjects);

        // Setup Featured Project
        const apps = finalProjects.filter(p => p.itemType === 'app');
        if (apps.length > 0) {
          const random = apps[Math.floor(Math.random() * apps.length)];
          setFeaturedProject(random);
        }
      } catch (err) {
        if (!mounted) return;
        // Quietly handle offline mode without alarming errors
        setIsOfflineMode(true);
        setProjects(INITIAL_PROJECTS);

        // Fallback Featured Project
        const apps = INITIAL_PROJECTS.filter(p => p.itemType === 'app');
        if (apps.length > 0) {
          setFeaturedProject(apps[0]);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    loadData();

    return () => { mounted = false; };
  }, []);

  // Handle scroll for navbar transparency and Featured App Rotation
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);

    // Auto-Rotate Featured Project every 2 minutes (120,000 ms)
    const rotationInterval = setInterval(() => {
      const currentApps = projects.filter(p => p.itemType === 'app');
      if (currentApps.length > 0) {
        const randomIndex = Math.floor(Math.random() * currentApps.length);
        setFeaturedProject(currentApps[randomIndex]);
      }
    }, 120000);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearInterval(rotationInterval);
    };
  }, [projects]); // Re-run if project list changes to ensure we rotate through new apps

  // Filter projects based on search query AND active category
  const filteredProjects = useMemo(() => {
    let filtered = projects;

    // 1. Filter by Category
    if (activeCategory === 'Home') {
      filtered = filtered.filter(p => p.itemType === 'app');
    } else if (activeCategory === 'Resources') {
      filtered = filtered.filter(p => p.itemType === 'file');
    } else if (activeCategory === 'My List') {
      filtered = filtered.filter(p => myList.includes(p.id));
    } else if (activeCategory === 'FETS Apps') {
      // Filter for official FETS apps (exclude client portals like Prometric/Pearson)
      filtered = filtered.filter(p =>
        p.itemType === 'app' && p.id.startsWith('fets')
      );
    }

    // 2. Filter by Search
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.description.toLowerCase().includes(lowerQuery) ||
        p.techStack.some(tech => tech.toLowerCase().includes(lowerQuery)) ||
        (p.files && p.files.toLowerCase().includes(lowerQuery))
      );
    }

    return filtered;
  }, [projects, searchQuery, activeCategory, myList]);

  // Group projects by status for rows
  const projectsByStatus = useMemo(() => {
    const grouped: Record<string, Project[]> = {
      [ProjectStatus.IN_PROGRESS]: [],
      [ProjectStatus.COMPLETED]: [],
      [ProjectStatus.IDEA]: [],
      [ProjectStatus.ARCHIVED]: []
    };

    filteredProjects.forEach(p => {
      if (grouped[p.status]) {
        grouped[p.status].push(p);
      } else {
        if (!grouped['Other']) grouped['Other'] = [];
        grouped['Other'].push(p);
      }
    });
    return grouped;
  }, [filteredProjects]);

  // User Actions
  const toggleMyList = (id: string) => {
    setMyList(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleLike = (id: string) => {
    setLikedProjects(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleDeleteProject = async (id: string) => {
    if (window.confirm("Are you sure you want to permanently delete this project?")) {
      try {
        if (!isOfflineMode) await deleteProject(id);
        setProjects(prev => prev.filter(p => p.id !== id));
        // Clean up selection if deleted
        if (selectedProject?.id === id) setSelectedProject(null);
        if (editingProject?.id === id) setEditingProject(undefined);
        if (featuredProject?.id === id) {
          const remaining = projects.filter(p => p.id !== id && p.itemType === 'app');
          setFeaturedProject(remaining.length > 0 ? remaining[0] : null);
        }
      } catch (e) {
        alert("Failed to delete project from database.");
      }
    }
  };

  // Handlers
  const handleCreateProject = async (data: ProjectFormData, gitState?: GitState) => {
    const newProject: Project = {
      id: Date.now().toString(),
      createdAt: data.createdAt || Date.now(),
      name: data.name,
      description: data.description,
      status: data.status,
      websiteUrl: data.websiteUrl,
      repoUrl: data.repoUrl,
      imageUrl: data.imageUrl,
      techStack: data.techStack.split(',').map(s => s.trim()).filter(Boolean),
      files: data.files,
      itemType: data.itemType,
      changeHistory: [],
      gitState: gitState
    };

    try {
      if (!isOfflineMode) await createProject(newProject);
      setProjects(prev => [newProject, ...prev]);
    } catch (e) {
      // alert("Failed to create project in database. Added locally."); // Suppress alert for better UX
      setProjects(prev => [newProject, ...prev]);
    }
  };

  const handleUpdateProject = async (data: ProjectFormData) => {
    if (!editingProject?.id) return;

    // Create Change Log Entry
    const newLog: ChangeLogEntry = {
      id: Date.now().toString(),
      date: Date.now(),
      author: currentUser?.name || 'Unknown',
      reason: data.changeReason || 'General update'
    };

    let updatedProject: Project | null = null;

    const updatedProjects = projects.map(p => {
      if (p.id === editingProject.id) {
        updatedProject = {
          ...p,
          name: data.name,
          description: data.description,
          status: data.status,
          websiteUrl: data.websiteUrl,
          repoUrl: data.repoUrl,
          imageUrl: data.imageUrl,
          techStack: data.techStack.split(',').map(s => s.trim()).filter(Boolean),
          files: data.files,
          itemType: data.itemType,
          createdAt: data.createdAt || p.createdAt,
          changeHistory: [...(p.changeHistory || []), newLog]
        };
        return updatedProject;
      }
      return p;
    });

    if (updatedProject) {
      try {
        if (!isOfflineMode) await updateProject(updatedProject);
        setProjects(updatedProjects);
        // Update derived states
        if (selectedProject?.id === editingProject.id) setSelectedProject(updatedProject);
        if (featuredProject?.id === editingProject.id) setFeaturedProject(updatedProject);
      } catch (e) {
        // Fallback to local update is already handled by state set
        setProjects(updatedProjects);
      }
    }
  };

  const handleQuickSaveProject = async (updated: Project) => {
    try {
      if (!isOfflineMode) await updateProject(updated);
      setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
      setSelectedProject(updated);
      if (featuredProject?.id === updated.id) setFeaturedProject(updated);
    } catch (e) {
      // Fallback logic
      setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
    }
  };

  // Seed Function for DB
  const handleSeedDb = async () => {
    if (isOfflineMode) {
      alert("Cannot seed database in offline mode.");
      return;
    }
    const success = await seedInitialProjects(INITIAL_PROJECTS);
    if (success) {
      alert("Database seeded! Refreshing...");
      const data = await fetchProjects();
      setProjects(data);
    } else {
      alert("Database not empty or error occurred.");
    }
  };

  // User Management Handlers
  const handleUpdateUserRole = (userId: string, newRole: UserRole) => {
    setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
  };

  const handleDeleteUser = (userId: string) => {
    if (window.confirm("Are you sure you want to remove this user access?")) {
      setUsers(users.filter(u => u.id !== userId));
    }
  };

  const openCreateModal = () => {
    setEditingProject(undefined);
    setIsModalOpen(true);
  };

  const openEditModal = (project: Project) => {
    setEditingProject(project);
  };

  const toggleSearch = () => {
    setIsSearchActive(prev => !prev);
    if (!isSearchActive) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  };

  const featuredImage = featuredProject?.imageUrl || (featuredProject ? `https://picsum.photos/seed/${featuredProject.id}/1920/1080` : '');

  // Helper for active link styling with new bigger/unique format
  const getLinkClass = (category: Category) =>
    `cursor-pointer relative group flex items-center gap-2 h-full transition-all duration-300 ${activeCategory === category
      ? 'text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]'
      : 'text-gray-400 hover:text-white'
    }`;

  // Permissions
  const canCreate = currentUser && (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.DEVELOPER);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-[var(--primary-color)] mx-auto mb-4" size={48} />
          <p className="text-gray-400 uppercase tracking-widest font-bold">Initializing FETS SPACE...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#050505] text-gray-100 font-sans selection:bg-white selection:text-black overflow-x-hidden bg-grain"
    >
      {/* Dynamic Styles based on Settings */}
      <style>{`
        :root {
          --primary-color: ${appSettings.accentColor};
        }
      `}</style>

      {/* Navbar */}
      <nav
        className={`fixed w-full z-[50] transition-all duration-700 ${isScrolled ? 'bg-black/90 backdrop-blur-xl shadow-2xl border-b border-white/10 py-4' : 'bg-gradient-to-b from-black via-black/60 to-transparent py-8'}`}
        role="navigation"
        aria-label="Main Navigation"
      >
        {isOfflineMode && (
          <div className="absolute top-0 left-0 w-full h-0.5 bg-red-600/50 overflow-hidden" title="Offline Mode: Database Unreachable"></div>
        )}
        <div className="px-6 md:px-16 flex items-center justify-between">
          <div className="flex items-center gap-8 lg:gap-20">
            {/* App Name */}
            <div
              className="cursor-pointer hover:opacity-90 transition-opacity group flex items-center gap-4"
              onClick={() => { setSearchQuery(''); setIsSearchActive(false); setActiveCategory('Home'); setSelectedResourceName(null); setSelectedSopId(null); }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setActiveCategory('Home')}
            >
              <h1 className="font-['Orbitron'] text-4xl md:text-6xl lg:text-7xl font-black tracking-[0.1em] drop-shadow-[0_0_25px_rgba(229,9,20,0.6)] bg-gradient-to-r from-[var(--primary-color)] via-red-500 to-red-700 bg-clip-text text-transparent transform group-hover:scale-105 transition-transform duration-500">
                FETS SPACE
              </h1>
              {isOfflineMode && <CloudOff size={20} className="text-red-500/50" title="Offline Mode: Local Data Only" />}
            </div>

            {/* Menu Links (Visible on md and up) */}
            <ul className="hidden md:flex items-center gap-6 lg:gap-12 xl:gap-16 text-lg lg:text-xl xl:text-2xl font-bold tracking-[0.2em] font-['Orbitron'] uppercase">

              {/* Resources Dropdown */}
              <li
                className={`${getLinkClass('Resources')}`}
                onClick={() => { setActiveCategory('Resources'); setSelectedResourceName(null); setSelectedSopId(null); }}
                role="button"
                tabIndex={0}
              >
                <span className="relative z-10">RESOURCES</span>
                <span className={`absolute -bottom-2 left-0 w-full h-0.5 bg-[var(--primary-color)] transform origin-left transition-transform duration-300 ${activeCategory === 'Resources' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}></span>
                <ChevronDown size={20} className="group-hover:rotate-180 transition-transform duration-300 opacity-60 group-hover:opacity-100" />

                <div className="absolute top-full left-0 mt-8 w-96 bg-[#0a0a0a]/95 backdrop-blur-xl border border-[#333] rounded-sm shadow-[0_20px_50px_rgba(0,0,0,0.9)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-4 group-hover:translate-y-0 overflow-hidden font-sans normal-case tracking-normal z-50">
                  <div className="absolute top-0 left-0 w-full h-0.5 bg-[var(--primary-color)] shadow-[0_0_20px_var(--primary-color)]"></div>
                  {['Prometric', 'Pearson VUE', 'PSI', 'FETS'].map(res => (
                    <button
                      key={res}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveCategory('Resources');
                        setSelectedResourceName(res);
                        setSelectedSopId(null);
                      }}
                      className="group/item block w-full text-left px-8 py-5 text-gray-400 border-b border-[#1f1f1f] last:border-0 transition-all duration-300 hover:text-white hover:pl-10 hover:bg-gradient-to-r hover:from-red-900/30 hover:to-transparent hover:border-l-4 hover:border-l-[var(--primary-color)] relative overflow-hidden font-['Orbitron'] font-bold text-lg uppercase tracking-wider"
                    >
                      <span className="relative z-10 transition-all duration-300 group-hover/item:drop-shadow-[0_0_8px_rgba(229,9,20,0.8)]">{res}</span>
                    </button>
                  ))}
                </div>
              </li>

              {/* FETS Apps Dropdown */}
              <li
                className={`${getLinkClass('FETS Apps')}`}
                onClick={() => { setActiveCategory('FETS Apps'); setSelectedSopId(null); }}
                role="button"
                tabIndex={0}
              >
                <span className="relative z-10">FETS APPS</span>
                <span className={`absolute -bottom-2 left-0 w-full h-0.5 bg-[var(--primary-color)] transform origin-left transition-transform duration-300 ${activeCategory === 'FETS Apps' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}></span>
                <ChevronDown size={20} className="group-hover:rotate-180 transition-transform duration-300 opacity-60 group-hover:opacity-100" />

                <div className="absolute top-full left-0 mt-8 w-96 bg-[#0a0a0a]/95 backdrop-blur-xl border border-[#333] rounded-sm shadow-[0_20px_50px_rgba(0,0,0,0.9)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-4 group-hover:translate-y-0 overflow-hidden font-sans normal-case tracking-normal z-50">
                  <div className="absolute top-0 left-0 w-full h-0.5 bg-[var(--primary-color)] shadow-[0_0_20px_var(--primary-color)]"></div>
                  {/* Changed slice from 5 to 10 to include new apps */}
                  {projects.filter(p => p.itemType === 'app').slice(0, 10).map(app => (
                    <button
                      key={app.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (app.websiteUrl) {
                          window.open(app.websiteUrl, '_blank');
                        } else {
                          setSelectedProject(app);
                        }
                      }}
                      className="group/item block w-full text-left px-8 py-5 text-gray-400 border-b border-[#1f1f1f] last:border-0 transition-all duration-300 hover:text-white hover:pl-10 hover:bg-gradient-to-r hover:from-red-900/30 hover:to-transparent hover:border-l-4 hover:border-l-[var(--primary-color)] relative overflow-hidden truncate font-['Orbitron'] font-bold text-lg uppercase tracking-wider"
                    >
                      <span className="relative z-10 transition-all duration-300 group-hover/item:drop-shadow-[0_0_8px_rgba(229,9,20,0.8)]">{app.name}</span>
                    </button>
                  ))}
                </div>
              </li>

              {/* SOP Dropdown */}
              <li
                className={`${getLinkClass('SOP')}`}
                onClick={() => { setActiveCategory('SOP'); setSelectedSopId('overview'); setSelectedResourceName(null); }}
                role="button"
                tabIndex={0}
              >
                <span className="relative z-10">SOP</span>
                <span className={`absolute -bottom-2 left-0 w-full h-0.5 bg-[var(--primary-color)] transform origin-left transition-transform duration-300 ${activeCategory === 'SOP' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}></span>
                <ChevronDown size={20} className="group-hover:rotate-180 transition-transform duration-300 opacity-60 group-hover:opacity-100" />

                <div className="absolute top-full left-0 mt-8 w-[28rem] bg-[#0a0a0a]/95 backdrop-blur-xl border border-[#333] rounded-sm shadow-[0_20px_50px_rgba(0,0,0,0.9)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-4 group-hover:translate-y-0 overflow-hidden font-sans normal-case tracking-normal z-50">
                  <div className="absolute top-0 left-0 w-full h-0.5 bg-[var(--primary-color)] shadow-[0_0_20px_var(--primary-color)]"></div>
                  {[
                    { id: 'overview', label: 'Overview' },
                    { id: 'opening', label: 'Branch Opening' },
                    { id: 'checkin', label: 'Candidate Check-In' },
                    { id: 'monitoring', label: 'Exam Monitoring' },
                    { id: 'emergency', label: 'Emergency & Incident' },
                    { id: 'closing', label: 'End-of-Day Closing' },
                    { id: 'compliance', label: 'Compliance & Penalties' },
                  ].map(item => (
                    <button
                      key={item.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveCategory('SOP');
                        setSelectedSopId(item.id);
                        setSelectedResourceName(null);
                      }}
                      className="group/item block w-full text-left px-8 py-5 text-gray-400 border-b border-[#1f1f1f] last:border-0 transition-all duration-300 hover:text-white hover:pl-10 hover:bg-gradient-to-r hover:from-red-900/30 hover:to-transparent hover:border-l-4 hover:border-l-[var(--primary-color)] relative overflow-hidden font-['Orbitron'] font-bold text-lg uppercase tracking-wider"
                    >
                      <span className="relative z-10 transition-all duration-300 group-hover/item:drop-shadow-[0_0_8px_rgba(229,9,20,0.8)]">{item.label}</span>
                    </button>
                  ))}
                </div>
              </li>

            </ul>
          </div>

          <div className="flex items-center gap-6 text-white">

            {/* Search Bar */}
            <div className={`flex items-center transition-all duration-500 ${isSearchActive ? 'bg-white/10 border border-white/20 px-4 py-2 rounded-full backdrop-blur-sm' : 'px-2 py-1 border border-transparent'}`}>
              <button onClick={toggleSearch} aria-label="Search">
                <Search size={28} className="cursor-pointer hover:text-white text-gray-300 transition-colors" aria-hidden="true" />
              </button>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onBlur={() => !searchQuery && setIsSearchActive(false)}
                placeholder="Search apps, stack, features..."
                aria-label="Search input"
                className={`bg-transparent text-white text-xl ml-3 focus:outline-none transition-all duration-500 placeholder-gray-400 font-['Orbitron'] ${isSearchActive ? 'w-56 md:w-96 opacity-100' : 'w-0 opacity-0'}`}
              />
            </div>

            {canCreate && (
              <div className="hidden md:flex items-center gap-2">
                {!isOfflineMode && projects.length === 0 && (
                  <button
                    onClick={handleSeedDb}
                    className="flex items-center gap-2 text-xs bg-gray-800 text-gray-300 px-3 py-2 rounded-sm hover:text-white hover:bg-gray-700 transition-colors uppercase tracking-wider"
                    title="Seed database with mock data"
                  >
                    <Database size={14} /> Seed DB
                  </button>
                )}
                <button
                  onClick={openCreateModal}
                  className="flex items-center gap-2 text-sm font-bold bg-white text-black hover:bg-gray-200 px-6 py-2.5 rounded-sm transition-all uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-white shadow-[0_0_15px_rgba(255,255,255,0.3)] hover:scale-105"
                  aria-label="Create New Build"
                >
                  <Plus size={18} aria-hidden="true" /> New Build
                </button>
              </div>
            )}

            {/* Settings & Profile Trigger */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="group flex items-center gap-2 focus:outline-none"
              aria-label="Open Settings"
            >
              <div className="w-10 h-10 rounded-sm border border-white/20 overflow-hidden group-hover:border-[var(--primary-color)] transition-all shadow-lg focus:ring-2 focus:ring-white">
                {currentUser?.avatarUrl ? (
                  <img src={currentUser.avatarUrl} alt="User" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                ) : (
                  <div className="w-full h-full bg-[#333] flex items-center justify-center text-xs font-bold">
                    {currentUser?.name?.[0] || 'U'}
                  </div>
                )}
              </div>
              <Settings size={24} className="text-gray-400 group-hover:text-white transition-colors group-hover:rotate-90 duration-500" />
            </button>

          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      {activeCategory === 'SOP' && selectedSopId ? (
        <SOPView sopId={selectedSopId} onBack={() => { setActiveCategory('Home'); setSelectedSopId(null); }} />
      ) : activeCategory === 'Resources' && selectedResourceName ? (
        <ResourceView resourceId={selectedResourceName} onBack={() => setSelectedResourceName(null)} />
      ) : (
        <>
          {/* Billboard (Hero Section) - Netflix Style with FETS Universe Background */}
          {!searchQuery && activeCategory === 'Home' && (
            <div className="relative h-[85vh] w-full bg-[#050505] animate-in fade-in duration-1000 border-b border-white/5 group">

              {/* Background Image - Spread & Cover */}
              <div className="absolute inset-0">
                <img
                  src="/fets_universe.png"
                  alt="FETS Universe Portfolio"
                  className="w-full h-full object-cover opacity-80"
                />
                {/* Vignette & Gradients for Text Readability (Netflix Style) */}
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 h-96 bg-gradient-to-t from-[#050505] via-[#050505]/90 to-transparent" />
              </div>

              {/* Hero Content - Left Aligned (Netflix Style) */}
              <div className="absolute top-[25%] md:top-[30%] left-6 md:left-16 max-w-2xl space-y-6 z-10">
                {/* Featured Badge */}
                <div className="flex items-center gap-4 mb-4 opacity-0 animate-slide-up" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
                  <div className="px-4 py-1.5 border border-[var(--primary-color)]/50 flex items-center justify-center rounded-sm font-bold text-[10px] tracking-[0.25em] text-[var(--primary-color)] uppercase backdrop-blur-md bg-black/40 shadow-[0_0_15px_rgba(229,9,20,0.4)]">
                    Enterprise Ecosystem
                  </div>
                </div>

                {/* Title */}
                <h1
                  className="text-6xl md:text-8xl font-black drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] tracking-tighter text-white leading-[0.9] uppercase animate-slide-up font-['Orbitron']"
                  style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}
                >
                  FETS <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">UNIVERSE</span>
                </h1>

                {/* Meta Data Row */}
                <div className="flex items-center gap-4 text-gray-300 font-medium text-sm animate-slide-up" style={{ animationDelay: '600ms', animationFillMode: 'forwards' }}>
                  <span className="text-[#46d369] font-bold">98% Match</span>
                  <span className="text-gray-400">2025 Release</span>
                  <span className="border border-gray-600 px-2 py-0.5 text-[10px] text-gray-300 uppercase tracking-wider bg-black/50 rounded">HD</span>
                  <span className="border border-gray-600 px-2 py-0.5 text-[10px] text-gray-300 uppercase tracking-wider bg-black/50 rounded">5.1</span>
                </div>

                {/* Description */}
                <p
                  className="text-lg md:text-xl text-gray-200 drop-shadow-lg font-light leading-relaxed text-shadow-sm max-w-xl animate-slide-up"
                  style={{ animationDelay: '800ms', animationFillMode: 'forwards' }}
                >
                  Explore the complete FETS ecosystem. From financial cloud solutions to real-time operations and team management. The FETS Universe connects every vertical into a singular, powerful portfolio.
                </p>

                {/* Buttons */}
                <div className="flex items-center gap-4 pt-6 animate-slide-up" style={{ animationDelay: '1000ms', animationFillMode: 'forwards' }}>
                  <button
                    onClick={() => {
                      const cloudApp = projects.find(p => p.id.includes('cloud') || p.name.includes('Cloud'));
                      if (cloudApp) setSelectedProject(cloudApp);
                    }}
                    className="bg-white text-black px-8 md:px-10 py-3 rounded-[4px] flex items-center gap-3 font-bold hover:bg-white/90 transition hover:scale-105 active:scale-95 shadow-lg uppercase tracking-wide text-lg"
                  >
                    <Play fill="black" size={24} />
                    <span>Explore</span>
                  </button>
                  <button
                    className="bg-gray-500/70 text-white px-8 md:px-10 py-3 rounded-[4px] flex items-center gap-3 font-bold hover:bg-gray-500/50 transition hover:scale-105 active:scale-95 backdrop-blur-md uppercase tracking-wide text-lg"
                  >
                    <Info size={24} />
                    <span>Details</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Category / Search Header */}
          {(searchQuery || activeCategory !== 'Home') && (
            <div className="pt-40 px-6 md:px-16 mb-10 animate-in fade-in">
              <h2 className="text-white text-4xl font-bold flex items-center gap-4 tracking-tight">
                {activeCategory === 'Resources' && <Folder size={36} className="text-gray-400" aria-hidden="true" />}
                {searchQuery ? `Results for "${searchQuery}"` : activeCategory}
              </h2>
              {!searchQuery && (
                <p className="text-gray-500 text-sm mt-3 font-mono uppercase tracking-wider">
                  {filteredProjects.length} items found
                </p>
              )}
            </div>
          )}

          {/* Rows */}
          <div className={`pb-40 relative z-20 pl-6 md:pl-16 overflow-visible ${(!searchQuery && activeCategory === 'Home') ? '-mt-24 md:-mt-40' : 'mt-8'}`}>

            {/* My List Empty State */}
            {activeCategory === 'My List' && filteredProjects.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-gray-500">
                <Plus size={56} className="mb-6 text-gray-700" aria-hidden="true" />
                <p className="text-xl uppercase tracking-widest">Your list is empty</p>
                <p className="text-base text-gray-600 mt-2">Add projects or files to track them here.</p>
              </div>
            )}

            {/* Resources (Files) View */}
            {activeCategory === 'Resources' && filteredProjects.length > 0 && (
              <Row
                title="Documents & Files"
                projects={filteredProjects}
                onView={setSelectedProject}
                myList={myList}
                likedProjects={likedProjects}
                onToggleLike={toggleLike}
                onToggleList={toggleMyList}
                currentUser={currentUser!}
                onDelete={handleDeleteProject}
                onEdit={openEditModal}
              />
            )}

            {/* Standard Dashboard Rows */}
            {activeCategory !== 'Resources' && (
              <>
                {projectsByStatus[ProjectStatus.COMPLETED].length > 0 && (
                  <Row
                    title="Currently Deployed"
                    projects={projectsByStatus[ProjectStatus.COMPLETED]}
                    onView={setSelectedProject}
                    myList={myList}
                    likedProjects={likedProjects}
                    onToggleLike={toggleLike}
                    onToggleList={toggleMyList}
                    currentUser={currentUser!}
                    onDelete={handleDeleteProject}
                    onEdit={openEditModal}
                  />
                )}

                {projectsByStatus[ProjectStatus.IN_PROGRESS].length > 0 && (
                  <Row
                    title="In Development"
                    projects={projectsByStatus[ProjectStatus.IN_PROGRESS]}
                    onView={setSelectedProject}
                    myList={myList}
                    likedProjects={likedProjects}
                    onToggleLike={toggleLike}
                    onToggleList={toggleMyList}
                    currentUser={currentUser!}
                    onDelete={handleDeleteProject}
                    onEdit={openEditModal}
                  />
                )}

                {projectsByStatus[ProjectStatus.IDEA].length > 0 && (
                  <Row
                    title="Concept Phase"
                    projects={projectsByStatus[ProjectStatus.IDEA]}
                    onView={setSelectedProject}
                    myList={myList}
                    likedProjects={likedProjects}
                    onToggleLike={toggleLike}
                    onToggleList={toggleMyList}
                    currentUser={currentUser!}
                    onDelete={handleDeleteProject}
                    onEdit={openEditModal}
                  />
                )}

                {projectsByStatus[ProjectStatus.ARCHIVED].length > 0 && (
                  <Row
                    title="Deprecated"
                    projects={projectsByStatus[ProjectStatus.ARCHIVED]}
                    onView={setSelectedProject}
                    myList={myList}
                    likedProjects={likedProjects}
                    onToggleLike={toggleLike}
                    onToggleList={toggleMyList}
                    currentUser={currentUser!}
                    onDelete={handleDeleteProject}
                    onEdit={openEditModal}
                  />
                )}

                {projectsByStatus['Other']?.length > 0 && (
                  <Row
                    title="Other Projects"
                    projects={projectsByStatus['Other']}
                    onView={setSelectedProject}
                    myList={myList}
                    likedProjects={likedProjects}
                    onToggleLike={toggleLike}
                    onToggleList={toggleMyList}
                    currentUser={currentUser!}
                    onDelete={handleDeleteProject}
                    onEdit={openEditModal}
                  />
                )}
              </>
            )}

            {/* Empty State */}
            {filteredProjects.length === 0 && activeCategory !== 'My List' && (
              <div className="flex flex-col items-center justify-center py-24 text-gray-600">
                <p className="uppercase tracking-widest text-lg">No items found</p>
                {activeCategory === 'Home' && !isLoading && !isOfflineMode && (
                  <button
                    onClick={handleSeedDb}
                    className="mt-4 flex items-center gap-2 text-sm bg-gray-800 text-gray-300 px-4 py-2 rounded-sm hover:text-white hover:bg-gray-700 transition-colors uppercase tracking-wider"
                  >
                    <Database size={16} /> Seed with Mock Data
                  </button>
                )}
              </div>
            )}

          </div>
        </>
      )}

      {/* Modals */}
      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleCreateProject}
        currentUser={currentUser}
      />

      <ProjectModal
        isOpen={!!editingProject}
        onClose={() => setEditingProject(undefined)}
        onSave={handleUpdateProject}
        initialData={editingProject}
        currentUser={currentUser}
      />

      <ProjectDetailView
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
        isLiked={selectedProject ? likedProjects.includes(selectedProject.id) : false}
        isInList={selectedProject ? myList.includes(selectedProject.id) : false}
        onToggleLike={toggleLike}
        onToggleList={toggleMyList}
        onEdit={openEditModal}
        onSaveProject={handleQuickSaveProject}
        currentUser={currentUser}
      />

      <SettingsView
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentUser={currentUser!}
        allUsers={users}
        allProjects={projects}
        settings={appSettings}
        onUpdateSettings={setAppSettings}
        onUpdateUserRole={handleUpdateUserRole}
        onDeleteUser={handleDeleteUser}
        onDeleteProject={handleDeleteProject}
      />

    </div>
  );
};

export default App;
