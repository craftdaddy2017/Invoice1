import { GoogleGenAI, Type } from "@google/genai";

// Initialize with process.env.API_KEY as per instructions
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const suggestLineItemsFromPrompt = async (prompt: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Extract a list of professional invoice line items (description, quantity, estimated market rate in INR, and common GST percentage for that item in India) from the following business scenario: "${prompt}"`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              description: { 
                type: Type.STRING,
                description: 'The name or description of the service/product'
              },
              qty: { 
                type: Type.NUMBER,
                description: 'The quantity'
              },
              rate: { 
                type: Type.NUMBER,
                description: 'The unit rate in INR'
              },
              taxRate: { 
                type: Type.NUMBER,
                description: 'The GST rate as a percentage (e.g. 18)'
              },
              hsn: { 
                type: Type.STRING,
                description: 'The HSN or SAC code'
              }
            },
            required: ['description', 'qty', 'rate', 'taxRate'],
            propertyOrdering: ['description', 'hsn', 'qty', 'rate', 'taxRate']
          }
        }
      }
    });

    // Directly access .text property as per guidelines
    const text = response.text;
    if (!text) return [];
    
    return JSON.parse(text);
  } catch (error) {
    console.error('Error in AI suggestion:', error);
    return [];
  }
};