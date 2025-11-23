

import React, { useState, useCallback, useEffect } from 'react';
import type { Transaction, SavingsGoal, User } from '../types';
import getFinancialAdvice from '../services/geminiService';
import ChevronUpIcon from './icons/ChevronUpIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import { useI18n } from '../hooks/useI18n';

interface AiAdvisorProps {
  transactions: Transaction[];
  monthlyLimit: number | null;
  savingsGoals: SavingsGoal[];
  currentUser: User | null;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const AiAdvisor: React.FC<AiAdvisorProps> = ({ transactions, monthlyLimit, savingsGoals, currentUser, isCollapsed, onToggleCollapse }) => {
  const { t, language } = useI18n();
  const [advice, setAdvice] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGetAdvice = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setAdvice('');
    try {
      const result = await getFinancialAdvice(transactions, monthlyLimit, savingsGoals, currentUser, language);
      setAdvice(result);
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === 'AI_SERVICE_ERROR') {
            setError(t('aiAdvisor.errorService'));
        } else if (err.message === 'AI_GENERATION_ERROR') {
            setError(t('aiAdvisor.errorGeneration'));
        } else {
            setError(err.message);
        }
      } else {
        setError(t('common.error'));
      }
    } finally {
      setIsLoading(false);
    }
  }, [transactions, monthlyLimit, savingsGoals, currentUser, language, t]);

  useEffect(() => {
    if (transactions.length === 0) {
        handleGetAdvice();
    }
  }, []); 

  return (
    <div className="bg-slate-900/50 p-4 rounded-lg flex flex-col">
       <div className={`flex justify-between items-center ${!isCollapsed ? 'mb-2' : ''}`}>
            <h3 className="text-xl font-bold text-white">{t('aiAdvisor.title')}</h3>
            <button 
              onClick={onToggleCollapse} 
              className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-700 transition-colors"
              aria-label={isCollapsed ? t('aiAdvisor.showAdvice') : t('aiAdvisor.hideAdvice')}
              title={isCollapsed ? t('aiAdvisor.showAdvice') : t('aiAdvisor.hideAdvice')}
            >
              {isCollapsed ? <ChevronDownIcon className="w-5 h-5" /> : <ChevronUpIcon className="w-5 h-5" />}
            </button>
        </div>
      
      {!isCollapsed && (
        <div className="flex-grow flex flex-col min-h-0 animate-fadeIn" aria-live="polite">
          {!advice && !isLoading && !error && (
            <div className="text-center flex-grow flex flex-col justify-center items-center py-4">
                <p className="text-slate-400 mb-4">{t('aiAdvisor.getAdvicePrompt')}</p>
                <button
                    onClick={handleGetAdvice}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                    {t('aiAdvisor.getAdviceButton')}
                </button>
            </div>
          )}

          {isLoading && (
            <div className="flex-grow flex flex-col items-center justify-center py-4">
              <svg className="animate-spin h-8 w-8 text-white mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              <p className="text-white font-semibold">{t('aiAdvisor.analyzing')}</p>
            </div>
          )}

          {error && (
            <div className="text-center flex-grow flex flex-col justify-center items-center py-4">
                <p className="text-red-400 mb-4">{error}</p>
                <button
                    onClick={handleGetAdvice}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                    {t('common.retry')}
                </button>
            </div>
          )}

          {advice && !isLoading && (
             <div className="text-slate-300 flex-grow overflow-y-auto space-y-2 prose prose-invert prose-sm max-w-none">
                <div dangerouslySetInnerHTML={{ __html: advice.replace(/\n/g, '<br />') }} />
                <button 
                    onClick={handleGetAdvice}
                    className="text-sm text-green-400 hover:text-green-300 mt-4"
                >
                    {t('aiAdvisor.refreshAnalysis')}
                </button>
             </div>
          )}
           <style>{`
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            .animate-fadeIn { animation: fadeIn 0.3s ease-in-out; }
        `}</style>
        </div>
      )}
    </div>
  );
};

export default AiAdvisor;