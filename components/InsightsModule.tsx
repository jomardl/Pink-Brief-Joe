
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
  Zap
} from 'lucide-react';
import { ExtractedInsight, BriefData } from '../types';
import { testBespokeInsight } from '../geminiService';

interface Props {
  onNext: (data: Partial<BriefData>) => void;
  research: string;
  extractedInsights: ExtractedInsight[];
  selectedInsight: string;
}

const InsightsModule: React.FC<Props> = ({ onNext, research, extractedInsights, selectedInsight }) => {
  const [localInsights, setLocalInsights] = useState<ExtractedInsight[]>(extractedInsights);
  const [expandedIndices, setExpandedIndices] = useState<Set<number | string>>(new Set());
  const [localSelected, setLocalSelected] = useState<number | string | null>(
    selectedInsight ? extractedInsights.findIndex(i => i.insight === selectedInsight) : null
  );

  // Editing State
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [tempInsight, setTempInsight] = useState('');
  const [tempExplanation, setTempExplanation] = useState('');

  // Bespoke Insight State
  const [bespokeInput, setBespokeInput] = useState('');
  const [isTestingBespoke, setIsTestingBespoke] = useState(false);
  const [bespokeResult, setBespokeResult] = useState<ExtractedInsight | null>(null);

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
    if (editingId !== null) return; // Prevent selection while editing
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
    try {
      const result = await testBespokeInsight(research, bespokeInput);
      const newBespoke = { ...result, rank: 99 };
      setBespokeResult(newBespoke);
      setLocalSelected('bespoke');
    } catch (err) {
      console.error(err);
    } finally {
      setIsTestingBespoke(false);
    }
  };

  const getSelectedText = () => {
    if (localSelected === 'bespoke' && bespokeResult) return bespokeResult.insight;
    if (typeof localSelected === 'number') return localInsights[localSelected].insight;
    return '';
  };

  const renderInsightCard = (item: ExtractedInsight, id: number | string) => {
    const isSelected = localSelected === id;
    const isExpanded = expandedIndices.has(id);
    const isEditing = editingId === id;

    return (
      <motion.div 
        key={id}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => handleSelect(id)}
        className={`group relative flex flex-col bg-white border-2 rounded-[2.5rem] transition-all cursor-pointer overflow-hidden ${
          isSelected 
            ? 'border-[#003da5] shadow-2xl shadow-blue-100 ring-8 ring-blue-50/50' 
            : 'border-slate-50 hover:border-blue-100 hover:shadow-xl'
        }`}
      >
        <div className="p-8 space-y-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl transition-all ${
                isSelected ? 'bg-[#003da5] text-white' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-100'
              }`}>
                {typeof id === 'number' ? id + 1 : <Sparkles size={24} />}
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-1.5 px-4 py-1.5 bg-green-50 text-green-700 rounded-full text-[10px] font-black uppercase tracking-wider">
                  <BarChart3 size={14} /> {item.matchPercentage}% Relevance
                </div>
                <div className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-50 text-blue-700 rounded-full text-[10px] font-black uppercase tracking-wider">
                  <MessageSquare size={14} /> {item.mentionCount} Mentions
                </div>
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
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-green-100">
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
              {isExpanded ? <><ChevronUp size={16} /> Hide Evidence</> : <><ChevronDown size={16} /> View Verbatims ({item.verbatims?.length || 0})</>}
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
                  {item.verbatims?.map((quote, idx) => (
                    <div key={idx} className="bg-slate-50/70 p-5 rounded-2xl text-sm text-slate-600 italic relative border border-white">
                      <Quote size={12} className="absolute top-4 left-2 text-slate-200" />
                      <span className="pl-6 inline-block">"{quote}"</span>
                    </div>
                  ))}
                  {(!item.verbatims || item.verbatims.length === 0) && (
                    <p className="text-sm text-slate-400 p-4">No specific verbatims found for this insight.</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Let's Go Button Overlay (Animate on selection) */}
        <AnimatePresence>
          {isSelected && !isEditing && (
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              className="absolute right-8 top-1/2 -translate-y-1/2 z-10 hidden lg:block"
            >
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onNext({ selectedInsight: getSelectedText() });
                }}
                className="px-8 py-5 bg-[#003da5] text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] flex items-center gap-3 hover:bg-blue-800 shadow-2xl shadow-blue-300 transition-all hover:scale-110 active:scale-95 group"
              >
                Let's go <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
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
        <p className="text-slate-500 max-w-lg mx-auto text-lg leading-relaxed">
          Select the strategic "North Star" for your brief. You can now edit any insight to better reflect your intuition.
        </p>
      </div>

      <div className="grid gap-6 flex-1">
        {localInsights.map((item, i) => renderInsightCard(item, i))}
        
        {bespokeResult && renderInsightCard(bespokeResult, 'bespoke')}

        {/* Bespoke Input Section */}
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

      {/* Persistent Bottom Button for Mobile/Alternative */}
      <div className="flex justify-end pt-12 border-t border-slate-100">
        <button 
          onClick={() => onNext({ selectedInsight: getSelectedText() })} 
          disabled={!localSelected}
          className="px-14 py-6 bg-[#003da5] text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] flex items-center gap-3 hover:bg-blue-800 shadow-2xl shadow-blue-200 transition-all disabled:opacity-50"
        >
          Confirm Strategy <ChevronRight size={20} />
        </button>
      </div>

      {/* Floating Let's Go for the bottom of the screen if anything is selected */}
      <AnimatePresence>
        {localSelected && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 lg:hidden"
          >
            <button 
              onClick={() => onNext({ selectedInsight: getSelectedText() })}
              className="px-12 py-6 bg-green-600 text-white rounded-full font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-green-200 flex items-center gap-4"
            >
              <Zap size={20} fill="currentColor" /> Let's go
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InsightsModule;
