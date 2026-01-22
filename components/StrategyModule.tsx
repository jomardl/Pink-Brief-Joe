
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Users, Zap, Loader2, ChevronRight, Sparkles, UserCircle2, Check, Target, RefreshCcw, AlertCircle } from 'lucide-react';
import { generatePersona, suggestCreativeDirections, analyzeResearch, generateRedThread } from '../geminiService';
import { BriefData, RedThreadStep } from '../types';

interface Props {
  onNext: (data: Partial<BriefData>) => void;
  briefData: BriefData;
  onProcessing: (val: boolean) => void;
}

const StrategyModule: React.FC<Props> = ({ onNext, briefData, onProcessing }) => {
  const [persona, setPersona] = useState(briefData.targetAudience);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selectedHookIdx, setSelectedHookIdx] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customTone, setCustomTone] = useState(briefData.tone);
  const [localObjective, setLocalObjective] = useState(briefData.strategicObjective);
  
  const [steps, setSteps] = useState<RedThreadStep[]>(briefData.redThread);
  const [essence, setEssence] = useState(briefData.redThreadEssence);
  const [imageSeeds, setImageSeeds] = useState<string[]>(new Array(5).fill('pg-seed'));

  // Use a ref to prevent double-firing of initialization logic
  const hasInitialized = useRef(false);

  useEffect(() => {
    const fetchData = async () => {
      // Prevent re-initialization if already loaded or currently loading
      if (hasInitialized.current || isLoading) return;
      
      // Secondary check: if we already have data from a previous session
      if (persona.name && suggestions.length > 0 && steps.some(s => s.content)) {
        hasInitialized.current = true;
        return;
      }

      setIsLoading(true);
      onProcessing(true);
      setError(null);

      try {
        let obj = localObjective;
        if (!obj) {
          const analysis = await analyzeResearch(briefData.researchText, briefData.selectedInsight);
          obj = analysis.summary;
          setLocalObjective(obj);
        }

        const [personaRes, directionsRes, threadRes] = await Promise.all([
          generatePersona(briefData.researchText, briefData.selectedInsight),
          suggestCreativeDirections({
            insight: briefData.selectedInsight,
            objective: obj
          }),
          generateRedThread(briefData.researchText, briefData.selectedInsight)
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
        if (threadRes) {
          setSteps(threadRes.steps);
          setEssence(threadRes.redThreadEssence);
        }
        
        hasInitialized.current = true;
      } catch (err: any) {
        console.error("Strategy initialization error:", err);
        setError("The strategic engine encountered an error. Please try again.");
      } finally {
        setIsLoading(false);
        onProcessing(false);
      }
    };
    
    fetchData();
  }, [briefData.researchText, briefData.selectedInsight]); // More specific dependencies

  const changeImage = (idx: number) => {
    const nextSeeds = [...imageSeeds];
    nextSeeds[idx] = Math.random().toString(36).substring(7);
    setImageSeeds(nextSeeds);
  };

  const handleFinish = () => {
    onNext({
      targetAudience: persona,
      keyMessage: selectedHookIdx !== null ? suggestions[selectedHookIdx].message : briefData.keyMessage,
      tone: customTone,
      strategicObjective: localObjective,
      redThread: steps,
      redThreadEssence: essence
    });
  };

  const findStep = (labelPart: string, indexFallback: number) => {
    const step = steps.find(s => s.label.toLowerCase().includes(labelPart.toLowerCase()));
    return step || steps[indexFallback];
  };

  const orderedSteps = [
    findStep('Product', 0),
    findStep('Instore', 3),
    findStep('Packaging', 1),
    findStep('Value', 4),
    findStep('Communication', 2),
  ];

  const threadPath = "M 175 100 C 175 250, 200 300, 200 420 L 600 420 L 1000 420 C 1000 600, 400 600, 400 780 L 800 780 C 1025 780, 1025 400, 1025 100";

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-24 text-center space-y-6">
        <div className="p-6 bg-rose-50 text-rose-500 rounded-full animate-bounce">
          <AlertCircle size={48} />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-black text-slate-900 uppercase">Strategy Sync Failed</h3>
          <p className="text-slate-500 max-w-md mx-auto font-medium">{error}</p>
        </div>
        <button 
          onClick={() => { hasInitialized.current = false; window.location.reload(); }}
          className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all"
        >
          Restart Strategic Engine
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-24 py-12 flex flex-col relative">
      <div className="space-y-4 text-center">
        <div className="inline-flex items-center justify-center p-4 bg-teal-50 text-teal-600 rounded-[2rem] mb-2 shadow-sm border border-teal-100">
          <Target size={36} />
        </div>
        <h2 className="text-4xl font-black text-slate-900 tracking-tight">Creative Strategy & Execution</h2>
        <p className="text-slate-500 max-w-2xl mx-auto text-lg leading-relaxed italic">
          "{briefData.selectedInsight}"
        </p>
      </div>

      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center p-24 space-y-4">
          <Loader2 className="animate-spin text-[#003da5]" size={48} />
          <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Architecting Strategy Components...</p>
        </div>
      ) : (
        <div className="space-y-32">
          <div className="grid lg:grid-cols-12 gap-10">
            <div className="lg:col-span-5 space-y-8">
              <div className="bg-white border border-slate-100 rounded-[3rem] p-8 shadow-sm h-full flex flex-col">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl"><Users size={24} /></div>
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">The Consumer</h3>
                </div>
                <div className="space-y-6 flex-1">
                  <div className="space-y-4 bg-slate-50 rounded-[2rem] p-6 border-2 border-slate-100">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-teal-600">
                      <UserCircle2 size={14} /> Name
                    </div>
                    <input 
                      value={persona.name}
                      onChange={(e) => setPersona({...persona, name: e.target.value})}
                      className="bg-transparent border-none text-slate-800 text-3xl font-black p-0 focus:ring-0 outline-none w-full"
                    />
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-teal-600">
                      <UserCircle2 size={14} /> Persona Narrative
                    </div>
                    <textarea 
                      value={persona.description}
                      onChange={(e) => setPersona({...persona, description: e.target.value})}
                      className="w-full h-80 bg-slate-50/50 border-none rounded-2xl p-4 text-sm font-bold text-slate-700 leading-relaxed focus:ring-2 focus:ring-teal-100 resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-7 space-y-8">
              <div className="bg-white border border-slate-100 rounded-[3rem] p-10 shadow-sm h-full flex flex-col">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><Zap size={24} /></div>
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">The Hook</h3>
                </div>
                <div className="space-y-6 flex-1">
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
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-16">
            <div className="flex items-center gap-6 max-w-4xl mx-auto">
              <div className="w-16 h-[4px] bg-rose-500 rounded-full" />
              <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Execution Architecture</h3>
              <div className="flex-1 h-[1px] bg-slate-100" />
            </div>

            <div className="relative min-h-[1000px] overflow-visible">
               <div className="flex items-stretch gap-0 mb-32 max-w-6xl mx-auto relative z-30">
                <motion.div 
                  initial={{ x: -20, opacity: 0 }}
                  whileInView={{ x: 0, opacity: 1 }}
                  className="bg-rose-600 text-white px-12 py-10 rounded-l-[4rem] shadow-2xl shadow-rose-200/50 flex flex-col justify-center min-w-[350px] border-r-2 border-rose-500/50"
                >
                  <span className="text-xs font-black uppercase tracking-[0.3em] opacity-80 mb-2">STRATEGIC ESSENCE</span>
                  <span className="text-3xl font-black italic tracking-tighter leading-tight uppercase">
                    {essence || 'SYNERGY'}
                  </span>
                </motion.div>

                <motion.div 
                  initial={{ x: 20, opacity: 0 }}
                  whileInView={{ x: 0, opacity: 1 }}
                  className="bg-[#003da5] text-white px-14 py-10 rounded-r-[4rem] shadow-2xl shadow-blue-200/50 flex-1 flex flex-col justify-center"
                >
                  <span className="text-xs font-black uppercase tracking-[0.3em] opacity-80 mb-2">JOB TO BE DONE</span>
                  <span className="text-xl font-bold italic tracking-tight leading-snug">
                    {localObjective || 'Establishing strategic clarity...'}
                  </span>
                </motion.div>
              </div>

              <svg 
                className="absolute top-0 left-0 w-full h-full pointer-events-none z-10 overflow-visible" 
                viewBox="0 0 1200 1000" 
                preserveAspectRatio="xMidYMid meet"
              >
                <defs>
                  <filter id="threadGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="8" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>
                <motion.path
                  d={threadPath}
                  fill="transparent"
                  stroke="#e11d48"
                  strokeWidth="10"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  transition={{ duration: 3, ease: "easeInOut" }}
                  filter="url(#threadGlow)"
                  className="drop-shadow-[0_0_20px_rgba(225,29,72,0.9)]"
                />
              </svg>

              <div className="relative z-20 max-w-6xl mx-auto space-y-24">
                <div className="grid grid-cols-3 gap-16">
                  <StrategyCard step={orderedSteps[0]} idx={0} seed={imageSeeds[0]} onRegenerate={() => changeImage(0)} />
                  <StrategyCard step={orderedSteps[1]} idx={1} seed={imageSeeds[1]} onRegenerate={() => changeImage(1)} />
                  <StrategyCard step={orderedSteps[2]} idx={2} seed={imageSeeds[2]} onRegenerate={() => changeImage(2)} />
                </div>
                <div className="flex justify-center gap-16 px-[12%]">
                  <div className="w-[45%]">
                    <StrategyCard step={orderedSteps[3]} idx={3} seed={imageSeeds[3]} onRegenerate={() => changeImage(3)} />
                  </div>
                  <div className="w-[45%]">
                    <StrategyCard step={orderedSteps[4]} idx={4} seed={imageSeeds[4]} onRegenerate={() => changeImage(4)} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-12 flex justify-center pb-24 border-t border-slate-100">
            <button 
              onClick={handleFinish}
              className="px-24 py-8 bg-[#003da5] text-white rounded-[3rem] font-black text-sm uppercase tracking-[0.4em] flex items-center gap-4 hover:bg-blue-800 shadow-[0_40px_80px_rgba(0,61,165,0.3)] hover:scale-105 active:scale-95 transition-all"
            >
              Architect Pink Brief <ChevronRight size={28} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const StrategyCard: React.FC<{ 
  step?: RedThreadStep; 
  idx: number; 
  seed: string; 
  onRegenerate: () => void; 
}> = ({ step, idx, seed, onRegenerate }) => {
  if (!step) return <div className="aspect-square w-full" />;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 30 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: 0.1 * idx, type: "spring", stiffness: 70 }}
      className="group relative flex flex-col items-center"
    >
      <div className="relative w-full aspect-square bg-white rounded-[4rem] border-[8px] border-white shadow-[0_40px_80px_rgba(0,0,0,0.12)] overflow-hidden transition-all duration-700 group-hover:shadow-[0_50px_100px_rgba(0,61,165,0.25)] group-hover:scale-[1.03]">
        <img 
          src={`https://picsum.photos/seed/${seed}/800/800`} 
          alt={step.label}
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
        />
        
        <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-transparent opacity-60" />

        <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-2xl px-10 py-4 rounded-[2rem] border border-slate-100 shadow-xl z-20">
           <span className="text-sm font-black text-[#003da5] uppercase tracking-[0.3em]">{step.label}</span>
        </div>

        <div className="absolute inset-0 bg-[#003da5]/80 opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center backdrop-blur-md">
          <button 
            onClick={(e) => { e.stopPropagation(); onRegenerate(); }}
            className="bg-white text-[#003da5] p-8 rounded-[2rem] shadow-2xl hover:scale-110 transition-transform flex items-center gap-4 font-black text-xs uppercase tracking-[0.2em]"
          >
            <RefreshCcw size={20} />
            Re-visualize
          </button>
        </div>

        <div className="absolute left-[-12px] top-1/2 -translate-y-1/2 w-8 h-8 bg-rose-500 rounded-full border-[6px] border-white z-30 shadow-[0_0_20px_rgba(225,29,72,0.8)]" />
        <div className="absolute right-[-12px] top-1/2 -translate-y-1/2 w-8 h-8 bg-rose-500 rounded-full border-[6px] border-white z-30 shadow-[0_0_20px_rgba(225,29,72,0.8)]" />
      </div>
    </motion.div>
  );
};

export default StrategyModule;
