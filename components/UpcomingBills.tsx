

import React from 'react';
import type { Transaction } from '../types';
import CalendarDaysIcon from './icons/CalendarDaysIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';
import { useI18n } from '../hooks/useI18n';

interface UpcomingBillsProps {
  transactions: Transaction[];
  onConfirmTransaction: (id: string) => void;
}

const UpcomingBills: React.FC<UpcomingBillsProps> = ({ transactions, onConfirmTransaction }) => {
  const { t, language } = useI18n();
  const upcomingBills = transactions
    .filter(t => {
      if (!t.isBillReminder || !t.dueDate || !t.isPlanned) return false;
      const dueDate = new Date(t.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return dueDate >= today;
    })
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 5);

  return (
    <div className="bg-slate-800 p-4 md:p-6 rounded-lg shadow-lg">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
        <div className="bg-blue-500/10 text-blue-400 p-2 rounded-full">
          <CalendarDaysIcon className="w-6 h-6" />
        </div>
        {t('upcomingBills.title')}
      </h3>
      {upcomingBills.length > 0 ? (
        <ul className="space-y-3">
          {upcomingBills.map(bill => (
            <li key={bill.id} className="flex items-center justify-between bg-slate-700/50 p-3 rounded-md hover:bg-slate-700 transition-colors">
              <div>
                <p className="font-semibold text-white">{bill.description}</p>
                <p className="text-sm text-slate-400">
                  {t('upcomingBills.dueDate')} {new Date(bill.dueDate!).toLocaleDateString(language, { timeZone: 'UTC' })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-orange-400">
                  {bill.amount.toLocaleString(language, { style: 'currency', currency: 'EUR' })}
                </span>
                <button
                    onClick={() => onConfirmTransaction(bill.id)}
                    className="text-slate-400 hover:text-green-400 p-2 rounded-full hover:bg-slate-600 transition-colors"
                    title={t('upcomingBills.confirmPayment')}
                    aria-label={t('upcomingBills.ariaConfirm', { description: bill.description })}
                >
                    <CheckCircleIcon className="w-6 h-6" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-center text-slate-400 py-4">
          {t('upcomingBills.noBills')}
        </p>
      )}
    </div>
  );
};

export default UpcomingBills;