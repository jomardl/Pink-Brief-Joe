
import React, { useState, useEffect } from 'react';
import { CheckCircle, Download, Share2, RefreshCw, Loader2, FileText, Send } from 'lucide-react';
import { finalizeBrief } from '../geminiService';
import { BriefData } from '../types';

interface Props {
  briefData: BriefData;
  onReset: () => void;
}

const SummaryModule: React.FC<Props> = ({ briefData, onReset }) => {
  const [finalBrief, setFinalBrief] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const generate = async () => {
      setIsLoading(true);
      try {
        const result = await finalizeBrief(briefData);
        setFinalBrief(result);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    generate();
  }, [briefData]);

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([finalBrief], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "PG_Creative_Brief.txt";
    document.body.appendChild(element);
    element.click();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center p-3 bg-green-100 text-green-700 rounded-2xl mb-2">
          <CheckCircle size={32} />
        </div>
        <h2 className="text-3xl font-bold text-slate-900">Creative Brief Finalized</h2>
        <p className="text-slate-500">Your brief is ready for the agency. Review the synthesized output below.</p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-24 space-y-4">
          <Loader2 className="animate-spin text-green-600" size={48} />
          <p className="text-slate-400 font-bold text-lg">Architecting your final document...</p>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="bg-slate-50 border border-slate-200 rounded-[2rem] p-8 md:p-12 shadow-inner font-serif text-slate-800 leading-relaxed whitespace-pre-wrap max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
            {finalBrief || 'No content generated.'}
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            <button
              onClick={handleDownload}
              className="flex items-center justify-center gap-2 py-4 px-6 bg-[#003da5] text-white rounded-2xl font-bold hover:bg-blue-800 transition-all shadow-lg shadow-blue-200"
            >
              <Download size={20} />
              Export .TXT
            </button>
            
            <button
              className="flex items-center justify-center gap-2 py-4 px-6 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold hover:bg-slate-50 transition-all"
            >
              <Send size={20} />
              Email Brief
            </button>

            <button
              className="flex items-center justify-center gap-2 py-4 px-6 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold hover:bg-slate-50 transition-all"
            >
              <Share2 size={20} />
              Share Link
            </button>

            <button
              onClick={onReset}
              className="flex items-center justify-center gap-2 py-4 px-6 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
            >
              <RefreshCw size={20} />
              New Brief
            </button>
          </div>
          
          <div className="flex items-center justify-center gap-3 p-4 bg-blue-50/50 rounded-2xl border border-blue-100 text-blue-800 text-sm font-medium">
            <FileText size={18} />
            Generated with P&G Strategic AI Engine v3.1
          </div>
        </div>
      )}
    </div>
  );
};

export default SummaryModule;
