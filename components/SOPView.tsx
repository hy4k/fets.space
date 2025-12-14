
import React from 'react';
import { ArrowLeft, BookOpen, Shield, Users, Activity, CheckCircle, AlertTriangle } from 'lucide-react';
import { SOP_DATA } from '../sopData';

interface SOPViewProps {
  sopId: string;
  onBack?: () => void;
}

export const SOPView: React.FC<SOPViewProps> = ({ sopId, onBack }) => {
  const data = SOP_DATA[sopId];

  if (!data) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center pt-32">
        <div className="text-center">
          <AlertTriangle size={48} className="mx-auto text-yellow-500 mb-4" />
          <h2 className="text-2xl font-bold">SOP Section Not Found</h2>
          <p className="text-gray-400 mt-2">The requested procedure "{sopId}" does not exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-gray-200 pt-32 pb-20 px-4 md:px-12 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-10">
        {onBack && (
           <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-white mb-6 transition-colors uppercase tracking-widest text-xs font-bold">
             <ArrowLeft size={14} /> Back to Dashboard
           </button>
         )}
        <div className="flex items-center gap-4 mb-4">
            <div className="bg-blue-900/20 p-3 rounded border border-blue-900/50 text-blue-400">
                <BookOpen size={32} />
            </div>
            <div>
                <p className="text-xs text-blue-500 font-bold uppercase tracking-[0.2em] mb-1">Standard Operating Procedure</p>
                <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight uppercase">{data.title}</h1>
            </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Meta Info */}
        <div className="space-y-6">
            {/* Purpose Card */}
            <div className="bg-[#121212] border border-[#333] p-6 rounded-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><Activity size={100} /></div>
                <h3 className="text-white font-bold uppercase tracking-wider text-sm mb-3 flex items-center gap-2">
                    <CheckCircle size={16} className="text-[var(--primary-color)]" /> Purpose
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">{data.purpose}</p>
            </div>

            {/* Scope Card */}
            <div className="bg-[#121212] border border-[#333] p-6 rounded-lg">
                <h3 className="text-white font-bold uppercase tracking-wider text-sm mb-3 flex items-center gap-2">
                    <Shield size={16} className="text-gray-400" /> Scope
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">{data.scope}</p>
            </div>

            {/* Responsibilities */}
            <div className="bg-[#121212] border border-[#333] p-6 rounded-lg">
                <h3 className="text-white font-bold uppercase tracking-wider text-sm mb-3 flex items-center gap-2">
                    <Users size={16} className="text-gray-400" /> Responsibilities
                </h3>
                <ul className="space-y-3">
                    {data.responsibilities.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-sm text-gray-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-600 mt-1.5 shrink-0"></span>
                            {item}
                        </li>
                    ))}
                </ul>
            </div>
        </div>

        {/* Center/Right Col: Procedure & Diagram */}
        <div className="lg:col-span-2 space-y-8">
            
            {/* Detailed Steps */}
            <div className="space-y-6">
                {data.steps.map((step, idx) => (
                    <div key={idx} className="bg-[#121212] border border-[#333] p-8 rounded-lg">
                        <h2 className="text-xl font-bold text-white mb-6 border-b border-[#333] pb-4 uppercase tracking-wide">
                            {idx + 1}. {step.heading}
                        </h2>
                        <ul className="space-y-4">
                             {step.content.map((point, pIdx) => (
                                <li key={pIdx} className="flex items-start gap-4 group">
                                    <div className="w-6 h-6 rounded bg-[#222] border border-[#333] flex items-center justify-center text-xs font-mono text-gray-500 group-hover:text-white group-hover:border-gray-500 transition-colors shrink-0">
                                        {pIdx + 1}
                                    </div>
                                    <p className="text-gray-300 text-base leading-relaxed">{point}</p>
                                </li>
                             ))}
                        </ul>
                    </div>
                ))}
            </div>

            {/* Visual Flowchart */}
            <div className="bg-[#121212] border border-[#333] p-8 rounded-lg">
                <h2 className="text-xl font-bold text-white mb-8 border-b border-[#333] pb-4 uppercase tracking-wide flex items-center gap-2">
                    <Activity size={20} className="text-blue-500" /> Process Flow
                </h2>
                <div className="bg-black/50 p-6 rounded border border-[#222]">
                    {data.diagram}
                </div>
            </div>

        </div>

      </div>
    </div>
  );
};
