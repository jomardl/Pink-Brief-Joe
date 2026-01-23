
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
   BookOpen, ChevronRight, Printer, Download, Sparkles, 
  ChevronDown, Edit3, Check, Save, Upload, AlertCircle 
} from 'lucide-react';
import { generateMarketingSummary, generateRedThread } from '../geminiService';
import { BriefData, RedThreadStep, StrategicSection } from '../types';

interface Props {
  onNext: (data: Partial<BriefData>) => void;
  briefData: BriefData;
  onProcessing: (val: boolean) => void;
}

const StrategyModule: React.FC<Props> = ({ onNext, briefData, onProcessing }) => {
  const [sections, setSections] = useState<StrategicSection[]>(briefData.marketingSummarySections || []);
  const [redThread, setRedThread] = useState<RedThreadStep[]>(briefData.redThread || []);
  const [essence, setEssence] = useState("Red Thread");
  const [unlock, setUnlock] = useState(briefData.redThreadEssence || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<string | null>(null);

  // Editable Labels State
  const [productName, setProductName] = useState("PRODUCT NAME");
  const [productPromise, setProductPromise] = useState("PRODUCT PROMISE");
  const [offerText, setOfferText] = useState("OFFER");

  const hasInitialized = useRef(false);

  useEffect(() => {
    const fetchData = async () => {
      if (hasInitialized.current || isLoading) return;
      if (sections.length > 0 && redThread.length > 0) {
        hasInitialized.current = true;
        return;
      }

      setIsLoading(true);
      onProcessing(true);
      setError(null);

      try {
        const [summaryRes, threadRes] = await Promise.all([
          generateMarketingSummary(briefData.researchText, briefData.selectedInsight),
          generateRedThread(briefData.researchText, briefData.selectedInsight)
        ]);

        setSections(summaryRes || []);
        // We now need exactly 5 steps
        const baseSteps = (threadRes?.steps || []).slice(0, 5);
        while(baseSteps.length < 5) {
          baseSteps.push({ label: 'Strategy', content: 'Logical Step', imagePrompt: 'P&G Strategy' });
        }
        setRedThread(baseSteps);
        setUnlock(threadRes?.redThreadUnlock || "Resolving the tension");
        setEssence("Red Thread");
        hasInitialized.current = true;
        if (summaryRes?.length > 0) setExpandedSection(summaryRes[0].id);
      } catch (err: any) {
        console.error("Strategy error:", err);
        setError("Strategic synthesis failed. Check your API connection.");
      } finally {
        setIsLoading(false);
        onProcessing(false);
      }
    };

    fetchData();
  }, [briefData.researchText, briefData.selectedInsight]);

  const updateSectionContent = (id: string, field: 'content' | 'summary', val: string) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, [field]: val } : s));
  };

  const handleImageUpload = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const nextThread = [...redThread];
        nextThread[idx] = { ...nextThread[idx], userImage: reader.result as string };
        setRedThread(nextThread);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFinish = () => {
    onNext({
      marketingSummarySections: sections,
      redThread: redThread,
      redThreadEssence: essence
    });
  };

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-24 text-center space-y-6 h-full">
        <div className="p-6 bg-rose-50 text-rose-500 rounded-full"><AlertCircle size={48} /></div>
        <h3 className="text-2xl font-black text-slate-900 uppercase">Strategic Error</h3>
        <p className="text-slate-500 max-w-md mx-auto font-medium">{error}</p>
        <button onClick={() => window.location.reload()} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest">Retry Synthesis</button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-24 space-y-8 h-full">
        <motion.div animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }} transition={{ repeat: Infinity, duration: 4 }} className="p-8 bg-[#003da5] text-white rounded-[3rem] shadow-2xl">
          <BookOpen size={64} />
        </motion.div>
        <div className="text-center space-y-3">
          <p className="text-slate-400 font-black uppercase tracking-[0.5em] text-xs">Architecting Logic...</p>
          <p className="text-xl font-bold text-slate-800 tracking-tight">Synthesizing Red Thread & Marketing Logic</p>
        </div>
        <div className="w-64 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <motion.div initial={{ x: "-100%" }} animate={{ x: "100%" }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} className="w-full h-full bg-[#ed008c]" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-12 flex flex-col h-full relative space-y-16">
      
      {/* 1. Execution Architecture (Red Thread) */}
      <section className="space-y-8">
        <div className="flex items-center gap-6 max-w-4xl mx-auto">
          <div className="w-16 h-[4px] bg-rose-500 rounded-full" />
          <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Execution Architecture</h3>
          <div className="flex-1 h-[1px] bg-slate-100" />
        </div>

        <div className="relative min-h-[600px] overflow-visible">
          {/* ESSENCE & UNLOCK HEADER */}
          <div className="flex items-stretch gap-0 mb-6 max-w-4xl mx-auto relative z-30">
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="bg-rose-600 text-white px-8 py-6 rounded-l-[3rem] shadow-2xl shadow-rose-200/50 flex flex-col justify-center min-w-[240px] border-r-2 border-rose-500/50"
            >
              <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80 mb-1">STRATEGIC ESSENCE</span>
              <span className="text-3xl font-black tracking-tighter uppercase leading-none">{essence}</span>
            </motion.div>

            <motion.div 
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="bg-[#003da5] text-white px-10 py-6 rounded-r-[3rem] shadow-2xl shadow-blue-200/50 flex-1 flex flex-col justify-center"
            >
              <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80 mb-1">Job to be done</span>
              <span className="text-xl font-black italic tracking-tight leading-snug uppercase">
                {unlock || "Resolving the consumer tension"}
              </span>
            </motion.div>
          </div>

          {/* SVG ANIMATED THREAD - Now starts from header and snakes through 5 boxes */}
          <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-10 overflow-visible" viewBox="0 0 1200 800">
            <motion.path
              d="M 220 30 C 220 90, 290 90, 290 90 L 590 90 C 590 180, 440 180, 440 270 C 440 360, 290 360, 290 450 L 590 450"
              fill="transparent" stroke="#ff0000" strokeWidth="6" strokeLinecap="round" strokeDasharray="20,10"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 4, ease: "easeInOut" }}
            />
          </svg>

          {/* COMPACT RED THREAD LAYOUT */}
          <div className="relative z-20 max-w-3xl mx-auto h-[550px]">
            {/* SQUARES - 180px, Tight Positioning */}
            <Frame index={0} pos="top-[0px] left-[150px]" size="180px" userImage={redThread[0]?.userImage} onUpload={(e) => handleImageUpload(0, e)} />
            <Frame index={1} pos="top-[0px] left-[450px]" size="180px" userImage={redThread[1]?.userImage} onUpload={(e) => handleImageUpload(1, e)} />
            <Frame index={2} pos="top-[180px] left-[300px]" size="180px" userImage={redThread[2]?.userImage} onUpload={(e) => handleImageUpload(2, e)} />
            <Frame index={3} pos="top-[360px] left-[150px]" size="180px" userImage={redThread[3]?.userImage} onUpload={(e) => handleImageUpload(3, e)} />
            <Frame index={4} pos="top-[360px] left-[450px]" size="180px" userImage={redThread[4]?.userImage} onUpload={(e) => handleImageUpload(4, e)} />

            {/* EDITABLE TEXT WINDOWS (Green Bars) - Positioned centered in gaps */}
            
            {/* 1. PRODUCT NAME (Centered between Top Two) */}
            <EditableBar 
              pos="top-[75px] left-[300px]" 
              value={productName} 
              onChange={setProductName} 
            />

            {/* 2. OFFER (On Middle Square) */}
            <EditableBar 
              pos="top-[255px] left-[300px]" 
              value={offerText} 
              onChange={setOfferText} 
            />

            {/* 3. PRODUCT PROMISE (Centered between Bottom Two) */}
            <EditableBar 
              pos="top-[435px] left-[300px]" 
              value={productPromise} 
              onChange={setProductPromise} 
            />
          </div>
        </div>
      </section>

      {/* 2. Deep Dive Sections */}
      <section className="space-y-12 pt-16 border-t border-slate-100">
        <div className="space-y-4 text-center">
          <div className="inline-flex items-center justify-center p-4 bg-indigo-50 text-indigo-600 rounded-[2rem] mb-2 shadow-sm border border-indigo-100">
            <BookOpen size={36} />
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Strategic Interrogation</h2>
          <p className="text-slate-500 max-w-2xl mx-auto text-lg font-medium leading-relaxed italic">
            Expanding the logical narrative beneath the Red Thread.
          </p>
        </div>

        <div className="space-y-6">
          {(sections || []).map((section, idx) => {
            const isExpanded = expandedSection === section.id;
            const isEditing = editingSection === section.id;

            return (
              <motion.div 
                key={section.id}
                layout
                className={`bg-white rounded-[2.5rem] border-2 transition-all duration-500 ${isExpanded ? 'border-[#003da5] shadow-2xl shadow-blue-100' : 'border-slate-100 hover:border-blue-100 shadow-sm hover:shadow-md'}`}
              >
                <div 
                  onClick={() => !isEditing && setExpandedSection(isExpanded ? null : section.id)}
                  className="p-8 cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl transition-colors ${isExpanded ? 'bg-[#003da5] text-white shadow-lg' : 'bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600'}`}>
                      {idx + 1}
                    </div>
                    <div>
                      <h3 className={`text-xl font-black uppercase tracking-tight ${isExpanded ? 'text-[#003da5]' : 'text-slate-800'}`}>
                        {section.title}
                      </h3>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                        {section.purpose}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.button
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingSection(isEditing ? null : section.id);
                          }}
                          className={`p-3 rounded-xl transition-all ${isEditing ? 'bg-green-500 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600'}`}
                        >
                          {isEditing ? <Check size={20} /> : <Edit3 size={20} />}
                        </motion.button>
                      )}
                    </AnimatePresence>
                    <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} className="text-slate-300">
                      <ChevronDown size={24} />
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
                      <div className="px-10 pb-10 pt-2 border-t border-slate-50">
                        {/* BLUE GIST PARAGRAPH */}
                        <div className="mb-8 p-8 bg-blue-50 rounded-3xl border border-blue-100">
                          {isEditing ? (
                            <textarea 
                              value={section.summary}
                              onChange={(e) => updateSectionContent(section.id, 'summary', e.target.value)}
                              placeholder="Summary gist..."
                              className="w-full p-4 bg-white rounded-xl border-2 border-blue-200 outline-none font-bold text-blue-800"
                            />
                          ) : (
                            <p className="text-xl font-black text-[#003da5] leading-relaxed">
                              {section.summary}
                            </p>
                          )}
                        </div>

                        {/* MAIN NARRATIVE CONTENT */}
                        {isEditing ? (
                          <textarea 
                            value={section.content}
                            onChange={(e) => updateSectionContent(section.id, 'content', e.target.value)}
                            className="w-full min-h-[400px] p-8 bg-slate-50 rounded-3xl border-2 border-blue-100 focus:border-[#003da5] outline-none text-lg leading-relaxed text-slate-800 font-medium"
                            style={{ fontFamily: 'Georgia, serif' }}
                          />
                        ) : (
                          <div className="p-8 relative">
                            <div className="absolute top-6 right-8 opacity-5 pointer-events-none">
                              <Sparkles size={100} />
                            </div>
                            <div 
                              className="prose prose-slate prose-lg max-w-none text-slate-800 leading-[2] text-xl whitespace-pre-wrap"
                              style={{ fontFamily: 'Georgia, serif' }}
                            >
                              {section.content}
                            </div>
                          </div>
                        )}
                        
                        {isEditing && (
                          <div className="mt-6 flex justify-end">
                            <button 
                              onClick={() => setEditingSection(null)}
                              className="flex items-center gap-2 px-8 py-3 bg-[#003da5] text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-200"
                            >
                              <Save size={16} /> Save Changes
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

      {/* FOOTER ACTIONS */}
      <div className="flex justify-between items-center py-12 border-t border-slate-100">
        <div className="flex gap-4">
          <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all">
            <Printer size={16} /> Print Strategic Logic
          </button>
          <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all">
            <Download size={16} /> Export Strategy
          </button>
        </div>

        <button 
          onClick={handleFinish}
          className="px-24 py-8 bg-[#003da5] text-white rounded-[3rem] font-black text-sm uppercase tracking-[0.4em] flex items-center gap-4 hover:bg-blue-800 shadow-[0_40px_80px_rgba(0,61,165,0.3)] hover:scale-105 active:scale-95 transition-all"
        >
          Confirm Strategy & Proceed <ChevronRight size={28} />
        </button>
      </div>
    </div>
  );
};

