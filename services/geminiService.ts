
// Use correct import for GoogleGenAI
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ResearchMode, ResearchResponse } from "../types";

export const performResearch = async (
  query: string,
  mode: ResearchMode
): Promise<ResearchResponse> => {
  // Use process.env.API_KEY exclusively as per guidelines.
  // The SDK initialization requires a named parameter: { apiKey: string }.
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    throw new Error("API Key is missing. Research cannot be performed.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const systemInstructions = {
    [ResearchMode.SYNTHESIS]: "Synthesize current scientific findings on the provided topic. Focus on consensus and conflicting data.",
    [ResearchMode.LIT_REVIEW]: "Provide a structured literature review outline with key thematic clusters and influential citations.",
    [ResearchMode.CRITICAL_ANALYSIS]: "Critically evaluate the methodology and assumptions typically found in research regarding this prompt.",
    [ResearchMode.HYPOTHESIS_GEN]: "Generate novel, testable research hypotheses based on current gaps in the literature."
  };

  try {
    // Using gemini-3-pro-preview for complex research tasks.
    // Ensure systemInstruction is passed inside the config object.
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: [{ parts: [{ text: query }] }],
      config: {
        systemInstruction: `You are a PhD-level research assistant. ${systemInstructions[mode]} Use formal, academic tone. Ensure all claims are grounded in provided search results.`,
        tools: [{ googleSearch: {} }],
        // maxOutputTokens and thinkingBudget must be set together if specified.
        // For research, we use a generous thinking budget for high-quality reasoning.
        thinkingConfig: { thinkingBudget: 32768 }
      },
    });

    // Access text property directly (not as a function).
    const content = response.text || "No insights generated.";
    
    // Extract grounding URLs for Google Search results as required.
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
    throw new Error(error.message || "Research request failed.");
  }
};
