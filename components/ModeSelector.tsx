import React from 'react';
import type { AppMode } from '../types';
import UserIcon from './icons/UserIcon';
import UserGroupIcon from './icons/UserGroupIcon';
import { useI18n } from '../hooks/useI18n';

interface ModeSelectorProps {
  onModeChange: (mode: AppMode) => void;
}

const ModeSelector: React.FC<ModeSelectorProps> = ({ onModeChange }) => {
  const { t } = useI18n();
  return (
    <div className="bg-slate-800 p-6 rounded-lg shadow-lg flex flex-col items-center gap-6 max-w-lg w-full">
      <h2 className="text-2xl font-bold text-white">{t('modeSelector.title')}</h2>
      <div className="flex flex-col sm:flex-row gap-4 w-full">
        <button
          onClick={() => onModeChange('individual')}
          className="flex-1 p-6 bg-slate-700 rounded-lg text-center hover:bg-green-600 hover:scale-105 transition-all"
        >
          <UserIcon className="w-10 h-10 mx-auto mb-2" />
          <span className="font-semibold text-lg">{t('common.individual')}</span>
          <p className="text-sm text-slate-400">{t('modeSelector.individualDescription')}</p>
        </button>
        <button
          onClick={() => onModeChange('family')}
          className="flex-1 p-6 bg-slate-700 rounded-lg text-center hover:bg-green-600 hover:scale-105 transition-all"
        >
          <UserGroupIcon className="w-10 h-10 mx-auto mb-2" />
          <span className="font-semibold text-lg">{t('common.family')}</span>
           <p className="text-sm text-slate-400">{t('modeSelector.familyDescription')}</p>
        </button>
      </div>
    </div>
  );
};

export default ModeSelector;