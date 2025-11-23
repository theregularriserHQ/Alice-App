
import React, { useState } from 'react';
import type { Transaction } from '../types';
import { TransactionType } from '../types';
import { useI18n } from '../hooks/useI18n';

interface EditTransactionFormProps {
  transaction: Transaction;
  onSave: (updatedData: Omit<Transaction, 'id' | 'date'>) => void;
  onCancel: () => void;
  expenseCategories: string[];
  incomeCategories: string[];
}

const EditTransactionForm: React.FC<EditTransactionFormProps> = ({ transaction, onSave, onCancel, expenseCategories, incomeCategories }) => {
  const { t } = useI18n();
  // Use fallbacks to ensure controlled inputs
  const [description, setDescription] = useState(transaction.description || '');
  const [amount, setAmount] = useState(transaction.amount?.toString() || '');
  const [type] = useState(transaction.type);
  const [category, setCategory] = useState(transaction.category || '');
  const [isRecurring, setIsRecurring] = useState(transaction.isRecurring || false);
  const [isBillReminder, setIsBillReminder] = useState(transaction.isBillReminder || false);
  const [dueDate, setDueDate] = useState(transaction.dueDate || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !category || (isBillReminder && !dueDate)) return;
    onSave({
      description,
      amount: parseFloat(amount),
      type,
      category,
      isRecurring: type === TransactionType.EXPENSE ? isRecurring : false,
      isBillReminder: type === TransactionType.EXPENSE ? isBillReminder : false,
      dueDate: type === TransactionType.EXPENSE && isBillReminder ? dueDate : undefined,
      remindersSent: transaction.remindersSent || { week: false, threeDays: false, today: false },
    });
  };

  return (
    <li className="bg-slate-600 p-3 rounded-md animate-pulse-once">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-slate-700 border border-slate-500 rounded-md py-1 px-2 text-white focus:outline-none focus:ring-green-500 focus:border-green-500"
            required
          />
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-slate-700 border border-slate-500 rounded-md py-1 px-2 text-white focus:outline-none focus:ring-green-500 focus:border-green-500"
            required
            min="0.01"
            step="0.01"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full bg-slate-700 border border-slate-500 rounded-md py-1 px-2 text-white focus:outline-none focus:ring-green-500 focus:border-green-500"
          required
        >
          {(type === TransactionType.EXPENSE ? expenseCategories : incomeCategories).map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        {type === TransactionType.EXPENSE && (
          <div className="space-y-2">
            <label className="flex items-center text-sm font-medium text-slate-300 select-none">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="h-4 w-4 rounded border-slate-500 bg-slate-700 text-green-600 focus:ring-green-500"
              />
              <span className="ml-2">{t('transactionForm.recurringExpense')}</span>
            </label>
             <label className="flex items-center text-sm font-medium text-slate-300 select-none">
              <input
                type="checkbox"
                checked={isBillReminder}
                onChange={(e) => setIsBillReminder(e.target.checked)}
                className="h-4 w-4 rounded border-slate-500 bg-slate-700 text-green-600 focus:ring-green-500"
              />
              <span className="ml-2">{t('transactionForm.billReminder')}</span>
            </label>
            {isBillReminder && (
                <div className="animate-fadeIn pl-6">
                    <label htmlFor={`dueDate-${transaction.id}`} className="block text-sm font-medium text-slate-300 mb-1">{t('common.dueDate')}</label>
                    <input
                        id={`dueDate-${transaction.id}`}
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full bg-slate-700 border border-slate-600 rounded-md py-1 px-2 text-white"
                        required
                        min={new Date().toISOString().split('T')[0]}
                    />
                </div>
            )}
          </div>
        )}
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="bg-slate-500 hover:bg-slate-400 text-white font-semibold text-sm py-1 px-3 rounded-md transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white font-semibold text-sm py-1 px-3 rounded-md transition-colors"
          >
            {t('common.save')}
          </button>
        </div>
      </form>
       <style>{`
            @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
            .animate-fadeIn { animation: fadeIn 0.3s ease-in-out; }
        `}</style>
    </li>
  );
};

export default EditTransactionForm;
