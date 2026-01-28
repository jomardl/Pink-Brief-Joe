
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  Quote,
  ChevronDown,
  ChevronUp,
  Search,
  Loader2,
  Edit2,
  Save,
  AlertTriangle,
  ArrowRight,
  Briefcase,
  Heart,
  Users,
  User
} from 'lucide-react';
import { ExtractedInsight, BriefData, TensionType } from '../types';
import { testBespokeInsight } from '../geminiService';

interface Props {
  onNext: (data: Partial<BriefData>) => void;
  research: string;
  extractedInsights: ExtractedInsight[];
  selectedInsight: ExtractedInsight | null;
  categoryContext: string;
  onProcessing: (val: boolean) => void;
}

const RELEVANCE_THRESHOLD = 5; // Minimum score out of 10

const tensionTypeConfig: Record<TensionType, { icon: React.ElementType; label: string; color: string }> = {
  functional: { icon: Briefcase, label: 'Functional', color: 'bg-blue-100 text-blue-700' },
  emotional: { icon: Heart, label: 'Emotional', color: 'bg-pink-100 text-pink-700' },
  social: { icon: Users, label: 'Social', color: 'bg-purple-100 text-purple-700' },
  identity: { icon: User, label: 'Identity', color: 'bg-amber-100 text-amber-700' }
};

