import React, { useState } from 'react';
import { FileText, Calendar, Check, Edit3, Copy, Trash2, User, Link2, File, Cpu } from 'lucide-react';
import type { BriefWithProduct } from '../lib/supabase/types';

interface Props {
  brief: BriefWithProduct;
  onOpen: (id: string, status: string) => void;
  onDuplicate: (id: string) => void;
  onArchive: (id: string) => void;
}

const BriefCard: React.FC<Props> = ({ brief, onOpen, onDuplicate, onArchive }) => {
  const [linkCopied, setLinkCopied] = useState(false);

  const copyLink = async () => {
    const url = `${window.location.origin}/brief/${brief.id}`;
    await navigator.clipboard.writeText(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const statusConfig = {
    draft: {
      label: 'Draft',
      color: 'bg-[#fff8e1] text-[#f57f17]',
      icon: Edit3
    },
    complete: {
      label: 'Complete',
      color: 'bg-[#e8f5e9] text-[#2e7d32]',
      icon: Check
    },
    archived: {
      label: 'Archived',
      color: 'bg-[#f5f5f5] text-[#757575]',
      icon: Trash2
    }
  };

  const status = statusConfig[brief.status];
  const StatusIcon = status.icon;

  return (
    <div className="bg-white border border-[#e0e0e0] hover:border-[#0f62fe] transition-colors group">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#161616] flex items-center justify-center">
              <FileText size={18} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-[#161616] line-clamp-1">
                {brief.title}
              </h3>
              <p className="text-xs text-[#6f6f6f]">
                {brief.product_name}
                {brief.brand !== 'Other' && ` · ${brief.brand}`}
              </p>
            </div>
          </div>

          <span className={`px-2 py-1 text-xs font-medium flex items-center gap-1 ${status.color}`}>
            <StatusIcon size={12} />
            {status.label}
          </span>
        </div>

        {/* Meta */}
        <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-[#6f6f6f]">
          <span className="flex items-center gap-1">
            <Calendar size={12} />
            {formatDate(brief.created_at)}
          </span>
          {brief.created_by && (
            <span className="flex items-center gap-1">
              <User size={12} />
              {brief.created_by}
            </span>
          )}
          {brief.source_filename && (
            <span className="flex items-center gap-1" title={brief.source_filename}>
              <File size={12} />
              <span className="max-w-[120px] truncate">{brief.source_filename}</span>
            </span>
          )}
          {brief.model_used && (
            <span className="px-1.5 py-0.5 bg-[#e8daff] text-[#6929c4] rounded text-[10px] font-medium">
              {brief.model_used.replace('gemini-', '').replace('claude-', '')}
            </span>
          )}
          {brief.market && (
            <span className="px-2 py-0.5 bg-[#f4f4f4] text-[#525252]">
              {brief.market}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="border-t border-[#e0e0e0] px-5 py-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onOpen(brief.id, brief.status)}
          className="h-8 px-3 bg-[#0f62fe] text-white text-xs font-medium hover:bg-[#0353e9] transition-colors"
        >
          {brief.status === 'draft' ? 'Continue Editing' : 'View'}
        </button>
        <button
          onClick={copyLink}
          className="h-8 px-3 text-[#525252] text-xs font-medium flex items-center gap-1 hover:bg-[#f4f4f4] transition-colors"
        >
          <Link2 size={12} />
          {linkCopied ? 'Copied!' : 'Copy Link'}
        </button>
        <button
          onClick={() => onDuplicate(brief.id)}
          className="h-8 px-3 text-[#525252] text-xs font-medium flex items-center gap-1 hover:bg-[#f4f4f4] transition-colors"
        >
          <Copy size={12} />
          Duplicate
        </button>
        <button
          onClick={() => onArchive(brief.id)}
          className="h-8 px-3 text-[#da1e28] text-xs font-medium flex items-center gap-1 hover:bg-[#fff1f1] transition-colors ml-auto"
        >
          <Trash2 size={12} />
          Archive
        </button>
      </div>
    </div>
  );
};

export default BriefCard;
