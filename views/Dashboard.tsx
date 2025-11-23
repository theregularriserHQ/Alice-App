
import React, { useMemo, useState, useRef, useEffect } from 'react';
import type { Transaction, SavingsGoal, User, Budget, CustomCategory, DashboardWidget } from '../types';
import { TransactionType } from '../types';
import TransactionForm from '../components/TransactionForm';
import AiAdvisor from '../components/AiAdvisor';
import SavingsGoalManager from '../components/SavingsGoalManager';
import EditTransactionForm from '../components/EditTransactionForm';
import ProactiveInsight from '../components/ProactiveInsight';
import UpcomingBills from '../components/UpcomingBills';
import getCategoryIcon from '../utils/getCategoryIcon.tsx';
import SpendingChart from '../components/SpendingChart';
import { useI18n } from '../hooks/useI18n';

// Icons
import ChevronLeftIcon from '../components/icons/ChevronLeftIcon';
import ChevronRightIcon from '../components/icons/ChevronRightIcon';
import PencilIcon from '../components/icons/PencilIcon';
import TrashIcon from '../components/icons/TrashIcon';
import CheckCircleIcon from '../components/icons/CheckCircleIcon';
import ShareIcon from '../components/icons/ShareIcon';
import PlusIcon from '../components/icons/PlusIcon';
import EllipsisVerticalIcon from '../components/icons/EllipsisVerticalIcon.tsx';
import ArrowUpRightIcon from '../components/icons/ArrowUpRightIcon.tsx';
import ArrowDownLeftIcon from '../components/icons/ArrowDownLeftIcon.tsx';
import ClockIcon from '../components/icons/ClockIcon.tsx';
import ScaleIcon from '../components/icons/ScaleIcon.tsx';
import Bars2Icon from '../components/icons/Bars2Icon.tsx';
import EyeIcon from '../components/icons/EyeIcon.tsx';
import EyeSlashIcon from '../components/icons/EyeSlashIcon.tsx';

interface DashboardProps {
    currentUser: User;
    transactions: Transaction[];
    savingsGoals: SavingsGoal[];
    budgets: Budget[];
    selectedDate: Date;
    expenseCategories: string[];
    incomeCategories: string[];
    customCategories: CustomCategory[];
    onAddTransaction: (transaction: Omit<Transaction, 'id' | 'date'>) => void;
    onUpdateTransaction: (id: string, updatedData: Omit<Transaction, 'id' | 'date'>) => void;
    onDeleteTransaction: (id: string) => void;
    onConfirmTransaction: (id: string) => void;
    onAddSavingsGoal: (goal: Omit<SavingsGoal, 'id' | 'currentAmount'>) => void;
    onDeleteSavingsGoal: (id: string) => void;
    onAddCategory: (name: string, type: TransactionType) => void;
    onPrevMonth: () => void;
    onNextMonth: () => void;
    onSetActiveSummary: (summaryType: string | null) => void;
    layout: { main: DashboardWidget[], aside: DashboardWidget[] };
    onUpdateLayout: (newLayout: { main: DashboardWidget[], aside: DashboardWidget[] }) => void;
}

const SummaryCard = ({ title, amount, color, icon: Icon, onClick, currency = 'EUR', language }: any) => (
    <button onClick={onClick} className={`relative p-5 rounded-xl overflow-hidden group transition-all duration-300 ease-in-out bg-slate-800 hover:bg-slate-700/50 border border-slate-700 hover:scale-105`}>
        <div className={`absolute -top-4 -right-4 w-24 h-24 rounded-full opacity-5 group-hover:opacity-10 transition-opacity duration-300 ${color.bg}`}></div>
        <div className="relative z-10">
            <div className={`p-2 rounded-full inline-block mb-3 ${color.bg} ${color.text}`}>
                 <Icon className="w-6 h-6" />
            </div>
            <p className="text-slate-400 text-sm">{title}</p>
            <p className="text-2xl font-bold text-white">{amount.toLocaleString(language, { style: 'currency', currency })}</p>
        </div>
    </button>
);

