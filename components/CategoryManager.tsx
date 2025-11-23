
import React, { useState } from 'react';
import type { CustomCategory } from '../types';
import { TransactionType } from '../types';
import { iconLibrary, iconNames } from '../utils/iconLibrary';
import PlusIcon from './icons/PlusIcon';
import PencilIcon from './icons/PencilIcon';
import TrashIcon from './icons/TrashIcon';
import XMarkIcon from './icons/XMarkIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';
import { useI18n } from '../hooks/useI18n';

interface CategoryManagerProps {
  title: string;
  type: TransactionType;
  defaultCategories: string[];
  customCategories: CustomCategory[];
  onAdd: (name: string, type: TransactionType, icon?: string) => void;
  onUpdate: (id: string, newName: string, newIcon?: string) => void;
  onDelete: (id: string) => void;
}

const CategoryManager: React.FC<CategoryManagerProps> = ({ title, type, defaultCategories, customCategories = [], onAdd, onUpdate, onDelete }) => {
  const { t } = useI18n();
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<string | undefined>(undefined);
  const [editingCategory, setEditingCategory] = useState<{ id: string, name: string, icon?: string } | null>(null);
  const [showIconPicker, setShowIconPicker] = useState(false);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    onAdd(newCategoryName.trim(), type, selectedIcon);
    setNewCategoryName('');
    setSelectedIcon(undefined);
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editingCategory.name || !editingCategory.name.trim()) return;
    onUpdate(editingCategory.id, editingCategory.name.trim(), editingCategory.icon);
    setEditingCategory(null);
  };
  
  // Filter out any undefined/non-string names from custom categories to prevent crashes
  const safeCustomCategories = Array.isArray(customCategories) ? customCategories : [];
  const allCategories = [...defaultCategories, ...safeCustomCategories.map(c => c?.name).filter(n => typeof n === 'string')];
  
  const isNameTaken = editingCategory 
    ? allCategories.some(c => (c || '').toLowerCase() === (editingCategory.name || '').trim().toLowerCase() && (c || '').toLowerCase() !== (safeCustomCategories.find(cat => cat.id === editingCategory.id)?.name || '').toLowerCase())
    : allCategories.some(c => (c || '').toLowerCase() === (newCategoryName || '').trim().toLowerCase());
    
  const IconPicker: React.FC<{ onSelect: (iconName: string) => void }> = ({ onSelect }) => (
    <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 bg-slate-800 p-3 rounded-md mt-2">
        {iconNames.map(iconName => {
            const Icon = iconLibrary[iconName];
            return (
                <button
                    key={iconName}
                    type="button"
                    onClick={() => onSelect(iconName)}
                    className="p-2 rounded-md hover:bg-slate-700 transition-colors text-slate-300 hover:text-white"
                    aria-label={iconName.replace('Icon', '')}
                >
                    <Icon className="w-6 h-6 mx-auto" />
                </button>
            )
        })}
    </div>
  );

  const SelectedIcon: React.FC<{ iconName?: string, onClick?: () => void, isButton?: boolean }> = ({ iconName, onClick, isButton = true }) => {
    const Icon = iconName ? iconLibrary[iconName] : PlusIcon;
    const commonClasses = "w-10 h-10 p-2 rounded-lg flex-shrink-0 flex items-center justify-center transition-colors";
    const buttonClasses = isButton ? "bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white" : "bg-slate-700 text-slate-300";
    return (
        <button type="button" onClick={onClick} className={`${commonClasses} ${buttonClasses}`} disabled={!isButton} aria-label={isButton ? t('categoryManager.chooseIcon') : undefined}>
            <Icon className="w-6 h-6" />
        </button>
    );
  };

  return (
    <div className="bg-slate-900/50 p-4 rounded-lg">
      <h3 className="text-xl font-bold text-white mb-4">{title}</h3>
      <form onSubmit={handleAddSubmit} className="flex gap-2 mb-4">
        <SelectedIcon iconName={selectedIcon} onClick={() => setShowIconPicker(!showIconPicker)} />
        <input
          type="text"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          placeholder={t('transactionForm.newCategoryName') + '...'}
          className="flex-grow bg-slate-700 border border-slate-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <button
          type="submit"
          disabled={!newCategoryName.trim() || isNameTaken}
          className="bg-green-600 hover:bg-green-700 text-white font-bold p-2 rounded-lg transition-colors flex-shrink-0 disabled:bg-slate-600 disabled:cursor-not-allowed"
          aria-label={t('transactionForm.addCategory')}
        >
          <PlusIcon className="h-6 w-6" />
        </button>
      </form>
      {isNameTaken && <p className="text-red-400 text-sm -mt-2 mb-3">{t('categoryManager.nameTaken')}</p>}
      {showIconPicker && !editingCategory && <IconPicker onSelect={(icon) => { setSelectedIcon(icon); setShowIconPicker(false); }} />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4">
        {[...safeCustomCategories].sort((a, b) => (a?.name || '').localeCompare(b?.name || '')).map(cat => {
            if (!cat) return null;
            const CustomIcon = cat.icon ? iconLibrary[cat.icon] : iconLibrary['UserIcon'];
            return editingCategory?.id === cat.id ? (
            <form key={cat.id} onSubmit={handleUpdateSubmit} className="col-span-1 md:col-span-2 bg-slate-700 p-2 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                    <SelectedIcon iconName={editingCategory.icon} onClick={() => setShowIconPicker(!showIconPicker)} />
                    <input
                        type="text"
                        value={editingCategory.name || ''}
                        onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                        className="flex-grow bg-slate-600 border border-slate-500 rounded-lg py-2 px-3 text-white focus:outline-none"
                        autoFocus
                    />
                    <button type="button" onClick={() => setEditingCategory(null)} className="p-2 text-slate-400 hover:text-white" aria-label={t('common.cancel')}><XMarkIcon className="w-5 h-5"/></button>
                    <button type="submit" disabled={!editingCategory.name || !editingCategory.name.trim() || isNameTaken} className="p-2 text-green-400 hover:text-white disabled:text-slate-600" aria-label={t('common.save')}><CheckCircleIcon className="w-5 h-5"/></button>
                </div>
                {showIconPicker && editingCategory?.id === cat.id && <IconPicker onSelect={(icon) => { setEditingCategory({...editingCategory, icon}); setShowIconPicker(false);}} />}
            </form>
          ) : (
            <div key={cat.id} className="group flex items-center justify-between bg-slate-800 p-3 rounded-lg transition-all hover:shadow-lg transform hover:scale-105">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-700 rounded-lg"><CustomIcon className="w-5 h-5 text-green-400" /></div>
                <span className="text-white font-medium">{cat.name}</span>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setEditingCategory({ id: cat.id, name: cat.name, icon: cat.icon }); setShowIconPicker(false); }} className="text-slate-400 hover:text-yellow-400" aria-label={`${t('common.edit')} ${cat.name}`}><PencilIcon className="w-4 h-4" /></button>
                <button onClick={() => onDelete(cat.id)} className="text-slate-400 hover:text-red-400" aria-label={`${t('common.delete')} ${cat.name}`}><TrashIcon className="w-4 h-4" /></button>
              </div>
            </div>
          )
        })}
        {defaultCategories.map(name => {
            const DefaultIcon = iconLibrary['PlusIcon'];
            return (
                <div key={name} className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-lg">
                    <div className="p-2 bg-slate-700/50 rounded-lg"><DefaultIcon className="w-5 h-5 text-slate-400" /></div>
                    <span className="text-slate-300">{name}</span>
                </div>
            )
        })}
      </div>
    </div>
  );
};

export default CategoryManager;