// COMPONENT FOR EDITABLE GREEN BARS
const EditableBar: React.FC<{ pos: string; value: string; onChange: (val: string) => void }> = ({ pos, value, onChange }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    className={`absolute ${pos} z-30 w-[180px]`}
  >
    <div className="bg-green-500/90 backdrop-blur rounded shadow-2xl border border-white/40 overflow-hidden group">
      <input 
        value={value}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        className="w-full bg-transparent border-none text-black font-black text-[10px] uppercase tracking-widest text-center py-3 focus:ring-0 focus:outline-none placeholder-black/30"
      />
      <div className="absolute top-0 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Edit3 size={10} className="text-black/50" />
      </div>
    </div>
  </motion.div>
);

// FRAME COMPONENT FOR RED THREAD GRID
const Frame: React.FC<{ 
  index: number; 
  pos: string; 
  size: string;
  userImage?: string; 
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void 
}> = ({ index, pos, size, userImage, onUpload }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: 0.15 * index }}
    className={`absolute ${pos} group`}
    style={{ width: size, height: size }}
  >
    <div className="relative w-full h-full bg-red-600 rounded-xl overflow-hidden shadow-2xl border-4 border-white transition-all duration-500 group-hover:scale-105 group-hover:shadow-[0_40px_80px_rgba(255,0,0,0.25)]">
      {userImage ? (
        <img src={userImage} alt={`Step ${index + 1}`} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-white/40">
           <Upload size={24} strokeWidth={3} />
           <p className="text-[9px] font-black uppercase tracking-widest mt-2">Upload Context</p>
        </div>
      )}
      <input 
        type="file" 
        accept="image/*" 
        onChange={onUpload} 
        className="absolute inset-0 opacity-0 cursor-pointer z-20" 
      />
    </div>
  </motion.div>
);

export default StrategyModule;
