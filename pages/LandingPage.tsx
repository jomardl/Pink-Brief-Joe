import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Folder } from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase/client';
import { useBriefFlowStore } from '../lib/stores/briefFlowStore';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const reset = useBriefFlowStore((state) => state.reset);
  const dbConfigured = isSupabaseConfigured();

  const handleNewBrief = () => {
    reset(); // Clear any previous state
    navigate('/new');
  };

  const handleOpenRepository = () => {
    navigate('/briefs');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f4f4]">
      {/* Header bar */}
      <header className="h-12 bg-[#161616] flex items-center px-4">
        <Link to="/">
          <img
            src="/pg-seeklogo.svg"
            alt="P&G"
            className="w-[30px] my-[5px]"
          />
        </Link>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-lg w-full">
          <div className="mb-12">
            <p className="text-xs font-mono text-[#6f6f6f] uppercase tracking-wider mb-3">
              Strategic Engine v9.0
            </p>
            <h1 className="text-5xl font-light text-[#161616] tracking-tight leading-tight mb-4">
              Pink Brief<br />Architect
            </h1>
            <p className="text-base text-[#525252] leading-relaxed max-w-md">
              Transform consumer research into actionable strategic briefs using AI-powered insight extraction.
            </p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleNewBrief}
              className="h-12 px-6 bg-[#0f62fe] text-white text-sm font-medium flex items-center gap-2 hover:bg-[#0353e9] transition-colors duration-150"
            >
              <Plus size={16} />
              New brief
            </button>

            <button
              onClick={handleOpenRepository}
              disabled={!dbConfigured}
              className={`h-12 px-6 text-sm font-medium flex items-center gap-2 transition-colors duration-150 ${
                dbConfigured
                  ? 'bg-[#f4f4f4] text-[#161616] hover:bg-[#e0e0e0]'
                  : 'bg-[#e0e0e0] text-[#a8a8a8] cursor-not-allowed'
              }`}
            >
              <Folder size={16} />
              Open
            </button>
          </div>

          {!dbConfigured && (
            <p className="mt-4 text-xs text-[#6f6f6f]">

            </p>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="h-12 border-t border-[#e0e0e0] flex items-center justify-center">
        <p className="text-xs text-[#6f6f6f]">
          Confidential & Proprietary — Procter & Gamble
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;
