
import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { Transaction, CustomCategory } from '../types';
import { TransactionType } from '../types';
import EditTransactionForm from '../components/EditTransactionForm';
import PencilIcon from '../components/icons/PencilIcon';
import TrashIcon from '../components/icons/TrashIcon';
import CheckCircleIcon from '../components/icons/CheckCircleIcon';
import ChevronLeftIcon from '../components/icons/ChevronLeftIcon';
import ShareIcon from '../components/icons/ShareIcon';
import EllipsisVerticalIcon from '../components/icons/EllipsisVerticalIcon';
import getCategoryIcon from '../utils/getCategoryIcon.tsx';
import MagnifyingGlassIcon from '../components/icons/MagnifyingGlassIcon';
import FunnelIcon from '../components/icons/FunnelIcon';
import { useI18n } from '../hooks/useI18n';

interface TransactionsViewProps {
  transactions: Transaction[];
  onUpdateTransaction: (id: string, updatedData: Omit<Transaction, 'id' | 'date'>) => void;
  onDeleteTransaction: (id: string) => void;
  onConfirmTransaction: (id: string) => void;
  onBulkDelete?: (ids: string[]) => void;
  expenseCategories: string[];
  incomeCategories: string[];
  customCategories: CustomCategory[];
  onGoBack: () => void;
}

type SortKey = 'date' | 'amount' | 'category';
type SortDirection = 'asc' | 'desc';
type StatusFilter = 'all' | 'planned' | 'real';

