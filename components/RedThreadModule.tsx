
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitBranch, Sparkles, Loader2, ChevronRight, Edit3, Image as ImageIcon, RefreshCcw, Info } from 'lucide-react';
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

  useEffect(() => {
    const fetchThread = async () => {
      if (steps.every(s => !s.content)) {
        setIsLoading(true);
        try {
          const result = await generateRedThread(research, selectedInsight);
          setSteps(result.steps);
          setEssence(result.redThreadEssence || 'STRATEGIC SOLUTION');
          setDescription(result.summary || '');
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

  return (
    <div className="max-w-6xl mx-auto space-y-12 py-4 flex flex-col h-full">
      {/* North Star Header */}
      <div className="text-center">
        <h2 className="text-3xl md:text-5xl font-serif italic text-[#003da5] max-w-4xl mx-auto leading-tight tracking-tight">
          "{selectedInsight}"
        </h2>
      </div>

      <div className="relative flex-1 flex flex-col justify-center min-h-[550px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 space-y-4">
            <Loader2 className="animate-spin text-[#003da5]" size={48} />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Designing your strategic thread...</p>
          </div>
        ) : (
          <div className="relative bg-white/50 border border-slate-100 rounded-[3rem] p-12 overflow-visible">
            
            {/* Context Summary (No JTBD acronym) */}
            <div className="absolute top-8 right-12 z-20 max-w-xs text-right">
              <p className="text-xs font-bold text-slate-400 italic leading-snug">
                "{description}"
              </p>
            </div>

            {/* RED THREAD TITLE BOX - Red color, 2-3 words summary */}
            <div id="red-thread-origin" className="absolute top-10 left-12 z-30">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-rose-600 text-white px-6 py-4 rounded-2xl shadow-xl shadow-rose-200 flex flex-col min-w-[200px]"
              >
                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-1">RED THREAD</span>
                <span className="text-2xl font-black italic tracking-tighter leading-tight">
                  {essence}
                </span>
              </motion.div>
            </div>

            <div className="relative mt-24">
              {/* THE RED THREAD LINE */}
              {/* This SVG path is designed to look like it weaves through the boxes and starts/ends at the origin box area */}
              <svg 
                className="absolute top-0 left-0 w-full h-[350px] pointer-events-none z-10" 
                viewBox="0 0 1000 400" 
                preserveAspectRatio="none"
              >
                <motion.path
                  d="M 120 0 Q 120 150, 200 150 T 400 150 T 600 150 T 800 150 T 950 150 Q 980 150, 980 180 T 900 350 Q 400 380, 120 0"
                  fill="transparent"
                  stroke="#e11d48"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 3, ease: "easeInOut" }}
                  className="drop-shadow-[0_0_8px_rgba(225,29,72,0.4)]"
                />
              </svg>

              {/* THE 5 VECTORS SQUARES */}
              <div className="grid grid-cols-5 gap-6 relative z-0">
                {steps.map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 + (i * 0.2) }}
                    className="flex flex-col items-center gap-4"
                  >
                    {/* Category Label above the box */}
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{step.label}</span>
                    
                    {/* Square Image Box - No Text inside */}
                    <div className="relative w-full aspect-square bg-white rounded-[2rem] border-2 border-slate-50 shadow-sm overflow-hidden group hover:shadow-2xl hover:scale-[1.05] transition-all duration-500">
                      {/* Using seed based on imageSeeds state, using same seed initially per instruction */}
                      <img 
                        src={`https://picsum.photos/seed/${imageSeeds[i]}/400/400`} 
                        alt={step.label}
                        className="w-full h-full object-cover mix-blend-multiply opacity-90 transition-transform duration-1000 group-hover:scale-110"
                      />
                      
                      {/* Gradient overlay to make thread more visible */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent" />

                      {/* Change Image Button Overlay */}
                      <div className="absolute inset-0 bg-rose-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                        <button 
                          onClick={() => changeImage(i)}
                          className="bg-white text-rose-600 p-3 rounded-full shadow-lg hover:scale-110 transition-transform flex items-center gap-2 font-bold text-xs"
                        >
                          <RefreshCcw size={16} />
                          Change Image
                        </button>
                      </div>

                      {/* Connection Dots (Visual feedback for the thread) */}
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-rose-500 rounded-full border-2 border-white -translate-x-1.5 z-20" />
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-rose-500 rounded-full border-2 border-white translate-x-1.5 z-20" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center pt-8 border-t border-slate-100">
        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
          <Info size={14} className="text-[#003da5]" />
          The Strategic Thread ties the brand promise back to the human truth
        </div>
        <button
          onClick={() => onNext({ 
            redThread: steps, 
            redThreadEssence: essence,
            strategicObjective: description 
          })}
          disabled={isLoading || steps.some(s => !s.content)}
          className="px-12 py-4 bg-[#003da5] text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-blue-800 transition-all shadow-xl shadow-blue-200 disabled:opacity-50"
        >
          Validate The Strategy <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default RedThreadModule;
