import { GoogleGenAI } from '@google/genai';

const transcribeAudio = async (audioBase64: string, mimeType: string, lang: string = 'fr'): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("API key is not configured.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const audioPart = {
        inlineData: {
            mimeType,
            data: audioBase64,
        },
    };
    
    const textPart = {
        text: `Transcrivez l'audio suivant en ${lang === 'fr' ? 'français' : 'anglais'}. Ne retournez que le texte transcrit.`
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [audioPart, textPart] },
        });
        return response.text;
    } catch (error) {
        console.error('Error transcribing audio:', error);
        throw new Error("AI_TRANSCRIPTION_ERROR");
    }
};

export default transcribeAudio;