const InsightsModule: React.FC<Props> = ({
  onNext,
  research,
  extractedInsights,
  selectedInsight,
  categoryContext,
  onProcessing
}) => {
  const [localInsights, setLocalInsights] = useState<ExtractedInsight[]>(extractedInsights);
  const [expandedIndices, setExpandedIndices] = useState<Set<number | string>>(new Set());

  const initialIndex = extractedInsights.findIndex(i => i.id === selectedInsight?.id);
  const [localSelected, setLocalSelected] = useState<number | string | null>(
    initialIndex !== -1 ? initialIndex : (selectedInsight ? 'bespoke' : null)
  );

  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [tempInsightText, setTempInsightText] = useState('');

  const [bespokeInput, setBespokeInput] = useState('');
  const [isTestingBespoke, setIsTestingBespoke] = useState(false);
  const [bespokeResult, setBespokeResult] = useState<ExtractedInsight | null>(
    selectedInsight && initialIndex === -1 ? selectedInsight : null
  );

  useEffect(() => {
    setLocalInsights(extractedInsights);
  }, [extractedInsights]);

  const toggleVerbatims = (id: number | string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(expandedIndices);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setExpandedIndices(next);
  };

  const handleSelect = (id: number | string) => {
    if (editingId !== null) return;

    // Check threshold for bespoke
    if (id === 'bespoke' && bespokeResult && bespokeResult.relevance_score < RELEVANCE_THRESHOLD) {
      return;
    }

    setLocalSelected(id);
  };

  const startEditing = (e: React.MouseEvent, id: number | string, item: ExtractedInsight) => {
    e.stopPropagation();
    setEditingId(id);
    setTempInsightText(item.insight_text);
  };

  const saveEdit = (e: React.MouseEvent, id: number | string) => {
    e.stopPropagation();
    if (id === 'bespoke' && bespokeResult) {
      setBespokeResult({ ...bespokeResult, insight_text: tempInsightText });
    } else if (typeof id === 'number') {
      const newList = [...localInsights];
      newList[id] = { ...newList[id], insight_text: tempInsightText };
      setLocalInsights(newList);
    }
    setEditingId(null);
  };

  const cancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleTestBespoke = async () => {
    if (!bespokeInput.trim()) return;
    setIsTestingBespoke(true);
    onProcessing(true);
    try {
      const result = await testBespokeInsight(research, bespokeInput);
      setBespokeResult(result);
      if (result.relevance_score >= RELEVANCE_THRESHOLD) {
        setLocalSelected('bespoke');
      } else {
        setLocalSelected(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsTestingBespoke(false);
      onProcessing(false);
    }
  };

  const getSelectedInsight = (): ExtractedInsight | null => {
    if (localSelected === 'bespoke' && bespokeResult) return bespokeResult;
    if (typeof localSelected === 'number' && localSelected >= 0) {
      return localInsights[localSelected] || null;
    }
    return null;
  };

  const handleContinue = () => {
    const insight = getSelectedInsight();
    if (insight) {
      onNext({ selectedInsight: insight });
    }
  };

  const renderInsightCard = (item: ExtractedInsight, id: number | string) => {
    const isSelected = localSelected === id;
    const isExpanded = expandedIndices.has(id);
    const isEditing = editingId === id;
    const isBespoke = id === 'bespoke';
    const isBelowThreshold = item.relevance_score < RELEVANCE_THRESHOLD;

    const tensionConfig = tensionTypeConfig[item.tension_type] || tensionTypeConfig.functional;
    const TensionIcon = tensionConfig.icon;

    return (
      <div
        key={id}
        onClick={() => handleSelect(id)}
        className={`bg-white border transition-all duration-150 cursor-pointer ${
          isSelected
            ? 'border-[#0f62fe] ring-2 ring-[#0f62fe] ring-opacity-20'
            : isBelowThreshold
            ? 'border-[#e0e0e0] opacity-50'
            : 'border-[#e0e0e0] hover:border-[#8d8d8d]'
        }`}
      >
        {/* Card header */}
        <div className="p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 flex items-center justify-center text-sm font-mono ${
                isSelected
                  ? 'bg-[#0f62fe] text-white'
                  : isBelowThreshold
                  ? 'bg-[#da1e28] text-white'
                  : 'bg-[#e0e0e0] text-[#525252]'
              }`}>
                {isBespoke ? 'H' : item.id}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs font-mono px-2 py-1 ${
                  isBelowThreshold ? 'bg-[#fff1f1] text-[#da1e28]' : 'bg-[#e0e0e0] text-[#525252]'
                }`}>
                  {item.relevance_score}/10 relevance
                </span>
                <span className={`text-xs px-2 py-1 flex items-center gap-1 ${tensionConfig.color}`}>
                  <TensionIcon size={12} />
                  {tensionConfig.label}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!isEditing && !isBelowThreshold && (
                <button
                  onClick={(e) => startEditing(e, id, item)}
                  className="p-2 text-[#6f6f6f] hover:text-[#161616] hover:bg-[#f4f4f4] transition-colors"
                >
                  <Edit2 size={14} />
                </button>
              )}
              {isSelected && (
                <div className="w-6 h-6 bg-[#0f62fe] flex items-center justify-center">
                  <Check size={14} className="text-white" />
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          {isEditing ? (
            <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
              <textarea
                autoFocus
                value={tempInsightText}
                onChange={(e) => setTempInsightText(e.target.value)}
                className="w-full text-base text-[#161616] bg-[#f4f4f4] border border-[#e0e0e0] p-3 focus:outline-none focus:border-[#0f62fe] resize-none h-32"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={cancelEdit}
                  className="px-3 py-2 text-sm text-[#525252] hover:bg-[#e0e0e0] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={(e) => saveEdit(e, id)}
                  className="px-3 py-2 text-sm bg-[#0f62fe] text-white hover:bg-[#0353e9] flex items-center gap-1 transition-colors"
                >
                  <Save size={14} /> Save
                </button>
              </div>
            </div>
          ) : (
            <div>
              {/* Insight Headline - Large prominent text */}
              {item.insight_headline && (
                <h3 className={`text-xl font-semibold mb-3 ${isBelowThreshold ? 'text-[#a8a8a8]' : 'text-[#161616]'}`}>
                  {item.insight_headline}
                </h3>
              )}

              {/* Full Insight Text - Smaller secondary text */}
              <p className={`text-sm leading-relaxed mb-4 ${isBelowThreshold ? 'text-[#a8a8a8]' : 'text-[#525252]'}`}>
                "{item.insight_text}"
              </p>

              {isBelowThreshold ? (
                <div className="flex items-start gap-2 p-3 bg-[#fff1f1]">
                  <AlertTriangle size={14} className="text-[#da1e28] shrink-0 mt-0.5" />
                  <p className="text-xs text-[#da1e28]">
                    Below threshold: Insufficient evidence in research to support this insight.
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-[#f4f4f4] border-l-2 border-[#0f62fe]">
                  <p className="text-xs font-mono text-[#6f6f6f] uppercase tracking-wider mb-1">Job To Be Done</p>
                  <p className="text-sm text-[#525252] italic">{item.jtbd}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Evidence section */}
        {!isBelowThreshold && !isEditing && item.verbatims.length > 0 && (
          <div className="border-t border-[#e0e0e0]">
            <button
              onClick={(e) => toggleVerbatims(id, e)}
              className="w-full px-6 py-3 flex items-center justify-between text-xs font-medium text-[#0f62fe] hover:bg-[#f4f4f4] transition-colors"
            >
              <span>View evidence ({item.verbatims.length})</span>
              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-4 space-y-2">
                    {item.verbatims.map((verbatim, idx) => (
                      <div key={idx} className="flex items-start gap-2 p-3 bg-[#f4f4f4]">
                        <Quote size={12} className="text-[#a8a8a8] shrink-0 mt-1" />
                        <div>
                          <p className="text-xs text-[#525252] italic leading-relaxed">
                            "{verbatim.quote}"
                          </p>
                          {verbatim.source_location && (
                            <p className="text-[10px] text-[#a8a8a8] mt-1 font-mono">
                              — {verbatim.source_location}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-mono text-[#6f6f6f] uppercase tracking-wider mb-2">
          Step 2
        </p>
        <h2 className="text-3xl font-light text-[#161616] tracking-tight mb-2">
          Select Insight
        </h2>
        <p className="text-sm text-[#525252] leading-relaxed">
          Choose the consumer insight that will anchor your brief. Insights are written in first-person consumer voice.
        </p>
      </div>

      {/* Category context */}
      {categoryContext && (
        <div className="mb-6 p-4 bg-[#edf5ff] border-l-4 border-[#0f62fe]">
          <p className="text-xs font-mono text-[#0f62fe] uppercase tracking-wider mb-1">Category Context</p>
          <p className="text-sm text-[#161616]">{categoryContext}</p>
        </div>
      )}

      {/* Insights grid */}
      <div className="grid grid-cols-1 gap-4 mb-8">
        {localInsights.map((item, i) => renderInsightCard(item, i))}
        {bespokeResult && renderInsightCard(bespokeResult, 'bespoke')}
      </div>

      {/* Custom hypothesis section */}
      <div className="p-6 bg-white border border-[#e0e0e0] mb-8">
        <div className="mb-4">
          <h3 className="text-sm font-medium text-[#161616] mb-1">Test custom hypothesis</h3>
          <p className="text-xs text-[#6f6f6f]">
            Write a first-person consumer statement to test against the research.
          </p>
        </div>

        <div className="flex gap-3">
          <textarea
            value={bespokeInput}
            onChange={(e) => setBespokeInput(e.target.value)}
            placeholder='e.g., "I want to feel confident during my workout, but I worry about..."'
            className="flex-1 h-20 p-3 bg-[#f4f4f4] border border-[#e0e0e0] text-sm text-[#161616] placeholder-[#a8a8a8] resize-none focus:outline-none focus:border-[#0f62fe]"
          />
          <button
            onClick={handleTestBespoke}
            disabled={bespokeInput.trim().length < 10 || isTestingBespoke}
            className="px-4 bg-[#161616] text-white text-sm font-medium flex items-center gap-2 hover:bg-[#393939] disabled:bg-[#c6c6c6] disabled:cursor-not-allowed transition-colors"
          >
            {isTestingBespoke ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Search size={16} />
            )}
            Test
          </button>
        </div>

        <p className="mt-3 text-xs text-[#6f6f6f] font-mono">
          Minimum threshold: {RELEVANCE_THRESHOLD}/10 relevance required
        </p>
      </div>

      {/* Continue button */}
      <AnimatePresence>
        {localSelected !== null && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="flex justify-end"
          >
            <button
              onClick={handleContinue}
              className="h-12 px-6 bg-[#0f62fe] text-white text-sm font-medium flex items-center gap-2 hover:bg-[#0353e9] transition-colors"
            >
              Continue with selected insight
              <ArrowRight size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InsightsModule;
