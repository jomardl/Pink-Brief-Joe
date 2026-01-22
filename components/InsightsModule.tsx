
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
  X,
  TrendingUp,
  FileSearch
} from 'lucide-react';
import { ExtractedInsight, BriefData, Mention } from '../types';
import { testBespokeInsight } from '../geminiService';

interface Props {
  onNext: (data: Partial<BriefData>) => void;
  research: string;
  extractedInsights: ExtractedInsight[];
  selectedInsight: string;
  onProcessing: (val: boolean) => void;
}

const MentionsOverlay: React.FC<{
  insight: ExtractedInsight;
  onClose: () => void;
  layoutId: string;
}> = ({ insight, onClose, layoutId }) => {
  const sortedMentions = [...(insight.mentions || [])].sort((a, b) => b.relevanceScore - a.relevanceScore);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-6 md:p-12"
    >
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" 
      />
      
      <motion.div 
        layoutId={layoutId}
        className="relative w-full max-w-3xl bg-white rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col max-h-[85vh]"
      >
        <div className="p-8 md:p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
              <MessageSquare size={28} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Supporting Evidence</h3>
              <p className="text-xs font-black uppercase tracking-widest text-blue-500 mt-1">
                {insight.mentionCount} unique quotes extracted
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-12 h-12 flex items-center justify-center bg-white hover:bg-slate-100 rounded-full border border-slate-200 text-slate-400 hover:text-slate-900 transition-all"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 md:p-10 space-y-6">
          <div className="bg-blue-50/50 p-6 rounded-[2rem] border border-blue-100 mb-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mb-2">Research Footprint</p>
            <p className="text-lg font-black text-slate-800 italic leading-snug">"{insight.totalEvidenceFrequency}"</p>
          </div>

          {sortedMentions.map((mention, idx) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              key={idx} 
              className="group relative bg-white border border-slate-100 p-8 rounded-[2.5rem] hover:border-blue-200 hover:shadow-xl hover:shadow-blue-50 transition-all"
            >
              <div className="absolute top-6 right-8 flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-[10px] font-black uppercase tracking-wider">
                <TrendingUp size={12} /> {mention.relevanceScore}% Relevant
              </div>
              <Quote size={24} className="text-blue-100 mb-4" />
              <p className="text-base font-bold text-slate-700 leading-relaxed italic pr-12">
                "{mention.text}"
              </p>
            </motion.div>
          ))}
        </div>
        
        <div className="p-8 border-t border-slate-100 bg-slate-50/30">
          <button 
            onClick={onClose}
            className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:bg-slate-800 transition-all"
          >
            Close Evidence Window
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const InsightsModule: React.FC<Props> = ({ onNext, research, extractedInsights, selectedInsight, onProcessing }) => {
  const [localInsights, setLocalInsights] = useState<ExtractedInsight[]>(extractedInsights);
  const [expandedIndices, setExpandedIndices] = useState<Set<number | string>>(new Set());
  const [activeMentionsOverlay, setActiveMentionsOverlay] = useState<number | string | null>(null);
  
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
      setLocalSelected('bespoke');
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

    return (
      <motion.div 
        key={id}
        layout
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => handleSelect(id)}
        className={`group relative flex flex-col bg-white border-2 rounded-[2.5rem] transition-all cursor-pointer overflow-hidden ${
          isSelected 
            ? 'border-[#003da5] shadow-2xl shadow-blue-100 ring-8 ring-blue-50/50 scale-[1.01] pb-28' 
            : 'border-slate-50 hover:border-blue-100 hover:shadow-xl pb-8'
        }`}
      >
        <div className="p-8 space-y-6">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl transition-all ${
                  isSelected ? 'bg-[#003da5] text-white' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-100'
                }`}>
                  {typeof id === 'number' ? id + 1 : <Sparkles size={24} />}
                </div>
                <div className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-50 text-blue-700 rounded-full text-[10px] font-black uppercase tracking-wider border border-blue-100">
                  <FileSearch size={14} /> {item.totalEvidenceFrequency}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-1.5 px-4 py-1.5 bg-green-50 text-green-700 rounded-full text-[10px] font-black uppercase tracking-wider border border-green-100">
                  <BarChart3 size={14} /> {item.matchPercentage}% Relevance
                </div>
                <motion.button 
                  layoutId={`mention-btn-${id}`}
                  onClick={(e) => { e.stopPropagation(); setActiveMentionsOverlay(id); }}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-wider border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                >
                  <MessageSquare size={14} /> {item.mentionCount} Quotes Available
                </motion.button>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {!isEditing && (
                <button 
                  onClick={(e) => startEditing(e, id, item)}
                  className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all"
                  title="Edit Insight"
                >
                  <Edit2 size={18} />
                </button>
              )}
              {isSelected && (
                <motion.div 
                  initial={{ scale: 0 }} 
                  animate={{ scale: 1 }} 
                  className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-green-100"
                >
                  <Check size={20} strokeWidth={3} />
                </motion.div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {isEditing ? (
              <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
                <input 
                  autoFocus
                  value={tempInsight}
                  onChange={(e) => setTempInsight(e.target.value)}
                  className="w-full text-2xl font-black text-slate-900 bg-slate-50 border-2 border-blue-200 rounded-2xl p-4 focus:ring-4 focus:ring-blue-100 outline-none"
                />
                <textarea 
                  value={tempExplanation}
                  onChange={(e) => setTempExplanation(e.target.value)}
                  className="w-full text-sm font-bold text-slate-600 bg-slate-50 border-2 border-blue-200 rounded-2xl p-4 focus:ring-4 focus:ring-blue-100 outline-none resize-none h-24"
                />
                <div className="flex justify-end gap-2">
                  <button onClick={cancelEdit} className="px-4 py-2 bg-slate-200 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-300">Cancel</button>
                  <button onClick={(e) => saveEdit(e, id)} className="px-6 py-2 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 flex items-center gap-2">
                    <Save size={14} /> Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <h3 className="text-2xl font-black text-slate-900 leading-tight tracking-tight pr-8">
                  {item.insight}
                </h3>
                <div className="flex items-start gap-3 py-1">
                  <div className="mt-1 p-1 bg-blue-50 text-blue-500 rounded-lg">
                    <Languages size={14} />
                  </div>
                  <p className="text-sm font-bold text-slate-500 leading-relaxed italic">
                    {item.plainEnglishExplanation}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <button 
              onClick={(e) => toggleVerbatims(id, e)} 
              className="flex items-center gap-2 text-xs font-black text-[#003da5] uppercase tracking-widest hover:underline"
            >
              {isExpanded ? <><ChevronUp size={16} /> Hide Quotes</> : <><ChevronDown size={16} /> Preview Best Evidence ({topMentions.length})</>}
            </button>
          </div>

          <AnimatePresence>
            {isExpanded && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }} 
                animate={{ height: 'auto', opacity: 1 }} 
                exit={{ height: 0, opacity: 0 }} 
                className="overflow-hidden"
              >
                <div className="pt-6 border-t border-slate-50 grid gap-3">
                  {topMentions.map((mention, idx) => (
                    <div key={idx} className="bg-slate-50/70 p-5 rounded-2xl text-sm text-slate-600 italic relative border border-white group/quote">
                      <Quote size={12} className="absolute top-4 left-2 text-slate-200" />
                      <span className="pl-6 inline-block">"{mention.text}"</span>
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
                className="px-10 py-5 bg-[#003da5] text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.3em] flex items-center gap-3 hover:bg-blue-800 shadow-[0_20px_40px_rgba(0,61,165,0.4)] transition-all hover:scale-105 active:scale-95 group border-2 border-white/20"
              >
                Select Truth <ChevronRight size={22} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 py-8 flex flex-col h-full relative">
      <div className="space-y-4 text-center">
        <div className="inline-flex items-center justify-center p-4 bg-amber-50 text-amber-600 rounded-[2rem] mb-2 shadow-sm border border-amber-100">
          <Lightbulb size={36} />
        </div>
        <h2 className="text-4xl font-black text-slate-900 tracking-tight">Market Insights</h2>
      </div>

      <div className="grid gap-6 flex-1">
        {localInsights.map((item, i) => renderInsightCard(item, i))}
        
        {bespokeResult && renderInsightCard(bespokeResult, 'bespoke')}

        <div className="mt-12 p-10 bg-indigo-50/50 border-2 border-dashed border-indigo-200 rounded-[3rem] space-y-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-200">
              <Beaker size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-indigo-900 uppercase tracking-tight">Test Bespoke Insights</h3>
              <p className="text-sm text-indigo-600 font-medium">Have a specific hypothesis? We'll search the research for evidence.</p>
            </div>
          </div>

          <div className="relative">
            <textarea
              value={bespokeInput}
              onChange={(e) => setBespokeInput(e.target.value)}
              placeholder="e.g. Busy professionals value product longevity over initial price..."
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
                  {isTestingBespoke ? 'Scanning Data...' : 'Test Insight'}
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {activeMentionsOverlay !== null && (
          <MentionsOverlay 
            insight={activeMentionsOverlay === 'bespoke' ? bespokeResult! : localInsights[activeMentionsOverlay as number]}
            onClose={() => setActiveMentionsOverlay(null)}
            layoutId={`mention-btn-${activeMentionsOverlay}`}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default InsightsModule;
