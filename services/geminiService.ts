
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ResearchMode, ResearchResponse } from "../types";

export const performResearch = async (
  query: string,
  mode: ResearchMode
): Promise<ResearchResponse> => {
  /**
   * PRODUCTION READY: Using process.env.API_KEY.
   * Make sure to add 'API_KEY' to your Vercel Environment Variables.
   */
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    throw new Error("Missing API Configuration. Please ensure the API_KEY environment variable is set in Vercel.");
  }

  // Initialize with named parameter as per SDK requirements
  const ai = new GoogleGenAI({ apiKey });
  
  const systemInstructions = {
    [ResearchMode.SYNTHESIS]: "Act as a Senior Research Scientist. Synthesize current scientific findings on the provided topic. Identify consensus, debate points, and conflicting data.",
    [ResearchMode.LIT_REVIEW]: "Act as an Academic Librarian. Provide a structured literature review outline with key thematic clusters, influential citations, and historical context.",
    [ResearchMode.CRITICAL_ANALYSIS]: "Act as a Peer Reviewer. Critically evaluate the methodologies, statistical assumptions, and potential biases found in typical research on this prompt.",
    [ResearchMode.HYPOTHESIS_GEN]: "Act as a Principal Investigator. Generate three novel, high-impact, testable research hypotheses based on current gaps in the literature."
  };

  try {
    // Use gemini-3-pro-preview for high-quality research and reasoning
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: [{ parts: [{ text: query }] }],
      config: {
        systemInstruction: `${systemInstructions[mode]} Use professional academic tone. Provide citations where possible based on your search results.`,
        tools: [{ googleSearch: {} }],
        // High thinking budget for complex academic synthesis
        thinkingConfig: { thinkingBudget: 32768 }
      },
    });

    // Directly access text property
    const content = response.text || "No insights could be generated for this query.";
    
    // Extract grounding metadata for transparency
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks
      .filter(chunk => chunk.web)
      .map(chunk => ({
        title: chunk.web?.title || "Academic Source",
        uri: chunk.web?.uri || ""
      }));

    return {
      content,
      sources,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  } catch (error: any) {
    console.error("Gemini Production Error:", error);
    
    // Check for common API errors
    if (error.message?.includes("429")) {
      throw new Error("Rate limit exceeded. Please wait a moment before your next inquiry.");
    }
    if (error.message?.includes("401") || error.message?.includes("API key not valid")) {
      throw new Error("Invalid API Configuration. Check your Vercel Environment Variables.");
    }
    
    throw new Error(error.message || "An unexpected error occurred during research synthesis.");
  }
};
