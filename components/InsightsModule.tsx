
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lightbulb, 
  ChevronRight, 
  Check, 
  Quote, 
  BarChart3, 
  MessageSquare, 
  ChevronDown, 
  ChevronUp, 
  Languages, 
  Beaker, 
  Search, 
  Loader2, 
  Sparkles,
  Edit2,
  Save,
  TrendingUp,
  FileSearch,
  Info,
  AlertTriangle,
  History
} from 'lucide-react';
import { ExtractedInsight, BriefData } from '../types';
import { testBespokeInsight } from '../geminiService';

interface Props {
  onNext: (data: Partial<BriefData>) => void;
  research: string;
  extractedInsights: ExtractedInsight[];
  selectedInsight: string;
  onProcessing: (val: boolean) => void;
}

const STRATEGIC_THRESHOLD = 30; // Minimum percentage for P&G Standard

const InsightsModule: React.FC<Props> = ({ onNext, research, extractedInsights, selectedInsight, onProcessing }) => {
  const [localInsights, setLocalInsights] = useState<ExtractedInsight[]>(extractedInsights);
  const [expandedIndices, setExpandedIndices] = useState<Set<number | string>>(new Set());
  
  const initialIndex = extractedInsights.findIndex(i => i.insight === selectedInsight);
  const [localSelected, setLocalSelected] = useState<number | string | null>(
    initialIndex !== -1 ? initialIndex : (selectedInsight ? 'bespoke' : null)
  );

  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [tempInsight, setTempInsight] = useState('');
  const [tempExplanation, setTempExplanation] = useState('');

  const [bespokeInput, setBespokeInput] = useState('');
  const [isTestingBespoke, setIsTestingBespoke] = useState(false);
  const [bespokeResult, setBespokeResult] = useState<ExtractedInsight | null>(
    (selectedInsight && initialIndex === -1) ? {
      insight: selectedInsight,
      plainEnglishExplanation: 'Bespoke strategic insight',
      rank: 99,
      reasoning: 'User defined insight',
      verbatims: [],
      mentions: [],
      matchPercentage: 100,
      mentionCount: 1,
      totalEvidenceFrequency: "Custom hypothesis"
    } : null
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
    
    // Don't allow selecting bespoke if it's below threshold
    if (id === 'bespoke' && bespokeResult && (bespokeResult.matchPercentage < STRATEGIC_THRESHOLD || bespokeResult.mentionCount === 0)) {
        return;
    }
    
    setLocalSelected(id);
  };

  const startEditing = (e: React.MouseEvent, id: number | string, item: ExtractedInsight) => {
    e.stopPropagation();
    setEditingId(id);
    setTempInsight(item.insight);
    setTempExplanation(item.plainEnglishExplanation);
  };

  const saveEdit = (e: React.MouseEvent, id: number | string) => {
    e.stopPropagation();
    if (id === 'bespoke' && bespokeResult) {
      setBespokeResult({ ...bespokeResult, insight: tempInsight, plainEnglishExplanation: tempExplanation });
    } else if (typeof id === 'number') {
      const newList = [...localInsights];
      newList[id] = { ...newList[id], insight: tempInsight, plainEnglishExplanation: tempExplanation };
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
      const newBespoke = { ...result, rank: 99 };
      setBespokeResult(newBespoke);
      
      // Only select if it passes threshold
      if (newBespoke.matchPercentage >= STRATEGIC_THRESHOLD && newBespoke.mentionCount > 0) {
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

  const getSelectedText = () => {
    if (localSelected === 'bespoke' && bespokeResult) return bespokeResult.insight;
    if (typeof localSelected === 'number' && localSelected >= 0) {
      return localInsights[localSelected]?.insight || '';
    }
    return '';
  };

  const handleGo = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = getSelectedText();
    if (text) {
      onNext({ selectedInsight: text });
    }
  };

  const renderInsightCard = (item: ExtractedInsight, id: number | string) => {
    const isSelected = localSelected === id;
    const isExpanded = expandedIndices.has(id);
    const isEditing = editingId === id;
    const sortedMentions = [...(item.mentions || [])].sort((a, b) => b.relevanceScore - a.relevanceScore);
    const topMentions = sortedMentions.slice(0, 4);
    
    const isBespoke = id === 'bespoke';
    const isBelowThreshold = isBespoke && (item.matchPercentage < STRATEGIC_THRESHOLD || item.mentionCount === 0);

    return (
      <motion.div 
        key={id}
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={() => handleSelect(id)}
        className={`group relative flex flex-col bg-white border-2 rounded-[2.5rem] transition-all cursor-pointer overflow-hidden min-h-[400px] h-full ${
          isSelected 
            ? 'border-[#003da5] shadow-2xl shadow-blue-100 ring-8 ring-blue-50/50 scale-[1.02] z-10' 
            : isBelowThreshold
            ? 'border-rose-100 bg-rose-50/20 grayscale'
            : 'border-slate-50 hover:border-blue-100 hover:shadow-xl'
        }`}
      >
        <div className={`p-8 space-y-6 flex-1 flex flex-col ${isSelected ? 'pb-32' : 'pb-8'}`}>
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl transition-all ${
                  isSelected ? 'bg-[#003da5] text-white' : isBelowThreshold ? 'bg-rose-100 text-rose-400' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-100'
                }`}>
                  {isBespoke ? <Sparkles size={20} /> : (typeof id === 'number' ? id + 1 : '')}
                </div>
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                  isBelowThreshold ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-blue-50 text-blue-700 border-blue-100'
                }`}>
                  <FileSearch size={12} /> {isBelowThreshold ? 'Violation' : item.totalEvidenceFrequency}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                   isBelowThreshold ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-green-50 text-green-700 border-green-100'
                }`}>
                  <BarChart3 size={12} /> {item.matchPercentage}% Impact
                </div>
                {!isBelowThreshold && (
                  <motion.div 
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-[9px] font-black uppercase tracking-wider border border-indigo-100 shadow-sm"
                  >
                    <MessageSquare size={12} /> {item.mentionCount} Quotes
                    <Info size={10} className="ml-0.5 opacity-40" />
                  </motion.div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {!isEditing && !isBelowThreshold && (
                <button 
                  onClick={(e) => startEditing(e, id, item)}
                  className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all"
                  title="Edit"
                >
                  <Edit2 size={16} />
                </button>
              )}
              {isSelected && (
                <motion.div 
                  initial={{ scale: 0 }} 
                  animate={{ scale: 1 }} 
                  className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-green-100"
                >
                  <Check size={16} strokeWidth={3} />
                </motion.div>
              )}
            </div>
          </div>

          <div className="space-y-4 flex-1">
            {isEditing ? (
              <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                <input 
                  autoFocus
                  value={tempInsight}
                  onChange={(e) => setTempInsight(e.target.value)}
                  className="w-full text-xl font-black text-slate-900 bg-slate-50 border-2 border-blue-200 rounded-2xl p-4 focus:ring-4 focus:ring-blue-100 outline-none"
                />
                <textarea 
                  value={tempExplanation}
                  onChange={(e) => setTempExplanation(e.target.value)}
                  className="w-full text-xs font-bold text-slate-600 bg-slate-50 border-2 border-blue-200 rounded-2xl p-4 focus:ring-4 focus:ring-blue-100 outline-none resize-none h-24"
                />
                <div className="flex justify-end gap-2">
                  <button onClick={cancelEdit} className="px-3 py-1.5 bg-slate-200 text-slate-600 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-slate-300">Cancel</button>
                  <button onClick={(e) => saveEdit(e, id)} className="px-4 py-1.5 bg-blue-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-blue-700 flex items-center gap-1">
                    <Save size={12} /> Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <h3 className={`text-xl font-black leading-tight tracking-tight pr-4 ${isBelowThreshold ? 'text-rose-300' : 'text-slate-900'}`}>
                  {item.insight}
                </h3>
                
                {isBelowThreshold ? (
                  <div className="flex items-start gap-3 p-4 bg-rose-100/50 rounded-2xl border border-rose-200">
                    <AlertTriangle size={20} className="text-rose-600 shrink-0" />
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-rose-700 mb-0.5">Below Threshold</p>
                      <p className="text-xs font-bold text-rose-600/80 leading-relaxed italic">
                        "{item.reasoning}"
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2.5 py-1">
                    <div className="mt-1 p-1 bg-blue-50 text-blue-500 rounded-lg">
                      <Languages size={12} />
                    </div>
                    <p className="text-xs font-bold text-slate-500 leading-relaxed italic">
                      {item.plainEnglishExplanation}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {!isBelowThreshold && (
            <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
              <button 
                onClick={(e) => toggleVerbatims(id, e)} 
                className="flex items-center gap-1.5 text-[10px] font-black text-[#003da5] uppercase tracking-widest hover:underline"
              >
                {isExpanded ? <><ChevronUp size={14} /> Hide</> : <><ChevronDown size={14} /> Preview Evidence ({topMentions.length})</>}
              </button>
            </div>
          )}

          <AnimatePresence>
            {isExpanded && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }} 
                animate={{ height: 'auto', opacity: 1 }} 
                exit={{ height: 0, opacity: 0 }} 
                className="overflow-hidden"
              >
                <div className="pt-4 grid gap-2">
                  {topMentions.map((mention, idx) => (
                    <div key={idx} className="bg-slate-50/70 p-4 rounded-xl text-[11px] text-slate-600 italic relative border border-white group/quote">
                      <Quote size={10} className="absolute top-3 left-1 text-slate-200" />
                      <span className="pl-4 inline-block leading-normal">"{mention.text}"</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <AnimatePresence>
          {isSelected && !isEditing && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="absolute bottom-6 right-8 z-20"
            >
              <button 
                onClick={handleGo}
                className="px-8 py-4 bg-[#003da5] text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.2em] flex items-center gap-2 hover:bg-blue-800 shadow-[0_15px_30px_rgba(0,61,165,0.3)] transition-all hover:scale-105 active:scale-95 group border-2 border-white/20"
              >
                Confirm Truth <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <div className="max-w-[1200px] mx-auto space-y-12 py-8 flex flex-col h-full relative">
      <div className="space-y-4 text-center">
        <div className="inline-flex items-center justify-center p-4 bg-amber-50 text-amber-600 rounded-[2rem] mb-2 shadow-sm border border-amber-100">
          <Lightbulb size={36} />
        </div>
        <h2 className="text-4xl font-black text-slate-900 tracking-tight">Market Insights</h2>
        <p className="text-slate-500 max-w-lg mx-auto text-lg leading-relaxed">
          Select the strategic Human Truth that will anchor your brief.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1 content-start">
        {localInsights.map((item, i) => renderInsightCard(item, i))}
        
        {bespokeResult && renderInsightCard(bespokeResult, 'bespoke')}

        {/* Interrogation Area - Span full width below the grid */}
        <div className="md:col-span-2 mt-8 p-10 bg-indigo-50/50 border-2 border-dashed border-indigo-200 rounded-[3rem] space-y-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-200">
              <Beaker size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-indigo-900 uppercase tracking-tight">Interrogate Hypotheses</h3>
              <p className="text-sm text-indigo-600 font-medium">Verify specific strategic theories against the research data footprint.</p>
            </div>
          </div>

          <div className="relative">
            <textarea
              value={bespokeInput}
              onChange={(e) => setBespokeInput(e.target.value)}
              placeholder="e.g. Gen Z parents prioritize ingredient transparency over price..."
              className="w-full h-32 p-6 rounded-3xl border-2 border-white bg-white/80 shadow-inner text-lg font-bold text-slate-800 focus:ring-4 focus:ring-indigo-100 outline-none transition-all resize-none"
            />
            
            <AnimatePresence>
              {bespokeInput.trim().length > 10 && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 10 }}
                  onClick={handleTestBespoke}
                  disabled={isTestingBespoke}
                  className="absolute bottom-4 right-4 px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isTestingBespoke ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
                  {isTestingBespoke ? 'Auditing Hypothesis...' : 'Interrogate'}
                </motion.button>
              )}
            </AnimatePresence>
          </div>
          
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 justify-center">
            <History size={12} /> Minimum Strategic Threshold: {STRATEGIC_THRESHOLD}% Match Required
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsightsModule;
