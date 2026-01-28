import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  Lightbulb,
  Layers,
  FileText,
  Package,
  Check,
  Loader2
} from 'lucide-react';
import { ModuleId, BriefData, INITIAL_BRIEF_DATA } from '../types';
import { useBriefFlowStore } from '../lib/stores/briefFlowStore';
import { isSupabaseConfigured } from '../lib/supabase/client';
import ProductSelector from '../components/ProductSelector';
import ResearchModule from '../components/ResearchModule';
import InsightsModule from '../components/InsightsModule';
import StrategyModule from '../components/StrategyModule';
import SummaryModule from '../components/SummaryModule';
import AIProviderToggle from '../components/AIProviderToggle';
import ConfirmDialog from '../components/ConfirmDialog';

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
    loadBrief,
    isSaving,
    lastSaved,
    briefId,
    currentStep,
    rawDocumentText,
    categoryContext,
    insights,
    selectedInsightId,
    marketingSummary,
    pinkBrief,
  } = useBriefFlowStore();

  // Map store step to module ID
  const stepToModule: Record<string, ExtendedModuleId> = {
    'product': 0,
    'upload': 1,
    'insights': 2,
    'strategy': 3,
    'brief': 4,
  };

  // Local state for the flow - initialize from store if available
  const initialModule = briefId ? stepToModule[currentStep] || 0 : 0;
  const [currentModule, setCurrentModule] = useState<ExtendedModuleId>(initialModule);
  const [briefData, setBriefData] = useState<BriefData>(INITIAL_BRIEF_DATA);
  const [completedModules, setCompletedModules] = useState<ExtendedModuleId[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [storeLoaded, setStoreLoaded] = useState(false);

  // Regeneration confirmation dialog state
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  const [pendingModule, setPendingModule] = useState<ExtendedModuleId | null>(null);
  const [isLoadingBrief, setIsLoadingBrief] = useState(false);

  // Auto-load brief from database if we have a briefId but no data
  // This handles the case where user returns after a page refresh
  // Skip if currentStep is 'upload' - that means we just created a new brief
  useEffect(() => {
    const shouldAutoLoad = briefId &&
      !rawDocumentText &&
      !isLoadingBrief &&
      dbConfigured &&
      currentStep !== 'upload'; // Don't auto-load for newly created briefs

    if (shouldAutoLoad) {
      setIsLoadingBrief(true);
      loadBrief(briefId)
        .catch(err => {
          console.error('Failed to reload brief:', err);
          // If loading fails, reset the store
          useBriefFlowStore.getState().reset();
        })
        .finally(() => setIsLoadingBrief(false));
    }
  }, [briefId, rawDocumentText, dbConfigured, isLoadingBrief, loadBrief, currentStep]);

  // Sync store data to local state on mount (for resuming briefs)
  useEffect(() => {
    // Only sync once when we have valid data from the store
    if (storeLoaded) return;

    // Wait until we have data to sync
    if (!briefId || !rawDocumentText) return;

    // There's existing data in the store - sync to local state
    const selectedInsight = insights.find(i => i.id === selectedInsightId) || null;

    setBriefData({
      researchText: rawDocumentText,
      extractedInsights: insights.map(i => ({
        id: i.id,
        insight_headline: i.insight_headline,
        insight_text: i.insight_text,
        verbatims: i.verbatims,
        relevance_score: i.relevance_score,
        tension_type: i.tension_type,
        jtbd: i.jtbd,
      })),
      categoryContext: categoryContext,
      selectedInsight: selectedInsight ? {
        id: selectedInsight.id,
        insight_headline: selectedInsight.insight_headline,
        insight_text: selectedInsight.insight_text,
        verbatims: selectedInsight.verbatims,
        relevance_score: selectedInsight.relevance_score,
        tension_type: selectedInsight.tension_type,
        jtbd: selectedInsight.jtbd,
      } : null,
      marketingSummarySections: marketingSummary?.sections || [],
      redThreadEssence: marketingSummary?.red_thread_essence || '',
      pinkBrief: pinkBrief ? {
        business_objective: pinkBrief.business_objective,
        consumer_problem: pinkBrief.consumer_problem,
        communication_challenge: pinkBrief.communication_challenge,
        message_strategy: pinkBrief.message_strategy,
        insights: pinkBrief.insights,
        execution: pinkBrief.execution,
      } : null,
    });

    // Set completed modules based on progress
    const completed: ExtendedModuleId[] = [0]; // Product always done if we have a briefId
    if (rawDocumentText) completed.push(1);
    if (insights.length > 0) completed.push(2);
    if (marketingSummary) completed.push(3);
    if (pinkBrief) completed.push(4);
    setCompletedModules(completed);

    // Set current module based on step
    setCurrentModule(stepToModule[currentStep] || 0);

    // Mark as loaded only after syncing
    setStoreLoaded(true);
  }, [briefId, rawDocumentText, insights, selectedInsightId, marketingSummary, pinkBrief, categoryContext, currentStep, storeLoaded]);

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
      // If navigating to an earlier step and Brief has been generated, warn user
      // This applies when going to Research, Insights, or Strategy while a Brief exists
      if (id < 4 && id < currentModule && briefData.pinkBrief) {
        setPendingModule(id);
        setShowRegenerateDialog(true);
      } else {
        setCurrentModule(id);
      }
    }
  };

  // Handle confirming regeneration (user wants to edit and regenerate)
  const handleConfirmRegenerate = () => {
    if (pendingModule !== null) {
      // Clear pinkBrief since user will be making changes
      setBriefData(prev => ({ ...prev, pinkBrief: null }));
      // Remove Brief from completed modules
      setCompletedModules(prev => prev.filter(m => m !== 4));
      setCurrentModule(pendingModule);
    }
    setShowRegenerateDialog(false);
    setPendingModule(null);
  };

  // Handle canceling regeneration (user wants to stay on Brief)
  const handleCancelRegenerate = () => {
    setShowRegenerateDialog(false);
    setPendingModule(null);
  };

  // Show loading state while reloading brief from database
  if (isLoadingBrief) {
    return (
      <div className="min-h-screen bg-[#f4f4f4] flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={32} className="text-[#0f62fe] animate-spin mx-auto mb-4" />
          <p className="text-sm text-[#6f6f6f]">Loading your brief...</p>
        </div>
      </div>
    );
  }

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

        <div className="flex items-center gap-4">
          {/* AI Provider Toggle */}
          <AIProviderToggle />

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
        </div>
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
                  onBack={() => setCurrentModule(2)}
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

      {/* Regeneration confirmation dialog */}
      <ConfirmDialog
        isOpen={showRegenerateDialog}
        title="Regenerate Brief?"
        message="Going back to edit previous steps will require regenerating the Pink Brief. Your current brief content will be replaced when you proceed to the Brief step again."
        confirmLabel="Edit & Regenerate"
        cancelLabel="Stay on Brief"
        variant="warning"
        onConfirm={handleConfirmRegenerate}
        onCancel={handleCancelRegenerate}
      />
    </div>
  );
};

export default BriefFlow;
