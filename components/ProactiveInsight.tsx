import React, { useState, useEffect, useCallback } from 'react';
import type { Transaction, SavingsGoal, Budget, User } from '../types';
import getProactiveInsight from '../services/insightService';
import LightBulbIcon from './icons/LightBulbIcon';
import ArrowPathIcon from './icons/ArrowPathIcon';
import { useI18n } from '../hooks/useI18n';

interface ProactiveInsightProps {
  transactions: Transaction[];
  savingsGoals: SavingsGoal[];
  budgets: Budget[];
  currentUser: User | null;
  selectedDate: Date;
}

const ProactiveInsight: React.FC<ProactiveInsightProps> = ({ transactions, savingsGoals, budgets, currentUser, selectedDate }) => {
  const { t, language } = useI18n();
  const [insight, setInsight] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInsight = useCallback(async () => {
    if (transactions.length === 0 && savingsGoals.length === 0 && budgets.length === 0) {
      setInsight(t('proactiveInsight.addTransactions'));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await getProactiveInsight(transactions, savingsGoals, budgets, currentUser, selectedDate, language);
      setInsight(result);
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === 'AI_INSIGHT_ERROR') {
            setError(t('proactiveInsight.errorInsight'));
        } else if (err.message === 'API_KEY_MISSING') {
            setError(t('proactiveInsight.errorService'));
        } else {
            setError(err.message);
        }
      } else {
        setError(t('common.error'));
      }
      setInsight('');
    } finally {
      setIsLoading(false);
    }
  }, [transactions, savingsGoals, budgets, currentUser, selectedDate, language, t]);

  useEffect(() => {
    fetchInsight();
  }, [selectedDate, transactions.length, fetchInsight]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center gap-2 text-slate-400">
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <span>{t('aiAdvisor.analyzing')}</span>
        </div>
      );
    }
    if (error) {
      return <p className="text-red-400 italic">{error}</p>;
    }
    if (transactions.length === 0 && savingsGoals.length === 0 && budgets.length === 0) {
        return <p className="text-slate-400 italic">{insight}</p>;
    }
    return <p className="text-slate-200">{insight}</p>;
  };

  return (
    <div className="bg-slate-800 p-4 rounded-lg flex items-start gap-4">
      <div className="flex-shrink-0 text-yellow-400 mt-0.5">
        <LightBulbIcon className="w-6 h-6" />
      </div>
      <div className="flex-grow">
        {renderContent()}
      </div>
      <button 
        onClick={fetchInsight} 
        disabled={isLoading}
        className="text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-wait p-1 rounded-full hover:bg-slate-700 transition-colors"
        aria-label={t('aiAdvisor.refreshAnalysis')}
        title={t('aiAdvisor.refreshAnalysis')}
      >
        <ArrowPathIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
      </button>
    </div>
  );
};

export default ProactiveInsight;