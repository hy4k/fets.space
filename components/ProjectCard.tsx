
import React, { useState, useRef } from 'react';
import { Play, ChevronDown, ThumbsUp, Plus, Check } from 'lucide-react';
import { Project, User } from '../types';

interface ProjectCardProps {
  project: Project;
  onView: (project: Project) => void;
  isLiked: boolean;
  isInList: boolean;
  onToggleLike: (id: string) => void;
  onToggleList: (id: string) => void;
  currentUser: User;
  onDelete?: (id: string) => void;
  onEdit?: (project: Project) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onView,
  isLiked,
  isInList,
  onToggleLike,
  onToggleList,
  currentUser,
  onDelete,
  onEdit
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const imageSrc = project.imageUrl || `https://picsum.photos/seed/${project.id}/600/340`;

  // Hover Logic with Delay for "Cinematic" smoothness
  const handleMouseEnter = () => {
    timerRef.current = setTimeout(() => {
      setIsHovered(true);
    }, 600); // 600ms delay to prevent accidental triggers while scrolling
  };

  const handleMouseLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsHovered(false);
  };

  return (
    <div
      className="relative flex-shrink-0 w-[250px] md:w-[300px] aspect-video cursor-pointer group z-10"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => onView(project)}
      role="article"
      aria-label={`Project card for ${project.name}`}
    >
      {/* Base Image (Visible when not hovered or before delay) */}
      <img
        src={imageSrc}
        alt={`Cover for ${project.name}`}
        className={`w-full h-full object-cover rounded-md transition-all duration-500 ease-out ${isHovered ? 'opacity-0' : 'brightness-90 group-hover:brightness-110'}`}
      />

      {/* Hover Card (Pop-out effect) */}
      <div
        className={`
          absolute top-0 left-0 w-full bg-[#141414] rounded-md overflow-hidden transition-all duration-500 ease-out origin-center transform shadow-black/80 border border-transparent
          ${isHovered ? 'scale-105 -translate-y-2 opacity-100 z-50 shadow-2xl border-white/10' : 'opacity-0 pointer-events-none scale-100 z-10'}
        `}
        style={isHovered ? {
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9)',
        } : {}}
        role="dialog"
        aria-modal="false" // It's a popover, not a modal blocking interaction
        aria-label={`${project.name} details`}
      >
        {/* Image container in pop-out */}
        <div className="relative aspect-video w-full">
          <img
            src={imageSrc}
            alt=""
            className="w-full h-full object-cover"
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent" />

          {/* Progress / Status Line */}
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-800">
            <div
              className="h-full transition-all duration-1000"
              style={{
                width: project.status === 'Deployed' ? '100%' : '60%',
                backgroundColor: 'var(--primary-color)'
              }}
            />
          </div>
        </div>

        {/* Content in pop-out */}
        <div className="p-4 flex flex-col gap-3 bg-[#141414] relative">

          {/* Ambient Glow underlay */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none transition-opacity duration-700"
            style={{ background: 'radial-gradient(circle at top right, var(--primary-color), transparent 70%)' }}
          />

          {/* Action Buttons */}
          <div className="flex items-center justify-between mb-1 relative z-10 animate-in fade-in duration-300">
            <div className="flex items-center gap-2">
              <button
                className="w-8 h-8 rounded-full bg-white hover:bg-gray-200 flex items-center justify-center text-black transition-all hover:scale-105 shadow-lg focus:outline-none focus:ring-2 focus:ring-white"
                onClick={(e) => { e.stopPropagation(); if (project.websiteUrl) window.open(project.websiteUrl, '_blank'); else onView(project); }}
                title="Launch / View"
                aria-label="Launch or View Project"
              >
                <Play size={12} fill="currentColor" className="ml-0.5" />
              </button>

              <button
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white ${isInList ? 'border-gray-400 text-white bg-white/10' : 'border-gray-500 text-gray-400 hover:border-white hover:text-white bg-transparent'}`}
                onClick={(e) => { e.stopPropagation(); onToggleList(project.id); }}
                title={isInList ? "Remove from List" : "Add to My List"}
                aria-label={isInList ? "Remove from My List" : "Add to My List"}
              >
                {isInList ? <Check size={14} /> : <Plus size={14} />}
              </button>

              <button
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white ${isLiked ? 'border-[var(--primary-color)] text-[var(--primary-color)] bg-transparent' : 'border-gray-500 text-gray-400 hover:border-white hover:text-white bg-transparent'}`}
                onClick={(e) => { e.stopPropagation(); onToggleLike(project.id); }}
                title={isLiked ? "Unlike" : "Like"}
                aria-label={isLiked ? "Unlike project" : "Like project"}
              >
                <ThumbsUp size={14} fill={isLiked ? "currentColor" : "none"} />
              </button>
            </div>

            {/* Details Button */}
            <div className="flex items-center gap-2">
              <button
                className="w-8 h-8 rounded-full border border-gray-600 hover:border-white text-gray-400 hover:text-white flex items-center justify-center transition-colors bg-transparent focus:outline-none focus:ring-2 focus:ring-white"
                onClick={(e) => { e.stopPropagation(); onView(project); }}
                title="More Info"
                aria-label="More Information"
              >
                <ChevronDown size={16} />
              </button>
            </div>
          </div>

          {/* Metadata */}
          <div className="relative z-10 animate-in slide-in-from-bottom-2 duration-300 delay-75">
            <h3 className="text-white font-bold text-sm truncate tracking-wide drop-shadow-md mb-1.5">{project.name}</h3>

            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              <span className="text-gray-300">{new Date(project.createdAt).getFullYear()}</span>
              <span className="border border-gray-600 px-1 text-[9px] rounded text-gray-400 uppercase bg-[#222]">{project.itemType === 'app' ? 'HD' : 'DOC'}</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {project.techStack.slice(0, 3).map((tech, i) => (
                <span key={i} className="text-[10px] text-gray-300 flex items-center">
                  {i > 0 && <span className="text-gray-500 mr-1.5">•</span>}
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
