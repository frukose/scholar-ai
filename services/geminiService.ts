
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ResearchMode, ResearchResponse } from "../types";

export const performResearch = async (
  query: string,
  mode: ResearchMode
): Promise<ResearchResponse> => {
  // Initialization pulls from process.env.API_KEY
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstructions = {
    [ResearchMode.SYNTHESIS]: "Synthesize current scientific findings on the provided topic. Focus on consensus and conflicting data.",
    [ResearchMode.LIT_REVIEW]: "Provide a structured literature review outline with key thematic clusters and influential citations.",
    [ResearchMode.CRITICAL_ANALYSIS]: "Critically evaluate the methodology and assumptions typically found in research regarding this prompt.",
    [ResearchMode.HYPOTHESIS_GEN]: "Generate novel, testable research hypotheses based on current gaps in the literature."
  };

  try {
    // Using gemini-3-flash-preview which is highly optimized for the Free Tier
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: query,
      config: {
        systemInstruction: `You are a PhD-level research assistant. ${systemInstructions[mode]} Use formal, academic tone. Ensure all claims are grounded in provided search results.`,
        tools: [{ googleSearch: {} }],
        // Thinking budget is enabled for deeper reasoning on the flash model
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
  } catch (error) {
    console.error("Gemini API Error:", error);
    // Specific error message for common Free Tier issues
    throw new Error("Research analysis failed. This could be due to Free Tier rate limits or an invalid API Key in your environment variables.");
  }
};
