import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Quote,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Briefcase,
  Heart,
  Users,
  User,
  Check
} from 'lucide-react';
import type { ExtractedInsight, TensionType } from '../../types';

interface Props {
  insights: ExtractedInsight[];
  selectedInsightId: number | null;
  categoryContext: string;
}

const tensionTypeConfig: Record<TensionType, { icon: React.ElementType; label: string; color: string }> = {
  functional: { icon: Briefcase, label: 'Functional', color: 'bg-blue-100 text-blue-700' },
  emotional: { icon: Heart, label: 'Emotional', color: 'bg-pink-100 text-pink-700' },
  social: { icon: Users, label: 'Social', color: 'bg-purple-100 text-purple-700' },
  identity: { icon: User, label: 'Identity', color: 'bg-amber-100 text-amber-700' }
};

const InsightsViewer: React.FC<Props> = ({ insights, selectedInsightId, categoryContext }) => {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  if (insights.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-[#f4f4f4] flex items-center justify-center mx-auto mb-4">
            <Lightbulb size={32} className="text-[#a8a8a8]" />
          </div>
          <p className="text-sm text-[#6f6f6f]">No insights available</p>
        </div>
      </div>
    );
  }

  const toggleVerbatims = (id: number) => {
    const next = new Set(expandedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setExpandedIds(next);
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      {/* Header */}
      <div className="mb-6">
        <p className="text-xs font-mono text-[#6f6f6f] uppercase tracking-wider mb-2">
          Extracted Insights
        </p>
        <h2 className="text-2xl font-light text-[#161616] tracking-tight">
          Consumer Insights
        </h2>
      </div>

      {/* Category context */}
      {categoryContext && (
        <div className="mb-6 p-4 bg-[#edf5ff] border-l-4 border-[#0f62fe]">
          <p className="text-xs font-mono text-[#0f62fe] uppercase tracking-wider mb-1">Category Context</p>
          <p className="text-sm text-[#161616]">{categoryContext}</p>
        </div>
      )}

      {/* Insights list */}
      <div className="space-y-4">
        {insights.map((insight) => {
          const isSelected = insight.id === selectedInsightId;
          const isExpanded = expandedIds.has(insight.id);
          const tensionConfig = tensionTypeConfig[insight.tension_type] || tensionTypeConfig.functional;
          const TensionIcon = tensionConfig.icon;

          return (
            <div
              key={insight.id}
              className={`bg-white border transition-all duration-150 ${
                isSelected
                  ? 'border-[#0f62fe] ring-2 ring-[#0f62fe] ring-opacity-20'
                  : 'border-[#e0e0e0]'
              }`}
            >
              {/* Card header */}
              <div className="p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 flex items-center justify-center text-sm font-mono ${
                      isSelected
                        ? 'bg-[#0f62fe] text-white'
                        : 'bg-[#e0e0e0] text-[#525252]'
                    }`}>
                      {insight.id}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono px-2 py-1 bg-[#e0e0e0] text-[#525252]">
                        {insight.relevance_score}/10 relevance
                      </span>
                      <span className={`text-xs px-2 py-1 flex items-center gap-1 ${tensionConfig.color}`}>
                        <TensionIcon size={12} />
                        {tensionConfig.label}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-[#0f62fe]">Selected</span>
                      <div className="w-6 h-6 bg-[#0f62fe] flex items-center justify-center">
                        <Check size={14} className="text-white" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Insight content */}
                <div>
                  {insight.insight_headline && (
                    <h3 className="text-xl font-semibold text-[#161616] mb-3">
                      {insight.insight_headline}
                    </h3>
                  )}

                  <p className="text-sm text-[#525252] leading-relaxed mb-4">
                    "{insight.insight_text}"
                  </p>

                  <div className="p-3 bg-[#f4f4f4] border-l-2 border-[#0f62fe]">
                    <p className="text-xs font-mono text-[#6f6f6f] uppercase tracking-wider mb-1">Job To Be Done</p>
                    <p className="text-sm text-[#525252] italic">{insight.jtbd}</p>
                  </div>
                </div>
              </div>

              {/* Evidence section */}
              {insight.verbatims && insight.verbatims.length > 0 && (
                <div className="border-t border-[#e0e0e0]">
                  <button
                    onClick={() => toggleVerbatims(insight.id)}
                    className="w-full px-6 py-3 flex items-center justify-between text-xs font-medium text-[#0f62fe] hover:bg-[#f4f4f4] transition-colors"
                  >
                    <span>View evidence ({insight.verbatims.length})</span>
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
                          {insight.verbatims.map((verbatim, idx) => (
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
        })}
      </div>
    </div>
  );
};

export default InsightsViewer;