const TransactionsView: React.FC<TransactionsViewProps> = (props) => {
  const { transactions = [], onUpdateTransaction, onDeleteTransaction, onConfirmTransaction, onBulkDelete, expenseCategories, incomeCategories, customCategories, onGoBack } = props;
  const { t, language } = useI18n();
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'date', direction: 'desc' });
  
  // New filter states
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Bulk selection states
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timerId = setTimeout(() => setSearchQuery(inputValue), 300);
    return () => clearTimeout(timerId);
  }, [inputValue]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleUpdate = (id: string, updatedData: Omit<Transaction, 'id' | 'date'>) => {
    onUpdateTransaction(id, updatedData);
    setEditingTransactionId(null);
  };
  
  const handleShare = async (transaction: Transaction) => {
    const shareData = {
        title: t('dashboard.shareTransaction'),
        text: `${t('common.description')}: ${transaction.description}\n${t('common.amount')}: ${transaction.amount.toLocaleString(language, { style: 'currency', currency: 'EUR' })}\n${t('common.category')}: ${transaction.category}\n${t('common.date')}: ${new Date(transaction.date).toLocaleDateString(language)}`,
        url: window.location.href,
    };
    if (navigator.share) {
        try { await navigator.share(shareData); } catch (err) { console.error("Share error:", err); }
    } else {
        alert(t('sidebar.shareError'));
    }
    setOpenMenuId(null);
  };

  const handleSort = (key: SortKey) => setSortConfig(p => ({ key, direction: p.key === key && p.direction === 'desc' ? 'asc' : 'desc' }));
  
  const clearFilters = () => {
      setStartDate('');
      setEndDate('');
      setStatusFilter('all');
      setInputValue('');
      setSearchQuery('');
  };

  const processedTransactions = useMemo(() => {
    const safeTransactions = Array.isArray(transactions) ? transactions : [];
    
    const filtered = safeTransactions.filter(transaction => {
      if (!transaction) return false;

      // Text Search
      const matchesSearch = 
        (transaction.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (transaction.category || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!matchesSearch) return false;

      // Status Filter
      if (statusFilter === 'planned' && !transaction.isPlanned) return false;
      if (statusFilter === 'real' && transaction.isPlanned) return false;

      // Date Range Filter
      const tDate = new Date(transaction.date).getTime();
      if (isNaN(tDate)) return false;

      if (startDate) {
          const start = new Date(startDate).getTime();
          if (tDate < start) return false;
      }

      if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (tDate > end.getTime()) return false;
      }

      return true;
    });

    return [...filtered].sort((a, b) => {
      if (!a || !b) return 0;
      let comparison = 0;
      if (sortConfig.key === 'date') {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          // Handle NaN dates by treating them as 0 (epoch start)
          const safeDateA = isNaN(dateA) ? 0 : dateA;
          const safeDateB = isNaN(dateB) ? 0 : dateB;
          comparison = safeDateB - safeDateA;
      }
      else if (sortConfig.key === 'amount') comparison = (b.amount || 0) - (a.amount || 0);
      else comparison = (a.category || '').localeCompare(b.category || '');
      return sortConfig.direction === 'asc' ? -comparison : comparison;
    });
  }, [transactions, searchQuery, sortConfig, statusFilter, startDate, endDate]);

  const toggleSelection = (id: string) => {
      const newSet = new Set(selectedIds);
      if (newSet.has(id)) {
          newSet.delete(id);
      } else {
          newSet.add(id);
      }
      setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
      if (selectedIds.size === processedTransactions.length) {
          setSelectedIds(new Set());
      } else {
          setSelectedIds(new Set(processedTransactions.map(t => t.id)));
      }
  };

  const handleBulkDelete = () => {
      if (onBulkDelete && selectedIds.size > 0) {
        // Confirm?
        if (window.confirm(t('common.delete') + ' ' + selectedIds.size + ' transactions?')) {
            onBulkDelete(Array.from(selectedIds));
            setSelectedIds(new Set());
            setIsSelectionMode(false);
        }
      }
  };

  const toggleSelectionMode = () => {
      if (isSelectionMode) {
          setSelectedIds(new Set());
          setIsSelectionMode(false);
      } else {
          setIsSelectionMode(true);
      }
  };

  const SortButton: React.FC<{ sortKey: SortKey, label: string }> = ({ sortKey, label }) => (
    <button onClick={() => handleSort(sortKey)} className={`px-3 py-1 text-sm rounded-full transition-colors ${sortConfig.key === sortKey ? 'bg-green-600 text-white font-semibold' : 'bg-slate-600 hover:bg-slate-500 text-slate-300'}`}>
        {label} {sortConfig.key === sortKey && (sortConfig.direction === 'asc' ? '▲' : '▼')}
    </button>
  );

  const activeFiltersCount = (statusFilter !== 'all' ? 1 : 0) + (startDate ? 1 : 0) + (endDate ? 1 : 0);

  return (
    <div className="p-4 md:p-6 bg-slate-800 rounded-lg shadow-lg animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button onClick={onGoBack} className="p-2 rounded-full hover:bg-slate-700 transition-colors" aria-label={t('common.back')}><ChevronLeftIcon className="w-6 h-6" /></button>
            <h2 className="text-2xl md:text-3xl font-bold text-white">{t('sidebar.transactions')}</h2>
          </div>
          {isSelectionMode && selectedIds.size > 0 && (
              <button 
                onClick={handleBulkDelete} 
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors font-bold"
              >
                  <TrashIcon className="w-5 h-5" />
                  <span className="hidden sm:inline">{t('common.bulkDelete')} ({selectedIds.size})</span>
              </button>
          )}
      </div>

      <div className="space-y-4 mb-6">
        <div className="flex gap-2">
            <div className="relative flex-grow">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><MagnifyingGlassIcon className="h-5 w-5 text-slate-400" aria-hidden="true" /></div>
                    <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder={t('common.searchPlaceholder')} className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <button 
                onClick={() => setShowFilters(!showFilters)} 
                className={`p-2 rounded-md border transition-colors flex items-center gap-2 ${showFilters || activeFiltersCount > 0 ? 'bg-slate-600 border-teal-500 text-white' : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'}`}
                title={t('filters.title')}
            >
                <FunnelIcon className="w-6 h-6" />
                {activeFiltersCount > 0 && <span className="bg-teal-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">{activeFiltersCount}</span>}
            </button>
            <button
                onClick={toggleSelectionMode}
                className={`p-2 rounded-md border transition-colors flex items-center gap-2 ${isSelectionMode ? 'bg-slate-600 border-blue-500 text-white' : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'}`}
                title={isSelectionMode ? t('common.cancel') : t('common.selectionMode')}
            >
                <CheckCircleIcon className="w-6 h-6" />
                {isSelectionMode && <span className="text-sm font-semibold hidden sm:inline">{t('common.cancel')}</span>}
            </button>
        </div>

        {showFilters && (
            <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600 animate-fadeIn">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-slate-300 mb-1">{t('filters.status')}</label>
                        <select 
                            value={statusFilter} 
                            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                            className="w-full bg-slate-600 border border-slate-500 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        >
                            <option value="all">{t('filters.all')}</option>
                            <option value="planned">{t('filters.planned')}</option>
                            <option value="real">{t('filters.real')}</option>
                        </select>
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-slate-300 mb-1">{t('filters.from')}</label>
                        <input 
                            type="date" 
                            value={startDate} 
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full bg-slate-600 border border-slate-500 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-slate-300 mb-1">{t('filters.to')}</label>
                        <input 
                            type="date" 
                            value={endDate} 
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full bg-slate-600 border border-slate-500 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                    </div>
                     <div className="flex items-end">
                        <button onClick={clearFilters} className="text-sm text-red-400 hover:text-red-300 hover:underline py-2 px-1">
                            {t('filters.clear')}
                        </button>
                    </div>
                </div>
            </div>
        )}
      </div>

       <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-slate-400 mr-2">{t('common.sortBy')}</span>
                <SortButton sortKey="date" label={t('common.date')} />
                <SortButton sortKey="amount" label={t('common.amount')} />
                <SortButton sortKey="category" label={t('common.category')} />
            </div>
            
            {isSelectionMode && processedTransactions.length > 0 && (
                <div className="flex items-center gap-2">
                     <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-slate-300 hover:text-white">
                        <input 
                            type="checkbox" 
                            checked={selectedIds.size > 0 && selectedIds.size === processedTransactions.length}
                            onChange={toggleSelectAll}
                            className="h-4 w-4 rounded border-slate-500 bg-slate-700 text-blue-600 focus:ring-blue-500"
                        />
                        <span>{selectedIds.size === processedTransactions.length ? t('common.deselectAll') : t('common.selectAll')}</span>
                    </label>
                    <span className="text-sm text-slate-400 ml-2">({selectedIds.size} {t('common.selected')})</span>
                </div>
            )}
      </div>

       <ul className="space-y-3">
            {processedTransactions.map(transaction => {
                const CategoryIcon = getCategoryIcon(transaction.category, customCategories);
                return editingTransactionId === transaction.id ? (
                    <EditTransactionForm key={transaction.id} transaction={transaction} onSave={(d) => handleUpdate(transaction.id, d)} onCancel={() => setEditingTransactionId(null)} {...props} />
                ) : (
                <li 
                    key={transaction.id} 
                    className={`flex items-center justify-between bg-slate-700/50 p-3 rounded-md transition-all ${transaction.isPlanned ? 'opacity-70 border-l-4 border-yellow-500/50' : 'border-l-4 border-transparent'} ${isSelectionMode && selectedIds.has(transaction.id) ? 'bg-slate-700 border-blue-500 ring-1 ring-blue-500' : ''}`}
                    onClick={() => isSelectionMode && toggleSelection(transaction.id)}
                >
                    <div className="flex items-center gap-4 flex-grow">
                        {isSelectionMode && (
                            <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                 <input 
                                    type="checkbox" 
                                    checked={selectedIds.has(transaction.id)}
                                    onChange={() => toggleSelection(transaction.id)}
                                    className="h-5 w-5 rounded border-slate-500 bg-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                />
                            </div>
                        )}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${transaction.type === TransactionType.EXPENSE ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'} flex-shrink-0`}><CategoryIcon className="w-5 h-5" /></div>
                        <div><p className="font-semibold text-white">{transaction.description}</p><p className="text-sm text-slate-400">{transaction.category} &middot; {new Date(transaction.date).toLocaleDateString(language)}</p></div>
                    </div>
                    <div className="flex items-center gap-1 md:gap-2" onClick={(e) => e.stopPropagation()}>
                         <div className="text-right mr-2"><p className={`font-bold ${transaction.type === TransactionType.EXPENSE ? 'text-red-400' : 'text-green-400'}`}>{transaction.amount.toLocaleString(language, { style: 'currency', currency: 'EUR' })}</p>{transaction.isPlanned && <span className="text-xs text-yellow-400">{t('dashboard.planned')}</span>}</div>
                        {!isSelectionMode && (
                            <>
                            {transaction.isPlanned && transaction.type === TransactionType.EXPENSE && <button onClick={() => onConfirmTransaction(transaction.id)} className="text-slate-400 hover:text-green-400 p-2 rounded-full hover:bg-slate-600" title={t('dashboard.confirmExpense')}><CheckCircleIcon className="w-5 h-5" /></button>}
                            <button onClick={() => setEditingTransactionId(transaction.id)} className="text-slate-400 hover:text-yellow-400 p-2 rounded-full hover:bg-slate-600" title={t('common.edit')}><PencilIcon className="w-5 h-5" /></button>
                            <div className="relative">
                                <button onClick={() => setOpenMenuId(openMenuId === transaction.id ? null : transaction.id)} className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-600"><EllipsisVerticalIcon className="w-5 h-5" /></button>
                                {openMenuId === transaction.id && (
                                    <div ref={menuRef} className="absolute right-0 mt-2 w-40 bg-slate-600 border border-slate-500 rounded-md shadow-lg z-10 animate-fadeIn">
                                        <button onClick={() => handleShare(transaction)} className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-500"><ShareIcon className="w-4 h-4" /> {t('common.share')}</button>
                                        <button onClick={() => { onDeleteTransaction(transaction.id); setOpenMenuId(null); }} className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-500"><TrashIcon className="w-4 h-4" /> {t('common.delete')}</button>
                                    </div>
                                )}
                            </div>
                            </>
                        )}
                    </div>
                </li>
                )
            })}
        </ul>
        {processedTransactions.length === 0 && <p className="text-center text-slate-400 py-8">{searchQuery || activeFiltersCount > 0 ? t('common.noTransactionsFound') : t('common.noTransactionsYet')}</p>}
    </div>
  );
};
export default TransactionsView;
