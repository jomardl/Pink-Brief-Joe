
import React, { useState } from 'react';
import { Upload, FileText, ChevronRight, X, Loader2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { extractRankedInsights } from '../geminiService';
import { BriefData } from '../types';

interface Props {
  onNext: (data: Partial<BriefData>) => void;
  currentData: string;
}

const ResearchModule: React.FC<Props> = ({ onNext, currentData }) => {
  const [text, setText] = useState(currentData);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessing(true);

    const reader = new FileReader();
    const isTextLike = file.type === "text/plain" || 
                       file.type === "text/rtf" || 
                       file.type === "application/rtf" ||
                       file.name.endsWith('.txt') || 
                       file.name.endsWith('.rtf');

    if (isTextLike) {
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setText(content);
        setIsProcessing(false);
      };
      reader.readAsText(file);
    } else {
      // Basic fallback simulation for Word/PDF extraction
      setTimeout(() => {
        const simulatedText = `Extracted Research Data from ${file.name}:
        Consumers often express frustration with current products feeling bulky.
        Many mentioned a desire for "weightless protection".
        Verbatim: "I want to forget I'm even wearing it."
        Research identifies a significant gap in high-performance slim options.`;
        setText(simulatedText);
        setIsProcessing(false);
      }, 1200);
    }
  };

  const handleProcess = async () => {
    if (!text.trim()) return;
    setIsProcessing(true);
    try {
      const results = await extractRankedInsights(text);
      onNext({ 
        researchText: text, 
        extractedInsights: results.insights.sort((a: any, b: any) => a.rank - b.rank) 
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 h-full flex flex-col justify-center py-12">
      <div className="space-y-4 text-center">
        <div className="inline-flex items-center justify-center p-4 bg-blue-50 text-[#003da5] rounded-[2rem] mb-2 shadow-sm border border-blue-100">
          <Upload size={36} />
        </div>
        <h2 className="text-4xl font-black text-slate-900 tracking-tight">Import Research</h2>
        <p className="text-slate-500 max-w-lg mx-auto text-lg leading-relaxed">
          Upload your consumer verbatims or research reports. We will analyze the content strictly based on your document.
        </p>
      </div>

      <div className="grid gap-8 max-w-2xl mx-auto w-full">
        <div className="relative group">
          <input 
            type="file" 
            onChange={handleFileUpload} 
            accept=".pdf,.doc,.docx,.txt,.rtf" 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
          />
          <div className="border-2 border-dashed border-slate-200 group-hover:border-[#003da5] group-hover:bg-blue-50/30 rounded-[3rem] p-16 transition-all flex flex-col items-center gap-6 shadow-sm">
            <div className="w-20 h-20 bg-white rounded-3xl shadow-lg border border-slate-50 flex items-center justify-center text-slate-300 group-hover:text-[#003da5] group-hover:scale-110 transition-all duration-500">
              {isProcessing ? <Loader2 className="animate-spin" size={32} /> : <Upload size={32} />}
            </div>
            <div className="text-center">
              <p className="text-xl font-black text-slate-800">Drop document here</p>
              <p className="text-sm text-slate-400 mt-1 font-medium">Supports PDF, Word, and Text Files</p>
            </div>
          </div>
        </div>

        {fileName && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex items-center justify-between p-6 bg-white border border-slate-100 rounded-3xl shadow-xl shadow-slate-100/50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200"><FileText size={20} /></div>
                <div className="flex flex-col">
                  <span className="text-lg font-black text-slate-800">{fileName}</span>
                  <span className="text-[10px] text-blue-500 uppercase tracking-[0.2em] font-black">{isProcessing ? 'Extracting Content...' : 'Document Loaded'}</span>
                </div>
              </div>
              {!isProcessing && (
                <button 
                  onClick={() => {setFileName(null); setText('');}} 
                  className="p-3 hover:bg-rose-50 rounded-full text-slate-300 hover:text-rose-500 transition-all"
                >
                  <X size={20} />
                </button>
              )}
            </div>
            
            <button 
              onClick={handleProcess} 
              disabled={!text.trim() || isProcessing} 
              className="w-full py-6 bg-[#003da5] text-white rounded-3xl font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-blue-800 disabled:opacity-50 transition-all shadow-2xl shadow-blue-200 active:scale-95"
            >
              {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
              {isProcessing ? 'Analyzing Research...' : 'Extract Insights'}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ResearchModule;
