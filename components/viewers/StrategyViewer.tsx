import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Target } from 'lucide-react';
import type { StrategicSection } from '../../types';

interface Props {
  redThreadEssence: string;
  redThreadUnlock: string;
  sections: StrategicSection[];
}

const StrategyViewer: React.FC<Props> = ({ redThreadEssence, redThreadUnlock, sections }) => {
  const [expandedSection, setExpandedSection] = useState<string | null>(
    sections.length > 0 ? sections[0].id : null
  );

  if (sections.length === 0 && !redThreadEssence) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-[#f4f4f4] flex items-center justify-center mx-auto mb-4">
            <Target size={32} className="text-[#a8a8a8]" />
          </div>
          <p className="text-sm text-[#6f6f6f]">No strategy data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      {/* Header */}
      <div className="mb-6">
        <p className="text-xs font-mono text-[#6f6f6f] uppercase tracking-wider mb-2">
          Strategic Framework
        </p>
        <h2 className="text-2xl font-light text-[#161616] tracking-tight">
          Marketing Strategy
        </h2>
      </div>

      {/* Red Thread Banner */}
      {(redThreadEssence || redThreadUnlock) && (
        <div className="mb-8 grid grid-cols-2 gap-px bg-[#e0e0e0]">
          <div className="bg-[#161616] p-6">
            <p className="text-xs font-mono text-[#6f6f6f] uppercase tracking-wider mb-2">Essence</p>
            <p className="text-xl font-medium text-white">{redThreadEssence || '—'}</p>
          </div>
          <div className="bg-[#393939] p-6">
            <p className="text-xs font-mono text-[#6f6f6f] uppercase tracking-wider mb-2">The Unlock</p>
            <p className="text-lg text-[#f4f4f4] italic">{redThreadUnlock || '—'}</p>
          </div>
        </div>
      )}

      {/* Sections */}
      <div className="space-y-2">
        {sections.map((section, idx) => {
          const isExpanded = expandedSection === section.id;

          return (
            <div
              key={section.id}
              className={`bg-white border transition-colors duration-150 ${
                isExpanded ? 'border-[#0f62fe]' : 'border-[#e0e0e0]'
              }`}
            >
              {/* Section header */}
              <button
                onClick={() => setExpandedSection(isExpanded ? null : section.id)}
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
                    {section.purpose && (
                      <p className="text-xs text-[#6f6f6f]">{section.purpose}</p>
                    )}
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
                      {section.summary && (
                        <div className="py-4 border-b border-[#e0e0e0]">
                          <p className="text-xs font-mono text-[#6f6f6f] uppercase tracking-wider mb-2">Summary</p>
                          <p className="text-sm font-medium text-[#161616]">{section.summary}</p>
                        </div>
                      )}

                      {/* Content */}
                      <div className="py-4">
                        <p className="text-xs font-mono text-[#6f6f6f] uppercase tracking-wider mb-2">Detail</p>
                        <p className="text-sm text-[#525252] leading-relaxed whitespace-pre-wrap">
                          {section.content}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StrategyViewer;
