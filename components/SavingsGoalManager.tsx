

import React, { useState, useRef } from 'react';
import type { SavingsGoal } from '../types';
import PlusIcon from './icons/PlusIcon';
import TrashIcon from './icons/TrashIcon';
import MicrophoneIcon from './icons/MicrophoneIcon';
import StopIcon from './icons/StopIcon';
import transcribeAudio from '../services/transcriptionService';
import extractGoalFromText from '../services/extractGoalFromTextService';
import { blobToBase64 } from '../utils/audioUtils';
import { useI18n } from '../hooks/useI18n';

interface SavingsGoalManagerProps {
  savingsGoals: SavingsGoal[];
  onAddGoal: (goal: Omit<SavingsGoal, 'id' | 'currentAmount'>) => void;
  onDeleteGoal: (goalId: string) => void;
  totalSavings: number;
}

const SavingsGoalManager: React.FC<SavingsGoalManagerProps> = ({ savingsGoals, onAddGoal, onDeleteGoal, totalSavings }) => {
  const { t, language } = useI18n();
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !targetAmount || !targetDate) return;
    onAddGoal({ name, targetAmount: parseFloat(targetAmount), targetDate });
    setName('');
    setTargetAmount('');
    setTargetDate('');
  };

  const processVoiceInputForGoal = async (audioBlob: Blob) => {
    setIsProcessingVoice(true);
    setAnalysisError(null);
    try {
        const mimeType = audioBlob.type.split(';')[0];
        const base64Data = await blobToBase64(audioBlob);
        
        const transcript = await transcribeAudio(base64Data, mimeType, language);
        if (!transcript) throw new Error(t('transactionForm.errorTranscription'));
        
        const result = await extractGoalFromText(transcript, language);

        setName(result.name);
        setTargetAmount(result.targetAmount.toString());
        setTargetDate(result.targetDate);

    } catch (err) {
        if (err instanceof Error && err.message === 'AI_GOAL_EXTRACTION_ERROR') {
          setAnalysisError(t('savingsGoals.errorGoalExtraction'));
        } else {
          setAnalysisError(err instanceof Error ? err.message : t('savingsGoals.errorGoalExtraction'));
        }
    } finally {
        setIsProcessingVoice(false);
    }
  };

  const handleStartRecording = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        audioChunksRef.current = [];
        mediaRecorderRef.current.ondataavailable = (event) => audioChunksRef.current.push(event.data);
        mediaRecorderRef.current.onstop = () => {
            if(audioChunksRef.current.length === 0) return;
            const audioBlob = new Blob(audioChunksRef.current, { type: audioChunksRef.current[0].type });
            processVoiceInputForGoal(audioBlob);
            stream.getTracks().forEach(track => track.stop());
        };
        mediaRecorderRef.current.start();
        setIsRecording(true);
    } catch (err) {
        setAnalysisError(t('transactionForm.errorMicrophone'));
    }
  };

  const handleStopRecording = () => {
      if (mediaRecorderRef.current?.state === "recording") {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
      }
  };

  return (
    <div className="bg-slate-900/50 p-4 rounded-lg flex flex-col">
      <h3 className="text-xl font-bold text-white mb-1">{t('savingsGoals.title')}</h3>
      <p className="text-sm text-slate-400 mb-4">
        {t('savingsGoals.availableBalance')} <span className="font-bold text-green-400">{totalSavings.toLocaleString(language, { style: 'currency', currency: 'EUR' })}</span>
      </p>

      <form onSubmit={handleSubmit} className="space-y-2 mb-4">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('savingsGoals.goalNamePlaceholder')}
          className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-green-500 focus:border-green-500"
          required
          disabled={isRecording || isProcessingVoice}
        />
        <div>
            <label htmlFor="targetDate" className="text-xs text-slate-400">{t('savingsGoals.targetDate')}</label>
            <input
                id="targetDate"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-green-500 focus:border-green-500"
                required
                min={new Date().toISOString().split('T')[0]}
                disabled={isRecording || isProcessingVoice}
            />
        </div>
        <div className="flex gap-2">
            <input
              type="number"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              placeholder={t('savingsGoals.targetAmountPlaceholder')}
              className="flex-grow bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-green-500 focus:border-green-500"
              required
              min="1"
              step="any"
              disabled={isRecording || isProcessingVoice}
            />
            <button
                type="button"
                onClick={isRecording ? handleStopRecording : handleStartRecording}
                className={`font-bold p-2 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 flex-shrink-0 ${isRecording ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
            >
                {isProcessingVoice ? <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : (isRecording ? <StopIcon className="w-5 h-5" /> : <MicrophoneIcon className="w-5 h-5" />)}
            </button>
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-2 rounded-lg transition-colors flex-shrink-0" disabled={isRecording || isProcessingVoice}>
              <PlusIcon className="h-5 w-5" />
            </button>
        </div>
      </form>
      
      {analysisError && <p className="text-red-400 text-sm mb-4 -mt-2 text-center">{analysisError}</p>}

      <div className="space-y-3 overflow-y-auto flex-grow">
        {savingsGoals.length > 0 ? (
          savingsGoals.map(goal => {
            const percentage = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
            return (
              <div key={goal.id} className="bg-slate-700 p-3 rounded-md">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <p className="font-medium text-white">{goal.name}</p>
                    <p className="text-xs text-slate-400">{t('savingsGoals.targetDate')}: {new Date(goal.targetDate).toLocaleDateString(language)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-300 text-right">{goal.currentAmount.toLocaleString(language, {style: 'currency', currency: 'EUR'})} / <br/>{goal.targetAmount.toLocaleString(language, {style: 'currency', currency: 'EUR'})}</span>
                    <button onClick={() => onDeleteGoal(goal.id)} className="text-slate-400 hover:text-red-400" aria-label={`${t('savingsGoals.deleteGoal')} ${goal.name}`}><TrashIcon className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="w-full bg-slate-600 rounded-full h-2"><div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${Math.min(percentage, 100)}%` }}></div></div>
              </div>
            );
          })
        ) : (
          <p className="text-slate-400 text-center pt-8">{t('savingsGoals.noGoals')}</p>
        )}
      </div>
    </div>
  );
};

export default SavingsGoalManager;