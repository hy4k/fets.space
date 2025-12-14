import React, { useState } from 'react';
import { X, User, Palette, Shield, HardDrive, Bell, Check, Trash2, Monitor, LayoutGrid, FileText } from 'lucide-react';
import { User as UserType, UserRole, AppSettings, Project } from '../types';

interface SettingsViewProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserType;
  allUsers: UserType[];
  allProjects: Project[];
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onUpdateUserRole: (userId: string, newRole: UserRole) => void;
  onDeleteUser: (userId: string) => void;
  onDeleteProject: (projectId: string) => void;
}

type SettingsTab = 'profile' | 'appearance' | 'users' | 'system' | 'apps';

const THEME_COLORS = [
  { name: 'Netflix Red', value: '#E50914' },
  { name: 'Ocean Blue', value: '#2563eb' },
  { name: 'Emerald Green', value: '#059669' },
  { name: 'Royal Gold', value: '#d97706' },
  { name: 'Amethyst', value: '#7c3aed' },
  { name: 'Steel Gray', value: '#4b5563' },
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  isOpen,
  onClose,
  currentUser,
  allUsers,
  allProjects,
  settings,
  onUpdateSettings,
  onUpdateUserRole,
  onDeleteUser,
  onDeleteProject
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  if (!isOpen) return null;

  const isAdmin = currentUser.role === UserRole.ADMIN;

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-sm bg-[#333] flex items-center justify-center overflow-hidden ring-2 ring-[var(--primary-color)]">
                 {currentUser.avatarUrl ? (
                   <img src={currentUser.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                 ) : (
                   <span className="text-4xl font-bold text-white">{currentUser.name.charAt(0)}</span>
                 )}
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">{currentUser.name}</h3>
                <p className="text-gray-400">{currentUser.email}</p>
                <span className="inline-block mt-2 px-2 py-0.5 rounded border border-gray-600 text-xs text-gray-300 uppercase tracking-wider">
                  {currentUser.role}
                </span>
              </div>
            </div>
            
            <div className="space-y-4 max-w-md">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Display Name</label>
                <input type="text" value={currentUser.name} disabled className="w-full bg-[#222] border border-[#333] rounded p-3 text-gray-400 cursor-not-allowed" aria-label="Display Name" />
                <p className="text-[10px] text-gray-600 mt-1">Managed by identity provider.</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email Address</label>
                <input type="email" value={currentUser.email} disabled className="w-full bg-[#222] border border-[#333] rounded p-3 text-gray-400 cursor-not-allowed" aria-label="Email Address" />
              </div>
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Palette size={18} aria-hidden="true" /> Accent Color
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4" role="radiogroup" aria-label="Theme Color Selection">
                {THEME_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => onUpdateSettings({ ...settings, accentColor: color.value })}
                    className={`flex items-center gap-3 p-3 rounded-md border transition-all focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] ${settings.accentColor === color.value ? 'bg-[#222] border-white' : 'bg-transparent border-[#333] hover:border-gray-500'}`}
                    role="radio"
                    aria-checked={settings.accentColor === color.value}
                    aria-label={`Select ${color.name}`}
                  >
                    <div 
                      className="w-8 h-8 rounded-full shadow-inner" 
                      style={{ backgroundColor: color.value }} 
                    />
                    <span className="text-sm font-medium text-gray-200">{color.name}</span>
                    {settings.accentColor === color.value && <Check size={16} className="ml-auto text-white" aria-hidden="true" />}
                  </button>
                ))}
              </div>

              {/* Divider */}
              <div className="h-px bg-[#333] my-6"></div>

              {/* Custom Color */}
              <div>
                 <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Custom Theme</h4>
                 <label className="flex items-center gap-4 cursor-pointer group hover:bg-[#222] p-2 rounded transition-colors border border-transparent hover:border-[#333] w-fit">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-[#333] group-hover:border-white transition-colors shadow-lg">
                       <input 
                          type="color" 
                          value={settings.accentColor}
                          onChange={(e) => onUpdateSettings({ ...settings, accentColor: e.target.value })}
                          className="absolute inset-[-50%] w-[200%] h-[200%] p-0 border-0 cursor-pointer"
                       />
                    </div>
                    <div className="flex flex-col">
                       <span className="text-white font-medium">Pick a custom color</span>
                       <span className="text-xs text-gray-500 font-mono uppercase">{settings.accentColor}</span>
                    </div>
                 </label>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Monitor size={18} aria-hidden="true" /> Interface
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-[#222] rounded-md border border-[#333]">
                  <div>
                    <p className="text-white font-medium" id="reduce-motion-label">Reduce Motion</p>
                    <p className="text-xs text-gray-500">Minimize animations for a simpler experience.</p>
                  </div>
                  <button 
                    onClick={() => onUpdateSettings({ ...settings, reduceMotion: !settings.reduceMotion })}
                    className={`w-12 h-6 rounded-full relative transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] ${settings.reduceMotion ? 'bg-[var(--primary-color)]' : 'bg-gray-600'}`}
                    aria-labelledby="reduce-motion-label"
                    aria-pressed={settings.reduceMotion}
                  >
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.reduceMotion ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'users':
        if (!isAdmin) return <div className="text-red-500">Access Denied</div>;
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Shield size={18} aria-hidden="true" /> User Management
              </h3>
              <span className="text-xs text-gray-500 uppercase tracking-wider">{allUsers.length} Active Users</span>
            </div>

            <div className="overflow-hidden rounded-md border border-[#333]">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#222]">
                  <tr>
                    <th className="p-3 text-xs font-bold text-gray-400 uppercase tracking-wider" scope="col">User</th>
                    <th className="p-3 text-xs font-bold text-gray-400 uppercase tracking-wider" scope="col">Role</th>
                    <th className="p-3 text-xs font-bold text-gray-400 uppercase tracking-wider text-right" scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#333] bg-[#181818]">
                  {allUsers.map(user => (
                    <tr key={user.id} className="hover:bg-[#1f1f1f] transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded bg-[#333] flex items-center justify-center text-xs overflow-hidden">
                              {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="w-full h-full" /> : user.name[0]}
                           </div>
                           <div>
                             <p className="text-sm font-bold text-gray-200">{user.name}</p>
                             <p className="text-xs text-gray-500">{user.email}</p>
                           </div>
                        </div>
                      </td>
                      <td className="p-3">
                        {user.id === currentUser.id ? (
                          <span className="text-xs font-mono text-[var(--primary-color)] border border-[var(--primary-color)] px-2 py-0.5 rounded">{user.role}</span>
                        ) : (
                          <select 
                            value={user.role}
                            onChange={(e) => onUpdateUserRole(user.id, e.target.value as UserRole)}
                            className="bg-[#111] border border-[#444] text-gray-300 text-xs rounded px-2 py-1 focus:outline-none focus:border-[var(--primary-color)]"
                            aria-label={`Change role for ${user.name}`}
                          >
                            {Object.values(UserRole).map(role => (
                              <option key={role} value={role}>{role}</option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        {user.id !== currentUser.id && (
                          <button 
                            onClick={() => onDeleteUser(user.id)}
                            className="text-gray-500 hover:text-red-500 transition-colors p-1 focus:outline-none focus:ring-1 focus:ring-red-500 rounded"
                            title="Delete User"
                            aria-label={`Delete user ${user.name}`}
                          >
                            <Trash2 size={16} aria-hidden="true" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Monitor size={12} aria-hidden="true" /> Admin Note: Changing roles affects access immediately.
            </p>
          </div>
        );

      case 'apps':
        if (!isAdmin) return <div className="text-red-500">Access Denied</div>;
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <LayoutGrid size={18} aria-hidden="true" /> App Management
              </h3>
              <span className="text-xs text-gray-500 uppercase tracking-wider">{allProjects.length} Items</span>
            </div>

            <p className="text-sm text-gray-400 bg-[#222] p-3 rounded border border-l-4 border-[#333] border-l-[var(--primary-color)]">
              Manage all deployed applications and files. Deleting items here is permanent and cannot be undone.
            </p>

            <div className="overflow-hidden rounded-md border border-[#333]">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#222]">
                  <tr>
                    <th className="p-3 text-xs font-bold text-gray-400 uppercase tracking-wider" scope="col">Name</th>
                    <th className="p-3 text-xs font-bold text-gray-400 uppercase tracking-wider" scope="col">Type</th>
                    <th className="p-3 text-xs font-bold text-gray-400 uppercase tracking-wider" scope="col">Created</th>
                    <th className="p-3 text-xs font-bold text-gray-400 uppercase tracking-wider text-right" scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#333] bg-[#181818]">
                  {allProjects.map(project => (
                    <tr key={project.id} className="hover:bg-[#1f1f1f] transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-6 bg-[#333] rounded overflow-hidden">
                              {project.imageUrl ? (
                                <img src={project.imageUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-500">IMG</div>
                              )}
                           </div>
                           <div>
                             <p className="text-sm font-bold text-gray-200">{project.name}</p>
                             <p className="text-[10px] text-gray-500 truncate max-w-[150px]">{project.websiteUrl || 'No URL'}</p>
                           </div>
                        </div>
                      </td>
                      <td className="p-3">
                         <span className={`text-[10px] uppercase px-2 py-0.5 rounded border ${project.itemType === 'app' ? 'border-blue-900 text-blue-400 bg-blue-900/10' : 'border-orange-900 text-orange-400 bg-orange-900/10'}`}>
                           {project.itemType}
                         </span>
                      </td>
                      <td className="p-3 text-xs text-gray-400">
                        {new Date(project.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-3 text-right">
                        <button 
                          onClick={() => onDeleteProject(project.id)}
                          className="text-gray-500 hover:text-red-500 transition-colors p-2 border border-transparent hover:border-red-900 rounded focus:outline-none focus:ring-1 focus:ring-red-500"
                          title="Delete Permanently"
                          aria-label={`Delete project ${project.name}`}
                        >
                          <Trash2 size={16} aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'system':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
             <div>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Bell size={18} aria-hidden="true" /> Notifications
                </h3>
                <div className="flex items-center justify-between p-4 bg-[#222] rounded-md border border-[#333]">
                  <div>
                    <p className="text-white font-medium" id="notifications-label">Enable Push Notifications</p>
                    <p className="text-xs text-gray-500">Receive updates about builds and deployments.</p>
                  </div>
                  <button 
                    onClick={() => onUpdateSettings({ ...settings, enableNotifications: !settings.enableNotifications })}
                    className={`w-12 h-6 rounded-full relative transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] ${settings.enableNotifications ? 'bg-[var(--primary-color)]' : 'bg-gray-600'}`}
                    aria-labelledby="notifications-label"
                    aria-pressed={settings.enableNotifications}
                  >
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.enableNotifications ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
             </div>

             <div className="pt-8 border-t border-[#333]">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <HardDrive size={18} aria-hidden="true" /> Data Management
                </h3>
                <div className="flex items-center justify-between p-4 bg-red-900/10 rounded-md border border-red-900/30">
                  <div>
                    <p className="text-red-400 font-medium">Clear Local Cache</p>
                    <p className="text-xs text-red-500/70">This will reset your local preferences but keep data.</p>
                  </div>
                  <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded uppercase tracking-wider transition-colors focus:outline-none focus:ring-2 focus:ring-red-500">
                    Clear Cache
                  </button>
                </div>
             </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[80] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Settings"
    >
      <div className="bg-[#121212] w-full max-w-5xl h-[80vh] rounded-lg shadow-2xl border border-[#333] flex overflow-hidden relative">
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-gray-400 hover:text-white p-2 bg-[#121212] rounded-full border border-[#333] focus:outline-none focus:ring-2 focus:ring-white"
          aria-label="Close Settings"
        >
          <X size={20} aria-hidden="true" />
        </button>

        {/* Sidebar */}
        <div className="w-64 bg-[#0a0a0a] border-r border-[#333] flex flex-col">
          <div className="p-6 border-b border-[#333]">
            <h2 className="text-xl font-black text-white tracking-tight">SETTINGS</h2>
          </div>
          <nav className="flex-1 p-4 space-y-1" aria-label="Settings Navigation">
            <button 
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-white ${activeTab === 'profile' ? 'bg-[var(--primary-color)] text-white' : 'text-gray-400 hover:text-white hover:bg-[#222]'}`}
              aria-current={activeTab === 'profile' ? 'page' : undefined}
            >
              <User size={18} aria-hidden="true" /> Profile
            </button>
            <button 
              onClick={() => setActiveTab('appearance')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-white ${activeTab === 'appearance' ? 'bg-[var(--primary-color)] text-white' : 'text-gray-400 hover:text-white hover:bg-[#222]'}`}
              aria-current={activeTab === 'appearance' ? 'page' : undefined}
            >
              <Palette size={18} aria-hidden="true" /> Appearance
            </button>
            {isAdmin && (
              <>
                <button 
                  onClick={() => setActiveTab('apps')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-white ${activeTab === 'apps' ? 'bg-[var(--primary-color)] text-white' : 'text-gray-400 hover:text-white hover:bg-[#222]'}`}
                  aria-current={activeTab === 'apps' ? 'page' : undefined}
                >
                  <LayoutGrid size={18} aria-hidden="true" /> App Management
                </button>
                <button 
                  onClick={() => setActiveTab('users')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-white ${activeTab === 'users' ? 'bg-[var(--primary-color)] text-white' : 'text-gray-400 hover:text-white hover:bg-[#222]'}`}
                  aria-current={activeTab === 'users' ? 'page' : undefined}
                >
                  <Shield size={18} aria-hidden="true" /> Users & Roles
                </button>
              </>
            )}
            <button 
              onClick={() => setActiveTab('system')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-white ${activeTab === 'system' ? 'bg-[var(--primary-color)] text-white' : 'text-gray-400 hover:text-white hover:bg-[#222]'}`}
              aria-current={activeTab === 'system' ? 'page' : undefined}
            >
              <HardDrive size={18} aria-hidden="true" /> System
            </button>
          </nav>
          <div className="p-4 text-[10px] text-gray-600 border-t border-[#333]">
            FETS SPACE v2.5.0
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-[#121212] p-8 md:p-12 overflow-y-auto">
           <div className="max-w-3xl mx-auto">
              {renderContent()}
           </div>
        </div>
      </div>
    </div>
  );
};