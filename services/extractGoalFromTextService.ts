import { GoogleGenAI, Type } from '@google/genai';
import type { ExtractedGoalData } from '../types';

const extractGoalFromText = async (
  text: string,
  lang: string = 'fr',
): Promise<ExtractedGoalData> => {
  if (!process.env.API_KEY) {
    throw new Error("API key is not configured.");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const isFrench = lang === 'fr';

  const prompt = `Analyze the following transcribed text from a user describing a savings goal. The user's language is ${lang}. Extract the information and return it as a structured JSON object. Today's date is ${new Date().toLocaleDateString('en-CA')}.
Text: "${text}"

1. 'name': A short, clear name for the savings goal (e.g., "${isFrench ? 'Voyage en Italie' : 'Trip to Italy'}", "${isFrench ? 'Nouvel ordinateur' : 'New Computer'}").
2. 'targetAmount': The total amount to save. It must be a number.
3. 'targetDate': The target date for the goal. Interpret dates relative to today (e.g., "${isFrench ? 'fin du mois' : 'end of the month'}", "${isFrench ? 'dans 6 mois' : 'in 6 months'}", "${isFrench ? "l'année prochaine" : 'next year'}"). It MUST be formatted as 'YYYY-MM-DD'.

The JSON output must strictly follow the schema and not be wrapped in markdown. Only return the JSON object.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            targetAmount: { type: Type.NUMBER },
            targetDate: { type: Type.STRING },
          },
          required: ['name', 'targetAmount', 'targetDate'],
        },
      },
    });

    return JSON.parse(response.text) as ExtractedGoalData;
  } catch (error) {
    console.error('Error extracting goal from text:', error);
    throw new Error('AI_GOAL_EXTRACTION_ERROR');
  }
};

export default extractGoalFromText;