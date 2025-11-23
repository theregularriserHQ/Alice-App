import { GoogleGenAI, Type } from '@google/genai';
import { TransactionType } from '../types';
import type { ExtractedTransactionData, TransactionExtractionResult } from '../types';

export const extractTransactionFromText = async (
  text: string,
  allExpenseCategories: string[],
  allIncomeCategories: string[],
  lang: string = 'fr',
): Promise<TransactionExtractionResult> => {
  if (!process.env.API_KEY) {
    throw new Error("API key is not configured.");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const isFrench = lang === 'fr';

  const prompt = `Analyze the following transcribed text from a user describing a financial transaction. Your goal is to extract the transaction details into a JSON object. The user's language is ${lang}.

Text: "${text}"

Your tasks:
1.  Determine if the text is clear enough to extract a specific description, amount, type, and category.
2.  If the text is clear:
    - Set 'success' to true.
    - Fill the 'data' object with:
        - 'description': A brief summary of the transaction.
        - 'amount': The total amount as a number.
        - 'type': 'EXPENSE' or 'INCOME'. Use context clues.
        - 'category': Suggest the most appropriate category.
          - For 'EXPENSE', choose from: ${allExpenseCategories.join(', ')}.
          - For 'INCOME', choose from: ${allIncomeCategories.join(', ')}.
          - Use '${isFrench ? 'Autres' : 'Other'}' if no category fits well.
3.  If the text is ambiguous (e.g., amount is vague, description is missing):
    - Set 'success' to false.
    - In 'clarificationNeeded', write a single, clear question to the user in ${isFrench ? 'French' : 'English'} to resolve the ambiguity. For example: "${isFrench ? 'Quel était le montant exact des courses ?' : 'What was the exact amount for the groceries?'}" or "${isFrench ? 'Pouvez-vous me donner une description pour cet achat ?' : 'Can you give me a description for this purchase?'}".

The JSON output must strictly follow the schema. Do not wrap it in markdown.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            success: { type: Type.BOOLEAN },
            data: {
              type: Type.OBJECT,
              nullable: true,
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
            clarificationNeeded: { type: Type.STRING, nullable: true },
          },
          required: ['success'],
        },
      },
    });

    return JSON.parse(response.text) as TransactionExtractionResult;
  } catch (error) {
    console.error('Error extracting transaction from text:', error);
    throw new Error("AI_EXTRACTION_ERROR");
  }
};


export const clarifyTransaction = async (
    originalText: string,
    userClarification: string,
    allExpenseCategories: string[],
    allIncomeCategories: string[],
    lang: string = 'fr',
): Promise<ExtractedTransactionData> => {
    if (!process.env.API_KEY) {
        throw new Error("API key is not configured.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const isFrench = lang === 'fr';

    const prompt = `The user described a financial transaction, but it was ambiguous. Based on the conversation, extract the final transaction details into a JSON object.

Original user input: "${originalText}"
User's clarification: "${userClarification}"

Your task is to extract:
1. 'description': A brief summary of the transaction.
2. 'amount': The total amount as a number.
3. 'type': 'EXPENSE' or 'INCOME'.
4. 'category': The most appropriate category.
   - For 'EXPENSE', choose from: ${allExpenseCategories.join(', ')}.
   - For 'INCOME', choose from: ${allIncomeCategories.join(', ')}.
   - Use '${isFrench ? 'Autres' : 'Other'}' if no category fits.

The JSON output must strictly follow the schema. Do not wrap it in markdown.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
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
        console.error('Error clarifying transaction:', error);
        throw new Error("AI_CLARIFICATION_ERROR");
    }
};