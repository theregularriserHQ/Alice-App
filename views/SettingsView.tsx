
import React, { useState, useEffect } from 'react';
import type { User, CustomCategory, FamilyComposition, CustomReminder } from '../types';
import { TransactionType } from '../types';
import CategoryManager from '../components/CategoryManager';
import CustomAlertsManager from '../components/CustomAlertsManager';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { defaultExpenseCategories, defaultIncomeCategories } from '../utils/categories';
import { getCombinedExpenseCategories } from '../utils/categories';
import ChevronDownIcon from '../components/icons/ChevronDownIcon';
import ChevronLeftIcon from '../components/icons/ChevronLeftIcon';
import { useI18n } from '../hooks/useI18n';

interface SettingsViewProps {
  currentUser: User | null;
  onUpdateUser: (user: User) => void;
  customCategories: CustomCategory[];
  onAddCategory: (name: string, type: TransactionType, icon?: string) => void;
  onUpdateCategory: (id: string, newName: string, newIcon?: string) => void;
  onDeleteCategory: (id: string) => void;
  customReminders: CustomReminder[];
  onAddCustomReminder: (reminder: Omit<CustomReminder, 'id'>) => void;
  onDeleteCustomReminder: (id: string) => void;
  onLogout: () => void;
  onGoBack: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = (props) => {
  const { 
    currentUser, onUpdateUser, customCategories, onAddCategory, onUpdateCategory, 
    onDeleteCategory, customReminders, onAddCustomReminder, onDeleteCustomReminder, 
    onLogout, onGoBack 
  } = props;
  const { t } = useI18n();
  const [firstName, setFirstName] = useState(currentUser?.firstName || '');
  const [familyName, setFamilyName] = useState(currentUser?.familyName || '');
  const [familyComposition, setFamilyComposition] = useState<FamilyComposition>(
    currentUser?.familyComposition || { adults: 1, teens: 0, children: 0 }
  );
  const [isSaved, setIsSaved] = useState(false);
  const [openSections, setOpenSections] = useState({
    profile: false,
    language: false,
    alerts: false,
    expenses: false,
    income: false,
    help: false,
  });

  useEffect(() => {
    if (currentUser) {
      setFirstName(currentUser.firstName || '');
      setFamilyName(currentUser.familyName || '');
      setFamilyComposition(currentUser.familyComposition || { adults: 1, teens: 0, children: 0 });
    }
  }, [currentUser]);

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleSaveProfile = () => {
    if (!currentUser) return;
    const updatedUser: User = {
      ...currentUser,
      ...(currentUser.mode === 'individual' && { firstName: firstName.trim() }),
      ...(currentUser.mode === 'family' && { familyName: familyName.trim(), familyComposition }),
    };
    onUpdateUser(updatedUser);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };
  
  const safeCustomCategories = Array.isArray(customCategories) ? customCategories : [];
  const customExpenseCategories = safeCustomCategories.filter(c => c.type === TransactionType.EXPENSE);
  const customIncomeCategories = safeCustomCategories.filter(c => c.type === TransactionType.INCOME);
  const allExpenseCategories = getCombinedExpenseCategories(safeCustomCategories);
  
  const AccordionSection: React.FC<{title: string; sectionKey: keyof typeof openSections; children: React.ReactNode}> = ({ title, sectionKey, children }) => (
    <div className="bg-slate-900/50 rounded-lg">
      <button onClick={() => toggleSection(sectionKey)} className="flex justify-between items-center w-full p-5 text-left hover:bg-slate-700/20 transition-colors">
          <h3 className="text-xl font-bold text-white">{title}</h3>
          <ChevronDownIcon className={`w-6 h-6 text-slate-400 transition-transform duration-300 ${openSections[sectionKey] ? 'rotate-180' : ''}`} />
      </button>
      <div className={`transition-[max-height,padding] duration-500 ease-in-out overflow-hidden ${openSections[sectionKey] ? 'max-h-[1500px]' : 'max-h-0'}`}>
           <div className="p-5 pt-0">{children}</div>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-6 bg-slate-800 rounded-lg shadow-lg max-w-4xl mx-auto animate-fadeIn">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onGoBack} className="p-2 rounded-full hover:bg-slate-700 transition-colors" aria-label={t('common.back')}><ChevronLeftIcon className="w-6 h-6" /></button>
        <h2 className="text-2xl md:text-3xl font-bold text-white">{t('sidebar.settings')}</h2>
      </div>
      
      <div className="space-y-4">
        <AccordionSection title={t('settings.profile')} sectionKey="profile">
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">{t('settings.email')}</label>
                    <input type="email" value={currentUser?.email || ''} disabled className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-slate-400 cursor-not-allowed" />
                </div>
                {currentUser?.mode === 'individual' && (
                    <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-slate-300 mb-1">{t('auth.firstName')}</label>
                    <input id="firstName" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-green-500 focus:border-green-500" />
                    </div>
                )}
                {currentUser?.mode === 'family' && (
                    <>
                    <div><label htmlFor="familyName" className="block text-sm font-medium text-slate-300 mb-1">{t('auth.familyName')}</label><input id="familyName" type="text" value={familyName} onChange={(e) => setFamilyName(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-green-500 focus:border-green-500" /></div>
                    <fieldset className="bg-slate-700/50 p-3 rounded-md">
                        <legend className="text-sm font-medium text-slate-300 mb-2">{t('auth.familyComposition')}</legend>
                        <div className="grid grid-cols-3 gap-2">
                          <div><label htmlFor="adults" className="block text-xs text-slate-400">{t('auth.adults')}</label><input type="number" id="adults" name="adults" value={familyComposition.adults} onChange={(e) => setFamilyComposition({...familyComposition, adults: parseInt(e.target.value, 10) || 0})} min="1" className="w-full bg-slate-600 border-slate-500 rounded-md py-1 px-2 text-white text-center"/></div>
                          <div><label htmlFor="teens" className="block text-xs text-slate-400">{t('auth.teens')}</label><input type="number" id="teens" name="teens" value={familyComposition.teens} onChange={(e) => setFamilyComposition({...familyComposition, teens: parseInt(e.target.value, 10) || 0})} min="0" className="w-full bg-slate-600 border-slate-500 rounded-md py-1 px-2 text-white text-center"/></div>
                          <div><label htmlFor="children" className="block text-xs text-slate-400">{t('auth.children')}</label><input type="number" id="children" name="children" value={familyComposition.children} onChange={(e) => setFamilyComposition({...familyComposition, children: parseInt(e.target.value, 10) || 0})} min="0" className="w-full bg-slate-600 border-slate-500 rounded-md py-1 px-2 text-white text-center"/></div>
                        </div>
                    </fieldset>
                    </>
                )}
                <div className="flex items-center gap-4 pt-2">
                    <button onClick={handleSaveProfile} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">{t('settings.saveChanges')}</button>
                    {isSaved && <p className="text-green-400 text-sm animate-fadeIn">{t('settings.profileUpdated')}</p>}
                </div>
            </div>
        </AccordionSection>
        
        <AccordionSection title={t('settings.langSection')} sectionKey="language">
            <LanguageSwitcher />
        </AccordionSection>

        <AccordionSection title={t('settings.customAlerts')} sectionKey="alerts">
            <CustomAlertsManager reminders={customReminders || []} onAdd={onAddCustomReminder} onDelete={onDeleteCustomReminder} expenseCategories={allExpenseCategories} />
        </AccordionSection>

        <AccordionSection title={t('settings.expenseCategories')} sectionKey="expenses">
            <CategoryManager title={t('settings.yourCustomCategories')} type={TransactionType.EXPENSE} defaultCategories={defaultExpenseCategories} customCategories={customExpenseCategories} onAdd={onAddCategory} onUpdate={onUpdateCategory} onDelete={onDeleteCategory} />
        </AccordionSection>

        <AccordionSection title={t('settings.incomeCategories')} sectionKey="income">
            <CategoryManager title={t('settings.yourCustomCategories')} type={TransactionType.INCOME} defaultCategories={defaultIncomeCategories} customCategories={customIncomeCategories} onAdd={onAddCategory} onUpdate={onUpdateCategory} onDelete={onDeleteCategory} />
        </AccordionSection>
        
        <AccordionSection title={t('settings.helpAndSupport')} sectionKey="help">
            <div className="text-slate-300 space-y-4 text-sm">
                <h4 className="font-bold text-lg text-white mt-2">{t('settings.faq')}</h4>
                <div><p className="font-semibold text-slate-200">{t('settings.q1_title')}</p><p>{t('settings.q1_answer')}</p></div>
                <div><p className="font-semibold text-slate-200">{t('settings.q2_title')}</p><p>{t('settings.q2_answer')}</p></div>
                <div><p className="font-semibold text-slate-200">{t('settings.q3_title')}</p><p>{t('settings.q3_answer')}</p></div>
                <h4 className="font-bold text-lg text-white pt-2">{t('settings.contactSupport')}</h4>
                <p>{t('settings.contactText')} <a href="mailto:support@alice-app.com" className="text-green-400 hover:underline">support@alice-app.com</a>.</p>
            </div>
        </AccordionSection>
      </div>
    </div>
  );
};

export default SettingsView;
