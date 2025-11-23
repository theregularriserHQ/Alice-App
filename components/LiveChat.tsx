

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { decode, decodeAudioData, createBlob } from '../utils/audioUtils';
import MicrophoneIcon from './icons/MicrophoneIcon';
import SendIcon from './icons/SendIcon';
import { useI18n } from '../hooks/useI18n';

interface Transcription {
    speaker: 'user' | 'model';
    text: string;
    isFinal: boolean;
}

interface LiveChatProps {
    onClose: () => void;
}

const LiveChat: React.FC<LiveChatProps> = ({ onClose }) => {
    const { t, language } = useI18n();
    const [status, setStatus] = useState<'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR'>('CONNECTING');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [transcriptionHistory, setTranscriptionHistory] = useState<Transcription[]>([]);
    const [textInput, setTextInput] = useState('');

    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const audioSourcesRef = useRef(new Set<AudioBufferSourceNode>());
    const nextStartTimeRef = useRef(0);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const currentInputTranscriptionRef = useRef('');
    const currentOutputTranscriptionRef = useRef('');

    const scrollToBottom = () => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
        }
    };

    useEffect(scrollToBottom, [transcriptionHistory]);

    const cleanup = useCallback(() => {
        if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then(session => session?.close());
            sessionPromiseRef.current = null;
        }
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
        if (scriptProcessorRef.current) scriptProcessorRef.current.disconnect();
        if (mediaStreamSourceRef.current) mediaStreamSourceRef.current.disconnect();
        if (inputAudioContextRef.current?.state !== 'closed') inputAudioContextRef.current?.close();
        if (outputAudioContextRef.current?.state !== 'closed') outputAudioContextRef.current?.close();
        audioSourcesRef.current.forEach(source => source.stop());
        audioSourcesRef.current.clear();
    }, []);

    useEffect(() => {
        const setup = async () => {
            if (!process.env.API_KEY) {
                setErrorMessage(t('liveChat.errorApiKey'));
                setStatus('ERROR');
                return;
            }

            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                
                outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

                sessionPromiseRef.current = ai.live.connect({
                    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                    callbacks: {
                        onopen: async () => {
                            setStatus('CONNECTED');
                            try {
                                inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                                mediaStreamRef.current = stream;
                                mediaStreamSourceRef.current = inputAudioContextRef.current.createMediaStreamSource(stream);
                                scriptProcessorRef.current = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
                                
                                scriptProcessorRef.current.onaudioprocess = (e) => {
                                    const inputData = e.inputBuffer.getChannelData(0);
                                    sessionPromiseRef.current?.then((s) => s.sendRealtimeInput({ media: createBlob(inputData) }));
                                };
                                mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
                                scriptProcessorRef.current.connect(inputAudioContextRef.current.destination);
                            } catch (micError) {
                                setErrorMessage(t('transactionForm.errorMicrophone'));
                                setStatus('ERROR');
                            }
                        },
                        onmessage: async (message: LiveServerMessage) => {
                            let hasNewInputTranscription = false, hasNewOutputTranscription = false;
                            if (message.serverContent?.inputTranscription) {
                                currentInputTranscriptionRef.current = message.serverContent.inputTranscription.text;
                                hasNewInputTranscription = true;
                            }
                            if (message.serverContent?.outputTranscription) {
                                currentOutputTranscriptionRef.current = message.serverContent.outputTranscription.text;
                                hasNewOutputTranscription = true;
                            }
                            
                            if (message.serverContent?.turnComplete) {
                                setTranscriptionHistory(p => p.map(t => ({...t, isFinal: true})));
                                currentInputTranscriptionRef.current = '';
                                currentOutputTranscriptionRef.current = '';
                            } else if (hasNewInputTranscription || hasNewOutputTranscription) {
                                setTranscriptionHistory(p => {
                                    const newHistory = p.filter(t => t.isFinal);
                                    if (currentInputTranscriptionRef.current) newHistory.push({ speaker: 'user', text: currentInputTranscriptionRef.current, isFinal: false });
                                    if (currentOutputTranscriptionRef.current) newHistory.push({ speaker: 'model', text: currentOutputTranscriptionRef.current, isFinal: false });
                                    return newHistory;
                                });
                            }

                            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                            if (base64Audio && outputAudioContextRef.current) {
                                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContextRef.current.currentTime);
                                const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContextRef.current, 24000, 1);
                                const source = outputAudioContextRef.current.createBufferSource();
                                source.buffer = audioBuffer;
                                source.connect(outputAudioContextRef.current.destination);
                                source.onended = () => audioSourcesRef.current.delete(source);
                                source.start(nextStartTimeRef.current);
                                nextStartTimeRef.current += audioBuffer.duration;
                                audioSourcesRef.current.add(source);
                            }

                            if (message.serverContent?.interrupted) {
                                audioSourcesRef.current.forEach(s => s.stop());
                                audioSourcesRef.current.clear();
                                nextStartTimeRef.current = 0;
                            }
                        },
                        onerror: (e: ErrorEvent) => {
                            setErrorMessage(t('liveChat.errorConnection'));
                            setStatus('ERROR');
                        },
                        onclose: (e: CloseEvent) => setStatus('DISCONNECTED'),
                    },
                    config: {
                        responseModalities: [Modality.AUDIO],
                        outputAudioTranscription: {},
                        inputAudioTranscription: {},
                        systemInstruction: `You are 'Alice', a friendly and helpful financial assistant for a ${language === 'fr' ? 'French' : 'English'}-speaking user. Keep your answers concise and encouraging.`,
                    },
                });
            } catch (err) {
                setErrorMessage(err instanceof Error ? err.message : t('liveChat.errorUnexpected'));
                setStatus('ERROR');
            }
        };

        setup();
        return cleanup;
    }, [cleanup, t, language]);
    
    const handleSendText = (e: React.FormEvent) => {
        e.preventDefault();
        if (!textInput.trim() || !sessionPromiseRef.current) return;
        sessionPromiseRef.current.then(s => s.sendRealtimeInput({ text: textInput.trim() }));
        setTextInput('');
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fadeIn" role="dialog" aria-modal="true" aria-labelledby="livechat-title">
            <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col p-4 md:p-6 border border-slate-700">
                <header className="flex justify-between items-center pb-4 border-b border-slate-700 flex-shrink-0">
                    <h2 id="livechat-title" className="text-xl font-bold text-white">{t('liveChat.title')}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white text-3xl leading-none" aria-label={t('liveChat.close')}>&times;</button>
                </header>
                <div ref={chatContainerRef} className="flex-1 overflow-y-auto py-4 space-y-4" aria-live="polite">
                    {transcriptionHistory.map((item, index) => (
                        <div key={index} className={`flex items-end gap-2 ${item.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
                           {item.speaker === 'model' && <span className="text-2xl flex-shrink-0" aria-hidden="true">🤖</span>}
                            <div className={`max-w-[80%] p-3 rounded-lg ${item.speaker === 'user' ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-200'}`}>
                                <p className={`${!item.isFinal ? 'opacity-70 italic' : ''}`}>{item.text}</p>
                            </div>
                           {item.speaker === 'user' && <span className="text-2xl flex-shrink-0" aria-hidden="true">👤</span>}
                        </div>
                    ))}
                    {status === 'CONNECTED' && transcriptionHistory.length === 0 && (
                        <div className="text-center text-slate-400 pt-8">
                            <p className="text-2xl mb-2" aria-hidden="true">🤖</p>
                            <p className="text-lg font-semibold text-slate-200">{t('liveChat.welcome')}</p>
                            <p>{t('liveChat.prompt')}</p>
                        </div>
                    )}
                </div>
                <footer className="pt-4 border-t border-slate-700 flex-shrink-0">
                    {status === 'CONNECTED' ? (
                        <form onSubmit={handleSendText} className="flex items-center gap-3">
                            <div className="flex-1 relative">
                                <label htmlFor="live-chat-input" className="sr-only">{t('liveChat.inputPlaceholder')}</label>
                                <input id="live-chat-input" type="text" value={textInput} onChange={(e) => setTextInput(e.target.value)} placeholder={t('liveChat.inputPlaceholder')} className="w-full bg-slate-700 border border-slate-600 rounded-full py-2 px-4 pl-10 text-white focus:outline-none focus:ring-2 focus:ring-green-500" autoComplete="off" />
                                <div className="absolute left-3 top-1/2 -translate-y-1/2" title={t('liveChat.micActive')} aria-hidden="true">
                                    <MicrophoneIcon className="w-5 h-5 text-red-500 animate-pulse" />
                                </div>
                            </div>
                            <button type="submit" className="bg-green-600 hover:bg-green-700 text-white rounded-full p-3 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed flex-shrink-0" disabled={!textInput.trim()} aria-label={t('liveChat.sendMessage')}><SendIcon className="w-5 h-5" /></button>
                        </form>
                    ) : (
                        <div className="text-center font-semibold">
                            {status === 'CONNECTING' && <p className="text-yellow-400">{t('liveChat.connecting')}</p>}
                            {status === 'DISCONNECTED' && <p className="text-slate-400">{t('liveChat.disconnected')}</p>}
                            {status === 'ERROR' && <p className="text-red-400">{errorMessage}</p>}
                        </div>
                    )}
                </footer>
            </div>
        </div>
    );
};

export default LiveChat;