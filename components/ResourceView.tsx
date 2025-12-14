
import React, { useState, useEffect } from 'react';
import { Phone, Mail, Globe, Calendar, FileText, AlertCircle, ArrowLeft, ShieldCheck, Clock, Newspaper, Loader2, ExternalLink } from 'lucide-react';
import { fetchResourceUpdates, SearchResult } from '../services/geminiService';

export interface ResourceData {
  id: string;
  name: string;
  description: string;
  rules: string[];
  support: {
    phone: string;
    email: string;
    url: string;
  };
  exams: {
    name: string;
    window: string;
    guidelines: string;
  }[];
  logoUrl?: string; // Added for brand logos
}

const RESOURCES: Record<string, ResourceData> = {
  'Prometric': {
    id: 'prometric',
    name: 'Prometric',
    description: 'Leading global provider of comprehensive testing and assessment services. Delivers the CMA USA and other high-stakes professional certifications.',
    rules: [
      'Two forms of valid government-issued ID required (Primary & Secondary).',
      'Full body scan via metal detector wand upon entry.',
      'No personal items in testing room; lockers provided.',
      'Arrive 30 minutes prior to appointment time.'
    ],
    support: {
      phone: '1-800-853-6769',
      email: 'candidate.care@prometric.com',
      url: 'https://www.prometric.com'
    },
    exams: [
      { name: 'CMA USA (Certified Management Accountant)', window: 'Jan/Feb, May/Jun, Sep/Oct', guidelines: 'Financial planning, performance, and analytics.' },
      { name: 'USMLE Step 1 & 2', window: 'Year-round', guidelines: 'Biometric check-in mandatory.' },
      { name: 'TOEFL iBT', window: 'Continuous', guidelines: 'Headset check required during tutorial.' }
    ],
    logoUrl: 'https://logo.clearbit.com/prometric.com'
  },
  'Pearson VUE': {
    id: 'pearson',
    name: 'Pearson VUE',
    description: 'The global leader in computer-based testing, delivering exams for Microsoft, RCS England, and AWS.',
    rules: [
      'Palm vein authentication strictly enforced.',
      'Digital signature and photograph required.',
      'Erasable whiteboard provided; no paper allowed.',
      'Glasses inspection required at check-in.'
    ],
    support: {
      phone: '1-877-392-6433',
      email: 'support@pearsonvue.com',
      url: 'https://home.pearsonvue.com'
    },
    exams: [
      { name: 'Microsoft Certified: Azure Solutions Architect', window: 'On-demand', guidelines: 'Case studies included. Labs may be presented.' },
      { name: 'RCS (Royal College of Surgeons)', window: 'Specific Dates', guidelines: 'High-security protocols. ID must match registration exactly.' },
      { name: 'PTE Academic', window: 'Daily', guidelines: 'AI-scored English language test.' }
    ],
    logoUrl: 'https://logo.clearbit.com/pearsonvue.com'
  },
  'PSI': {
    id: 'psi',
    name: 'PSI Services',
    description: 'Trusted provider of licensure and certification exams for insurance, real estate, and government agencies.',
    rules: [
      'Government ID must contain signature.',
      'Remote proctoring: 360-degree room scan required.',
      'No talking or mouthing words during exam.',
      'Calculators permitted only for specific exams.'
    ],
    support: {
      phone: '1-800-733-9267',
      email: 'examschedule@psionline.com',
      url: 'https://www.psiexams.com'
    },
    exams: [
      { name: 'Real Estate Salesperson & Broker', window: 'State dependent', guidelines: 'State-specific law components included.' },
      { name: 'Insurance Producer (Life/Health)', window: 'Daily', guidelines: 'Instant pass/fail results provided.' },
      { name: 'AWS Cloud Practitioner (PSI Option)', window: 'On-demand', guidelines: 'Foundational cloud concepts.' }
    ],
    logoUrl: 'https://logo.clearbit.com/psiexams.com'
  },
  'FETS': {
    id: 'fets',
    name: 'Forun Educational & Testing Services',
    description: 'Internal testing operations, staff training, and compliance hub for Forun centers.',
    rules: [
      'Employee ID badge must be worn visible.',
      'Yellow lockers designated for staff personal items.',
      'Clean desk policy in reception and proctor stations.',
      'Annual NDA and security training renewal.'
    ],
    support: {
      phone: '+1 (555) 012-3456',
      email: 'ops@forun.edu',
      url: 'https://fets.hub'
    },
    exams: [
      { name: 'TCA (Test Center Administrator) Cert', window: 'Monthly', guidelines: 'Policy mastery and incident reporting.' },
      { name: 'Proctor L2 Authorization', window: 'Quarterly', guidelines: 'Advanced monitoring and intervention techniques.' },
      { name: 'IT Infrastructure Safety', window: 'Annual', guidelines: 'Server room protocols and network security.' }
    ],
    // No external logo URL, utilizing the name/description prominently
  }
};

