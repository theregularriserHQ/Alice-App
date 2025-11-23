import { GoogleGenAI } from '@google/genai';
import { TransactionType } from '../types';

const suggestCategory = async (
  description: string,
  type: TransactionType,
  categories: string[],
  lang: string = 'fr',
): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API key is not configured.");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const fallbackCategory = lang === 'fr' ? 'Autres' : 'Other';

  const prompt = `Given the following transaction description: "${description}" and type: "${type}", what is the most appropriate category from the following list?
Category list: ${categories.join(', ')}.
Reply only with the name of the most relevant category from the list. If none match well, reply "${fallbackCategory}". Do not give any explanation.`;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents: prompt,
    });
    
    const responseText = response.text.trim();

    const foundCategory = categories.find(cat => responseText.includes(cat));

    if (foundCategory) {
      return foundCategory;
    }
    
    return fallbackCategory;

  } catch (error) {
    console.error('Error suggesting category:', error);
    return fallbackCategory;
  }
};

export default suggestCategory;
