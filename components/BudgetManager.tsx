

import React, { useState } from 'react';
import type { Budget, Transaction } from '../types';
import { TransactionType } from '../types';
import PlusIcon from './icons/PlusIcon';
import TrashIcon from './icons/TrashIcon';
import { useI18n } from '../hooks/useI18n';

interface BudgetManagerProps {
  budgets: Budget[];
  transactions: Transaction[];
  onAddBudget: (budget: Omit<Budget, 'id'>) => void;
  onDeleteBudget: (budgetId: string) => void;
  spentByCategory: Record<string, { name: string; value: number }>;
  availableCategories: string[];
}

const BudgetManager: React.FC<BudgetManagerProps> = ({ budgets, transactions, onAddBudget, onDeleteBudget, spentByCategory, availableCategories }) => {
  const { t } = useI18n();
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !amount) return;
    onAddBudget({ category, amount: parseFloat(amount) });
    setCategory('');
    setAmount('');
  };

  const handleSuggestBudget = () => {
    if (!category) return;
    const today = new Date();
    const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 3, 1);

    const relevantTransactions = transactions.filter(t =>
      t.category === category &&
      t.type === TransactionType.EXPENSE &&
      !t.isPlanned &&
      new Date(t.date) >= threeMonthsAgo &&
      new Date(t.date) < today
    );
    
    if (relevantTransactions.length === 0) {
        setAmount('0');
        return;
    }

    const totalSpent = relevantTransactions.reduce((sum, t) => sum + t.amount, 0);
    const monthlyAverage = totalSpent / 3;
    setAmount(monthlyAverage.toFixed(2));
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return { bar: 'bg-red-500', text: 'text-red-400' };
    if (percentage >= 80) return { bar: 'bg-yellow-500', text: 'text-yellow-400' };
    return { bar: 'bg-green-500', text: 'text-green-400' };
  };

  const categoriesForDropdown = availableCategories.filter(
    cat => !budgets.some(b => b.category === cat)
  );

  return (
    <div className="bg-slate-900/50 p-4 rounded-lg h-full flex flex-col">
      <h3 className="text-xl font-bold text-white mb-4">{t('budgets.title')}</h3>
      
      <form onSubmit={handleSubmit} className="space-y-2 mb-4">
        <div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-green-500 focus:border-green-500"
            required
          >
            <option value="" disabled>{t('budgets.chooseCategory')}</option>
            {categoriesForDropdown.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={t('common.amount')}
              className="flex-grow bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-green-500 focus:border-green-500"
              required
              min="0.01"
              step="0.01"
            />
            <button
              type="button"
              onClick={handleSuggestBudget}
              disabled={!category}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-3 rounded-lg transition-colors flex-shrink-0 disabled:bg-slate-600 disabled:cursor-not-allowed"
            >
              {t('budgets.suggest')}
            </button>
            <button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-bold p-2 rounded-lg transition-colors flex-shrink-0">
              <PlusIcon className="h-5 w-5" />
            </button>
        </div>
      </form>

      <div className="space-y-3 overflow-y-auto flex-grow">
        {budgets.length > 0 ? (
          budgets.map(budget => {
            const spent = spentByCategory[budget.category]?.value || 0;
            const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
            const { bar: progressBarColor, text: progressTextColor } = getProgressColor(percentage);
            
            return (
              <div key={budget.id} className="bg-slate-700 p-3 rounded-md">
                <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-white">{budget.category}</span>
                    <div className="flex items-center gap-3">
                        <span className={`text-sm font-semibold ${progressTextColor}`}>{percentage.toFixed(0)}%</span>
                        <span className="text-sm text-slate-300">{spent.toFixed(2)}€ / {budget.amount.toFixed(2)}€</span>
                        <button onClick={() => onDeleteBudget(budget.id)} className="text-slate-400 hover:text-red-400" aria-label={`${t('common.delete')} ${t('sidebar.budgets')} ${budget.category}`}>
                          <TrashIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>
                <div className="w-full bg-slate-600 rounded-full h-2">
                  <div className={`${progressBarColor} h-2 rounded-full`} style={{ width: `${Math.min(percentage, 100)}%` }}></div>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-slate-400 text-center pt-8">{t('budgets.noBudgets')}</p>
        )}
      </div>
    </div>
  );
};

export default BudgetManager;
