

import React from 'react';
import type { Transaction } from '../types';
import { TransactionType } from '../types';
import XMarkIcon from './icons/XMarkIcon';
import { useI18n } from '../hooks/useI18n';

interface SummaryModalProps {
  title: string;
  transactions: Transaction[];
  balanceDetails?: { income: number; realExpenses: number; balance: number };
  onClose: () => void;
}

const SummaryModal: React.FC<SummaryModalProps> = ({ title, transactions, balanceDetails, onClose }) => {
  const { t, language } = useI18n();
  return (
    <div 
      className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="summary-modal-title"
    >
      <div 
        className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col border border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex justify-between items-center p-4 border-b border-slate-700 flex-shrink-0">
          <h2 id="summary-modal-title" className="text-xl font-bold text-white">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white" aria-label={t('summaryModal.close')}>
            <XMarkIcon className="w-6 h-6" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {balanceDetails && (
            <div className="bg-slate-700 p-4 rounded-lg mb-4 text-center">
                <p className="text-lg">
                    <span className="text-green-400">{balanceDetails.income.toLocaleString(language, { style: 'currency', currency: 'EUR' })}</span>
                    <span className="text-slate-400 mx-2">-</span>
                    <span className="text-red-400">{balanceDetails.realExpenses.toLocaleString(language, { style: 'currency', currency: 'EUR' })}</span>
                    <span className="text-slate-400 mx-2">=</span>
                    <span className={`font-bold ${balanceDetails.balance >= 0 ? 'text-blue-400' : 'text-orange-500'}`}>{balanceDetails.balance.toLocaleString(language, { style: 'currency', currency: 'EUR' })}</span>
                </p>
            </div>
          )}
          {transactions.length > 0 ? (
            transactions.map(transaction => (
              <div key={transaction.id} className="flex items-center justify-between bg-slate-700 p-3 rounded-md">
                <div className="flex items-center gap-3">
                  <div className={`w-1.5 h-10 rounded ${transaction.type === TransactionType.EXPENSE ? 'bg-red-500' : 'bg-green-500'}`}></div>
                  <div>
                    <p className="font-semibold text-white">{transaction.description}</p>
                    <p className="text-sm text-slate-400">{transaction.category} &middot; {new Date(transaction.date).toLocaleDateString(language)}</p>
                  </div>
                </div>
                <span className={`font-bold text-lg ${transaction.type === TransactionType.EXPENSE ? 'text-red-400' : 'text-green-400'}`}>
                  {transaction.amount.toLocaleString(language, { style: 'currency', currency: 'EUR' })}
                </span>
              </div>
            ))
          ) : (
            <p className="text-slate-400 text-center py-8">{t('summaryModal.noTransactions')}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SummaryModal;
