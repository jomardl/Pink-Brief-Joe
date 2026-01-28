import React from 'react';
import { useAIProviderStore, isProviderConfigured, type AIProvider } from '../lib/stores/aiProviderStore';

const AIProviderToggle: React.FC = () => {
  const { provider, setProvider } = useAIProviderStore();

  const geminiConfigured = isProviderConfigured('gemini');
  const claudeConfigured = isProviderConfigured('claude');

  const handleToggle = (newProvider: AIProvider) => {
    if (newProvider === 'gemini' && !geminiConfigured) return;
    if (newProvider === 'claude' && !claudeConfigured) return;
    setProvider(newProvider);
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-[#262626] rounded">
      <span className="text-xs text-[#a8a8a8] mr-2">AI:</span>
      <button
        onClick={() => handleToggle('gemini')}
        disabled={!geminiConfigured}
        className={`px-2 py-1 text-xs font-medium transition-colors ${
          provider === 'gemini'
            ? 'bg-[#0f62fe] text-white'
            : geminiConfigured
            ? 'bg-[#393939] text-[#c6c6c6] hover:bg-[#525252]'
            : 'bg-[#393939] text-[#6f6f6f] cursor-not-allowed'
        }`}
        title={geminiConfigured ? 'Use Google Gemini' : 'VITE_GEMINI_API_KEY not set'}
      >
        Gemini
      </button>
      <button
        onClick={() => handleToggle('claude')}
        disabled={!claudeConfigured}
        className={`px-2 py-1 text-xs font-medium transition-colors ${
          provider === 'claude'
            ? 'bg-[#0f62fe] text-white'
            : claudeConfigured
            ? 'bg-[#393939] text-[#c6c6c6] hover:bg-[#525252]'
            : 'bg-[#393939] text-[#6f6f6f] cursor-not-allowed'
        }`}
        title={claudeConfigured ? 'Use Anthropic Claude' : 'VITE_ANTHROPIC_API_KEY not set'}
      >
        Claude
      </button>
    </div>
  );
};

export default AIProviderToggle;
