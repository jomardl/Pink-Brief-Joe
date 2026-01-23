
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UploadCloud, 
  Lightbulb,
  PlusCircle,
  FolderOpen,
  BookOpen,
  CheckCircle,
  Target,
  Users
} from 'lucide-react';
import { ModuleId, BriefData, INITIAL_BRIEF_DATA } from './types.ts';
import ResearchModule from './components/ResearchModule.tsx';
import InsightsModule from './components/InsightsModule.tsx';
import ObjectiveModule from './components/ObjectiveModule.tsx';
import PersonaModule from './components/PersonaModule.tsx';
import StrategyModule from './components/StrategyModule.tsx';
import SummaryModule from './components/SummaryModule.tsx';

const App: React.FC = () => {
  const [appStarted, setAppStarted] = useState(false);
  const [currentModule, setCurrentModule] = useState<ModuleId>(1);
  const [briefData, setBriefData] = useState<BriefData>(INITIAL_BRIEF_DATA);
  const [completedModules, setCompletedModules] = useState<ModuleId[]>([]);
  const [hoveredModule, setHoveredModule] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const modules = [
    { id: 1, title: 'Upload', icon: UploadCloud, description: 'Import consumer verbatims and research' },
    { id: 2, title: 'Insights', icon: Lightbulb, description: 'Identify the primary human truth' },
    { id: 3, title: 'Objective', icon: Target, description: 'Define the business mission' },
    { id: 4, title: 'Persona', icon: Users, description: 'Visualize the target consumer' },
    { id: 5, title: 'Strategy', icon: BookOpen, description: 'The deep strategic narrative' },
    { id: 6, title: 'Pink Brief', icon: CheckCircle, description: 'Final standardized output' }
  ];

  const handleNext = (nextData?: Partial<BriefData>) => {
    if (nextData) {
      setBriefData(prev => ({ ...prev, ...nextData }));
    }
    if (!completedModules.includes(currentModule)) {
      setCompletedModules(prev => [...prev, currentModule]);
    }
    if (currentModule < 6) {
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
    const isClickable = id === 1 || completedModules.includes((id - 1) as ModuleId) || completedModules.includes(id);
    if (isClickable) {
      setCurrentModule(id);
    }
  };

  const Logo = ({ isLanding = false }: { isLanding?: boolean }) => (
    <motion.div layoutId="brandContainer" className={`flex items-center ${isLanding ? 'flex-col gap-8' : 'gap-4'}`}>
      <motion.div layoutId="brandCircle" className={`${isLanding ? 'w-24 h-24' : 'w-10 h-10'} bg-[#003da5] rounded-full flex items-center justify-center shadow-2xl`}>
        <span className="text-white font-bold" style={{ fontFamily: 'Georgia, serif' }}>P&G</span>
      </motion.div>
      <div className={`flex flex-col ${isLanding ? 'items-center text-center' : ''}`}>
        <motion.h1 layoutId="brandTitle" className={`${isLanding ? 'text-6xl' : 'text-sm'} font-black text-slate-900 tracking-tighter uppercase`}>
          <span className="text-[#ed008c]">PINK BRIEF</span> <span className="text-[#003da5]">ARCHITECT</span>
        </motion.h1>
      </div>
    </motion.div>
  );

  if (!appStarted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50" />
        <div className="z-10 flex flex-col items-center gap-12">
          <Logo isLanding={true} />
          <div className="flex gap-6">
            <motion.button whileHover={{ scale: 1.05 }} onClick={() => setAppStarted(true)} className="px-12 py-6 bg-[#003da5] text-white rounded-3xl font-black uppercase tracking-widest shadow-2xl flex items-center gap-4">
              <PlusCircle size={20} /> New Strategic Brief
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <motion.header initial={{ y: -100 }} animate={{ y: 0 }} className="sticky top-0 z-[100] h-20 bg-white/95 border-b border-slate-200 backdrop-blur-xl">
        <div className="max-w-[1400px] mx-auto h-full px-8 flex items-center justify-between">
          <button onClick={handleReset} className="hover:opacity-80 transition-opacity"><Logo /></button>
          <nav className="flex items-center">
            {modules.map((m, idx) => {
              const isActive = currentModule === m.id;
              const isDone = completedModules.includes(m.id as ModuleId);
              const isLocked = !isDone && !isActive && (m.id !== 1 && !completedModules.includes((m.id - 1) as ModuleId));
              return (
                <React.Fragment key={m.id}>
                  <button 
                    onClick={() => !isLocked && goToModule(m.id as ModuleId)}
                    onMouseEnter={() => !isLocked && setHoveredModule(m.id)}
                    onMouseLeave={() => setHoveredModule(null)}
                    className={`relative w-12 h-12 flex items-center justify-center transition-all rounded-2xl ${isActive ? 'bg-[#003da5] text-white scale-125 shadow-xl ring-4 ring-blue-100' : isDone ? 'text-blue-500 bg-blue-50' : 'text-slate-300'} ${isLocked ? 'opacity-20 cursor-not-allowed' : 'hover:scale-110'}`}
                  >
                    <m.icon size={20} />
                    {hoveredModule === m.id && (
                      <div className="absolute top-full mt-4 w-48 bg-slate-900 text-white p-3 rounded-xl text-[10px] uppercase font-black tracking-widest pointer-events-none z-50">
                        {m.title}
                      </div>
                    )}
                  </button>
                  {idx < modules.length - 1 && <div className="w-12 h-[2px] bg-slate-100 mx-2" />}
                </React.Fragment>
              );
            })}
          </nav>
          <div className="min-w-[200px]" />
        </div>
      </motion.header>

      <main className="flex-1 p-12 flex flex-col items-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-7xl bg-white rounded-[3rem] shadow-2xl p-10 min-h-[700px]">
          {currentModule === 1 && <ResearchModule onNext={handleNext} currentData={briefData.researchText} onProcessing={setIsProcessing} />}
          {currentModule === 2 && <InsightsModule onNext={handleNext} research={briefData.researchText} extractedInsights={briefData.extractedInsights} selectedInsight={briefData.selectedInsight} onProcessing={setIsProcessing} />}
          {currentModule === 3 && <ObjectiveModule onNext={handleNext} research={briefData.researchText} selectedInsight={briefData.selectedInsight} currentData={briefData.strategicObjective || ''} />}
          {currentModule === 4 && <PersonaModule onNext={handleNext} research={briefData.researchText} selectedInsight={briefData.selectedInsight} currentData={briefData.targetAudience!} />}
          {currentModule === 5 && <StrategyModule onNext={handleNext} briefData={briefData} onProcessing={setIsProcessing} />}
          {currentModule === 6 && <SummaryModule briefData={briefData} onReset={handleReset} onProcessing={setIsProcessing} />}
        </motion.div>
      </main>
    </div>
  );
};

export default App;
