import { GoogleGenAI, Modality } from '@google/genai';
import { decode, decodeAudioData } from '../utils/audioUtils';

// FIX: Added `(window as any)` to support `webkitAudioContext` for older browsers without causing a TypeScript error.
const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

const textToSpeech = async (text: string): Promise<AudioBuffer | null> => {
    if (!process.env.API_KEY) {
        throw new Error("API key is not configured.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-tts',
            contents: [{ parts: [{ text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
            const audioBytes = decode(base64Audio);
            const audioBuffer = await decodeAudioData(audioBytes, audioContext, 24000, 1);
            return audioBuffer;
        }
        return null;
    } catch (error) {
        console.error('Error generating speech:', error);
        return null;
    }
};

export const playAudio = (audioBuffer: AudioBuffer): AudioBufferSourceNode | null => {
    if (!audioContext) return null;
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start();
    return source;
};


export default textToSpeech;