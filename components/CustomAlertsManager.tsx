
import React, { useState } from 'react';
import type { CustomReminder } from '../types';
import PlusIcon from './icons/PlusIcon';
import TrashIcon from './icons/TrashIcon';
import { useI18n } from '../hooks/useI18n';

interface CustomAlertsManagerProps {
  reminders: CustomReminder[];
  onAdd: (reminder: Omit<CustomReminder, 'id'>) => void;
  onDelete: (id: string) => void;
  expenseCategories: string[];
}

const CustomAlertsManager: React.FC<CustomAlertsManagerProps> = ({ reminders = [], onAdd, onDelete, expenseCategories }) => {
  const { t, language } = useI18n();
  const [name, setName] = useState('');
  const [type, setType] = useState<'amount' | 'category'>('amount');
  const [threshold, setThreshold] = useState('');
  const [category, setCategory] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (type === 'amount' && parseFloat(threshold) > 0) {
      onAdd({ name, type, threshold: parseFloat(threshold) });
    } else if (type === 'category' && category) {
      onAdd({ name, type, category });
    }

    setName('');
    setType('amount');
    setThreshold('');
    setCategory('');
  };

  const isSubmitDisabled = !name.trim() || (type === 'amount' && !threshold) || (type === 'category' && !category);

  return (
    <div className="bg-slate-900/50 p-4 rounded-lg">
      <h3 className="text-xl font-bold text-white mb-4">{t('customAlerts.createAlert')}</h3>
      <form onSubmit={handleSubmit} className="space-y-3 mb-6">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('customAlerts.alertNamePlaceholder')}
          className="w-full bg-slate-700 border border-slate-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
          required
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as 'amount' | 'category')}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="amount">{t('customAlerts.byAmount')}</option>
            <option value="category">{t('customAlerts.byCategory')}</option>
          </select>
          {type === 'amount' ? (
            <input
              type="number"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              placeholder={t('customAlerts.amountGreaterThan')}
              min="0.01"
              step="0.01"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          ) : (
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            >
              <option value="" disabled>{t('budgets.chooseCategory')}</option>
              {expenseCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          )}
        </div>
        <button
          type="submit"
          disabled={isSubmitDisabled}
          className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
        >
          <PlusIcon className="w-5 h-5" /> {t('customAlerts.addAlert')}
        </button>
      </form>

      <h3 className="text-xl font-bold text-white mb-4">{t('customAlerts.activeAlerts')}</h3>
      <div className="space-y-2">
        {reminders.length > 0 ? (
          reminders.map(reminder => (
            <div key={reminder.id} className="group flex items-center justify-between bg-slate-800 p-3 rounded-lg">
              <div>
                <p className="font-semibold text-white">{reminder.name}</p>
                <p className="text-sm text-slate-400">
                  {reminder.type === 'amount' 
                    ? t('customAlerts.alertIfExpenseExceeds', { amount: reminder.threshold?.toLocaleString(language, { style: 'currency', currency: 'EUR' }) })
                    : t('customAlerts.alertForCategory', { category: reminder.category })}
                </p>
              </div>
              <button
                onClick={() => onDelete(reminder.id)}
                className="text-slate-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label={`${t('customAlerts.deleteAlert')} ${reminder.name}`}
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            </div>
          ))
        ) : (
          <p className="text-slate-400 text-center py-4">{t('customAlerts.noAlerts')}</p>
        )}
      </div>
    </div>
  );
};

export default CustomAlertsManager;
