import React from 'react';
import { FileText, Calendar, HardDrive } from 'lucide-react';
import type { SourceDocument } from '../../lib/supabase/types';

interface Props {
  sourceDocument: SourceDocument | null;
  rawText: string;
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (isoString: string): string => {
  return new Date(isoString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const ResearchViewer: React.FC<Props> = ({ sourceDocument, rawText }) => {
  if (!rawText && !sourceDocument) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-[#f4f4f4] flex items-center justify-center mx-auto mb-4">
            <FileText size={32} className="text-[#a8a8a8]" />
          </div>
          <p className="text-sm text-[#6f6f6f]">No research document available</p>
        </div>
      </div>
    );
  }

  const wordCount = rawText.trim().split(/\s+/).filter(Boolean).length;
  const charCount = rawText.length;

  return (
    <div className="max-w-4xl mx-auto p-8">
      {/* Header */}
      <div className="mb-6">
        <p className="text-xs font-mono text-[#6f6f6f] uppercase tracking-wider mb-2">
          Source Document
        </p>
        <h2 className="text-2xl font-light text-[#161616] tracking-tight">
          Research Input
        </h2>
      </div>

      {/* Document metadata */}
      {sourceDocument && (
        <div className="mb-6 p-4 bg-white border border-[#e0e0e0]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-[#edf5ff] flex items-center justify-center">
              <FileText size={20} className="text-[#0f62fe]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#161616]">{sourceDocument.filename}</p>
              <p className="text-xs text-[#6f6f6f]">{sourceDocument.file_type}</p>
            </div>
          </div>

          <div className="flex gap-6 text-xs text-[#525252]">
            <div className="flex items-center gap-1.5">
              <Calendar size={12} className="text-[#6f6f6f]" />
              <span>{formatDate(sourceDocument.upload_timestamp)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <HardDrive size={12} className="text-[#6f6f6f]" />
              <span>{formatFileSize(sourceDocument.file_size_bytes)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Stats bar */}
      <div className="mb-4 flex gap-4 text-xs text-[#6f6f6f]">
        <span>{wordCount.toLocaleString()} words</span>
        <span>{charCount.toLocaleString()} characters</span>
      </div>

      {/* Document content */}
      <div className="bg-white border border-[#e0e0e0]">
        <div className="p-6 max-h-[600px] overflow-y-auto">
          <pre className="text-sm text-[#161616] whitespace-pre-wrap font-sans leading-relaxed">
            {rawText}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default ResearchViewer;
