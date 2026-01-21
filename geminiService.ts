
import { GoogleGenAI, Type } from "@google/genai";

// P&G STRATEGIC GUARDRAILS - Revised for strict internal data focus
const SYSTEM_INSTRUCTIONS = `
You are the P&G Strategic AI Architect. 
Your core mission is to transform raw consumer research into sharp strategic foundations.

STRICT DATA RULE:
- You must ONLY use the provided research text. Do not hallucinate or use external market data unless explicitly requested.
- Every insight must be directly traceable to the uploaded document.

THE HUMAN TRUTH RULE:
- Every INSIGHT HEADLINE must be written in "Human Truth" format. 
- AVOID CORPORATE JARGON. Use simple, emotional, and profoundly human language.
- Provide a "plainEnglishExplanation" that acts as a conversational subline.

ADHERE TO THESE STRICT GUARDRAILS:
1. ROOT IN REALITY: Derived 100% from the provided text.
2. THE TENSION RULE: Identify human tension (X BUT Y).
3. P&G BRAND VOICE: Professional strategy, human insights.
`;

export const extractRankedInsights = async (text: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `Analyze the following consumer research document. 
    Identify the top 3 human truths/insights found WITHIN THIS TEXT ONLY.
    
    Research Data:
    ${text}
    
    Tasks:
    1. Summarize research gist.
    2. Identify top 3 consumer insights as punchy HUMAN TRUTHS.
    3. For each, provide a "plainEnglishExplanation".
    4. For each, list supporting verbatims found in the text.`,
    config: {
      systemInstruction: SYSTEM_INSTRUCTIONS,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          researchSummary: { type: Type.STRING },
          insights: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                insight: { type: Type.STRING },
                plainEnglishExplanation: { type: Type.STRING },
                rank: { type: Type.INTEGER },
                reasoning: { type: Type.STRING },
                verbatims: { type: Type.ARRAY, items: { type: Type.STRING } },
                matchPercentage: { type: Type.NUMBER },
                mentionCount: { type: Type.INTEGER }
              },
              required: ["insight", "plainEnglishExplanation", "rank", "reasoning", "verbatims", "matchPercentage", "mentionCount"]
            }
          }
        },
        required: ["researchSummary", "insights"]
      }
    }
  });

  const content = JSON.parse(response.text || '{"researchSummary": "", "insights": []}');
  return { ...content, sources: [] };
};

export const testBespokeInsight = async (text: string, userInsight: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `Analyze the research to validate this specific insight: "${userInsight}".
    
    Research Data:
    ${text}
    
    Tasks:
    1. Find supporting verbatims (up to 5) strictly from the text.
    2. Provide a plain English explanation of how the research supports this.
    3. Calculate a relevance score (matchPercentage) based on evidence density.
    4. Count mentions.`,
    config: {
      systemInstruction: SYSTEM_INSTRUCTIONS,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          insight: { type: Type.STRING },
          plainEnglishExplanation: { type: Type.STRING },
          verbatims: { type: Type.ARRAY, items: { type: Type.STRING } },
          matchPercentage: { type: Type.NUMBER },
          mentionCount: { type: Type.INTEGER },
          reasoning: { type: Type.STRING }
        },
        required: ["insight", "plainEnglishExplanation", "verbatims", "matchPercentage", "mentionCount", "reasoning"]
      }
    }
  });
  return JSON.parse(response.text || '{}');
};

export const analyzeResearch = async (text: string, selectedInsight: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `Analyze the provided research for strategic objectives related to: "${selectedInsight}". 
    Focus strictly on the provided text:
    ${text.substring(0, 3000)}`,
    config: {
      systemInstruction: SYSTEM_INSTRUCTIONS,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          keyInsights: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING } 
          }
        },
        required: ["summary", "keyInsights"]
      }
    }
  });
  return JSON.parse(response.text || '{"summary": "", "keyInsights": []}');
};

export const generateRedThread = async (research: string, selectedInsight: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `Synthesize the "Red Thread" strategy for: "${selectedInsight}" based ONLY on this research:
    ${research.substring(0, 2000)}
    
    You must generate:
    1. redThreadEssence: A 2-3 word summary in ALL CAPS.
    2. summary: A one-sentence goal description.
    3. steps: 5 steps (Product, Packaging, Communication, Instore, Value Equation).`,
    config: {
      systemInstruction: SYSTEM_INSTRUCTIONS,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          redThreadEssence: { type: Type.STRING },
          summary: { type: Type.STRING },
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
        required: ["redThreadEssence", "summary", "steps"]
      }
    }
  });
  return JSON.parse(response.text || '{"redThreadEssence": "", "summary": "", "steps": []}');
};

export const generatePersona = async (research: string, selectedInsight: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `Create a persona based on the research provided for the insight: "${selectedInsight}". 
    Reference context: ${research.substring(0, 1000)}`,
    config: {
      systemInstruction: SYSTEM_INSTRUCTIONS,
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
  return JSON.parse(response.text || '{}');
};

export const suggestCreativeDirections = async (data: any) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `Suggest 3 creative directions based strictly on this strategic context: ${JSON.stringify(data)}`,
    config: {
      systemInstruction: SYSTEM_INSTRUCTIONS,
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
  return JSON.parse(response.text || '[]');
};

export const finalizeBrief = async (data: any) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `Finalize the Creative Brief based ONLY on the following synthesized strategy: ${JSON.stringify(data)}`,
    config: {
      systemInstruction: SYSTEM_INSTRUCTIONS
    }
  });
  return response.text || '';
};
