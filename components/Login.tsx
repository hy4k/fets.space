import React, { useState, useMemo } from 'react';
import { User, UserRole } from '../types';
import { MOCK_USERS, INITIAL_PROJECTS } from '../constants';
import { Lock, UserCircle, Cpu, Mail, ArrowRight, Check } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
  onCreateUser: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin, onCreateUser }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: UserRole.VIEWER
  });

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSignUp) {
      // Create new user simulation
      const newUser: User = {
        id: `user-${Date.now()}`,
        name: formData.name,
        email: formData.email,
        role: formData.role,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.name}`
      };
      onCreateUser(newUser);
    } else {
      // Simulate basic login for non-mock users
      // In a real app, this would validate against a backend
      const existingMock = MOCK_USERS.find(u => u.email === formData.email);
      if (existingMock) {
        onLogin(existingMock);
      } else {
        // Allow login if they just typed something valid-ish for demo purposes
        const demoUser: User = {
          id: 'demo-user',
          name: 'Demo User',
          email: formData.email,
          role: UserRole.VIEWER,
        };
        onLogin(demoUser);
      }
    }
  };

  // Generate a grid of repeated images for background
  // Memoize to prevent flickering during input updates
  const bgImages = useMemo(() => {
    // Create enough items to fill a large screen (48 items)
    return [...INITIAL_PROJECTS, ...INITIAL_PROJECTS, ...INITIAL_PROJECTS, ...INITIAL_PROJECTS, ...INITIAL_PROJECTS, ...INITIAL_PROJECTS].slice(0, 48);
  }, []);

  return (
    <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center">
      
      {/* Dynamic Background Collage */}
      <div className="absolute inset-0 grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-0.5 opacity-30 grayscale pointer-events-none select-none">
        {bgImages.map((project, idx) => (
          <div key={idx} className="relative w-full aspect-video overflow-hidden bg-[#0a0a0a]">
             <img 
               src={project.imageUrl} 
               alt="" 
               className="w-full h-full object-cover opacity-60 transition-transform duration-1000 ease-in-out hover:scale-110" 
               loading="lazy"
             />
             <div className="absolute inset-0 bg-black/20"></div>
          </div>
        ))}
      </div>
      
      {/* Heavy overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/85 to-black/95 z-0"></div>

      <div className="z-10 w-full max-w-md p-8 relative animate-in fade-in zoom-in-95 duration-500">
        
        <div className="text-center mb-8 flex flex-col items-center">
          {/* Logo / Branding */}
          <h1 className="font-['Orbitron'] text-5xl font-black tracking-tighter text-[var(--primary-color)] mb-2 drop-shadow-2xl">
            FETS SPACE
          </h1>
          <p className="text-gray-400 text-sm tracking-widest uppercase">Enterprise Project Management</p>
        </div>

        <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-lg p-8 shadow-2xl">
          
          <h2 className="text-2xl font-bold text-white mb-6">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </h2>

          <form onSubmit={handleAuth} className="space-y-4">
            {isSignUp && (
               <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                 <div className="relative group">
                   <input 
                     type="text" 
                     required
                     className="w-full bg-[#333] text-white px-4 py-3 rounded focus:outline-none focus:bg-[#444] focus:ring-2 focus:ring-[var(--primary-color)] transition-all peer"
                     placeholder=" "
                     value={formData.name}
                     onChange={e => setFormData({...formData, name: e.target.value})}
                   />
                   <label className="absolute left-4 top-3 text-gray-400 text-sm transition-all peer-focus:-top-2 peer-focus:text-xs peer-focus:text-white peer-[&:not(:placeholder-shown)]:-top-2 peer-[&:not(:placeholder-shown)]:text-xs peer-[&:not(:placeholder-shown)]:text-white pointer-events-none">
                      Full Name
                   </label>
                 </div>

                 <div className="relative">
                   <select
                      value={formData.role}
                      onChange={e => setFormData({...formData, role: e.target.value as UserRole})}
                      className="w-full bg-[#333] text-white px-4 py-3 rounded focus:outline-none focus:bg-[#444] appearance-none"
                   >
                      <option value={UserRole.VIEWER}>Viewer (Read Only)</option>
                      <option value={UserRole.DEVELOPER}>Developer (Edit/Create)</option>
                      <option value={UserRole.ADMIN}>Administrator (Full Access)</option>
                   </select>
                   <div className="absolute right-4 top-3.5 pointer-events-none">
                      <ArrowRight size={16} className="rotate-90 text-gray-400" />
                   </div>
                 </div>
               </div>
            )}

            <div className="relative group">
               <input 
                 type="email" 
                 required
                 className="w-full bg-[#333] text-white px-4 py-3 rounded focus:outline-none focus:bg-[#444] focus:ring-2 focus:ring-[var(--primary-color)] transition-all peer"
                 placeholder=" "
                 value={formData.email}
                 onChange={e => setFormData({...formData, email: e.target.value})}
               />
               <label className="absolute left-4 top-3 text-gray-400 text-sm transition-all peer-focus:-top-2 peer-focus:text-xs peer-focus:text-white peer-[&:not(:placeholder-shown)]:-top-2 peer-[&:not(:placeholder-shown)]:text-xs peer-[&:not(:placeholder-shown)]:text-white pointer-events-none">
                  Email Address
               </label>
            </div>

            <div className="relative group">
               <input 
                 type="password" 
                 required
                 className="w-full bg-[#333] text-white px-4 py-3 rounded focus:outline-none focus:bg-[#444] focus:ring-2 focus:ring-[var(--primary-color)] transition-all peer"
                 placeholder=" "
                 value={formData.password}
                 onChange={e => setFormData({...formData, password: e.target.value})}
               />
               <label className="absolute left-4 top-3 text-gray-400 text-sm transition-all peer-focus:-top-2 peer-focus:text-xs peer-focus:text-white peer-[&:not(:placeholder-shown)]:-top-2 peer-[&:not(:placeholder-shown)]:text-xs peer-[&:not(:placeholder-shown)]:text-white pointer-events-none">
                  Password
               </label>
            </div>

            <button 
              type="submit" 
              className="w-full bg-[var(--primary-color)] hover:bg-red-700 text-white font-bold py-3 rounded transition-all mt-6 flex items-center justify-center gap-2 shadow-lg hover:shadow-red-900/20"
            >
              {isSignUp ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-1">
               <input type="checkbox" id="remember" className="accent-[var(--primary-color)] rounded" />
               <label htmlFor="remember">Remember me</label>
            </div>
            <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="text-white hover:underline">
               {isSignUp ? 'Already a member? Sign in.' : 'New to FETS SPACE? Sign up now.'}
            </button>
          </div>

        </div>

        {/* Quick Demo Access */}
        {!isSignUp && (
           <div className="mt-8">
             <p className="text-gray-500 text-center text-xs uppercase tracking-widest mb-4 font-bold">Quick Demo Access</p>
             <div className="flex justify-center gap-4">
                {MOCK_USERS.map((user) => (
                  <button 
                    key={user.id}
                    onClick={() => onLogin(user)}
                    className="group relative flex flex-col items-center"
                    title={`${user.name} (${user.role})`}
                  >
                     <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-transparent group-hover:border-white transition-all transform group-hover:scale-110">
                        <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                     </div>
                     <div className="absolute -bottom-8 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] bg-white text-black px-2 py-1 rounded whitespace-nowrap font-bold">
                        {user.role}
                     </div>
                  </button>
                ))}
             </div>
           </div>
        )}

      </div>
    </div>
  );
};