interface ResourceViewProps {
  resourceId: string;
  onBack?: () => void;
}

export const ResourceView: React.FC<ResourceViewProps> = ({ resourceId, onBack }) => {
  const data = RESOURCES[resourceId];
  const [updates, setUpdates] = useState<SearchResult | null>(null);
  const [loadingUpdates, setLoadingUpdates] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (data && data.id !== 'fets') { // Skip internal
      setLoadingUpdates(true);
      fetchResourceUpdates(data.name).then(result => {
        if (mounted) {
           setUpdates(result);
           setLoadingUpdates(false);
        }
      });
    }
    return () => { mounted = false; };
  }, [data?.name, data?.id]);

  if (!data) return <div className="p-8 text-white pt-32">Resource not found.</div>;

  return (
    <div className="min-h-screen bg-[#050505] text-gray-100 p-6 md:p-12 animate-in fade-in duration-500 pt-32">
       {/* Header */}
       <div className="max-w-7xl mx-auto mb-12">
         {onBack && (
           <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
             <ArrowLeft size={16} /> Back to Resources
           </button>
         )}
         <div className="flex items-center gap-6 mb-4">
            {data.logoUrl && (
              <div className="w-20 h-20 bg-white rounded-lg p-2 flex items-center justify-center shrink-0">
                <img src={data.logoUrl} alt={`${data.name} Logo`} className="max-w-full max-h-full object-contain" />
              </div>
            )}
            <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter text-white bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
              {data.name}
            </h1>
         </div>
         <p className="text-xl text-gray-400 max-w-2xl font-light leading-relaxed">{data.description}</p>
       </div>

       <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Client Info */}
          <div className="lg:col-span-1 space-y-6">
             <div className="bg-[#121212] border border-[#333] rounded-lg p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                   <ShieldCheck size={120} />
                </div>
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2 uppercase tracking-wide relative z-10">
                  <AlertCircle size={20} className="text-[var(--primary-color)]" /> Client Protocols
                </h2>
                
                <div className="space-y-6 relative z-10">
                   <div>
                      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Center Rules</h3>
                      <div className="space-y-3">
                        {data.rules.map((rule, idx) => (
                          <div key={idx} className="flex items-start gap-3 p-3 rounded-md bg-[#1a1a1a] border border-[#2a2a2a] hover:bg-[#222] transition-colors group">
                             <ShieldCheck size={16} className="text-gray-400 group-hover:text-[var(--primary-color)] mt-0.5 shrink-0 transition-colors" />
                             <span className="text-sm text-gray-300 leading-snug">{rule}</span>
                          </div>
                        ))}
                      </div>
                   </div>

                   <div className="border-t border-[#333] pt-6">
                      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Support Contacts</h3>
                      <div className="space-y-3">
                         <div className="flex items-center gap-3 text-sm text-gray-300">
                            <Phone size={14} className="text-gray-500" />
                            <span>{data.support.phone}</span>
                         </div>
                         <div className="flex items-center gap-3 text-sm text-gray-300">
                            <Mail size={14} className="text-gray-500" />
                            <a href={`mailto:${data.support.email}`} className="hover:text-white transition-colors">{data.support.email}</a>
                         </div>
                         <div className="flex items-center gap-3 text-sm text-gray-300">
                            <Globe size={14} className="text-gray-500" />
                            <a href={data.support.url} target="_blank" rel="noreferrer" className="hover:text-white transition-colors truncate">{data.support.url}</a>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
             
             {/* Live Intelligence Card (Gemini Search Grounding) */}
             {data.id !== 'fets' && (
                <div className="bg-[#121212] border border-[#333] rounded-lg p-6 shadow-xl relative">
                  <div className="flex items-center justify-between mb-4">
                     <h2 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wide">
                        <Newspaper size={16} className="text-yellow-500" /> Live Intelligence
                     </h2>
                     <span className="text-[10px] bg-[#222] text-gray-400 px-2 py-1 rounded flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                        GOOGLE SEARCH
                     </span>
                  </div>
                  
                  {loadingUpdates ? (
                     <div className="flex flex-col items-center justify-center py-6 text-gray-500 gap-2">
                        <Loader2 className="animate-spin" size={20} />
                        <span className="text-xs">Fetching latest updates...</span>
                     </div>
                  ) : updates ? (
                     <div className="space-y-4">
                        <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">{updates.text}</p>
                        {updates.sources.length > 0 && (
                           <div className="border-t border-[#333] pt-3 mt-2">
                              <p className="text-[10px] text-gray-500 uppercase mb-2">Sources:</p>
                              <ul className="space-y-1">
                                 {updates.sources.slice(0, 3).map((source, idx) => (
                                    <li key={idx}>
                                       <a 
                                          href={source.uri} 
                                          target="_blank" 
                                          rel="noreferrer" 
                                          className="text-[10px] text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 truncate"
                                       >
                                          <ExternalLink size={8} /> {source.title}
                                       </a>
                                    </li>
                                 ))}
                              </ul>
                           </div>
                        )}
                     </div>
                  ) : (
                     <p className="text-xs text-gray-500 italic">No updates available at this time.</p>
                  )}
                </div>
             )}
          </div>

          {/* Right Column: Exam Details */}
          <div className="lg:col-span-2 space-y-6">
             {/* Section 1: Active Programs */}
             <div className="bg-[#121212] border border-[#333] rounded-lg p-6 shadow-xl h-fit">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2 uppercase tracking-wide">
                  <FileText size={20} className="text-blue-500" /> Active Exam Programs
                </h2>

                <div className="grid gap-4">
                   {data.exams.map((exam, idx) => (
                      <div key={idx} className="bg-[#181818] border border-[#2a2a2a] p-5 rounded hover:border-gray-600 transition-colors group">
                         <div className="flex justify-between items-start mb-2">
                            <h3 className="text-lg font-bold text-gray-200 group-hover:text-white transition-colors">{exam.name}</h3>
                         </div>
                         <p className="text-sm text-gray-500 group-hover:text-gray-400 transition-colors">{exam.guidelines.split('.')[0] + '.'} <span className="text-gray-600 text-xs italic ml-1">See below for schedule.</span></p>
                      </div>
                   ))}
                </div>
             </div>

             {/* Section 2: Testing Windows (Requested Feature) */}
             <div className="bg-[#121212] border border-[#333] rounded-lg p-6 shadow-xl">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2 uppercase tracking-wide">
                  <Clock size={20} className="text-[var(--primary-color)]" /> Testing Windows
                </h2>

                <div className="overflow-hidden rounded border border-[#2a2a2a]">
                   <table className="w-full text-left text-sm">
                      <thead className="bg-[#1a1a1a] border-b border-[#2a2a2a]">
                         <tr>
                            <th className="p-4 font-bold text-gray-400 uppercase text-xs tracking-wider">Exam Name</th>
                            <th className="p-4 font-bold text-gray-400 uppercase text-xs tracking-wider">Availability</th>
                            <th className="p-4 font-bold text-gray-400 uppercase text-xs tracking-wider">Specific Guidelines</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-[#2a2a2a] bg-[#181818]">
                         {data.exams.map((exam, idx) => (
                            <tr key={idx} className="hover:bg-[#1f1f1f] transition-colors">
                               <td className="p-4 font-medium text-white align-top w-1/3">{exam.name}</td>
                               <td className="p-4 align-top w-1/4">
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-[#222] text-[var(--primary-color)] border border-[#333] whitespace-nowrap">
                                     <Calendar size={12} /> {exam.window}
                                  </span>
                               </td>
                               <td className="p-4 text-gray-400 text-xs leading-relaxed align-top">{exam.guidelines}</td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
};
