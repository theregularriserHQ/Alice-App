import React from 'react';
import type { Budget, Transaction } from '../types';
import BudgetManager from '../components/BudgetManager';
import { useMemo } from 'react';
import { TransactionType } from '../types';
import ChevronLeftIcon from '../components/icons/ChevronLeftIcon';
import { useI18n } from '../hooks/useI18n';

interface BudgetsViewProps {
    budgets: Budget[];
    transactions: Transaction[];
    onAddBudget: (budget: Omit<Budget, 'id'>) => void;
    onDeleteBudget: (id: string) => void;
    expenseCategories: string[];
    onGoBack: () => void;
}

const BudgetsView: React.FC<BudgetsViewProps> = ({ budgets = [], transactions = [], onAddBudget, onDeleteBudget, expenseCategories = [], onGoBack }) => {
    const { t } = useI18n();
    const spentByCategory = useMemo(() => {
        const today = new Date();
        const safeTransactions = Array.isArray(transactions) ? transactions : [];
        
        return safeTransactions
            .filter(t => {
                if (!t) return false;
                const tDate = new Date(t.date);
                return t.type === TransactionType.EXPENSE && !t.isPlanned && tDate.getMonth() === today.getMonth() && tDate.getFullYear() === today.getFullYear();
            })
            .reduce((acc, t) => {
                if (!acc[t.category]) {
                    acc[t.category] = { name: t.category, value: 0 };
                }
                acc[t.category].value += t.amount;
                return acc;
            }, {} as Record<string, { name: string; value: number }>);
    }, [transactions]);
    
    const safeBudgets = Array.isArray(budgets) ? budgets : [];

    return (
        <div id="budgets-view-content" className="p-6 bg-slate-800 rounded-lg shadow-lg">
             <div className="flex items-center gap-4 mb-6">
                <button onClick={onGoBack} className="p-2 rounded-full hover:bg-slate-700 transition-colors" aria-label={t('common.back')}>
                    <ChevronLeftIcon className="w-6 h-6" />
                </button>
                <h2 className="text-3xl font-bold text-white">{t('sidebar.budgets')}</h2>
             </div>
             <div className="max-w-4xl mx-auto h-[70vh]">
                <BudgetManager 
                    budgets={safeBudgets}
                    transactions={Array.isArray(transactions) ? transactions : []}
                    onAddBudget={onAddBudget}
                    onDeleteBudget={onDeleteBudget}
                    spentByCategory={spentByCategory}
                    availableCategories={expenseCategories}
                />
             </div>
        </div>
    );
};
export default BudgetsView;