
import React, { useState, useEffect } from 'react';
import { Users, Loader2, ChevronRight, UserCircle2 } from 'lucide-react';
import { generatePersona } from '../geminiService';
import { BriefData, Persona } from '../types';

interface Props {
  onNext: (data: { targetAudience: BriefData['targetAudience'] }) => void;
  research: string;
  selectedInsight: string;
  currentData: BriefData['targetAudience'];
}

const PersonaModule: React.FC<Props> = ({ onNext, research, selectedInsight, currentData }) => {
  // Fixed: Ensure persona state is correctly typed and initialized from currentData
  const [persona, setPersona] = useState<Persona>(currentData || { name: '', description: '', insights: [] });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchPersona = async () => {
      if (!research || persona.name) return;
      setIsLoading(true);
      try {
        const result = await generatePersona(research, selectedInsight);
        setPersona({
          name: result.name,
          description: `${result.demographics}\n\n${result.psychographics}`,
          insights: [result.keyNeed]
        });
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPersona();
  }, [research, selectedInsight, persona.name]);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center p-3 bg-teal-100 text-teal-700 rounded-2xl mb-2">
          <Users size={32} />
        </div>
        <h2 className="text-3xl font-bold text-slate-900">Target Audience</h2>
        <p className="text-slate-500">Who are we talking to? We've synthesized a primary persona based on the research.</p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 space-y-4">
          <Loader2 className="animate-spin text-teal-600" size={32} />
          <p className="text-slate-400 font-medium">Visualizing your consumer...</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-1 space-y-6">
            <div className="aspect-square bg-slate-100 rounded-[2rem] flex items-center justify-center relative overflow-hidden group border-2 border-slate-50 shadow-inner">
               <img 
                 src={`https://picsum.photos/seed/${persona.name}/400/400`} 
                 className="w-full h-full object-cover opacity-90 group-hover:scale-110 transition-transform duration-700" 
                 alt="Persona" 
               />
               <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-6">
                  <h3 className="text-white text-2xl font-bold">{persona.name || 'Target Consumer'}</h3>
               </div>
            </div>
            
            <div className="p-5 bg-teal-50/50 rounded-2xl border border-teal-100 space-y-2">
              <h4 className="text-xs font-bold text-teal-700 uppercase tracking-widest">Key Need State</h4>
              <p className="text-sm text-teal-900 leading-relaxed font-medium">
                {persona.insights[0] || 'Identifying primary motivation...'}
              </p>
            </div>
          </div>

          <div className="md:col-span-2 space-y-6">
            <div className="space-y-4">
              <label className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <UserCircle2 size={16} className="text-blue-500" />
                Persona Details
              </label>
              <input 
                value={persona.name}
                onChange={(e) => setPersona({...persona, name: e.target.value})}
                placeholder="Persona Name"
                className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-xl font-semibold text-slate-800"
              />
              <textarea
                value={persona.description}
                onChange={(e) => setPersona({...persona, description: e.target.value})}
                placeholder="Demographics, psychographics, and behaviors..."
                className="w-full h-64 p-5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-slate-700 leading-relaxed"
              />
            </div>
            
            <button
              onClick={() => onNext({ targetAudience: persona })}
              disabled={isLoading}
              className="w-full py-4 bg-[#003da5] text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-800 transition-all shadow-xl shadow-blue-200"
            >
              Continue to Creative Hook
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonaModule;
