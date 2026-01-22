
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UploadCloud, 
  Lightbulb,
  Target,
  CheckCircle,
  PlusCircle,
  FolderOpen
} from 'lucide-react';
import { ModuleId, BriefData, INITIAL_BRIEF_DATA } from './types';
import ResearchModule from './components/ResearchModule';
import InsightsModule from './components/InsightsModule';
import StrategyModule from './components/StrategyModule';
import SummaryModule from './components/SummaryModule';

const App: React.FC = () => {
  const [appStarted, setAppStarted] = useState(false);
  const [currentModule, setCurrentModule] = useState<ModuleId>(1);
  const [briefData, setBriefData] = useState<BriefData>(INITIAL_BRIEF_DATA);
  const [completedModules, setCompletedModules] = useState<ModuleId[]>([]);
  const [hoveredModule, setHoveredModule] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const modules = [
    { 
      id: 1, 
      title: 'Upload', 
      icon: UploadCloud, 
      description: 'Import consumer verbatims and research reports' 
    },
    { 
      id: 2, 
      title: 'Insights', 
      icon: Lightbulb, 
      description: 'Synthesize data into actionable human truths' 
    },
    { 
      id: 3, 
      title: 'Strategy', 
      icon: Target, 
      description: 'Define persona, creative hook, and red thread execution' 
    },
    { 
      id: 4, 
      title: 'PINK BRIEF', 
      icon: CheckCircle, 
      description: 'Generate the final standardized P&G brief' 
    }
  ];

  const handleNext = (nextData?: Partial<BriefData>) => {
    if (nextData) {
      setBriefData(prev => ({ ...prev, ...nextData }));
    }
    if (!completedModules.includes(currentModule)) {
      setCompletedModules(prev => [...prev, currentModule]);
    }
    if (currentModule < 4) {
      setCurrentModule((currentModule + 1) as ModuleId);
    }
  };

  const handleReset = () => {
    setBriefData(INITIAL_BRIEF_DATA);
    setCompletedModules([]);
    setCurrentModule(1);
    setAppStarted(false);
    setIsProcessing(false);
  };

  const goToModule = (id: ModuleId) => {
    if (id === 1 || completedModules.includes((id - 1) as ModuleId) || completedModules.includes(id)) {
      setCurrentModule(id);
    }
  };

  const Logo = ({ isLanding = false }: { isLanding?: boolean }) => (
    <motion.div 
      layoutId="brandContainer"
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className={`flex items-center ${isLanding ? 'flex-col gap-8' : 'gap-4'}`}
    >
      <motion.div 
        layoutId="brandCircle"
        className={`${isLanding ? 'w-24 h-24' : 'w-10 h-10'} bg-[#003da5] rounded-full flex items-center justify-center shadow-2xl shadow-blue-900/20 shrink-0`}
      >
        <span className={`text-white font-bold ${isLanding ? 'text-2xl' : 'text-[10px]'}`} style={{ fontFamily: 'Georgia, serif' }}>P&G</span>
      </motion.div>
      <div className={`flex flex-col ${isLanding ? 'items-center text-center' : ''}`}>
        <motion.h1 
          layoutId="brandTitle"
          className={`${isLanding ? 'text-6xl' : 'text-sm'} font-black text-slate-900 tracking-tighter uppercase leading-none`}
        >
          <span className="text-[#ed008c]">PINK BRIEF</span> <span className="text-[#003da5]">ARCHITECT</span>
        </motion.h1>
        <motion.p 
          layoutId="brandVersion"
          className={`${isLanding ? 'text-sm' : 'text-[8px]'} font-black text-slate-400 uppercase tracking-[0.4em] mt-2`}
        >
          Strategic Engine v6.0
        </motion.p>
      </div>
    </motion.div>
  );

  if (!appStarted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 overflow-hidden relative">
        <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-blue-100/40 rounded-full mix-blend-multiply filter blur-[150px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-indigo-100/40 rounded-full mix-blend-multiply filter blur-[150px] animate-pulse delay-1000" />

        <div className="z-10 flex flex-col items-center gap-16">
          <Logo isLanding={true} />

          <div className="flex gap-6 mt-8">
            <motion.button
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setAppStarted(true)}
              className="px-12 py-6 bg-[#003da5] text-white rounded-3xl font-black text-sm uppercase tracking-[0.3em] flex items-center gap-4 hover:bg-blue-800 shadow-[0_30px_60px_rgba(0,61,165,0.25)] transition-all"
            >
              <PlusCircle size={20} />
              Write new Brief
            </motion.button>

            <button
              disabled
              className="px-12 py-6 bg-slate-200 text-slate-400 rounded-3xl font-black text-sm uppercase tracking-[0.3em] flex items-center gap-4 cursor-not-allowed opacity-60"
            >
              <FolderOpen size={20} />
              Open
            </button>
          </div>
        </div>

        <footer className="absolute bottom-12 text-center">
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.6em]">
            Confidential & Proprietary • Procter & Gamble
          </p>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 overflow-x-hidden">
      <motion.header 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="sticky top-0 z-[100] h-20 bg-white/95 border-b border-slate-200 backdrop-blur-xl shadow-sm"
      >
        <div className="max-w-[1400px] mx-auto h-full px-8 flex items-center justify-between">
          <button 
            onClick={handleReset}
            className="min-w-[280px] text-left hover:opacity-80 transition-opacity cursor-pointer group"
          >
            <Logo />
          </button>

          <nav className="flex-1 flex justify-center items-center h-full">
            <div className="flex items-center">
              {modules.map((m, idx) => {
                const isActive = currentModule === m.id;
                const isDone = completedModules.includes(m.id as ModuleId);
                const isLocked = !isDone && !isActive && (m.id !== 1 && !completedModules.includes((m.id - 1) as ModuleId));
                const isNextBeingProcessed = isProcessing && currentModule === m.id;

                return (
                  <React.Fragment key={m.id}>
                    <div 
                      className="relative w-16 h-16 flex items-center justify-center"
                      onMouseEnter={() => !isLocked && setHoveredModule(m.id)}
                      onMouseLeave={() => setHoveredModule(null)}
                    >
                      <button
                        onClick={() => !isLocked && goToModule(m.id as ModuleId)}
                        disabled={isLocked}
                        className={`relative z-10 w-12 h-12 flex items-center justify-center transition-all duration-500 rounded-2xl ${
                          isActive 
                            ? 'text-white bg-[#003da5] scale-125 shadow-lg shadow-blue-200 ring-4 ring-blue-100 animate-pulse' 
                            : isDone 
                            ? 'text-blue-500 hover:text-blue-700 hover:bg-blue-50/50' 
                            : 'text-slate-300'
                        } ${isLocked ? 'cursor-not-allowed opacity-20' : 'cursor-pointer hover:scale-110'}`}
                      >
                        <m.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                      </button>

                      <AnimatePresence>
                        {hoveredModule === m.id && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute top-full mt-4 w-64 bg-slate-900 text-white p-4 rounded-2xl shadow-2xl z-50 pointer-events-none"
                          >
                            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 rotate-45" />
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 mb-1">
                              Step {m.id}: {m.title}
                            </p>
                            <p className="text-xs font-medium text-slate-300 leading-relaxed">
                              {m.description}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {idx < modules.length - 1 && (
                      <div className="w-24 flex items-center justify-center overflow-hidden">
                        <div className="relative w-16 h-[3px] bg-slate-100 rounded-full">
                          <motion.div 
                            initial={false}
                            animate={{ 
                              backgroundColor: isDone ? '#93c5fd' : '#f1f5f9' 
                            }}
                            className="absolute inset-0 rounded-full transition-colors duration-500"
                          />
                          {isNextBeingProcessed && (
                            <motion.div 
                              initial={{ x: "-100%" }}
                              animate={{ x: "100%" }}
                              transition={{ 
                                repeat: Infinity, 
                                duration: 1.5, 
                                ease: "linear" 
                              }}
                              className="absolute inset-0 bg-gradient-to-r from-transparent via-[#ed008c] to-transparent w-full"
                            />
                          )}
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </nav>

          <div className="flex items-center justify-end min-w-[280px]">
          </div>
        </div>
      </motion.header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-100/30 rounded-full mix-blend-multiply filter blur-[140px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-100/30 rounded-full mix-blend-multiply filter blur-[140px] animate-pulse delay-1000" />

        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="w-full max-w-7xl z-10 h-full flex flex-col"
        >
          <div className="bg-white/90 border border-white/60 backdrop-blur-3xl rounded-[4rem] shadow-[0_50px_100px_-20px_rgba(0,61,165,0.12)] p-4 md:p-10 flex-1 flex flex-col relative overflow-hidden min-h-[800px]">
            <div className="relative z-10 flex-1 flex flex-col h-full">
              {currentModule === 1 && <ResearchModule onNext={handleNext} currentData={briefData.researchText} onProcessing={setIsProcessing} />}
              {currentModule === 2 && <InsightsModule onNext={handleNext} research={briefData.researchText} extractedInsights={briefData.extractedInsights} selectedInsight={briefData.selectedInsight} onProcessing={setIsProcessing} />}
              {currentModule === 3 && <StrategyModule onNext={handleNext} briefData={briefData} onProcessing={setIsProcessing} />}
              {currentModule === 4 && <SummaryModule briefData={briefData} onReset={handleReset} onProcessing={setIsProcessing} />}
            </div>
          </div>
        </motion.div>
      </main>

      <footer className="p-10 bg-white/20 backdrop-blur-md border-t border-slate-100 flex flex-col items-center gap-6">
        <div className="flex gap-4">
          {modules.map((m) => (
            <motion.div 
              key={m.id}
              initial={false}
              animate={{ 
                width: currentModule === m.id ? 80 : (completedModules.includes(m.id as ModuleId) ? 40 : 16),
                backgroundColor: currentModule === m.id ? '#003da5' : (completedModules.includes(m.id as ModuleId) ? '#93c5fd' : '#e2e8f0')
              }}
              className="h-2 rounded-full shadow-sm"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] font-sans">
            P&G Strategic AI Engine v6.0 • Research Mode
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
