
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ResearchMode, ResearchResponse } from "../types";

export const performResearch = async (
  query: string,
  mode: ResearchMode
): Promise<ResearchResponse> => {
  // Safe access for browser environments
  const getEnvKey = () => {
    try {
      return (window as any).process?.env?.API_KEY || (process as any)?.env?.API_KEY;
    } catch {
      return null;
    }
  };

  const apiKey = getEnvKey() || localStorage.getItem('SCHOLARPULSE_KEY');

  if (!apiKey || apiKey === "undefined") {
    throw new Error("API Key is missing. Please provide one in the setup screen.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const systemInstructions = {
    [ResearchMode.SYNTHESIS]: "Synthesize current scientific findings on the provided topic. Focus on consensus and conflicting data.",
    [ResearchMode.LIT_REVIEW]: "Provide a structured literature review outline with key thematic clusters and influential citations.",
    [ResearchMode.CRITICAL_ANALYSIS]: "Critically evaluate the methodology and assumptions typically found in research regarding this prompt.",
    [ResearchMode.HYPOTHESIS_GEN]: "Generate novel, testable research hypotheses based on current gaps in the literature."
  };

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: query,
      config: {
        systemInstruction: `You are a PhD-level research assistant. ${systemInstructions[mode]} Use formal, academic tone. Ensure all claims are grounded in provided search results.`,
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 2000 }
      },
    });

    const content = response.text || "No insights generated.";
    
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks
      .filter(chunk => chunk.web)
      .map(chunk => ({
        title: chunk.web?.title || "Research Source",
        uri: chunk.web?.uri || ""
      }));

    return {
      content,
      sources,
      timestamp: new Date().toLocaleTimeString()
    };
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Request failed. Check your API key and connection.");
  }
};
