
import { GoogleGenAI, Type } from "@google/genai";

const SYSTEM_INSTRUCTIONS = `
You are the P&G Deterministic Audit Analyst. 
Your primary goal is REPRODUCIBILITY and LOGICAL CONSISTENCY. 
Use provided research only. Use Human Truth headlines (max 8 words).

ANALYSIS PROTOCOL:
1. DATA INTEGRITY: You must ONLY use provided research.
2. PATTERN RECOGNITION: Prioritize themes that appear across multiple verbatims.
3. STRATEGIC THRESHOLD: Even if research is brief, identify the most significant consumer struggle. Do not return an empty list if there is any usable data.
`;

const STRATEGIST_INSTRUCTIONS = `
You are a Senior Brand Strategist at P&G. You synthesize raw consumer data into a deep, logical strategic narrative. 
Your objective is to justify the brand's "Right to Win."

TASK: Generate a structured Marketing Summary with 5 distinct sections.
STYLE: Professional, analytical, persuasive, and wordy.
STRUCTURE: Use rich paragraphs. Avoid bullets.

SECTIONS:
1. Business Landscape & Competitive Reality: Purpose - Analyze category state and competitive gaps.
2. Behavioral Deep-Dive: Purpose - Describe the consumer's "Habitual Reality" and "Psychological Tax."
3. Strategic Tension & "The Unlock": Purpose - Articulate the conflict and why this Insight is the key.
4. The Brand's Right to Win: Purpose - Connect functional attributes to solving life-problems.
5. Creative & Cultural Direction: Purpose - Define visual/sonic ambition and cultural relevance.

FOR EACH SECTION:
- Provide a "summary": A concise (2-3 sentence) gist of the strategy for that section. This will be displayed in blue.
- Provide a "content": The deep, exhaustive narrative logic.
`;

const FAST_MODEL = "gemini-3-flash-preview";
const STRATEGY_MODEL = "gemini-3-pro-preview"; 
const DETERMINISTIC_CONFIG = {
  temperature: 0.2, // Slightly increased from 0.1 for better variety in sparse data
  seed: 42,      
};

const pruneText = (text: string, limit = 15000) => {
  if (text.length <= limit) return text;
  return text.substring(0, limit) + "... [Content Truncated]";
};

// Robust JSON cleaner to handle markdown blocks or conversational text
const cleanJsonResponse = (text: string) => {
  const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
  return cleaned;
};

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3, baseDelay = 1000): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      if (error?.message?.includes("503") || error?.message?.includes("429")) {
        const delay = baseDelay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

export const extractRankedInsights = async (text: string) => {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const response = await ai.models.generateContent({
      model: FAST_MODEL,
      contents: `Interrogate this consumer research and extract high-impact "Human Truths" (insights).
      Follow the P&G Deterministic Audit Protocol. 
      Ensure you identify 3-5 distinct insights based on the patterns in the data.
      
      Input Data: ${pruneText(text)}`,
      config: {
        ...DETERMINISTIC_CONFIG,
        systemInstruction: SYSTEM_INSTRUCTIONS,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            insights: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  insight: { type: Type.STRING },
                  plainEnglishExplanation: { type: Type.STRING },
                  rank: { type: Type.INTEGER },
                  reasoning: { type: Type.STRING },
                  totalEvidenceFrequency: { type: Type.STRING },
                  mentions: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: { text: { type: Type.STRING }, relevanceScore: { type: Type.NUMBER } },
                      required: ["text", "relevanceScore"]
                    }
                  },
                  matchPercentage: { type: Type.NUMBER }
                },
                required: ["insight", "plainEnglishExplanation", "rank", "reasoning", "mentions", "matchPercentage", "totalEvidenceFrequency"]
              }
            }
          },
          required: ["insights"]
        }
      }
    });
    
    const cleanedText = cleanJsonResponse(response.text || '');
    const content = JSON.parse(cleanedText || '{"insights": []}');
    return {
      insights: content.insights.map((ins: any) => ({
        ...ins,
        mentionCount: ins.mentions.length,
        verbatims: ins.mentions.map((m: any) => m.text)
      }))
    };
  });
};

export const generateMarketingSummary = async (research: string, insight: string) => {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const response = await ai.models.generateContent({
      model: STRATEGY_MODEL,
      contents: `Generate structured Marketing Summary for research: ${pruneText(research, 5000)} and insight: ${insight}`,
      config: {
        ...DETERMINISTIC_CONFIG,
        systemInstruction: STRATEGIST_INSTRUCTIONS,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  purpose: { type: Type.STRING },
                  summary: { type: Type.STRING },
                  content: { type: Type.STRING }
                },
                required: ["id", "title", "purpose", "summary", "content"]
              }
            }
          },
          required: ["sections"]
        }
      }
    });
    const cleanedText = cleanJsonResponse(response.text || '');
    return JSON.parse(cleanedText || '{"sections": []}').sections;
  });
};

export const generateRedThread = async (research: string, insight: string) => {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const response = await ai.models.generateContent({
      model: FAST_MODEL,
      contents: `Generate Red Thread for: "${insight}" in context: ${pruneText(research, 3000)}. 
      - The Red Thread Essence MUST BE exactly "Red Thread".
      - The Category Unlock MUST BE labeled as the "Job to be done" and be strictly under 10 words.`,
      config: {
        ...DETERMINISTIC_CONFIG,
        systemInstruction: SYSTEM_INSTRUCTIONS,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            redThreadEssence: { type: Type.STRING, description: "Must be exactly 'Red Thread'" },
            redThreadUnlock: { type: Type.STRING, description: "The Job to be done, max 10 words" },
            steps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  content: { type: Type.STRING },
                  imagePrompt: { type: Type.STRING }
                },
                required: ["label", "content", "imagePrompt"]
              }
            }
          },
          required: ["redThreadEssence", "redThreadUnlock", "steps"]
        }
      }
    });
    const cleanedText = cleanJsonResponse(response.text || '');
    const parsed = JSON.parse(cleanedText || '{"redThreadEssence": "Red Thread", "redThreadUnlock": "", "steps": []}');
    parsed.redThreadEssence = "Red Thread";
    parsed.redThreadUnlock = parsed.redThreadUnlock.split(' ').slice(0, 10).join(' ');
    return parsed;
  });
};

