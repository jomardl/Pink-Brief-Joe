
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UploadCloud, 
  Lightbulb,
  GitBranch, 
  Target,
  CheckCircle, 
  ChevronRight,
  Loader2
} from 'lucide-react';
import { ModuleId, BriefData, INITIAL_BRIEF_DATA } from './types';
import ResearchModule from './components/ResearchModule';
import InsightsModule from './components/InsightsModule';
import RedThreadModule from './components/RedThreadModule';
import StrategyModule from './components/StrategyModule';
import SummaryModule from './components/SummaryModule';

const App: React.FC = () => {
  const [currentModule, setCurrentModule] = useState<ModuleId>(1);
  const [briefData, setBriefData] = useState<BriefData>(INITIAL_BRIEF_DATA);
  const [completedModules, setCompletedModules] = useState<ModuleId[]>([]);
  const [hoveredModule, setHoveredModule] = useState<number | null>(null);

  const modules = [
    { id: 1, title: 'Upload', icon: UploadCloud, desc: 'Import research document' },
    { id: 2, title: 'Insights', icon: Lightbulb, desc: 'Select extracted human truths' },
    { id: 3, title: 'Red Thread', icon: GitBranch, desc: 'Superiority vectors flow' },
    { id: 4, title: 'Strategy', icon: Target, desc: 'Persona & creative hook' },
    { id: 5, title: 'Final Brief', icon: CheckCircle, desc: 'Review & export output' }
  ];

  const handleNext = (nextData?: Partial<BriefData>) => {
    if (nextData) {
      setBriefData(prev => ({ ...prev, ...nextData }));
    }
    if (!completedModules.includes(currentModule)) {
      setCompletedModules(prev => [...prev, currentModule]);
    }
    if (currentModule < 5) {
      setCurrentModule((currentModule + 1) as ModuleId);
    }
  };

  const goToModule = (id: ModuleId) => {
    // Only allow navigating to completed modules or the first step
    if (id === 1 || completedModules.includes((id - 1) as ModuleId) || completedModules.includes(id)) {
      setCurrentModule(id);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="h-28 px-8 grid grid-cols-3 items-center border-b bg-white/80 backdrop-blur-xl sticky top-0 z-50">
        {/* Left Section: Logo + Title */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-[#003da5] rounded-full flex items-center justify-center shadow-lg shadow-blue-900/20 ring-4 ring-blue-50 shrink-0">
            <span className="text-white font-bold text-base tracking-tighter" style={{ fontFamily: 'Georgia, serif' }}>P&G</span>
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tighter uppercase whitespace-nowrap">
            BRIEF <span className="text-[#003da5]">ARCHITECT</span>
          </h1>
        </div>

        {/* Middle Section: Centered Navigation (Icons twice as large, shifted slightly right) */}
        <div className="flex justify-center items-center gap-4 ml-16">
          {modules.map((m, idx) => (
            <React.Fragment key={m.id}>
              <div className="relative">
                <button
                  onMouseEnter={() => setHoveredModule(m.id)}
                  onMouseLeave={() => setHoveredModule(null)}
                  onClick={() => goToModule(m.id as ModuleId)}
                  className={`relative z-10 flex items-center justify-center w-16 h-16 rounded-2xl transition-all duration-500 ${
                    currentModule === m.id 
                      ? 'bg-[#003da5] text-white shadow-2xl shadow-blue-200 scale-110 rotate-3 ring-4 ring-blue-100' 
                      : completedModules.includes(m.id as ModuleId)
                      ? 'bg-blue-50 text-blue-600 hover:bg-blue-100 hover:scale-105'
                      : 'bg-slate-50 text-slate-300 hover:text-slate-400 cursor-not-allowed opacity-50'
                  }`}
                >
                  <m.icon size={32} strokeWidth={currentModule === m.id ? 2.5 : 2} />
                  {currentModule === m.id && (
                    <span className="absolute inset-0 rounded-2xl bg-[#003da5] animate-ping opacity-20 -z-10" />
                  )}
                </button>

                <AnimatePresence>
                  {hoveredModule === m.id && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.9 }}
                      className="absolute top-full mt-4 left-1/2 -translate-x-1/2 w-48 bg-slate-900 text-white p-3 rounded-2xl shadow-2xl z-50 pointer-events-none"
                    >
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 rotate-45 -translate-y-1.5" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-1">{m.title}</p>
                      <p className="text-[11px] font-medium leading-relaxed text-slate-300">{m.desc}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {idx < modules.length - 1 && (
                <div className={`w-6 h-[2px] rounded-full transition-colors duration-700 ${completedModules.includes(m.id as ModuleId) ? 'bg-blue-200' : 'bg-slate-100'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Right Section: Empty for balance */}
        <div className="flex items-center justify-end">
          {/* Action buttons could go here */}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-100/30 rounded-full mix-blend-multiply filter blur-[140px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-100/30 rounded-full mix-blend-multiply filter blur-[140px] animate-pulse delay-1000" />

        <div className="w-full max-w-6xl z-10 h-full flex flex-col">
          <div className="bg-white/90 border border-white/60 backdrop-blur-3xl rounded-[3.5rem] shadow-[0_40px_80px_-20px_rgba(0,61,165,0.12)] p-8 md:p-14 flex-1 flex flex-col relative overflow-hidden min-h-[700px]">
            <div className="relative z-10 flex-1 flex flex-col h-full">
              {currentModule === 1 && (
                <ResearchModule 
                  onNext={handleNext} 
                  currentData={briefData.researchText} 
                />
              )}
              {currentModule === 2 && (
                <InsightsModule 
                  onNext={handleNext} 
                  research={briefData.researchText}
                  extractedInsights={briefData.extractedInsights}
                  selectedInsight={briefData.selectedInsight}
                />
              )}
              {currentModule === 3 && (
                <RedThreadModule 
                  onNext={handleNext} 
                  research={briefData.researchText}
                  selectedInsight={briefData.selectedInsight}
                  currentData={briefData.redThread}
                />
              )}
              {currentModule === 4 && (
                <StrategyModule 
                  onNext={handleNext} 
                  briefData={briefData}
                />
              )}
              {currentModule === 5 && (
                <SummaryModule 
                  briefData={briefData}
                  onReset={() => {
                    setBriefData(INITIAL_BRIEF_DATA);
                    setCompletedModules([]);
                    setCurrentModule(1);
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="p-10 bg-white/20 backdrop-blur-md border-t border-slate-100 flex flex-col items-center gap-6">
        <div className="flex gap-4">
          {modules.map((m) => (
            <motion.div 
              key={m.id}
              initial={false}
              animate={{ 
                width: currentModule === m.id ? 64 : (completedModules.includes(m.id as ModuleId) ? 32 : 12),
                backgroundColor: currentModule === m.id ? '#003da5' : (completedModules.includes(m.id as ModuleId) ? '#93c5fd' : '#e2e8f0')
              }}
              className="h-2 rounded-full shadow-sm"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] font-sans">
            P&G Strategic AI Engine v6.0 • Research Focused
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
