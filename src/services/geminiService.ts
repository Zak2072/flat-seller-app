import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

export async function validateDocument(category: string, fileName: string): Promise<ValidationResult> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a legal document validator for a London law firm. 
      The user has uploaded a file named "${fileName}" for the category "${category}".
      
      Does this file name and category combination appear to be a valid legal document for this purpose?
      For example, an LPE1 form should be in the 'Leasehold Info' category.
      
      Return a JSON object with:
      - isValid: boolean
      - message: string (a friendly explanation if invalid, or a confirmation if valid)
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isValid: { type: Type.BOOLEAN },
            message: { type: Type.STRING }
          },
          required: ["isValid", "message"]
        }
      }
    });

    const result = JSON.parse(response.text || '{"isValid": false, "message": "AI validation failed."}');
    return result;
  } catch (error) {
    console.error("AI Validation Error:", error);
    return { isValid: false, message: "Our AI validation system is currently unavailable. Please try again later." };
  }
}
