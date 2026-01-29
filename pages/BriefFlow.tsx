import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
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
  const { id: urlBriefId } = useParams<{ id?: string }>();
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
  // Start in loading state if we have a URL param (need to load the brief first)
  const [isLoadingBrief, setIsLoadingBrief] = useState(!!urlBriefId && dbConfigured);

  // Track changes made while away from Brief step
  const [briefDataSnapshot, setBriefDataSnapshot] = useState<BriefData | null>(null);
  const [hasChangedSinceSnapshot, setHasChangedSinceSnapshot] = useState(false);

  // Track if we've already attempted to auto-load (prevents infinite loop)
  const autoLoadAttempted = useRef(false);
  // Track if we've already attempted to sync store data (prevents infinite loop)
  const syncAttempted = useRef(false);

  // Load brief from URL param - this is the primary way to edit existing briefs
  // When navigating to /new/:id, we load that specific brief
  useEffect(() => {
    // Skip if we've already attempted to auto-load
    if (autoLoadAttempted.current) return;
    if (!dbConfigured) return;

    // If we have a URL param ID, always load that brief
    if (urlBriefId) {
      autoLoadAttempted.current = true;
      // isLoadingBrief already starts as true for URL params, but set it just in case
      if (!isLoadingBrief) setIsLoadingBrief(true);
      loadBrief(urlBriefId)
        .catch(err => {
          console.error('Failed to load brief from URL:', err);
          useBriefFlowStore.getState().reset();
          navigate('/briefs'); // Go back to repository on error
        })
        .finally(() => setIsLoadingBrief(false));
      return;
    }

    // Fallback: If no URL param but store has briefId with no data, try to reload
    // This handles page refresh on /new when store was persisted with briefId
    const shouldAutoLoad = briefId &&
      !rawDocumentText &&
      currentStep !== 'upload';

    if (shouldAutoLoad) {
      autoLoadAttempted.current = true;
      setIsLoadingBrief(true);
      loadBrief(briefId)
        .catch(err => {
          console.error('Failed to reload brief:', err);
          useBriefFlowStore.getState().reset();
        })
        .finally(() => setIsLoadingBrief(false));
    }
  }, [urlBriefId, briefId, rawDocumentText, dbConfigured, loadBrief, currentStep, navigate]);

  // Sync store data to local state on mount (for resuming briefs)
  useEffect(() => {
    // Only sync once - prevent infinite loops from array reference changes
    if (syncAttempted.current) return;
    if (storeLoaded) return;

    // Don't sync while still loading from database
    if (isLoadingBrief) return;

    // Wait until we have a briefId - required for syncing
    if (!briefId) {
      // If no briefId and not loading, we're starting fresh - mark as attempted
      if (!isLoadingBrief && !urlBriefId) {
        syncAttempted.current = true;
      }
      return;
    }

    // Check if we have ANY meaningful data to sync (don't require rawDocumentText)
    // This handles cases where raw_text might be missing but other data exists
    const hasDataToSync = rawDocumentText || insights.length > 0 || marketingSummary || pinkBrief;
    if (!hasDataToSync) {
      // No data but we have a briefId - mark as attempted to prevent loops
      syncAttempted.current = true;
      return;
    }

    // Mark sync as attempted before doing the actual sync
    syncAttempted.current = true;

    // There's existing data in the store - sync to local state
    const selectedInsight = selectedInsightId != null
      ? insights.find(i => Number(i.id) === Number(selectedInsightId)) || null
      : null;

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
    // Insights is only complete if we have insights AND a selected insight
    if (insights.length > 0 && selectedInsightId !== null) completed.push(2);
    if (marketingSummary) completed.push(3);
    if (pinkBrief) completed.push(4);
    setCompletedModules(completed);

    // Determine the correct module to show
    let targetModule = stepToModule[currentStep] || 0;

    // CRITICAL: If we have insights but no selected insight, force user to Insights step
    // This prevents the "Brief content not available" error
    if (insights.length > 0 && selectedInsightId === null && targetModule > 2) {
      targetModule = 2; // Force to Insights step
    }

    setCurrentModule(targetModule);

    // Mark as loaded only after syncing
    setStoreLoaded(true);
  }, [briefId, rawDocumentText, insights, selectedInsightId, marketingSummary, pinkBrief, categoryContext, currentStep, storeLoaded, isLoadingBrief, urlBriefId]);

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
      // Mark that changes were made if we have a snapshot (i.e., navigated back from Brief)
      if (briefDataSnapshot) {
        setHasChangedSinceSnapshot(true);
      }
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

  // Check if briefData has changed compared to snapshot
  const hasDataChanged = (current: BriefData, snapshot: BriefData | null): boolean => {
    if (!snapshot) return false;
    // Compare key fields that affect the brief output
    if (current.selectedInsight?.id !== snapshot.selectedInsight?.id) return true;
    if (current.selectedInsight?.insight_text !== snapshot.selectedInsight?.insight_text) return true;
    if (current.redThreadEssence !== snapshot.redThreadEssence) return true;
    if (JSON.stringify(current.marketingSummarySections) !== JSON.stringify(snapshot.marketingSummarySections)) return true;
    return false;
  };

  const goToModule = (id: ExtendedModuleId) => {
    if (id === 0 || completedModules.includes((id - 1) as ExtendedModuleId) || completedModules.includes(id)) {
      // If leaving Brief step to go backwards, take a snapshot for comparison
      if (currentModule === 4 && id < 4 && briefData.pinkBrief) {
        if (!briefDataSnapshot) {
          setBriefDataSnapshot({ ...briefData });
        }
      }

      // If going TO Brief step, check if data has changed
      if (id === 4 && briefDataSnapshot) {
        const changed = hasChangedSinceSnapshot || hasDataChanged(briefData, briefDataSnapshot);
        if (changed) {
          setShowRegenerateDialog(true);
        } else {
          // No changes, clear snapshot and navigate
          setBriefDataSnapshot(null);
          setHasChangedSinceSnapshot(false);
          setCurrentModule(id);
        }
      } else {
        setCurrentModule(id);
      }
    }
  };

  // Handle confirming regeneration (user wants to apply changes and regenerate)
  const handleConfirmRegenerate = () => {
    // Clear pinkBrief to trigger regeneration, keep the changes
    setBriefData(prev => ({ ...prev, pinkBrief: null }));
    // Remove Brief from completed modules
    setCompletedModules(prev => prev.filter(m => m !== 4));
    // Clear snapshot state
    setBriefDataSnapshot(null);
    setHasChangedSinceSnapshot(false);
    // Navigate to Brief step
    setCurrentModule(4);
    setShowRegenerateDialog(false);
  };

  // Handle canceling regeneration (user wants to keep current brief, discard changes)
  const handleCancelRegenerate = () => {
    // Restore the original data from snapshot
    if (briefDataSnapshot) {
      setBriefData(briefDataSnapshot);
    }
    // Clear snapshot state
    setBriefDataSnapshot(null);
    setHasChangedSinceSnapshot(false);
    // Navigate to Brief step with original content
    setCurrentModule(4);
    setShowRegenerateDialog(false);
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

      {/* Draft banner - shown when editing an existing brief that's not yet complete */}
      {briefId && !pinkBrief && (
        <div className="bg-[#fff8e1] border-b border-[#ffc107] px-8 py-2 flex items-center justify-between shrink-0">
          <p className="text-sm text-[#795548]">
            <span className="font-medium">Draft Brief</span> — Your progress is automatically saved
          </p>
          <button
            onClick={() => navigate('/briefs')}
            className="text-sm text-[#795548] hover:text-[#5d4037] font-medium"
          >
            Back to Repository
          </button>
        </div>
      )}

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
        title="Apply Changes?"
        message="You've made changes to previous steps. Would you like to regenerate the Pink Brief with your changes, or keep the current brief and discard your edits?"
        confirmLabel="Regenerate Brief"
        cancelLabel="Keep Current Brief"
        variant="warning"
        onConfirm={handleConfirmRegenerate}
        onCancel={handleCancelRegenerate}
      />
    </div>
  );
};

export default BriefFlow;
