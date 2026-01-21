
import React, { useState, useEffect } from 'react';
import { Target, Sparkles, ChevronRight, Loader2 } from 'lucide-react';
import { analyzeResearch } from '../geminiService';
import { BriefData } from '../types';

interface Props {
  onNext: (data: Partial<BriefData>) => void;
  research: string;
  selectedInsight: string;
  currentData: string;
}

const ObjectiveModule: React.FC<Props> = ({ onNext, research, selectedInsight, currentData }) => {
  const [objective, setObjective] = useState(currentData);
  const [insights, setInsights] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchInsights = async () => {
      if (!research) return;
      setIsLoading(true);
      try {
        const result = await analyzeResearch(research, selectedInsight);
        setInsights(result.keyInsights || []);
        if (!objective) setObjective(result.summary || '');
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInsights();
  }, [research, selectedInsight]);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="space-y-2 text-center">
        <div className="inline-flex items-center justify-center p-3 bg-indigo-100 text-indigo-700 rounded-2xl mb-2">
          <Target size={32} />
        </div>
        <h2 className="text-3xl font-bold text-slate-900">Strategic Objective</h2>
        <p className="text-slate-500">Based on your focus on <span className="text-blue-600 font-semibold italic">"{selectedInsight}"</span>, what is the mission?</p>
      </div>

      <div className="grid gap-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 space-y-4">
            <Loader2 className="animate-spin text-blue-600" size={32} />
            <p className="text-slate-400 font-medium">Synthesizing strategic goals...</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Sparkles size={14} className="text-amber-500" />
                Supporting Insights
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {insights.map((insight, i) => (
                  <div key={i} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm text-sm text-slate-600 italic">
                    "{insight}"
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700 ml-1">Communication Objective</label>
              <textarea
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder="Define the primary business or communication objective..."
                className="w-full h-40 p-5 rounded-3xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white text-lg font-medium text-slate-800 leading-relaxed"
              />
            </div>
          </>
        )}

        <button
          onClick={() => onNext({ strategicObjective: objective })}
          disabled={!objective.trim() || isLoading}
          className="w-full py-4 bg-[#003da5] text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-800 disabled:opacity-50 transition-all shadow-xl shadow-blue-200 mt-4"
        >
          Confirm Objective
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default ObjectiveModule;
