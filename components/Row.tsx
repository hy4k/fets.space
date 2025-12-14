
import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Project, User } from '../types';
import { ProjectCard } from './ProjectCard';

interface RowProps {
  title: string;
  projects: Project[];
  onView: (project: Project) => void;
  myList: string[];
  likedProjects: string[];
  onToggleLike: (id: string) => void;
  onToggleList: (id: string) => void;
  currentUser: User;
  onDelete: (id: string) => void;
  onEdit: (project: Project) => void;
}

export const Row: React.FC<RowProps> = ({ 
  title, 
  projects, 
  onView,
  myList,
  likedProjects,
  onToggleLike,
  onToggleList,
  currentUser,
  onDelete,
  onEdit
}) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const [isMoved, setIsMoved] = useState(false);

  const handleClick = (direction: 'left' | 'right') => {
    setIsMoved(true);
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollTo = direction === 'left' 
        ? scrollLeft - clientWidth 
        : scrollLeft + clientWidth;

      rowRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
      
      if (direction === 'left' && scrollTo <= 0) {
        setIsMoved(false);
      }
    }
  };

  if (projects.length === 0) return null;

  return (
    <div className="space-y-2 md:space-y-4 mb-4" role="region" aria-label={title}>
      <h2 className="w-56 cursor-pointer text-sm font-bold text-[#e5e5e5] transition duration-200 hover:text-white md:text-xl px-4 md:px-12 tracking-wide uppercase drop-shadow-md font-mono">
        {title}
      </h2>
      
      <div className="group relative">
        <button
          className={`absolute top-0 bottom-0 left-0 z-40 m-auto h-full w-12 cursor-pointer opacity-0 transition hover:scale-125 group-hover:opacity-100 bg-gradient-to-r from-black/80 to-transparent flex items-center justify-center border-none focus:outline-none focus:opacity-100 ${!isMoved && 'hidden'}`}
          onClick={() => handleClick('left')}
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-10 w-10 text-white drop-shadow-lg" aria-hidden="true" />
        </button>

        {/* Increased padding to py-10 to allow pop-out without clipping */}
        <div 
          ref={rowRef}
          className="flex items-center gap-4 overflow-x-scroll scrollbar-hide px-4 md:px-12 py-10 scroll-smooth"
        >
          {projects.map((project) => (
            <ProjectCard 
              key={project.id} 
              project={project} 
              onView={onView} 
              isLiked={likedProjects.includes(project.id)}
              isInList={myList.includes(project.id)}
              onToggleLike={onToggleLike}
              onToggleList={onToggleList}
              currentUser={currentUser}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          ))}
        </div>

        <button
          className={`absolute top-0 bottom-0 right-0 z-40 m-auto h-full w-12 cursor-pointer opacity-0 transition hover:scale-125 group-hover:opacity-100 bg-gradient-to-l from-black/80 to-transparent flex items-center justify-center border-none focus:outline-none focus:opacity-100 ${projects.length < 4 && 'hidden'}`}
          onClick={() => handleClick('right')}
          aria-label="Scroll right"
        >
          <ChevronRight className="h-10 w-10 text-white drop-shadow-lg" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};
