
import React, { useState } from 'react';
import { Upload, FileText, X, Loader2, ArrowRight, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { extractRankedInsights } from '../geminiService';
import { BriefData } from '../types';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';

interface Props {
  onNext: (data: Partial<BriefData>) => void;
  currentData: string;
  onProcessing: (val: boolean) => void;
}

// Set PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const ResearchModule: React.FC<Props> = ({ onNext, currentData, onProcessing }) => {
  const [text, setText] = useState(currentData);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Parse PDF files
  const parsePDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const textParts: string[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item: any) => item.str)
        .join(' ');
      textParts.push(pageText);
    }

    return textParts.join('\n\n');
  };

  // Parse DOCX files
  const parseDOCX = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  };

  // Parse Excel and CSV files
  const parseSpreadsheet = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const textParts: string[] = [];

    workbook.SheetNames.forEach(sheetName => {
      const sheet = workbook.Sheets[sheetName];
      const csv = XLSX.utils.sheet_to_csv(sheet);
      textParts.push(`--- ${sheetName} ---\n${csv}`);
    });

    return textParts.join('\n\n');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setFileName(file.name);
    setIsProcessing(true);
    onProcessing(true);

    try {
      const ext = file.name.toLowerCase().split('.').pop() || '';
      let content = '';

      if (['txt', 'rtf'].includes(ext) || file.type === 'text/plain') {
        content = await file.text();
      } else if (ext === 'pdf') {
        content = await parsePDF(file);
      } else if (ext === 'docx') {
        content = await parseDOCX(file);
      } else if (ext === 'doc') {
        try {
          content = await parseDOCX(file);
        } catch {
          setError('Legacy .doc format has limited support. Please save as .docx for best results.');
          setIsProcessing(false);
          onProcessing(false);
          return;
        }
      } else if (['xlsx', 'xls', 'csv'].includes(ext)) {
        content = await parseSpreadsheet(file);
      } else {
        setError(`Unsupported file type: .${ext}`);
        setIsProcessing(false);
        onProcessing(false);
        return;
      }

      if (!content.trim()) {
        setError('Could not extract text from this file. The file may be empty or protected.');
        setIsProcessing(false);
        onProcessing(false);
        return;
      }

      setText(content);
    } catch (err) {
      console.error('File parsing error:', err);
      setError('Failed to parse file. Please try a different format or check the file is not corrupted.');
    } finally {
      setIsProcessing(false);
      onProcessing(false);
    }
  };

  const handleProcess = async () => {
    if (!text.trim()) return;
    setIsProcessing(true);
    onProcessing(true);
    setError(null);
    try {
      const results = await extractRankedInsights(text);
      if (!results.insights || results.insights.length === 0) {
        setError("Could not extract insights from this research. Please provide more descriptive content.");
        setIsProcessing(false);
        onProcessing(false);
        return;
      }
      onNext({
        researchText: text,
        extractedInsights: results.insights.sort((a: any, b: any) => a.rank - b.rank)
      });
    } catch (err) {
      console.error(err);
      setError("Analysis failed. Please check your API key and try again.");
    } finally {
      setIsProcessing(false);
      onProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-mono text-[#6f6f6f] uppercase tracking-wider mb-2">
          Step 1
        </p>
        <h2 className="text-3xl font-light text-[#161616] tracking-tight mb-2">
          Import Research
        </h2>
        <p className="text-sm text-[#525252] leading-relaxed">
          Upload consumer research documents or verbatim transcripts for analysis.
        </p>
      </div>

      {/* Upload area */}
      <div className="space-y-4">
        <div className="relative">
          <input
            type="file"
            onChange={handleFileUpload}
            accept=".pdf,.doc,.docx,.txt,.rtf,.xlsx,.xls,.csv"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            disabled={isProcessing}
          />
          <div className={`border-2 border-dashed bg-white p-12 transition-colors duration-150 ${
            isProcessing ? 'border-[#0f62fe] bg-[#edf5ff]' : 'border-[#e0e0e0] hover:border-[#0f62fe] hover:bg-[#f4f4f4]'
          }`}>
            <div className="flex flex-col items-center text-center">
              {isProcessing ? (
                <Loader2 size={32} className="text-[#0f62fe] animate-spin mb-4" />
              ) : (
                <Upload size={32} className="text-[#6f6f6f] mb-4" />
              )}
              <p className="text-sm font-medium text-[#161616] mb-1">
                {isProcessing ? 'Processing document...' : 'Drop file here or click to upload'}
              </p>
              <p className="text-xs text-[#6f6f6f]">
                PDF, Word, Excel, CSV, or Text files
              </p>
            </div>
          </div>
        </div>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-start gap-3 p-4 bg-[#fff1f1] border-l-4 border-[#da1e28]"
            >
              <AlertCircle size={16} className="text-[#da1e28] shrink-0 mt-0.5" />
              <p className="text-sm text-[#161616]">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* File loaded state */}
        <AnimatePresence>
          {fileName && !error && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4"
            >
              {/* File info */}
              <div className="flex items-center justify-between p-4 bg-white border border-[#e0e0e0]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#161616] flex items-center justify-center">
                    <FileText size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#161616]">{fileName}</p>
                    <p className="text-xs text-[#6f6f6f] font-mono">
                      {text.length.toLocaleString()} characters
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => { setFileName(null); setText(''); setError(null); }}
                  className="p-2 text-[#6f6f6f] hover:text-[#da1e28] hover:bg-[#fff1f1] transition-colors"
                  disabled={isProcessing}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Process button */}
              <button
                onClick={handleProcess}
                disabled={!text.trim() || isProcessing}
                className="w-full h-12 bg-[#0f62fe] text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-[#0353e9] disabled:bg-[#c6c6c6] disabled:cursor-not-allowed transition-colors duration-150"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Analyzing research...
                  </>
                ) : (
                  <>
                    Extract insights
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Helper text */}
      <div className="mt-8 pt-8 border-t border-[#e0e0e0]">
        <p className="text-xs text-[#6f6f6f] leading-relaxed">
          <span className="font-medium text-[#161616]">Tip:</span> For best results, upload documents containing direct consumer quotes, survey responses, or focus group transcripts.
        </p>
      </div>
    </div>
  );
};

export default ResearchModule;
