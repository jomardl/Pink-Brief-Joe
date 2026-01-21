
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// Added missing Target import from lucide-react
import { Users, Zap, Loader2, ChevronRight, Sparkles, Volume2, UserCircle2, Check, Target } from 'lucide-react';
import { generatePersona, suggestCreativeDirections } from '../geminiService';
import { BriefData } from '../types';

interface Props {
  onNext: (data: Partial<BriefData>) => void;
  briefData: BriefData;
}

const StrategyModule: React.FC<Props> = ({ onNext, briefData }) => {
  const [persona, setPersona] = useState(briefData.targetAudience);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selectedHookIdx, setSelectedHookIdx] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [customTone, setCustomTone] = useState(briefData.tone);

  useEffect(() => {
    const fetchData = async () => {
      // Avoid re-fetching if we already have data
      if (persona.name && suggestions.length > 0) return;

      setIsLoading(true);
      try {
        const [personaRes, directionsRes] = await Promise.all([
          !persona.name ? generatePersona(briefData.researchText, briefData.selectedInsight) : Promise.resolve(null),
          suggestions.length === 0 ? suggestCreativeDirections({
            insight: briefData.selectedInsight,
            objective: briefData.strategicObjective
          }) : Promise.resolve(null)
        ]);

        if (personaRes) {
          setPersona({
            name: personaRes.name,
            description: `${personaRes.demographics}\n\n${personaRes.psychographics}`,
            insights: [personaRes.keyNeed]
          });
        }
        if (directionsRes) {
          setSuggestions(directionsRes);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [briefData]);

  const handleFinish = () => {
    onNext({
      targetAudience: persona,
      keyMessage: selectedHookIdx !== null ? suggestions[selectedHookIdx].message : briefData.keyMessage,
      tone: customTone
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 py-4 h-full flex flex-col">
      <div className="space-y-4 text-center">
        <div className="inline-flex items-center justify-center p-4 bg-teal-50 text-teal-600 rounded-[2rem] mb-2 shadow-sm border border-teal-100">
          <Target size={36} />
        </div>
        <h2 className="text-4xl font-black text-slate-900 tracking-tight">Creative Strategy</h2>
        <p className="text-slate-500 max-w-lg mx-auto text-lg leading-relaxed">
          Who are we talking to, and how will we win them over?
        </p>
      </div>

      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center p-24 space-y-4">
          <Loader2 className="animate-spin text-[#003da5]" size={48} />
          <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Designing Strategy Components...</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-12 gap-10 flex-1">
          {/* Persona Section */}
          <div className="lg:col-span-5 space-y-8">
            <div className="bg-white border border-slate-100 rounded-[3rem] p-8 shadow-sm h-full flex flex-col">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl"><Users size={24} /></div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">The Consumer</h3>
              </div>

              <div className="space-y-6 flex-1">
                <div className="aspect-[4/3] bg-slate-50 rounded-[2.5rem] overflow-hidden relative border-4 border-white shadow-xl">
                  <img 
                    src={`https://picsum.photos/seed/${persona.name}/500/400`} 
                    alt="Persona" 
                    className="w-full h-full object-cover grayscale-[30%] opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent flex items-end p-8">
                    <input 
                      value={persona.name}
                      onChange={(e) => setPersona({...persona, name: e.target.value})}
                      className="bg-transparent border-none text-white text-3xl font-black p-0 focus:ring-0 outline-none w-full"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-teal-600">
                    <UserCircle2 size={14} /> Persona Narrative
                  </div>
                  <textarea 
                    value={persona.description}
                    onChange={(e) => setPersona({...persona, description: e.target.value})}
                    className="w-full h-40 bg-slate-50/50 border-none rounded-2xl p-4 text-sm font-bold text-slate-700 leading-relaxed focus:ring-2 focus:ring-teal-100 resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Hook Section */}
          <div className="lg:col-span-7 space-y-8">
            <div className="bg-white border border-slate-100 rounded-[3rem] p-10 shadow-sm h-full flex flex-col">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><Zap size={24} /></div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">The Hook</h3>
              </div>

              <div className="space-y-8 flex-1">
                <div className="grid grid-cols-1 gap-4">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setSelectedHookIdx(i);
                        setCustomTone(s.tone);
                      }}
                      className={`p-6 text-left rounded-[2rem] border-2 transition-all flex items-center gap-6 relative overflow-hidden ${
                        selectedHookIdx === i 
                          ? 'border-amber-500 bg-amber-50 shadow-xl shadow-amber-100/50' 
                          : 'border-slate-50 bg-slate-50/30 hover:border-amber-100'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                        selectedHookIdx === i ? 'bg-amber-500 text-white' : 'bg-white text-slate-300'
                      }`}>
                        {selectedHookIdx === i ? <Check size={24} strokeWidth={3} /> : <Sparkles size={20} />}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-black text-slate-800 tracking-tight">{s.directionName}</h4>
                        <p className="text-xs text-slate-500 italic mt-1 leading-snug">"{s.message}"</p>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="bg-slate-50 rounded-[2.5rem] p-8 space-y-6 border border-white">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <Volume2 size={14} /> Tone of Voice
                    </div>
                    <input 
                      value={customTone}
                      onChange={(e) => setCustomTone(e.target.value)}
                      className="w-full bg-white border border-slate-100 rounded-xl p-4 text-sm font-black text-slate-800 focus:ring-2 focus:ring-amber-100 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-8 flex justify-end">
                <button 
                  onClick={handleFinish}
                  disabled={selectedHookIdx === null && !customTone}
                  className="px-14 py-6 bg-[#003da5] text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] flex items-center gap-3 hover:bg-blue-800 shadow-2xl shadow-blue-200 transition-all disabled:opacity-50"
                >
                  Finalize Strategy <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StrategyModule;
