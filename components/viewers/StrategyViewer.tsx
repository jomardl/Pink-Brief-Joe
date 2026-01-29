import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Target, Edit2, X, Check, RefreshCw } from 'lucide-react';
import type { StrategicSection } from '../../types';

interface Props {
  redThreadEssence: string;
  redThreadUnlock: string;
  sections: StrategicSection[];
  onUpdate?: (data: { redThreadEssence?: string; redThreadUnlock?: string; sections?: StrategicSection[] }) => void;
  hasBrief?: boolean; // Whether a pink brief exists
  onRequestRegenerate?: () => void; // Called when user wants to regenerate brief after edits
}

const StrategyViewer: React.FC<Props> = ({
  redThreadEssence,
  redThreadUnlock,
  sections,
  onUpdate,
  hasBrief = false,
  onRequestRegenerate
}) => {
  const [expandedSection, setExpandedSection] = useState<string | null>(
    sections.length > 0 ? sections[0].id : null
  );
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [localEssence, setLocalEssence] = useState(redThreadEssence);
  const [localUnlock, setLocalUnlock] = useState(redThreadUnlock);
  const [localSections, setLocalSections] = useState(sections);

  // Track original values for cancel functionality
  const [originalEssence, setOriginalEssence] = useState(redThreadEssence);
  const [originalUnlock, setOriginalUnlock] = useState(redThreadUnlock);
  const [originalSections, setOriginalSections] = useState(sections);

  // Track if strategy has been modified since last brief generation
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Sync with props when they change externally
  useEffect(() => {
    setLocalEssence(redThreadEssence);
    setLocalUnlock(redThreadUnlock);
    setLocalSections(sections);
    setOriginalEssence(redThreadEssence);
    setOriginalUnlock(redThreadUnlock);
    setOriginalSections(sections);
  }, [redThreadEssence, redThreadUnlock, sections]);

  const startEdit = (sectionKey: string) => {
    // Store original values before editing
    setOriginalEssence(localEssence);
    setOriginalUnlock(localUnlock);
    setOriginalSections([...localSections]);
    setEditingSection(sectionKey);
  };

  const saveEdit = () => {
    if (onUpdate) {
      onUpdate({
        redThreadEssence: localEssence,
        redThreadUnlock: localUnlock,
        sections: localSections,
      });
    }
    setHasUnsavedChanges(true);
    setEditingSection(null);
  };

  const cancelEdit = () => {
    // Restore original values
    setLocalEssence(originalEssence);
    setLocalUnlock(originalUnlock);
    setLocalSections(originalSections);
    setEditingSection(null);
  };

  const toggleEdit = (sectionKey: string) => {
    if (editingSection === sectionKey) {
      // Close without saving - user should use Save button
      cancelEdit();
    } else {
      startEdit(sectionKey);
    }
  };

  const updateSectionField = (sectionId: string, field: 'title' | 'summary' | 'content', value: string) => {
    setLocalSections(prev => prev.map(s =>
      s.id === sectionId ? { ...s, [field]: value } : s
    ));
  };

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

      {/* Regenerate Brief Banner - shown when brief exists and strategy has been modified */}
      {hasBrief && hasUnsavedChanges && onRequestRegenerate && (
        <div className="mb-6 p-4 bg-[#fff1f1] border border-[#ffb3b8]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#161616]">Strategy has been modified</p>
              <p className="text-xs text-[#525252]">
                Would you like to regenerate the Pink Brief based on your changes?
              </p>
            </div>
            <button
              onClick={onRequestRegenerate}
              className="h-10 px-4 bg-[#da1e28] text-white text-sm font-medium flex items-center gap-2 hover:bg-[#ba1b23] transition-colors"
            >
              <RefreshCw size={16} />
              Regenerate Brief
            </button>
          </div>
        </div>
      )}

      {/* Red Thread Banner */}
      {(redThreadEssence || redThreadUnlock || onUpdate) && (
        <div className="mb-8 relative">
          {/* Edit controls for Red Thread */}
          {onUpdate && (
            <div className="absolute right-2 top-2 z-10 flex items-center gap-1">
              {editingSection === 'redThread' ? (
                <>
                  <button
                    onClick={saveEdit}
                    className="p-2 text-white bg-[#0f62fe] hover:bg-[#0353e9] transition-colors flex items-center gap-1"
                    title="Save changes"
                  >
                    <Check size={14} />
                    <span className="text-xs">Save</span>
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="p-2 text-[#a8a8a8] hover:text-white hover:bg-[#525252] transition-colors"
                    title="Cancel"
                  >
                    <X size={16} />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => startEdit('redThread')}
                  className="p-2 text-[#a8a8a8] hover:text-white hover:bg-[#525252] transition-colors"
                  title="Edit"
                >
                  <Edit2 size={16} />
                </button>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-px bg-[#e0e0e0]">
            <div className="bg-[#161616] p-6">
              <p className="text-xs font-mono text-[#6f6f6f] uppercase tracking-wider mb-2">Essence</p>
              {editingSection === 'redThread' ? (
                <input
                  value={localEssence}
                  onChange={(e) => setLocalEssence(e.target.value)}
                  className="w-full text-xl font-medium text-white bg-[#393939] border border-[#525252] px-2 py-1 focus:border-[#0f62fe] focus:outline-none"
                />
              ) : (
                <p className="text-xl font-medium text-white">{localEssence || '—'}</p>
              )}
            </div>
            <div className="bg-[#393939] p-6">
              <p className="text-xs font-mono text-[#6f6f6f] uppercase tracking-wider mb-2">The Unlock</p>
              {editingSection === 'redThread' ? (
                <textarea
                  value={localUnlock}
                  onChange={(e) => setLocalUnlock(e.target.value)}
                  className="w-full text-lg text-[#f4f4f4] italic bg-[#525252] border border-[#6f6f6f] px-2 py-1 focus:border-[#0f62fe] focus:outline-none resize-none h-20"
                />
              ) : (
                <p className="text-lg text-[#f4f4f4] italic">{localUnlock || '—'}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sections */}
      <div className="space-y-2">
        {localSections.map((section, idx) => {
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
              <div className="flex items-center">
                <button
                  onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                  className="flex-1 p-6 flex items-center justify-between text-left hover:bg-[#f4f4f4] transition-colors"
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

                {/* Edit controls per section */}
                {onUpdate && isExpanded && (
                  <div className="flex items-center gap-1 mr-4">
                    {isEditing ? (
                      <>
                        <button
                          onClick={saveEdit}
                          className="p-2 text-white bg-[#0f62fe] hover:bg-[#0353e9] transition-colors flex items-center gap-1"
                          title="Save changes"
                        >
                          <Check size={14} />
                          <span className="text-xs">Save</span>
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-2 text-[#6f6f6f] hover:text-[#161616] hover:bg-[#f4f4f4] transition-colors"
                          title="Cancel"
                        >
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => startEdit(section.id)}
                        className="p-2 text-[#6f6f6f] hover:text-[#161616] hover:bg-[#f4f4f4] transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                    )}
                  </div>
                )}
              </div>

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
                      {(section.summary || isEditing) && (
                        <div className="py-4 border-b border-[#e0e0e0]">
                          <p className="text-xs font-mono text-[#6f6f6f] uppercase tracking-wider mb-2">Summary</p>
                          {isEditing ? (
                            <input
                              value={section.summary || ''}
                              onChange={(e) => updateSectionField(section.id, 'summary', e.target.value)}
                              className="w-full text-sm font-medium text-[#161616] bg-[#f4f4f4] border border-[#e0e0e0] px-2 py-1 focus:border-[#0f62fe] focus:outline-none"
                            />
                          ) : (
                            <p className="text-sm font-medium text-[#161616]">{section.summary}</p>
                          )}
                        </div>
                      )}

                      {/* Content */}
                      <div className="py-4">
                        <p className="text-xs font-mono text-[#6f6f6f] uppercase tracking-wider mb-2">Detail</p>
                        {isEditing ? (
                          <textarea
                            value={section.content}
                            onChange={(e) => updateSectionField(section.id, 'content', e.target.value)}
                            className="w-full text-sm text-[#525252] leading-relaxed bg-[#f4f4f4] border border-[#e0e0e0] px-2 py-1 focus:border-[#0f62fe] focus:outline-none resize-none min-h-[200px]"
                          />
                        ) : (
                          <p className="text-sm text-[#525252] leading-relaxed whitespace-pre-wrap">
                            {section.content}
                          </p>
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
    </div>
  );
};

export default StrategyViewer;
