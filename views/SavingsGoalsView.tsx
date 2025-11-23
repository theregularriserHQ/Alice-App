import React, { useMemo } from 'react';
import type { SavingsGoal, Transaction } from '../types';
import { TransactionType } from '../types';
import SavingsGoalManager from '../components/SavingsGoalManager';
import ChevronLeftIcon from '../components/icons/ChevronLeftIcon';
import { useI18n } from '../hooks/useI18n';

interface SavingsGoalsViewProps {
  savingsGoals: SavingsGoal[];
  transactions: Transaction[];
  onAddGoal: (goal: Omit<SavingsGoal, 'id' | 'currentAmount'>) => void;
  onDeleteGoal: (goalId: string) => void;
  onGoBack: () => void;
}

const SavingsGoalsView: React.FC<SavingsGoalsViewProps> = ({ savingsGoals = [], transactions = [], onAddGoal, onDeleteGoal, onGoBack }) => {
  const { t } = useI18n();
  const balance = useMemo(() => {
    const today = new Date();
    const safeTransactions = Array.isArray(transactions) ? transactions : [];
    
    const monthlyTransactions = safeTransactions.filter(t => {
        if (!t) return false;
        const tDate = new Date(t.date);
        return tDate.getMonth() === today.getMonth() && tDate.getFullYear() === today.getFullYear();
    });
    const income = monthlyTransactions.filter(t => t.type === TransactionType.INCOME && !t.isPlanned).reduce((sum, t) => sum + t.amount, 0);
    const realExpenses = monthlyTransactions.filter(t => t.type === TransactionType.EXPENSE && !t.isPlanned).reduce((sum, t) => sum + t.amount, 0);
    return income - realExpenses;
  }, [transactions]);

  const safeGoals = Array.isArray(savingsGoals) ? savingsGoals : [];

  return (
    <div className="p-6 bg-slate-800 rounded-lg shadow-lg">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onGoBack} className="p-2 rounded-full hover:bg-slate-700 transition-colors" aria-label={t('common.back')}>
            <ChevronLeftIcon className="w-6 h-6" />
        </button>
        <h2 className="text-3xl font-bold text-white">{t('sidebar.goals')}</h2>
      </div>
      <div className="max-w-4xl mx-auto h-[70vh]">
        <SavingsGoalManager 
          savingsGoals={safeGoals} 
          onAddGoal={onAddGoal} 
          onDeleteGoal={onDeleteGoal} 
          totalSavings={balance > 0 ? balance : 0} 
        />
      </div>
    </div>
  );
};

export default SavingsGoalsView;