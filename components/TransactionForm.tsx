
import React, { useState, useEffect, useRef } from 'react';
import { TransactionType } from '../types';
import type { Transaction, ExtractedTransactionData } from '../types';
import PlusIcon from './icons/PlusIcon';
import CameraIcon from './icons/CameraIcon';
import XMarkIcon from './icons/XMarkIcon';
import MicrophoneIcon from './icons/MicrophoneIcon';
import StopIcon from './icons/StopIcon';
import analyzeReceipt from '../services/receiptAnalysisService';
import suggestCategory from '../services/categorySuggestionService';
import transcribeAudio from '../services/transcriptionService';
import { extractTransactionFromText, clarifyTransaction } from '../services/extractTransactionFromTextService';
import { blobToBase64 } from '../utils/audioUtils';
import { useI18n } from '../hooks/useI18n';

interface TransactionFormProps {
  onAddTransaction: (transaction: Omit<Transaction, 'id' | 'date'>) => void;
  onAddCategory: (name: string, type: TransactionType) => void;
  expenseCategories: string[];
  incomeCategories: string[];
  onCollapse: () => void;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ onAddTransaction, onAddCategory, expenseCategories, incomeCategories, onCollapse }) => {
  const { t } = useI18n();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [category, setCategory] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [isBillReminder, setIsBillReminder] = useState(false);
  const [dueDate, setDueDate] = useState('');
  
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  
  const [clarificationRequest, setClarificationRequest] = useState<string | null>(null);
  const [userClarification, setUserClarification] = useState('');
  const [originalTranscript, setOriginalTranscript] = useState<string | null>(null);
  const [isClarifying, setIsClarifying] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (description.length > 3) {
      setIsSuggesting(true);
      debounceTimeoutRef.current = setTimeout(async () => {
        const categories = type === TransactionType.EXPENSE ? expenseCategories : incomeCategories;
        const suggestion = await suggestCategory(description, type, categories);
        if (suggestion && !isAddingCategory) {
          setCategory(suggestion);
        }
        setIsSuggesting(false);
      }, 1000);
    }

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [description, type, expenseCategories, incomeCategories, isAddingCategory]);


  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    setCategory('');
    if (newType === TransactionType.INCOME) {
      setIsRecurring(false);
      setIsBillReminder(false);
      setDueDate('');
    }
  };
  
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      if (value === 'ADD_NEW') {
          setIsAddingCategory(true);
          setCategory('ADD_NEW'); // Keep the select on this option
      } else {
          setCategory(value);
          setIsAddingCategory(false);
      }
  }

  const handleAddNewCategory = () => {
      if (newCategoryName.trim() === '') return;
      onAddCategory(newCategoryName, type);
      setCategory(newCategoryName);
      setNewCategoryName('');
      setIsAddingCategory(false);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // The button's disabled state prevents invalid submissions,
    // so we can proceed with confidence here.
    
    let categoryToSubmit = category;

    // If we are adding a new category, create it and set it as the one to submit
    if (isAddingCategory) {
        const newCatName = newCategoryName.trim();
        onAddCategory(newCatName, type);
        categoryToSubmit = newCatName;
    }

    onAddTransaction({
      description,
      amount: parseFloat(amount),
      type,
      category: categoryToSubmit,
      isRecurring: type === TransactionType.EXPENSE ? isRecurring : false,
      isBillReminder: type === TransactionType.EXPENSE ? isBillReminder : false,
      dueDate: type === TransactionType.EXPENSE && isBillReminder ? dueDate : undefined,
      remindersSent: { week: false, threeDays: false, today: false },
      isPlanned: type === TransactionType.EXPENSE && isBillReminder,
    });

    // Reset form state completely
    setDescription('');
    setAmount('');
    setCategory('');
    setIsRecurring(false);
    setIsBillReminder(false);
    setDueDate('');
    setIsAddingCategory(false);
    setNewCategoryName('');
  };
  
  const populateForm = (data: ExtractedTransactionData) => {
    setDescription(data.description);
    setAmount(data.amount.toString());
    setType(data.type);
    setCategory(data.category);
    if (data.type === TransactionType.INCOME) {
        setIsRecurring(false);
        setIsBillReminder(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsAnalyzing(true);
      setAnalysisError(null);
      setClarificationRequest(null);

      try {
          const base64Data = await blobToBase64(file);
          const result = await analyzeReceipt(
              base64Data,
              file.type,
              expenseCategories,
              incomeCategories
          );
          populateForm(result);
      } catch (err) {
          if (err instanceof Error && err.message === 'AI_RECEIPT_ERROR') {
            setAnalysisError(t('transactionForm.errorReceiptAnalysis'));
          } else {
            setAnalysisError(err instanceof Error ? err.message : t('transactionForm.errorAnalysisGeneric'));
          }
      } finally {
          setIsAnalyzing(false);
          if(fileInputRef.current) {
              fileInputRef.current.value = '';
          }
      }
  };

  const processVoiceInput = async (audioBlob: Blob) => {
    setIsProcessingVoice(true);
    setAnalysisError(null);
    setClarificationRequest(null);
    try {
        const mimeType = audioBlob.type.split(';')[0];
        const base64Data = await blobToBase64(audioBlob);
        
        const transcript = await transcribeAudio(base64Data, mimeType);
        if (!transcript) {
            throw new Error(t('transactionForm.errorTranscription'));
        }
        
        const result = await extractTransactionFromText(transcript, expenseCategories, incomeCategories);

        if (result.success && result.data) {
            populateForm(result.data);
        } else {
            setClarificationRequest(result.clarificationNeeded || t('transactionForm.clarificationDefault'));
            setOriginalTranscript(transcript);
            setDescription('');
            setAmount('');
            setCategory('');
        }

    } catch (err) {
        if (err instanceof Error) {
            if (err.message === 'AI_TRANSCRIPTION_ERROR') {
                setAnalysisError(t('transactionForm.errorTranscriptionAi'));
            } else if (err.message === 'AI_EXTRACTION_ERROR') {
                setAnalysisError(t('transactionForm.errorAnalysis'));
            } else {
                 setAnalysisError(err.message);
            }
        } else {
             setAnalysisError(t('transactionForm.errorVoiceProcessing'));
        }
    } finally {
        setIsProcessingVoice(false);
    }
  };

  const handleClarificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userClarification.trim() || !originalTranscript) return;
    
    setIsClarifying(true);
    setAnalysisError(null);

    try {
        const result = await clarifyTransaction(originalTranscript, userClarification, expenseCategories, incomeCategories);
        populateForm(result);
        
        setClarificationRequest(null);
        setOriginalTranscript(null);
        setUserClarification('');

    } catch (err) {
        if (err instanceof Error && err.message === 'AI_CLARIFICATION_ERROR') {
            setAnalysisError(t('transactionForm.errorClarification'));
        } else {
            setAnalysisError(err instanceof Error ? err.message : t('transactionForm.errorClarification'));
        }
    } finally {
        setIsClarifying(false);
    }
  };

  const handleStartRecording = async () => {
    try {
        setClarificationRequest(null);
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        audioChunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (event) => {
            audioChunksRef.current.push(event.data);
        };

        mediaRecorderRef.current.onstop = () => {
            if(audioChunksRef.current.length === 0) return;
            const audioBlob = new Blob(audioChunksRef.current, { type: audioChunksRef.current[0].type });
            processVoiceInput(audioBlob);
            stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);
    } catch (err) {
        setAnalysisError(t('transactionForm.errorMicrophone'));
    }
  };

  const handleStopRecording = () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
      }
  };

  const categories = type === TransactionType.EXPENSE ? expenseCategories : incomeCategories;
  const isFormDisabled = !!clarificationRequest;
  
  const isSubmitDisabled = 
    !description || 
    !amount || 
    (isAddingCategory && !newCategoryName.trim()) || 
    (!isAddingCategory && (!category || category === 'ADD_NEW')) || 
    (isBillReminder && !dueDate);


  return (
    <div className="bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-700 animate-fadeIn">
      <div className="flex justify-between items-start mb-6">
        <h3 className="text-xl font-bold text-white">{t('transactionForm.newTransaction')}</h3>
        <button type="button" onClick={onCollapse} className="text-slate-400 hover:text-white p-2 -mr-2 -mt-2 rounded-full hover:bg-slate-700 transition-colors flex-shrink-0 ml-2" aria-label={t('transactionForm.collapseForm')}><XMarkIcon className="w-6 h-6" /></button>
      </div>

      {analysisError && <div role="alert" className="text-red-400 text-sm mb-4">{analysisError}</div>}
      
      {clarificationRequest && (
        <div className="bg-slate-700/50 p-4 rounded-lg my-4 border border-blue-400/50 animate-fadeIn">
            <p className="font-semibold text-blue-300 mb-2">{t('transactionForm.clarificationNeeded')}</p>
            <p className="text-slate-300 mb-3 italic">"{clarificationRequest}"</p>
            <form onSubmit={handleClarificationSubmit} className="flex items-center gap-2">
                <input
                    type="text"
                    value={userClarification}
                    onChange={(e) => setUserClarification(e.target.value)}
                    placeholder={t('transactionForm.clarificationPlaceholder')}
                    className="flex-1 min-w-0 bg-slate-600 border border-slate-500 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                    disabled={isClarifying}
                />
                <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50"
                    disabled={isClarifying || !userClarification.trim()}
                >
                    {isClarifying ? (
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    ) : (
                        t('common.confirm')
                    )}
                </button>
            </form>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <fieldset disabled={isFormDisabled} className="space-y-4 disabled:opacity-50">
            <div className="flex bg-slate-700 rounded-lg p-1">
              <button type="button" onClick={() => handleTypeChange(TransactionType.EXPENSE)} className={`flex-1 py-2 rounded-md font-semibold transition-all duration-300 ${type === TransactionType.EXPENSE ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow' : 'text-slate-300 hover:bg-slate-600/50'}`}>{t('common.expense')}</button>
              <button type="button" onClick={() => handleTypeChange(TransactionType.INCOME)} className={`flex-1 py-2 rounded-md font-semibold transition-all duration-300 ${type === TransactionType.INCOME ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white shadow' : 'text-slate-300 hover:bg-slate-600/50'}`}>{t('common.income')}</button>
            </div>

            <div className="grid grid-cols-2 gap-2">
                <button
                    type="button"
                    onClick={isRecording ? handleStopRecording : handleStartRecording}
                    className={`font-bold py-2.5 px-4 rounded-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2 disabled:opacity-50 ${isRecording ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                    disabled={isAnalyzing || isClarifying}
                >
                    {isProcessingVoice ? (
                        <><svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>{t('transactionForm.processing')}</>
                    ) : isRecording ? (
                        <><StopIcon className="w-5 h-5" />{t('transactionForm.stop')}</>
                    ) : (
                        <><MicrophoneIcon className="w-5 h-5" />{t('transactionForm.dictate')}</>
                    )}
                </button>
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2 disabled:opacity-50"
                  disabled={isRecording || isProcessingVoice || isClarifying}
                >
                  {isAnalyzing ? (
                    <><svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>{t('transactionForm.analyzing')}</>
                  ) : (
                    <><CameraIcon className="w-5 h-5" />{t('transactionForm.scan')}</>
                  )}
                </button>
            </div>
             <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t('transactionForm.descriptionPlaceholder')}
                    className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                />
                <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={t('transactionForm.amountPlaceholder')}
                    className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                    min="0.01"
                    step="0.01"
                />
            </div>

            <div className="relative">
                <label htmlFor="category" className="text-sm text-slate-400">{t('common.category')}</label>
                <select
                    id="category"
                    value={category}
                    onChange={handleCategoryChange}
                    className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none mt-1"
                    required
                >
                    <option value="" disabled>{t('common.choose')}</option>
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    <option value="ADD_NEW" className="font-bold text-teal-400">{t('transactionForm.addNewCategory')}</option>
                </select>
                {isSuggesting && <span className="absolute right-3 top-1/2 translate-y-1 text-xs text-slate-400 italic" aria-live="polite" aria-atomic="true">{t('transactionForm.suggestion')}</span>}
            </div>
            
            {isAddingCategory && (
                <div className="bg-slate-700/50 p-3 rounded-md animate-fadeIn">
                    <label htmlFor="newCategoryName" className="block text-sm font-medium text-slate-300 mb-1">{t('transactionForm.newCategoryName')}</label>
                    <div className="flex items-center gap-2 flex-wrap">
                         <input
                            id="newCategoryName"
                            type="text"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            placeholder={t('transactionForm.newCategoryPlaceholder')}
                            className="flex-1 min-w-0 bg-slate-600 border border-slate-500 rounded-md py-2 px-3 text-white focus:outline-none"
                            autoFocus
                        />
                        <button type="button" onClick={handleAddNewCategory} className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg">{t('transactionForm.addCategory')}</button>
                        <button type="button" onClick={() => {setIsAddingCategory(false); setCategory('');}} className="bg-slate-600 hover:bg-slate-500 text-white font-medium py-2 px-3 rounded-lg text-sm">{t('common.cancel')}</button>
                    </div>
                </div>
            )}

            {type === TransactionType.EXPENSE && (
              <div className="space-y-4 pt-2">
                <label className="flex items-center text-sm font-medium text-slate-300 select-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-500 bg-slate-700 text-teal-600 focus:ring-teal-500"
                  />
                  <span className="ml-2">{t('transactionForm.recurringExpense')}</span>
                </label>
                 <label className="flex items-center text-sm font-medium text-slate-300 select-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isBillReminder}
                    onChange={(e) => setIsBillReminder(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-500 bg-slate-700 text-teal-600 focus:ring-teal-500"
                  />
                  <span className="ml-2">{t('transactionForm.billReminder')}</span>
                </label>
                 {isBillReminder && (
                    <div className="animate-fadeIn pl-6">
                        <label htmlFor="dueDate" className="block text-sm font-medium text-slate-300 mb-1">{t('common.dueDate')}</label>
                        <input
                            id="dueDate"
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                            required
                            min={new Date().toISOString().split('T')[0]}
                        />
                    </div>
                )}
              </div>
            )}

            <button type="submit" className="w-full bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-bold py-3 px-4 rounded-lg transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 transform hover:scale-105 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed disabled:shadow-none" disabled={isSubmitDisabled}>
                <PlusIcon className="w-5 h-5" /> {t('transactionForm.addTransactionButton')}
            </button>
        </fieldset>
      </form>
    </div>
  );
};

export default TransactionForm;