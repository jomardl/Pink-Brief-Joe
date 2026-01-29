import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AIProvider = 'gemini' | 'claude';

interface AIProviderState {
  provider: AIProvider;
  setProvider: (provider: AIProvider) => void;
}

export const useAIProviderStore = create<AIProviderState>()(
  persist(
    (set) => ({
      provider: 'claude', // Default to Claude
      setProvider: (provider) => set({ provider }),
    }),
    {
      name: 'ai-provider-storage',
    }
  )
);

// Helper to check if provider API key is configured
export const isProviderConfigured = (provider: AIProvider): boolean => {
  if (provider === 'gemini') {
    return !!import.meta.env.VITE_GEMINI_API_KEY;
  }
  if (provider === 'claude') {
    return !!import.meta.env.VITE_ANTHROPIC_API_KEY;
  }
  return false;
};
