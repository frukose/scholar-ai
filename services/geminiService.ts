
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ResearchMode, ResearchResponse } from "../types";

export const performResearch = async (
  query: string,
  mode: ResearchMode
): Promise<ResearchResponse> => {
  // Initialization pulls from process.env.API_KEY, which you should set in Netlify's UI
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstructions = {
    [ResearchMode.SYNTHESIS]: "Synthesize current scientific findings on the provided topic. Focus on consensus and conflicting data.",
    [ResearchMode.LIT_REVIEW]: "Provide a structured literature review outline with key thematic clusters and influential citations.",
    [ResearchMode.CRITICAL_ANALYSIS]: "Critically evaluate the methodology and assumptions typically found in research regarding this prompt.",
    [ResearchMode.HYPOTHESIS_GEN]: "Generate novel, testable research hypotheses based on current gaps in the literature."
  };

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: query,
      config: {
        systemInstruction: `You are a PhD-level research assistant. ${systemInstructions[mode]} Use formal, academic tone.`,
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 4000 }
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
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Research analysis failed. Ensure your API_KEY is correctly configured in your hosting provider settings.");
  }
};
