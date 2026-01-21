
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Loader2, ChevronRight, RefreshCcw } from 'lucide-react';
import { generateRedThread } from '../geminiService';
import { RedThreadStep, BriefData } from '../types';

interface Props {
  onNext: (data: Partial<BriefData>) => void;
  research: string;
  selectedInsight: string;
  currentData: RedThreadStep[];
}

const RedThreadModule: React.FC<Props> = ({ onNext, research, selectedInsight, currentData }) => {
  const [steps, setSteps] = useState<RedThreadStep[]>(currentData);
  const [essence, setEssence] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [imageSeeds, setImageSeeds] = useState<string[]>(new Array(5).fill('pg-strategic-seed'));
  
  const prevInsightRef = useRef<string>(selectedInsight);

  useEffect(() => {
    const fetchThread = async () => {
      const insightChanged = prevInsightRef.current !== selectedInsight;
      const isInitial = steps.every(s => !s.content);

      if (isInitial || insightChanged) {
        setIsLoading(true);
        try {
          const result = await generateRedThread(research, selectedInsight);
          setSteps(result.steps);
          setEssence(result.redThreadEssence || 'STRATEGIC SOLUTION');
          setDescription(result.summary || '');
          prevInsightRef.current = selectedInsight;
        } catch (err) {
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchThread();
  }, [research, selectedInsight]);

  const changeImage = (idx: number) => {
    const nextSeeds = [...imageSeeds];
    nextSeeds[idx] = Math.random().toString(36).substring(7);
    setImageSeeds(nextSeeds);
  };

  // Helper to find step by partial label to ensure order
  const getStep = (label: string) => steps.find(s => s.label.toLowerCase().includes(label.toLowerCase()));

  // Path sequence: Red Header -> Product -> Instore -> Packaging -> Value -> Communication -> Job To Be Done Header
  // Using ViewBox: 0 0 1200 1000
  // Red Header (Start): ~150, 100
  // Box 1 (Product - Top L): 200, 450
  // Box 2 (Instore - Top M): 600, 450
  // Box 3 (Packaging - Top R): 1000, 450
  // Box 4 (Value - Bot L): 400, 800
  // Box 5 (Communication - Bot R): 800, 800
  // Blue Header (End): ~1050, 100
  const threadPath = "M 150 100 C 150 250, 200 300, 200 450 S 400 450, 600 450 S 800 450, 1000 450 S 1000 650, 400 800 S 600 800, 800 800 S 1050 350, 1050 100";

  return (
    <div className="max-w-7xl mx-auto space-y-12 py-8 flex flex-col h-full overflow-visible">
      <div className="text-center px-4">
        <h2 className="text-3xl md:text-5xl font-serif italic text-[#003da5] max-w-5xl mx-auto leading-tight tracking-tight">
          "{selectedInsight}"
        </h2>
      </div>

      <div className="relative flex-1 flex flex-col min-h-[1000px] overflow-visible">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-24 space-y-6">
            <Loader2 className="animate-spin text-[#003da5]" size={64} />
            <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-xs">Architecting Strategy...</p>
          </div>
        ) : (
          <div className="relative overflow-visible">
            {/* Header Boxes Row: Red Thread & Job To Be Done */}
            <div className="flex items-stretch gap-0 mb-32 max-w-6xl mx-auto relative z-30">
              <motion.div 
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="bg-rose-600 text-white px-12 py-10 rounded-l-[3.5rem] shadow-2xl shadow-rose-200/50 flex flex-col justify-center min-w-[350px] border-r-2 border-rose-500/50"
              >
                <span className="text-xs font-black uppercase tracking-[0.3em] opacity-80 mb-2">RED THREAD</span>
                <span className="text-3xl font-black italic tracking-tighter leading-tight uppercase">
                  {essence || 'SYNERGY'}
                </span>
              </motion.div>

              <motion.div 
                initial={{ x: 30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="bg-[#003da5] text-white px-14 py-10 rounded-r-[3.5rem] shadow-2xl shadow-blue-200/50 flex-1 flex flex-col justify-center"
              >
                <span className="text-xs font-black uppercase tracking-[0.3em] opacity-80 mb-2">JOB TO BE DONE</span>
                <span className="text-xl font-bold italic tracking-tight leading-snug">
                  {description}
                </span>
              </motion.div>
            </div>

            {/* THE RED THREAD SVG ANIMATION */}
            <svg 
              className="absolute top-0 left-0 w-full h-full pointer-events-none z-10 overflow-visible" 
              viewBox="0 0 1200 1000" 
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <filter id="threadGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              <motion.path
                d={threadPath}
                fill="transparent"
                stroke="#e11d48"
                strokeWidth="8"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 3.5, ease: "easeInOut", delay: 0.5 }}
                filter="url(#threadGlow)"
                className="drop-shadow-[0_0_15px_rgba(225,29,72,0.8)]"
              />
            </svg>

            {/* STAGGERED ZIGZAG BOXES (3 Top, 2 Bottom) */}
            <div className="relative z-20 max-w-6xl mx-auto space-y-20">
              {/* Row 1: Product, Instore, Packaging */}
              <div className="grid grid-cols-3 gap-16">
                <VectorCard step={getStep('Product')} idx={0} seed={imageSeeds[0]} onRegenerate={() => changeImage(0)} />
                <VectorCard step={getStep('Instore')} idx={1} seed={imageSeeds[1]} onRegenerate={() => changeImage(1)} />
                <VectorCard step={getStep('Packaging')} idx={2} seed={imageSeeds[2]} onRegenerate={() => changeImage(2)} />
              </div>

              {/* Row 2: Value, Communication */}
              <div className="flex justify-center gap-16 px-[12%]">
                <div className="w-[45%]">
                  <VectorCard step={getStep('Value')} idx={3} seed={imageSeeds[3]} onRegenerate={() => changeImage(3)} />
                </div>
                <div className="w-[45%]">
                  <VectorCard step={getStep('Communication')} idx={4} seed={imageSeeds[4]} onRegenerate={() => changeImage(4)} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center pt-16 border-t border-slate-100 mt-24">
        <div className="flex items-center gap-4 text-xs text-slate-400 font-bold uppercase tracking-[0.4em]">
          <div className="w-12 h-[3px] bg-rose-500 rounded-full" />
          Seamless Strategy Execution
        </div>
        <button
          onClick={() => onNext({ 
            redThread: steps, 
            redThreadEssence: essence,
            strategicObjective: description 
          })}
          disabled={isLoading || steps.some(s => !s.content)}
          className="px-16 py-7 bg-[#003da5] text-white rounded-[2.5rem] font-black text-sm uppercase tracking-[0.3em] flex items-center gap-4 hover:bg-blue-800 transition-all shadow-[0_30px_60px_rgba(0,61,165,0.3)] active:scale-95 disabled:opacity-50"
        >
          Validate The Strategy <ChevronRight size={24} />
        </button>
      </div>
    </div>
  );
};

const VectorCard: React.FC<{ 
  step?: RedThreadStep; 
  idx: number; 
  seed: string; 
  onRegenerate: () => void; 
}> = ({ step, idx, seed, onRegenerate }) => {
  if (!step) return <div className="aspect-square w-full" />; // Spacer
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 1 + (idx * 0.15), type: "spring", stiffness: 80 }}
      className="group relative flex flex-col items-center"
    >
      {/* Massive Square Image Box */}
      <div className="relative w-full aspect-square bg-white rounded-[4rem] border-8 border-white shadow-[0_40px_90px_rgba(0,0,0,0.15)] overflow-hidden transition-all duration-1000 group-hover:shadow-[0_50px_110px_rgba(0,61,165,0.25)] group-hover:scale-[1.03]">
        <img 
          src={`https://picsum.photos/seed/${seed}/1000/1000`} 
          alt={step.label}
          className="w-full h-full object-cover grayscale-[20%] transition-transform duration-1000 group-hover:scale-110 group-hover:grayscale-0"
        />
        
        <div className="absolute inset-0 bg-gradient-to-tr from-black/50 via-transparent to-transparent opacity-60" />
        <div className="absolute inset-0 bg-rose-600/5 mix-blend-overlay" />

        {/* Label Badge on box */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-xl px-10 py-4 rounded-[1.5rem] border border-slate-100 shadow-2xl z-20">
           <span className="text-sm font-black text-[#003da5] uppercase tracking-[0.4em]">{step.label}</span>
        </div>

        {/* Regenerate Visual Button Overlay */}
        <div className="absolute inset-0 bg-[#003da5]/80 opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center backdrop-blur-md">
          <button 
            onClick={(e) => { e.stopPropagation(); onRegenerate(); }}
            className="bg-white text-[#003da5] p-8 rounded-3xl shadow-2xl hover:scale-110 transition-transform flex items-center gap-5 font-black text-sm uppercase tracking-[0.2em]"
          >
            <RefreshCcw size={24} />
            Refresh Visual
          </button>
        </div>

        {/* The Connection Nodes (Purely Visual for the Thread Line) */}
        <div className="absolute left-[-12px] top-1/2 -translate-y-1/2 w-8 h-8 bg-rose-500 rounded-full border-6 border-white z-30 shadow-[0_0_25px_rgba(225,29,72,1)]" />
        <div className="absolute right-[-12px] top-1/2 -translate-y-1/2 w-8 h-8 bg-rose-500 rounded-full border-6 border-white z-30 shadow-[0_0_25px_rgba(225,29,72,1)]" />
      </div>
      
      {/* REMOVED TEXT CONTENT BELOW BOX AS REQUESTED */}
    </motion.div>
  );
};

export default RedThreadModule;
