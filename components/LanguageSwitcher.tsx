import React from 'react';
import { useI18n } from '../hooks/useI18n';

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useI18n();

  return (
    <div className="flex items-center gap-2 p-2 bg-slate-700 rounded-lg">
      <button
        onClick={() => setLanguage('fr')}
        className={`flex-1 py-2 px-4 rounded-md font-semibold transition-colors ${
          language === 'fr' ? 'bg-green-600 text-white' : 'hover:bg-slate-600 text-slate-300'
        }`}
      >
        Français
      </button>
      <button
        onClick={() => setLanguage('en')}
        className={`flex-1 py-2 px-4 rounded-md font-semibold transition-colors ${
          language === 'en' ? 'bg-green-600 text-white' : 'hover:bg-slate-600 text-slate-300'
        }`}
      >
        English
      </button>
    </div>
  );
};

export default LanguageSwitcher;
