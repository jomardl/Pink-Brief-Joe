
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
   BookOpen, ChevronRight, Printer, Download, Sparkles, 
  ChevronDown, Edit3, Check, Save, AlertCircle, Quote, RefreshCcw
} from 'lucide-react';
import { performStrategicSynthesis } from '../geminiService.ts';
import { BriefData, StrategicSection } from '../types.ts';

interface Props {
  onNext: (data: Partial<BriefData>) => void;
  briefData: BriefData;
  onProcessing: (val: boolean) => void;
}

const HARD_TIMEOUT_MS = 60000; 

const StrategyModule: React.FC<Props> = ({ onNext, briefData, onProcessing }) => {
  const [sections, setSections] = useState<StrategicSection[]>(briefData.marketingSummarySections || []);
  const [summaryMeta, setSummaryMeta] = useState({ 
    essence: briefData.redThreadEssence || "Red Thread", 
    unlock: "The Strategic Unlock" 
  });
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("Architecting Strategic Logic...");
  const [error, setError] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<string | null>(null);

  const fetchStatus = useRef<'idle' | 'processing' | 'done'>('idle');

  useEffect(() => {
    const initSynthesis = async () => {
      if (fetchStatus.current !== 'idle' || sections.length > 0) return;

      setIsLoading(true);
      onProcessing(true);
      setError(null);
      fetchStatus.current = 'processing';

      const statusInterval = setInterval(() => {
        setStatus(prev => {
          if (prev.includes("Architecting")) return "Distilling Qualitative Data...";
          if (prev.includes("Distilling")) return "Calibrating Human Truths...";
          if (prev.includes("Calibrating")) return "Finalizing Global Narrative...";
          return "Almost there, securing logic...";
        });
      }, 12000);

      const hardTimeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("The AI engine took too long to respond. Please try again.")), HARD_TIMEOUT_MS)
      );

      try {
        const result: any = await Promise.race([
          performStrategicSynthesis(briefData.researchText, briefData.selectedInsight),
          hardTimeout
        ]);

        if (result && result.sections) {
          setSections(result.sections);
          setSummaryMeta({
            essence: result.redThreadEssence || "Red Thread",
            unlock: result.redThreadUnlock || "The Strategic Unlock"
          });
          if (result.sections.length > 0) setExpandedSection(result.sections[0].id);
          fetchStatus.current = 'done';
        } else {
          throw new Error("Received a malformed strategic response from the AI.");
        }
      } catch (err: any) {
        console.error("Strategic Module Component Error:", err);
        setError(err.message || "A network or parsing error occurred.");
        fetchStatus.current = 'idle';
      } finally {
        clearInterval(statusInterval);
        setIsLoading(false);
        onProcessing(false);
      }
    };

    initSynthesis();
  }, []);

  const handleManualRetry = () => {
    fetchStatus.current = 'idle';
    setSections([]);
    setError(null);
    window.location.reload();
  };

  const updateSectionContent = (id: string, field: 'content' | 'summary', val: string) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, [field]: val } : s));
  };

  const handleFinish = () => {
    onNext({
      marketingSummarySections: sections,
      redThreadEssence: summaryMeta.essence,
      redThread: []
    });
  };

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-24 text-center space-y-8 h-full">
        <div className="p-8 bg-rose-50 text-rose-500 rounded-full shadow-inner"><AlertCircle size={64} /></div>
        <div className="space-y-4">
          <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tight">System Interrupted</h3>
          <p className="text-slate-500 max-w-md mx-auto font-medium leading-relaxed">
            {error}
          </p>
        </div>
        <div className="flex flex-col gap-4">
          <button 
            onClick={handleManualRetry} 
            className="px-12 py-5 bg-[#003da5] text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-blue-200 hover:scale-105 transition-all flex items-center gap-3"
          >
            <RefreshCcw size={18} /> Restart Module
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-24 space-y-12 h-full">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }} 
          transition={{ repeat: Infinity, duration: 4 }} 
          className="p-12 bg-[#003da5] text-white rounded-[4rem] shadow-2xl shadow-blue-900/20 relative"
        >
          <div className="absolute inset-0 bg-white/10 rounded-[4rem] animate-ping opacity-20" />
          <BookOpen size={80} />
        </motion.div>
        <div className="text-center space-y-4">
          <p className="text-slate-400 font-black uppercase tracking-[0.8em] text-[11px]">Stress-Testing Logic</p>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">{status}</h2>
          <p className="text-slate-400 max-w-md mx-auto text-sm font-medium italic">Gemini is synthesizing high-fidelity strategic rationale. This may take up to 45 seconds.</p>
        </div>
        <div className="w-80 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-50 shadow-inner">
          <motion.div 
            initial={{ x: "-100%" }} 
            animate={{ x: "100%" }} 
            transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }} 
            className="w-full h-full bg-gradient-to-r from-transparent via-[#ed008c] to-transparent" 
          />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-12 flex flex-col h-full relative space-y-16">
      <section className="space-y-6">
        <div className="flex items-center gap-6">
          <div className="w-12 h-[3px] bg-rose-600 rounded-full" />
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.4em]">Strategic North Star</h3>
        </div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-stretch gap-0 rounded-[3rem] overflow-hidden shadow-2xl shadow-blue-900/10 border-2 border-white"
        >
          <div className="bg-rose-600 text-white px-12 py-10 flex flex-col justify-center min-w-[300px] border-r-2 border-rose-500/50 relative overflow-hidden">
            <div className="absolute top-[-20%] left-[-20%] w-full h-full bg-white/5 rounded-full blur-3xl pointer-events-none" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-70 mb-2">Essence</span>
            <span className="text-4xl font-black tracking-tighter uppercase leading-none">{summaryMeta.essence}</span>
          </div>
          <div className="bg-[#003da5] text-white px-12 py-10 flex-1 flex flex-col justify-center relative">
            <Quote size={48} className="absolute top-6 right-8 opacity-10" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-70 mb-2">The Unlock</span>
            <span className="text-2xl font-black italic tracking-tight leading-snug uppercase max-w-2xl">
              {summaryMeta.unlock}
            </span>
          </div>
        </motion.div>
      </section>
      <section className="space-y-12">
        <div className="space-y-4 text-center">
          <div className="inline-flex items-center justify-center p-4 bg-indigo-50 text-indigo-600 rounded-[2rem] mb-2 shadow-sm border border-indigo-100">
            <BookOpen size={32} />
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Logical Interrogation</h2>
          <p className="text-slate-500 max-w-2xl mx-auto text-lg font-medium leading-relaxed italic">
            A comprehensive expansion of the strategic logic beneath the North Star.
          </p>
        </div>
        <div className="space-y-6">
          {sections.map((section, idx) => {
            const isExpanded = expandedSection === section.id;
            const isEditing = editingSection === section.id;
            return (
              <motion.div 
                key={section.id}
                layout
                className={`bg-white rounded-[3rem] border-2 transition-all duration-700 ${
                  isExpanded 
                    ? 'border-[#003da5] shadow-2xl shadow-blue-100/50' 
                    : 'border-slate-100 hover:border-blue-200 shadow-sm hover:shadow-xl'
                }`}
              >
                <div 
                  onClick={() => !isEditing && setExpandedSection(isExpanded ? null : section.id)}
                  className="p-8 cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-8">
                    <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center font-black text-2xl transition-all duration-500 ${
                      isExpanded ? 'bg-[#003da5] text-white shadow-xl shadow-blue-200' : 'bg-slate-50 text-slate-300 group-hover:bg-blue-50 group-hover:text-blue-500'
                    }`}>
                      {idx + 1}
                    </div>
                    <div className="space-y-1">
                      <h3 className={`text-2xl font-black uppercase tracking-tight transition-colors duration-500 ${isExpanded ? 'text-[#003da5]' : 'text-slate-800'}`}>
                        {section.title}
                      </h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                        {section.purpose}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.button
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingSection(isEditing ? null : section.id);
                          }}
                          className={`p-3.5 rounded-2xl transition-all ${isEditing ? 'bg-green-500 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600'}`}
                        >
                          {isEditing ? <Check size={20} /> : <Edit3 size={20} />}
                        </motion.button>
                      )}
                    </AnimatePresence>
                    <motion.div 
                      animate={{ rotate: isExpanded ? 180 : 0 }} 
                      className={`transition-colors ${isExpanded ? 'text-[#003da5]' : 'text-slate-200'}`}
                    >
                      <ChevronDown size={24} strokeWidth={3} />
                    </motion.div>
                  </div>
                </div>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-10 pb-12 pt-2 border-t border-slate-50 space-y-8">
                        <div className="p-8 bg-blue-50/50 rounded-[2.5rem] border border-blue-100 shadow-inner relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-4 opacity-5"><Sparkles size={64} /></div>
                          {isEditing ? (
                            <textarea 
                              value={section.summary}
                              onChange={(e) => updateSectionContent(section.id, 'summary', e.target.value)}
                              className="w-full p-4 bg-white rounded-2xl border-2 border-blue-200 outline-none font-bold text-blue-900 text-lg"
                              placeholder="Summary gist..."
                            />
                          ) : (
                            <p className="text-xl font-black text-[#003da5] leading-relaxed">
                              {section.summary}
                            </p>
                          )}
                        </div>
                        <div className="relative p-2">
                          {isEditing ? (
                            <textarea 
                              value={section.content}
                              onChange={(e) => updateSectionContent(section.id, 'content', e.target.value)}
                              className="w-full min-h-[400px] p-8 bg-slate-50 rounded-[2.5rem] border-2 border-blue-100 focus:border-[#003da5] outline-none text-xl leading-relaxed text-slate-800 font-medium"
                              style={{ fontFamily: 'Georgia, serif' }}
                            />
                          ) : (
                            <div 
                              className="prose prose-slate prose-xl max-w-none text-slate-800 leading-[1.9] text-xl whitespace-pre-wrap font-medium"
                              style={{ fontFamily: 'Georgia, serif' }}
                            >
                              {section.content}
                            </div>
                          )}
                        </div>
                        {isEditing && (
                          <div className="flex justify-end pt-4">
                            <button 
                              onClick={() => setEditingSection(null)}
                              className="flex items-center gap-3 px-8 py-4 bg-[#003da5] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-blue-200 hover:scale-105 active:scale-95 transition-all"
                            >
                              <Save size={18} /> Save Logic
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </section>
      <div className="flex justify-between items-center py-12 border-t border-slate-200">
        <div className="flex gap-4">
          <button className="flex items-center gap-3 px-6 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
            <Printer size={18} /> Print Logic
          </button>
          <button className="flex items-center gap-3 px-6 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
            <Download size={18} /> Export Strat
          </button>
        </div>
        <button 
          onClick={handleFinish}
          className="px-20 py-8 bg-[#003da5] text-white rounded-[3rem] font-black text-sm uppercase tracking-[0.4em] flex items-center gap-4 hover:bg-blue-800 shadow-[0_30px_60px_rgba(0,61,165,0.25)] hover:scale-105 active:scale-95 transition-all group"
        >
          Finalize Strategy <ChevronRight size={28} className="group-hover:translate-x-2 transition-transform" />
        </button>
      </div>
    </div>
  );
};

export default StrategyModule;