export const testBespokeInsight = async (text: string, userInsight: string) => {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const response = await ai.models.generateContent({
      model: FAST_MODEL,
      contents: `Audit hypothesis: "${userInsight}" against research: ${pruneText(text)}`,
      config: {
        ...DETERMINISTIC_CONFIG,
        systemInstruction: SYSTEM_INSTRUCTIONS,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            insight: { type: Type.STRING },
            plainEnglishExplanation: { type: Type.STRING },
            totalEvidenceFrequency: { type: Type.STRING },
            mentions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: { text: { type: Type.STRING }, relevanceScore: { type: Type.NUMBER } },
                required: ["text", "relevanceScore"]
              }
            },
            matchPercentage: { type: Type.NUMBER },
            reasoning: { type: Type.STRING }
          },
          required: ["insight", "plainEnglishExplanation", "mentions", "matchPercentage", "reasoning", "totalEvidenceFrequency"]
        }
      }
    });
    const cleanedText = cleanJsonResponse(response.text || '');
    const content = JSON.parse(cleanedText || '{}');
    return {
      ...content,
      mentionCount: (content.mentions || []).length,
      verbatims: (content.mentions || []).map((m: any) => m.text)
    };
  });
};

export const generatePinkBrief = async (data: any) => {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const response = await ai.models.generateContent({
      model: FAST_MODEL,
      contents: `Generate P&G PINK BRIEF from: ${JSON.stringify(data)}`,
      config: {
        ...DETERMINISTIC_CONFIG,
        systemInstruction: SYSTEM_INSTRUCTIONS,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            locationBrandProject: { type: Type.STRING },
            toGrow: { type: Type.STRING },
            needToPrevent: { type: Type.STRING },
            andObjective: { type: Type.STRING },
            byForming: { type: Type.STRING },
            jtbd: { type: Type.STRING },
            consumerCurrently: { type: Type.STRING },
            struggleWith: { type: Type.STRING },
            commChallenge: { type: Type.STRING },
            benefit: { type: Type.STRING },
            rtb: { type: Type.STRING },
            brandCharacter: { type: Type.STRING },
            insight1: { type: Type.STRING },
            insight2: { type: Type.STRING },
            keyMedia: { type: Type.STRING },
            budget: { type: Type.STRING },
            inMarketDate: { type: Type.STRING },
            successMeasuresBusiness: { type: Type.STRING },
            successMeasuresEquity: { type: Type.STRING },
            deliverables: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  touchpoint: { type: Type.STRING },
                  messages: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["touchpoint", "messages"]
              }
            }
          },
          required: ["locationBrandProject", "toGrow", "needToPrevent", "andObjective", "byForming", "jtbd", "consumerCurrently", "struggleWith", "commChallenge", "benefit", "rtb", "brandCharacter", "insight1", "insight2", "keyMedia", "budget", "inMarketDate", "successMeasuresBusiness", "successMeasuresEquity", "deliverables"]
        }
      }
    });
    const cleanedText = cleanJsonResponse(response.text || '');
    return JSON.parse(cleanedText || '{}');
  });
};

export const analyzeResearch = async (research: string, insight: string) => {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const response = await ai.models.generateContent({
      model: FAST_MODEL,
      contents: `Analyze: ${pruneText(research, 3000)} - Insight: ${insight}`,
      config: {
        ...DETERMINISTIC_CONFIG,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            keyInsights: { type: Type.ARRAY, items: { type: Type.STRING } },
            summary: { type: Type.STRING }
          },
          required: ["keyInsights", "summary"]
        }
      }
    });
    const cleanedText = cleanJsonResponse(response.text || '');
    return JSON.parse(cleanedText || '{"keyInsights": [], "summary": ""}');
  });
};

export const generatePersona = async (research: string, insight: string) => {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const response = await ai.models.generateContent({
      model: FAST_MODEL,
      contents: `Persona for: ${pruneText(research, 3000)} - Insight: ${insight}`,
      config: {
        ...DETERMINISTIC_CONFIG,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            demographics: { type: Type.STRING },
            psychographics: { type: Type.STRING },
            keyNeed: { type: Type.STRING }
          },
          required: ["name", "demographics", "psychographics", "keyNeed"]
        }
      }
    });
    const cleanedText = cleanJsonResponse(response.text || '');
    return JSON.parse(cleanedText || '{}');
  });
};

export const suggestCreativeDirections = async (data: any) => {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const response = await ai.models.generateContent({
      model: FAST_MODEL,
      contents: `Directions for: ${JSON.stringify(data)}`,
      config: {
        ...DETERMINISTIC_CONFIG,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              directionName: { type: Type.STRING },
              message: { type: Type.STRING },
              tone: { type: Type.STRING }
            },
            required: ["directionName", "message", "tone"]
          }
        }
      }
    });
    const cleanedText = cleanJsonResponse(response.text || '');
    return JSON.parse(cleanedText || '[]');
  });
};
