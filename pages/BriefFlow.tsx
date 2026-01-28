import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  Lightbulb,
  Layers,
  FileText,
  Package,
  Check
} from 'lucide-react';
import { ModuleId, BriefData, INITIAL_BRIEF_DATA } from '../types';
import { useBriefFlowStore } from '../lib/stores/briefFlowStore';
import { isSupabaseConfigured } from '../lib/supabase/client';
import ProductSelector from '../components/ProductSelector';
import ResearchModule from '../components/ResearchModule';
import InsightsModule from '../components/InsightsModule';
import StrategyModule from '../components/StrategyModule';
import SummaryModule from '../components/SummaryModule';

type ExtendedModuleId = 0 | ModuleId; // 0 = product selection

const BriefFlow: React.FC = () => {
  const navigate = useNavigate();
  const dbConfigured = isSupabaseConfigured();

  // Zustand store
  const {
    product,
    setProduct,
    userName,
    setUserName,
    createBrief,
    isSaving,
    lastSaved,
    briefId,
  } = useBriefFlowStore();

  // Local state for the flow
  const [currentModule, setCurrentModule] = useState<ExtendedModuleId>(0);
  const [briefData, setBriefData] = useState<BriefData>(INITIAL_BRIEF_DATA);
  const [completedModules, setCompletedModules] = useState<ExtendedModuleId[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const modules = [
    { id: 0, title: 'Product', icon: Package },
    { id: 1, title: 'Research', icon: Upload },
    { id: 2, title: 'Insights', icon: Lightbulb },
    { id: 3, title: 'Strategy', icon: Layers },
    { id: 4, title: 'Brief', icon: FileText }
  ];

  const handleProductSelect = (selectedProduct: { id: string | null; name: string; isOther: boolean }) => {
    setProduct(selectedProduct);
  };

  const handleProductContinue = async () => {
    if (!product) return;

    // Create brief in Supabase if configured
    if (dbConfigured) {
      try {
        await createBrief();
      } catch (err) {
        console.error('Failed to create brief:', err);
        // Continue anyway for now
      }
    }

    setCompletedModules([0]);
    setCurrentModule(1);
  };

  const handleNext = (nextData?: Partial<BriefData>) => {
    if (nextData) {
      setBriefData(prev => ({ ...prev, ...nextData }));
    }
    if (!completedModules.includes(currentModule)) {
      setCompletedModules(prev => [...prev, currentModule]);
    }
    if (currentModule < 4) {
      setCurrentModule((currentModule + 1) as ExtendedModuleId);
    }
  };

  const handleReset = () => {
    navigate('/');
  };

  const goToModule = (id: ExtendedModuleId) => {
    if (id === 0 || completedModules.includes((id - 1) as ExtendedModuleId) || completedModules.includes(id)) {
      setCurrentModule(id);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f4f4]">
      {/* Header */}
      <header className="h-12 bg-[#161616] flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center">
          <Link to="/">
            <img
              src="/pg-seeklogo.svg"
              alt="P&G"
              className="w-[30px] my-[5px]"
            />
          </Link>
          <span className="mx-3 text-[#525252]">/</span>
          <span className="text-[#c6c6c6] text-sm">Pink Brief Architect</span>
          {product && (
            <>
              <span className="mx-3 text-[#525252]">/</span>
              <span className="text-[#c6c6c6] text-sm">{product.name}</span>
            </>
          )}
        </div>

        {/* Save status indicator */}
        {dbConfigured && briefId && (
          <div className="flex items-center gap-2 text-xs text-[#6f6f6f]">
            {isSaving ? (
              <span className="animate-pulse">Saving...</span>
            ) : lastSaved ? (
              <span>Saved</span>
            ) : null}
          </div>
        )}
      </header>

      {/* Progress bar */}
      <nav className="h-16 bg-white border-b border-[#e0e0e0] px-8 flex items-center shrink-0">
        <div className="max-w-5xl mx-auto w-full flex items-center">
          {modules.map((m, idx) => {
            const isActive = currentModule === m.id;
            const isDone = completedModules.includes(m.id as ExtendedModuleId);
            const isLocked = !isDone && !isActive && (m.id !== 0 && !completedModules.includes((m.id - 1) as ExtendedModuleId));

            return (
              <React.Fragment key={m.id}>
                <button
                  onClick={() => !isLocked && goToModule(m.id as ExtendedModuleId)}
                  disabled={isLocked}
                  className={`flex items-center gap-3 py-2 px-4 transition-colors duration-150 ${
                    isLocked
                      ? 'opacity-30 cursor-not-allowed'
                      : 'cursor-pointer hover:bg-[#f4f4f4]'
                  }`}
                >
                  <div className={`w-8 h-8 flex items-center justify-center text-sm font-mono transition-colors duration-150 ${
                    isActive
                      ? 'bg-[#0f62fe] text-white'
                      : isDone
                      ? 'bg-[#161616] text-white'
                      : 'bg-[#e0e0e0] text-[#525252]'
                  }`}>
                    {isDone ? <Check size={14} strokeWidth={2.5} /> : m.id}
                  </div>
                  <span className={`text-sm font-medium transition-colors duration-150 ${
                    isActive ? 'text-[#161616]' : 'text-[#525252]'
                  }`}>
                    {m.title}
                  </span>
                </button>

                {idx < modules.length - 1 && (
                  <div className="flex-1 flex items-center justify-center px-2">
                    <div className={`h-px flex-1 max-w-[60px] transition-colors duration-150 ${
                      isDone ? 'bg-[#161616]' : 'bg-[#e0e0e0]'
                    }`} />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentModule}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {currentModule === 0 && (
                <ProductSelector
                  onSelect={handleProductSelect}
                  onContinue={handleProductContinue}
                  initialValue={product || undefined}
                  userName={userName}
                  onUserNameChange={setUserName}
                />
              )}
              {currentModule === 1 && (
                <ResearchModule
                  onNext={handleNext}
                  currentData={briefData.researchText}
                  onProcessing={setIsProcessing}
                />
              )}
              {currentModule === 2 && (
                <InsightsModule
                  onNext={handleNext}
                  research={briefData.researchText}
                  extractedInsights={briefData.extractedInsights}
                  selectedInsight={briefData.selectedInsight}
                  categoryContext={briefData.categoryContext}
                  onProcessing={setIsProcessing}
                />
              )}
              {currentModule === 3 && (
                <StrategyModule
                  onNext={handleNext}
                  briefData={briefData}
                  onProcessing={setIsProcessing}
                />
              )}
              {currentModule === 4 && (
                <SummaryModule
                  briefData={briefData}
                  onReset={handleReset}
                  onProcessing={setIsProcessing}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Footer status */}
      <footer className="h-10 bg-white border-t border-[#e0e0e0] px-8 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-[#0f62fe] animate-pulse' : 'bg-[#24a148]'}`} />
          <span className="text-xs text-[#6f6f6f] font-mono">
            {isProcessing ? 'Processing...' : 'Ready'}
          </span>
        </div>
        <span className="text-xs text-[#6f6f6f] font-mono">
          Step {currentModule} of 4
        </span>
      </footer>
    </div>
  );
};

export default BriefFlow;
