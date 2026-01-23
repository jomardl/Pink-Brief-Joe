
import React, { useState, useEffect } from 'react';
import { Zap, Sparkles, Loader2, ChevronRight, Volume2 } from 'lucide-react';
import { suggestCreativeDirections } from '../geminiService.ts';
import { BriefData } from '../types.ts';

interface Props {
  onNext: (data: Partial<BriefData>) => void;
  briefData: BriefData;
}

const CreativeModule: React.FC<Props> = ({ onNext, briefData }) => {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [customTone, setCustomTone] = useState('');

  useEffect(() => {
    const fetchDirections = async () => {
      setIsLoading(true);
      try {
        const results = await suggestCreativeDirections({
          objective: briefData.redThread?.find(s => s.label === 'Strategic Objective')?.content,
          proposition: briefData.redThread?.find(s => s.label === 'Core Proposition')?.content,
          persona: briefData.targetAudience?.name,
          insight: briefData.selectedInsight
        });
        setSuggestions(results);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDirections();
  }, [briefData]);

  const handleSelection = (idx: number) => {
    setSelectedIdx(idx);
    setCustomTone(suggestions[idx].tone);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center p-3 bg-amber-100 text-amber-700 rounded-2xl mb-2">
          <Zap size={32} />
        </div>
        <h2 className="text-3xl font-bold text-slate-900">Creative Hook</h2>
        <p className="text-slate-500">The "What" and "How". Choose a creative direction or craft your own.</p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 space-y-4">
          <Loader2 className="animate-spin text-amber-600" size={32} />
          <p className="text-slate-400 font-medium">Brainstorming with the AI...</p>
        </div>
      ) : (
        <div className="space-y-10">
          <div className="grid md:grid-cols-3 gap-4">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSelection(i)}
                className={`p-6 text-left rounded-3xl border-2 transition-all duration-300 relative overflow-hidden group ${
                  selectedIdx === i 
                    ? 'border-amber-500 bg-amber-50 shadow-lg shadow-amber-100 scale-[1.02]' 
                    : 'border-slate-100 bg-white hover:border-amber-200'
                }`}
              >
                {selectedIdx === i && (
                  <div className="absolute top-2 right-2 bg-amber-500 text-white p-1 rounded-full">
                    <Sparkles size={12} />
                  </div>
                )}
                <h4 className={`font-bold mb-2 ${selectedIdx === i ? 'text-amber-900' : 'text-slate-800'}`}>
                  {s.directionName}
                </h4>
                <p className="text-xs text-slate-500 italic mb-4">"{s.message}"</p>
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-bold text-slate-400">
                  <Volume2 size={12} />
                  {s.tone}
                </div>
              </button>
            ))}
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 p-8 space-y-6 shadow-sm">
             <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Sparkles size={16} className="text-amber-500" />
                  Primary Messaging
                </label>
                <textarea 
                  value={selectedIdx !== null ? suggestions[selectedIdx].message : ''}
                  onChange={(e) => {
                    const newS = [...suggestions];
                    if (selectedIdx !== null) {
                      newS[selectedIdx].message = e.target.value;
                      setSuggestions(newS);
                    }
                  }}
                  className="w-full h-24 p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none text-slate-700"
                  placeholder="The 'One Big Thing' we want the consumer to remember..."
                />
             </div>

             <div className="grid md:grid-cols-2 gap-6">
               <div className="space-y-3">
                  <label className="text-sm font-bold text-slate-700">Tone of Voice</label>
                  <input 
                    value={customTone}
                    onChange={(e) => setCustomTone(e.target.value)}
                    className="w-full p-4 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="e.g. Playful, Authoritative, Empathetic..."
                  />
               </div>
               <div className="space-y-3">
                  <label className="text-sm font-bold text-slate-700">Brand Character</label>
                  <input 
                    className="w-full p-4 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="e.g. The Wise Mentor, The Caring Best Friend..."
                  />
               </div>
             </div>
          </div>

          <button
            onClick={() => onNext({ 
              keyMessage: selectedIdx !== null ? suggestions[selectedIdx].message : '',
              tone: customTone
            })}
            disabled={selectedIdx === null && !customTone}
            className="w-full py-4 bg-[#003da5] text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-800 transition-all shadow-xl shadow-blue-200"
          >
            Review Final Brief
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
};

export default CreativeModule;
