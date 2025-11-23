

import { GoogleGenAI, Type } from '@google/genai';
import { TransactionType } from '../types';
import type { ExtractedTransactionData } from '../types';

const analyzeReceipt = async (
  imageBase64: string,
  mimeType: string,
  allExpenseCategories: string[],
  allIncomeCategories: string[],
  lang: string = 'fr',
): Promise<ExtractedTransactionData> => {
  if (!process.env.API_KEY) {
    throw new Error("API key is not configured.");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const imagePart = {
    inlineData: {
      mimeType,
      data: imageBase64,
    },
  };

  const textPart = {
    text: `Analyze the provided image of a receipt or invoice. Extract the following information and return it as a structured JSON object.
The user's language is ${lang}.

1. 'description': The name of the merchant or a brief summary of the transaction.
2. 'amount': The total final amount paid. It must be a number.
3. 'type': Determine if this is an 'EXPENSE' or 'INCOME'. Most receipts will be 'EXPENSE'.
4. 'category': Based on the description and type, suggest the most appropriate category.
   - If the type is 'EXPENSE', choose from this list: ${allExpenseCategories.join(', ')}.
   - If the type is 'INCOME', choose from this list: ${allIncomeCategories.join(', ')}.
   - If you cannot determine a specific category from the lists, use '${lang === 'fr' ? 'Autres' : 'Other'}'.

The JSON output must strictly follow the schema and not be wrapped in markdown. Only return the JSON object.`,
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING },
            amount: { type: Type.NUMBER },
            type: {
              type: Type.STRING,
              enum: [TransactionType.EXPENSE, TransactionType.INCOME],
            },
            category: { type: Type.STRING },
          },
          required: ['description', 'amount', 'type', 'category'],
        },
      },
    });

    return JSON.parse(response.text) as ExtractedTransactionData;
  } catch (error) {
    console.error('Error analyzing receipt image:', error);
    throw new Error('AI_RECEIPT_ERROR');
  }
};

export default analyzeReceipt;