const Dashboard: React.FC<DashboardProps> = (props) => {
    const { t, language } = useI18n();
    const {
        transactions = [], savingsGoals = [], selectedDate, customCategories = [],
        onUpdateTransaction, onDeleteTransaction, onConfirmTransaction,
        onSetActiveSummary, layout, onUpdateLayout,
    } = props;

    const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [isAdvisorCollapsed, setIsAdvisorCollapsed] = useState(true);
    const [isCustomizing, setIsCustomizing] = useState(false);
    
    const menuRef = useRef<HTMLDivElement>(null);
    const dragItemRef = useRef<{ id: string; column: 'main' | 'aside' } | null>(null);
    const dragOverItemRef = useRef<{ id: string; column: 'main' | 'aside' } | null>(null);

    const transactionsPerPage = 10;
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setOpenMenuId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const monthlyTransactions = useMemo(() => {
        const safeTransactions = Array.isArray(transactions) ? transactions : [];
        return safeTransactions
            .filter(transaction => transaction && new Date(transaction.date).getMonth() === selectedDate.getMonth() && new Date(transaction.date).getFullYear() === selectedDate.getFullYear())
            .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [transactions, selectedDate]);

    useEffect(() => {
        setCurrentPage(1);
        setIsFormVisible(false);
    }, [selectedDate]);

    const { income, realExpenses, plannedExpenses, balance } = useMemo(() => {
        const incomeTotal = monthlyTransactions.filter(txn => txn.type === TransactionType.INCOME && !txn.isPlanned).reduce((s, txn) => s + txn.amount, 0);
        const realExpensesTotal = monthlyTransactions.filter(txn => txn.type === TransactionType.EXPENSE && !txn.isPlanned).reduce((s, txn) => s + txn.amount, 0);
        const plannedExpensesTotal = monthlyTransactions.filter(txn => txn.type === TransactionType.EXPENSE && txn.isPlanned).reduce((s, txn) => s + txn.amount, 0);
        return { income: incomeTotal, realExpenses: realExpensesTotal, plannedExpenses: plannedExpensesTotal, balance: incomeTotal - realExpensesTotal };
    }, [monthlyTransactions]);

    const handleUpdate = (id: string, updatedData: Omit<Transaction, 'id' | 'date'>) => {
        onUpdateTransaction(id, updatedData);
        setEditingTransactionId(null);
    }
    
    const handleAddAndCloseForm = (transaction: Omit<Transaction, 'id' | 'date'>) => {
        props.onAddTransaction(transaction);
        setIsFormVisible(false);
    }
    
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

    const paginatedTransactions = useMemo(() => monthlyTransactions.slice((currentPage - 1) * transactionsPerPage, currentPage * transactionsPerPage), [monthlyTransactions, currentPage]);
    const totalPages = Math.ceil(monthlyTransactions.length / transactionsPerPage);

    const handleToggleWidgetVisibility = (id: string, column: 'main' | 'aside') => {
        const newLayout = JSON.parse(JSON.stringify(layout));
        const widget = newLayout[column].find((w: DashboardWidget) => w.id === id);
        if (widget) {
            widget.visible = !widget.visible;
            onUpdateLayout(newLayout);
        }
    };
    
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: string, column: 'main' | 'aside') => dragItemRef.current = { id, column };
    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, id: string, column: 'main' | 'aside') => dragOverItemRef.current = { id, column };
    const handleDrop = (e: React.DragEvent<HTMLElement>, targetColumn: 'main' | 'aside') => {
        if (!dragItemRef.current) return;
        const { id: draggedId, column: fromColumn } = dragItemRef.current;
        const targetId = dragOverItemRef.current?.id;
        if (draggedId === targetId) return;
        const newLayout = JSON.parse(JSON.stringify(layout));
        const draggedItemIndex = newLayout[fromColumn].findIndex((w: DashboardWidget) => w.id === draggedId);
        
        if (draggedItemIndex === -1) return; // Safety check to prevent crash if item not found

        const [draggedItem] = newLayout[fromColumn].splice(draggedItemIndex, 1);
        draggedItem.column = targetColumn;
        if (targetId) {
            const targetItemIndex = newLayout[targetColumn].findIndex((w: DashboardWidget) => w.id === targetId);
            newLayout[targetColumn].splice(targetItemIndex, 0, draggedItem);
        } else {
            newLayout[targetColumn].push(draggedItem);
        }
        newLayout.main.forEach((w: DashboardWidget, i: number) => w.order = i + 1);
        newLayout.aside.forEach((w: DashboardWidget, i: number) => w.order = i + 1);
        onUpdateLayout(newLayout);
    };
    const handleDragEnd = () => { dragItemRef.current = null; dragOverItemRef.current = null; };
    
    const renderWidget = (widget: DashboardWidget) => {
        switch (widget.component) {
            case 'SummaryCards': return <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { title: t('dashboard.revenues'), amount: income, color: { bg: 'bg-green-500/10', text: 'text-green-400' }, icon: ArrowUpRightIcon, onClick: () => onSetActiveSummary('income') },
                    { title: t('dashboard.plannedExpenses'), amount: plannedExpenses, color: { bg: 'bg-orange-500/10', text: 'text-orange-400' }, icon: ClockIcon, onClick: () => onSetActiveSummary('plannedExpenses') },
                    { title: t('dashboard.realExpenses'), amount: realExpenses, color: { bg: 'bg-red-500/10', text: 'text-red-400' }, icon: ArrowDownLeftIcon, onClick: () => onSetActiveSummary('realExpenses') },
                    { title: t('dashboard.balance'), amount: balance, color: { bg: 'bg-blue-500/10', text: 'text-blue-400' }, icon: ScaleIcon, onClick: () => onSetActiveSummary('balance') },
                ].map(card => <SummaryCard key={card.title} {...card} language={language} />)}
            </div>;
            case 'SpendingChart': return <SpendingChart transactions={monthlyTransactions} />;
            case 'TransactionFormToggler': return isFormVisible ? <TransactionForm onAddTransaction={handleAddAndCloseForm} onCollapse={() => setIsFormVisible(false)} {...props} /> : <button id="add-transaction-button" onClick={() => setIsFormVisible(true)} className="w-full bg-slate-800 p-4 rounded-lg hover:bg-slate-700 transition-all duration-300 border border-dashed border-slate-600 hover:border-teal-500 flex items-center justify-center gap-3 text-left transform hover:scale-[1.02]"><PlusIcon className="w-5 h-5 text-slate-400" /><span className="text-lg font-semibold text-white">{t('dashboard.addTransaction')}</span></button>;
            case 'UpcomingBills': return <UpcomingBills transactions={transactions} onConfirmTransaction={onConfirmTransaction} />;
            case 'ProactiveInsight': return <ProactiveInsight {...props} />;
            case 'TransactionHistory': return <div className="bg-slate-800 p-4 md:p-6 rounded-lg shadow-lg">
                    <h3 className="text-xl font-bold text-white mb-4">{t('dashboard.transactionHistory')}</h3>
                    {monthlyTransactions.length > 0 ? (
                        <ul className="space-y-3">
                            {paginatedTransactions.map(transaction => {
                                const CategoryIcon = getCategoryIcon(transaction.category, customCategories);
                                return editingTransactionId === transaction.id ? (
                                    <EditTransactionForm key={transaction.id} transaction={transaction} onSave={(d) => handleUpdate(transaction.id, d)} onCancel={() => setEditingTransactionId(null)} {...props}/>
                                ) : (
                                <li key={transaction.id} className={`flex items-center justify-between bg-slate-700/50 p-3 rounded-md transition-opacity ${transaction.isPlanned ? 'opacity-70 border-l-4 border-yellow-500/50' : 'border-l-4 border-transparent'}`}>
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${transaction.type === TransactionType.EXPENSE ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}><CategoryIcon className="w-5 h-5" /></div>
                                        <div><p className="font-semibold text-white">{transaction.description}</p><p className="text-sm text-slate-400">{transaction.category} &middot; {new Date(transaction.date).toLocaleDateString(language)}</p></div>
                                    </div>
                                    <div className="flex items-center gap-1 md:gap-2">
                                        <div className="text-right mr-2"><p className={`font-bold ${transaction.type === TransactionType.EXPENSE ? 'text-red-400' : 'text-green-400'}`}>{transaction.amount.toLocaleString(language, { style: 'currency', currency: 'EUR' })}</p>{transaction.isPlanned && <span className="text-xs text-yellow-400">{t('dashboard.planned')}</span>}</div>
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
                                    </div>
                                </li>
                                )
                            })}
                        </ul>
                    ) : <p className="text-center text-slate-400 py-8">{t('dashboard.noTransactionsThisMonth')}</p>}
                    {totalPages > 1 && (
                        <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-700">
                            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="flex items-center gap-1 text-slate-400 hover:text-white disabled:opacity-50"><ChevronLeftIcon className="w-5 h-5" /> {t('common.previous')}</button>
                            <span className="text-slate-400 text-sm">{t('common.page')} {currentPage} {t('common.of')} {totalPages}</span>
                            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="flex items-center gap-1 text-slate-400 hover:text-white disabled:opacity-50">{t('common.next')} <ChevronRightIcon className="w-5 h-5" /></button>
                        </div>
                    )}
                </div>;
            case 'SavingsGoals': return <SavingsGoalManager savingsGoals={savingsGoals} onAddGoal={props.onAddSavingsGoal} onDeleteGoal={props.onDeleteSavingsGoal} totalSavings={balance > 0 ? balance : 0} />;
            case 'AiAdvisor': return <div className={`flex-grow ${isAdvisorCollapsed ? '' : 'flex-1 min-h-0'}`}><AiAdvisor transactions={monthlyTransactions} monthlyLimit={null} savingsGoals={savingsGoals} isCollapsed={isAdvisorCollapsed} onToggleCollapse={() => setIsAdvisorCollapsed(p => !p)} {...props}/></div>;
            default: return null;
        }
    };
    
    const DropZone = () => <div className="flex items-center justify-center h-32 border-2 border-dashed border-slate-600 rounded-lg bg-slate-800/50"><p className="text-slate-500">{t('dashboard.dropHere')}</p></div>;

    const renderCustomizableWidget = (widget: DashboardWidget, column: 'main' | 'aside') => (
      <div key={widget.id} id={widget.id} draggable={isCustomizing} onDragStart={(e) => handleDragStart(e, widget.id, column)} onDragEnter={(e) => handleDragEnter(e, widget.id, column)} onDragEnd={handleDragEnd} className={`relative transition-all duration-300 ${isCustomizing ? `p-2 border-2 border-dashed border-slate-600 rounded-lg ${widget.visible ? '' : 'opacity-40'}` : ''}`}>
          {isCustomizing && (
            <div className="absolute top-0 right-0 flex items-center bg-slate-700 rounded-bl-lg rounded-tr-lg p-1 z-10">
                <button onClick={() => handleToggleWidgetVisibility(widget.id, column)} className="p-1 text-slate-300 hover:text-white" title={t(widget.visible ? 'dashboard.hide' : 'dashboard.show')}>{widget.visible ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}</button>
                <div className="p-1 text-slate-300 hover:text-white cursor-move" title={t('dashboard.move')}><Bars2Icon className="w-4 h-4" /></div>
            </div>
          )}
          {renderWidget(widget)}
      </div>
    );

    return (
         <div>
             <div className="flex justify-between items-center bg-slate-800/50 p-3 rounded-lg mb-6">
                <button onClick={props.onPrevMonth} className="p-2 rounded-full hover:bg-slate-700 transition-colors"><ChevronLeftIcon className="w-6 h-6" /></button>
                <h2 className="text-xl font-bold text-white tracking-wider">{selectedDate.toLocaleString(language, { month: 'long', year: 'numeric' }).toUpperCase()}</h2>
                <button onClick={props.onNextMonth} className="p-2 rounded-full hover:bg-slate-700 transition-colors"><ChevronRightIcon className="w-6 h-6" /></button>
            </div>
            <div className="flex justify-end mb-4"><button id="dashboard-customize-button" onClick={() => setIsCustomizing(!isCustomizing)} className={`px-4 py-2 rounded-lg font-semibold transition-colors ${isCustomizing ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-200'}`}>{t(isCustomizing ? 'dashboard.done' : 'dashboard.customize')}</button></div>
             <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <section className="lg:col-span-2 xl:col-span-2 space-y-6 min-h-[100px]" onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDrop(e, 'main')}>
                    {layout.main.sort((a, b) => a.order - b.order).map(widget => (widget.visible || isCustomizing) && renderCustomizableWidget(widget, 'main'))}
                    {isCustomizing && layout.main.length === 0 && <DropZone />}
                </section>
                <aside className="lg:col-span-1 xl:col-span-2 flex flex-col gap-6 min-h-[100px]" onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDrop(e, 'aside')}>
                    {layout.aside.sort((a, b) => a.order - b.order).map(widget => (widget.visible || isCustomizing) && renderCustomizableWidget(widget, 'aside'))}
                    {isCustomizing && layout.aside.length === 0 && <DropZone />}
                </aside>
             </div>
         </div>
    );
};
export default Dashboard;
