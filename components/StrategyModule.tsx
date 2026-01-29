
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  Edit3,
  Check,
  Save,
  AlertCircle,
  RefreshCcw,
  ArrowRight,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { performStrategicSynthesis } from '../aiService';
import { BriefData, StrategicSection } from '../types';
import { useBriefFlowStore } from '../lib/stores/briefFlowStore';
import ConfirmDialog from './ConfirmDialog';

interface Props {
  onNext: (data: Partial<BriefData>) => void;
  onBack?: () => void;
  briefData: BriefData;
  onProcessing: (val: boolean) => void;
}

const TIMEOUT_MS = 90000; // 90 seconds for Claude's longer synthesis

const StrategyModule: React.FC<Props> = ({ onNext, onBack, briefData, onProcessing }) => {
  const {
    setMarketingSummary,
    marketingSummary: storeMarketingSummary,
    pinkBrief,
    insights: storeInsights,
    selectedInsightId: storeSelectedInsightId,
  } = useBriefFlowStore();

  // Initialize from store's marketingSummary if available, otherwise from briefData props
  const initialSections = storeMarketingSummary?.sections || briefData.marketingSummarySections || [];
  const initialEssence = storeMarketingSummary?.red_thread_essence || briefData.redThreadEssence || "Red Thread";
  const initialUnlock = storeMarketingSummary?.red_thread_unlock || "The Strategic Unlock";

  const [sections, setSections] = useState<StrategicSection[]>(initialSections);
  const [summaryMeta, setSummaryMeta] = useState({ essence: initialEssence, unlock: initialUnlock });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<string | null>(null);

  // Track if strategy has been modified since viewing (for regenerate banner)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);

  const fetchAttempted = useRef(false);

  // Check if a pink brief already exists (check both store and props)
  const hasBrief = !!(
    (pinkBrief && pinkBrief.business_objective) ||
    (briefData.pinkBrief && briefData.pinkBrief.business_objective)
  );

  // Sync from store if it gets populated after mount (e.g., when loading a saved brief)
  useEffect(() => {
    if (storeMarketingSummary?.sections && storeMarketingSummary.sections.length > 0 && sections.length === 0) {
      setSections(storeMarketingSummary.sections);
      setSummaryMeta({
        essence: storeMarketingSummary.red_thread_essence || "Red Thread",
        unlock: storeMarketingSummary.red_thread_unlock || "The Strategic Unlock"
      });
      fetchAttempted.current = true; // Prevent synthesis from running
      if (storeMarketingSummary.sections.length > 0) {
        setExpandedSection(storeMarketingSummary.sections[0].id);
      }
    }
  }, [storeMarketingSummary, sections.length]);

  const runSynthesis = async () => {
    setIsLoading(true);
    onProcessing(true);
    setError(null);

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Synthesis timed out. Please try again.")), TIMEOUT_MS)
    );

    try {
      const result: any = await Promise.race([
        performStrategicSynthesis(briefData.researchText, briefData.selectedInsight?.insight_text || ''),
        timeoutPromise
      ]);

      if (result && result.sections) {
        setSections(result.sections);
        setSummaryMeta({
          essence: result.redThreadEssence || "Red Thread",
          unlock: result.redThreadUnlock || "The Strategic Unlock"
        });
        if (result.sections.length > 0) setExpandedSection(result.sections[0].id);
      } else {
        throw new Error("Invalid synthesis result.");
      }
    } catch (err: any) {
      console.error("Strategic Module Error:", err);
      setError(err.message || "Synthesis failed. Please try again.");
    } finally {
      setIsLoading(false);
      onProcessing(false);
    }
  };

  useEffect(() => {
    const initSynthesis = async () => {
      if (fetchAttempted.current || isLoading) return;
      if (sections.length > 0) {
        fetchAttempted.current = true;
        return;
      }

      fetchAttempted.current = true;
      runSynthesis();
    };

    initSynthesis();
  }, []);

  const updateSectionContent = (id: string, field: 'content' | 'summary', val: string) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, [field]: val } : s));
    setHasUnsavedChanges(true);
  };

  const saveAndContinue = (shouldRegenerate: boolean) => {
    // Save marketing summary to store (auto-saves to DB)
    setMarketingSummary({
      red_thread_essence: summaryMeta.essence,
      red_thread_unlock: summaryMeta.unlock,
      sections: sections.map(s => ({
        id: s.id,
        title: s.title,
        purpose: s.purpose,
        summary: s.summary,
        content: s.content,
      })),
    });

    // Get existing brief from store or props
    const existingBrief = pinkBrief || briefData.pinkBrief;

    // Get selectedInsight from props, or fall back to store
    const effectiveSelectedInsight = briefData.selectedInsight || (() => {
      if (storeSelectedInsightId != null && storeInsights.length > 0) {
        const found = storeInsights.find(i => Number(i.id) === Number(storeSelectedInsightId));
        if (found) {
          return {
            id: found.id,
            insight_headline: found.insight_headline,
            insight_text: found.insight_text,
            verbatims: found.verbatims,
            relevance_score: found.relevance_score,
            tension_type: found.tension_type,
            jtbd: found.jtbd,
          };
        }
      }
      return null;
    })();

    onNext({
      marketingSummarySections: sections,
      redThreadEssence: summaryMeta.essence,
      redThread: [],
      // Preserve selectedInsight - required for brief generation
      selectedInsight: effectiveSelectedInsight,
      // Clear pinkBrief if regenerating so SummaryModule knows to generate new
      // Otherwise preserve the existing brief
      pinkBrief: shouldRegenerate ? null : existingBrief
    });
  };

  const handleContinue = () => {
    if (hasBrief && !hasUnsavedChanges) {
      // Brief exists and no edits made - just continue
      saveAndContinue(false);
    } else if (!hasBrief) {
      // No brief exists - generate new one
      saveAndContinue(true);
    }
    // If hasBrief && hasUnsavedChanges, the regenerate banner handles this
  };

  const handleRegenerateBrief = () => {
    setShowRegenerateConfirm(true);
  };

  const confirmRegenerate = () => {
    setShowRegenerateConfirm(false);
    setHasUnsavedChanges(false);
    saveAndContinue(true);
  };

  // Error state
  if (error) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center">
        <div className="w-16 h-16 bg-[#fff1f1] flex items-center justify-center mx-auto mb-6">
          <AlertCircle size={32} className="text-[#da1e28]" />
        </div>
        <h3 className="text-2xl font-light text-[#161616] mb-2">Synthesis failed</h3>
        <p className="text-sm text-[#525252] mb-6">{error}</p>

        <div className="flex flex-col gap-3 items-center">
          <button
            onClick={() => {
              setError(null);
              runSynthesis();
            }}
            className="h-12 px-6 bg-[#0f62fe] text-white text-sm font-medium flex items-center gap-2 hover:bg-[#0353e9] transition-colors"
          >
            <RefreshCcw size={16} /> Try Again
          </button>

          {onBack && (
            <button
              onClick={onBack}
              className="h-10 px-4 text-[#525252] text-sm font-medium flex items-center gap-2 hover:bg-[#f4f4f4] transition-colors"
            >
              <ArrowLeft size={16} /> Back to Insights
            </button>
          )}
        </div>

        <p className="text-xs text-[#6f6f6f] mt-6">
          Your research and insights are preserved. You won't lose any progress.
        </p>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center">
        <div className="w-16 h-16 bg-[#edf5ff] flex items-center justify-center mx-auto mb-6">
          <Loader2 size={32} className="text-[#0f62fe] animate-spin" />
        </div>
        <h3 className="text-2xl font-light text-[#161616] mb-2">Synthesizing strategy</h3>
        <p className="text-sm text-[#525252] mb-8">
          Analyzing research and building strategic narrative...
        </p>
        <div className="w-64 h-1 bg-[#e0e0e0] mx-auto overflow-hidden">
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            className="w-full h-full bg-[#0f62fe]"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-mono text-[#6f6f6f] uppercase tracking-wider mb-2">
          Step 3
        </p>
        <h2 className="text-3xl font-light text-[#161616] tracking-tight mb-2">
          Strategic Framework
        </h2>
        <p className="text-sm text-[#525252] leading-relaxed">
          Review and refine the strategic narrative built from your research.
        </p>
      </div>

      {/* Red Thread Banner */}
      <div className="mb-8 grid grid-cols-2 gap-px bg-[#e0e0e0]">
        <div className="bg-[#161616] p-6">
          <p className="text-xs font-mono text-[#6f6f6f] uppercase tracking-wider mb-2">Essence</p>
          <p className="text-xl font-medium text-white">{summaryMeta.essence}</p>
        </div>
        <div className="bg-[#393939] p-6">
          <p className="text-xs font-mono text-[#6f6f6f] uppercase tracking-wider mb-2">The Unlock</p>
          <p className="text-lg text-[#f4f4f4] italic">{summaryMeta.unlock}</p>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-2 mb-8">
        {sections.map((section, idx) => {
          const isExpanded = expandedSection === section.id;
          const isEditing = editingSection === section.id;

          return (
            <div
              key={section.id}
              className={`bg-white border transition-colors duration-150 ${
                isExpanded ? 'border-[#0f62fe]' : 'border-[#e0e0e0]'
              }`}
            >
              {/* Section header */}
              <button
                onClick={() => !isEditing && setExpandedSection(isExpanded ? null : section.id)}
                className="w-full p-6 flex items-center justify-between text-left hover:bg-[#f4f4f4] transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 flex items-center justify-center text-sm font-mono ${
                    isExpanded ? 'bg-[#0f62fe] text-white' : 'bg-[#e0e0e0] text-[#525252]'
                  }`}>
                    {idx + 1}
                  </div>
                  <div>
                    <h3 className={`text-base font-medium ${isExpanded ? 'text-[#0f62fe]' : 'text-[#161616]'}`}>
                      {section.title}
                    </h3>
                    <p className="text-xs text-[#6f6f6f]">{section.purpose}</p>
                  </div>
                </div>
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  className="text-[#6f6f6f]"
                >
                  <ChevronDown size={20} />
                </motion.div>
              </button>

              {/* Section content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6 border-t border-[#e0e0e0]">
                      {/* Summary */}
                      <div className="py-4 border-b border-[#e0e0e0]">
                        <p className="text-xs font-mono text-[#6f6f6f] uppercase tracking-wider mb-2">Summary</p>
                        {isEditing ? (
                          <textarea
                            value={section.summary}
                            onChange={(e) => updateSectionContent(section.id, 'summary', e.target.value)}
                            className="w-full p-3 bg-[#f4f4f4] border border-[#e0e0e0] text-sm text-[#161616] focus:outline-none focus:border-[#0f62fe] resize-none h-20"
                          />
                        ) : (
                          <p className="text-sm font-medium text-[#161616]">{section.summary}</p>
                        )}
                      </div>

                      {/* Content */}
                      <div className="py-4">
                        <p className="text-xs font-mono text-[#6f6f6f] uppercase tracking-wider mb-2">Detail</p>
                        {isEditing ? (
                          <textarea
                            value={section.content}
                            onChange={(e) => updateSectionContent(section.id, 'content', e.target.value)}
                            className="w-full p-3 bg-[#f4f4f4] border border-[#e0e0e0] text-sm text-[#161616] focus:outline-none focus:border-[#0f62fe] resize-none min-h-[200px]"
                          />
                        ) : (
                          <p className="text-sm text-[#525252] leading-relaxed whitespace-pre-wrap">
                            {section.content}
                          </p>
                        )}
                      </div>

                      {/* Edit controls */}
                      <div className="flex justify-end gap-2 pt-4">
                        {isEditing ? (
                          <button
                            onClick={() => setEditingSection(null)}
                            className="h-10 px-4 bg-[#0f62fe] text-white text-sm font-medium flex items-center gap-2 hover:bg-[#0353e9] transition-colors"
                          >
                            <Save size={14} /> Save
                          </button>
                        ) : (
                          <button
                            onClick={() => setEditingSection(section.id)}
                            className="h-10 px-4 bg-[#f4f4f4] text-[#525252] text-sm font-medium flex items-center gap-2 hover:bg-[#e0e0e0] transition-colors"
                          >
                            <Edit3 size={14} /> Edit
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Regenerate Brief Banner - shown when brief exists and strategy has been modified */}
      {hasBrief && hasUnsavedChanges && (
        <div className="mb-6 p-4 bg-[#fff1f1] border border-[#ffb3b8]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#161616]">Strategy has been modified</p>
              <p className="text-xs text-[#525252]">
                Would you like to regenerate the Pink Brief based on your changes?
              </p>
            </div>
            <button
              onClick={handleRegenerateBrief}
              className="h-10 px-4 bg-[#da1e28] text-white text-sm font-medium flex items-center gap-2 hover:bg-[#ba1b23] transition-colors"
            >
              <RefreshCcw size={16} />
              Regenerate Brief
            </button>
          </div>
        </div>
      )}

      {/* Continue button - only show if no edits have been made, or no brief exists yet */}
      {(!hasBrief || !hasUnsavedChanges) && (
        <div className="flex justify-end pt-4 border-t border-[#e0e0e0]">
          <button
            onClick={handleContinue}
            className="h-12 px-6 bg-[#0f62fe] text-white text-sm font-medium flex items-center gap-2 hover:bg-[#0353e9] transition-colors"
          >
            {hasBrief ? 'Continue to Brief' : 'Generate brief'}
            <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* Regenerate Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showRegenerateConfirm}
        title="Regenerate Brief?"
        message="This will create a new Pink Brief based on your updated strategy. The existing brief will be replaced."
        confirmLabel="Regenerate"
        cancelLabel="Cancel"
        variant="warning"
        onConfirm={confirmRegenerate}
        onCancel={() => setShowRegenerateConfirm(false)}
      />
    </div>
  );
};

export default StrategyModule;
