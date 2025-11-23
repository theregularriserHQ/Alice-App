
import React, { useState, useEffect, useCallback, useMemo } from 'react';

// Import types
import type { Transaction, SavingsGoal, User, AppView, Budget, CustomCategory, CustomReminder, DashboardWidget } from './types';
import { TransactionType } from './types';

// Import components and views
import Auth from './components/Auth';
import SplashScreen from './components/SplashScreen';
import LiveChat from './components/LiveChat';
import SummaryModal from './components/SummaryModal';
import Sidebar from './components/Sidebar';
import Dashboard from './views/Dashboard';
import TransactionsView from './views/TransactionsView';
import SavingsGoalsView from './views/SavingsGoalsView';
import BudgetsView from './views/BudgetsView';
import SettingsView from './views/SettingsView';
import OnboardingGuide from './components/OnboardingGuide';

// Import hooks and helpers
import { useI18n } from './hooks/useI18n';
import { getCombinedExpenseCategories, getCombinedIncomeCategories } from './utils/categories';

// Import icons
import ChatIcon from './components/icons/ChatIcon';
import Bars3Icon from './components/icons/Bars3Icon';

// Default user for testing purposes
const defaultUser: User = {
    email: 'test.family@alice.com',
    mode: 'family',
    familyName: 'Test',
    familyComposition: { adults: 2, teens: 1, children: 2 },
    hasCompletedOnboarding: true,
};

const defaultDashboardLayout: { main: DashboardWidget[], aside: DashboardWidget[] } = {
    main: [
        { id: 'summary', component: 'SummaryCards', column: 'main', order: 1, visible: true },
        { id: 'spending-chart', component: 'SpendingChart', column: 'main', order: 2, visible: true },
        { id: 'add-transaction', component: 'TransactionFormToggler', column: 'main', order: 3, visible: true },
        { id: 'upcoming-bills', component: 'UpcomingBills', column: 'main', order: 4, visible: true },
        { id: 'proactive-insight', component: 'ProactiveInsight', column: 'main', order: 5, visible: true },
        { id: 'transaction-history', component: 'TransactionHistory', column: 'main', order: 6, visible: true },
    ],
    aside: [
        { id: 'savings-goals', component: 'SavingsGoals', column: 'aside', order: 1, visible: true },
        { id: 'ai-advisor', component: 'AiAdvisor', column: 'aside', order: 2, visible: true },
    ]
};

const App: React.FC = () => {
    const { t, language } = useI18n();
    const [isLoading, setIsLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    
    // Initialize with empty arrays to prevent crashes
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
    const [customReminders, setCustomReminders] = useState<CustomReminder[]>([]);
    
    const [dashboardLayout, setDashboardLayout] = useState(defaultDashboardLayout);
    const [isLiveChatOpen, setIsLiveChatOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showCarryOverPrompt, setShowCarryOverPrompt] = useState(false);
    const [previousMonthForCarryOver, setPreviousMonthForCarryOver] = useState<Date | null>(null);
    const [activeSummary, setActiveSummary] = useState<string | null>(null);
    
    const [isFabVisible, setIsFabVisible] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Simple Navigation State
    const [activeView, setActiveView] = useState<AppView>('dashboard');

    const handleNavigate = useCallback((view: AppView) => {
        setIsMobileMenuOpen(false);
        setActiveView(view);
        window.scrollTo(0, 0);
    }, []);

    const handleGoBack = useCallback(() => {
        setActiveView('dashboard');
    }, []);

    const handleAuthSuccess = useCallback((user: User, shouldSaveUser = true) => {
        try {
            if (shouldSaveUser) {
                let allUsers = JSON.parse(localStorage.getItem('users') || '{}');
                if (!allUsers || typeof allUsers !== 'object') allUsers = {};
                allUsers[user.email] = user;
                localStorage.setItem('users', JSON.stringify(allUsers));
            }

            let allUserData = JSON.parse(localStorage.getItem('userData') || '{}');
            if (!allUserData || typeof allUserData !== 'object') allUserData = {};
            
            const userData = allUserData[user.email] || { transactions: [], savingsGoals: [], budgets: [] };
            
            // SAFE LOADING: Ensure we always have arrays and numbers are numbers
            const loadedTransactions = Array.isArray(userData.transactions) ? userData.transactions : [];
            setTransactions(loadedTransactions.filter((t: any) => t).map((t: Transaction) => ({
                ...t,
                amount: Number(t.amount) || 0, // Strict cast to number
                remindersSent: t.remindersSent || { week: false, threeDays: false, today: false }
            })));

            setSavingsGoals(Array.isArray(userData.savingsGoals) ? userData.savingsGoals.filter((g: any) => g).map((g: any) => ({
                ...g,
                targetAmount: Number(g.targetAmount) || 0, // Strict cast to number
                currentAmount: Number(g.currentAmount) || 0 // Strict cast to number
            })) : []);

            setBudgets(Array.isArray(userData.budgets) ? userData.budgets.filter((b: any) => b).map((b: any) => ({
                ...b,
                amount: Number(b.amount) || 0 // Strict cast to number
            })) : []);
            
            let userCustomCategories = [];
            try {
                const storedCats = JSON.parse(localStorage.getItem(`customCategories_${user.email}`) || '[]');
                userCustomCategories = Array.isArray(storedCats) ? storedCats : [];
            } catch (e) { userCustomCategories = []; }
            setCustomCategories(userCustomCategories);

            let userCustomReminders = [];
            try {
                const storedReminders = JSON.parse(localStorage.getItem(`customReminders_${user.email}`) || '[]');
                userCustomReminders = Array.isArray(storedReminders) ? storedReminders : [];
            } catch (e) { userCustomReminders = []; }
            setCustomReminders(userCustomReminders);
            
            const savedLayout = user.dashboardLayout;
            if (savedLayout && Array.isArray(savedLayout.main) && Array.isArray(savedLayout.aside)) {
                setDashboardLayout(savedLayout);
            } else {
                setDashboardLayout(defaultDashboardLayout);
            }
            
            setCurrentUser(user);
            localStorage.setItem('loggedInUser', user.email);
        } catch (error: any) {
            console.error("Auth success handling failed", error);
            setTransactions([]);
            setSavingsGoals([]);
            setBudgets([]);
            setCustomCategories([]);
            setCustomReminders([]);
        }
    }, []);

    useEffect(() => {
        try {
            const loggedInUserEmail = localStorage.getItem('loggedInUser');
            let allUsers = JSON.parse(localStorage.getItem('users') || '{}');
            if (!allUsers || typeof allUsers !== 'object') allUsers = {};

            if (!allUsers[defaultUser.email]) {
                allUsers[defaultUser.email] = defaultUser;
                localStorage.setItem('users', JSON.stringify(allUsers));
            }

            if (loggedInUserEmail) {
                const user = allUsers[loggedInUserEmail];
                if (user) {
                    handleAuthSuccess(user, false);
                }
            }
        } catch (error: any) {
            console.error("Failed to load data from storage", error);
        } finally {
            setTimeout(() => setIsLoading(false), 1500); 
        }
    }, [handleAuthSuccess]);

    useEffect(() => {
        if (!currentUser) return;

        const today = new Date();
        const currentMonthKey = `${today.getFullYear()}-${today.getMonth()}`;
        const lastCarryOverKey = `lastAutoCarryOver_${currentUser.email}`;
        const lastCarryOverMonth = localStorage.getItem(lastCarryOverKey);

        if (lastCarryOverMonth === currentMonthKey) return;
        
        let performedAction = false;

        setBudgets(prevBudgets => {
            const needsReset = prevBudgets.some(b => b.notified80 || b.notified100);
            if (needsReset) {
                performedAction = true;
                return prevBudgets.map(b => ({ ...b, notified80: false, notified100: false }));
            }
            return prevBudgets;
        });

        setTransactions(prevTransactions => {
            const currentMonthTransactions = prevTransactions.filter(txn => {
                const tDate = new Date(txn.date);
                return tDate.getMonth() === today.getMonth() && tDate.getFullYear() === today.getFullYear();
            });

            if (currentMonthTransactions.length > 0) {
                return prevTransactions;
            }

            const prevMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            const prevMonthTransactions = prevTransactions.filter(txn => {
                const tDate = new Date(txn.date);
                return tDate.getMonth() === prevMonthDate.getMonth() && tDate.getFullYear() === prevMonthDate.getFullYear();
            });
            
            const transactionsToCarryOver = prevMonthTransactions.filter(txn => 
                txn.type === TransactionType.INCOME || (txn.type === TransactionType.EXPENSE && txn.isRecurring)
            );

            if (transactionsToCarryOver.length > 0) {
                performedAction = true;
                const newTransactionsForCurrentMonth = transactionsToCarryOver.map(txn => {
                    const originalDate = new Date(txn.date);
                    const newDate = new Date(today.getFullYear(), today.getMonth(), originalDate.getDate());
                    return {
                        ...txn,
                        id: `trans-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                        date: newDate.toISOString(),
                        isPlanned: txn.type === TransactionType.EXPENSE,
                    };
                });
                
                 if ('Notification' in window && Notification.permission === 'granted') {
                    const monthName = today.toLocaleString(language, { month: 'long' });
                    new Notification('Alice', {
                        body: t('notifications.budgetCarryOver', { month: monthName }),
                        icon: '/vite.svg'
                    });
                }
                return [...prevTransactions, ...newTransactionsForCurrentMonth];
            }
            
            return prevTransactions;
        });

        if(performedAction) {
            localStorage.setItem(lastCarryOverKey, currentMonthKey);
        }

    }, [currentUser, t, language]);
    
    useEffect(() => {
        if (currentUser) {
            try {
                let allUsers = JSON.parse(localStorage.getItem('users') || '{}');
                if (!allUsers || typeof allUsers !== 'object') allUsers = {};
                
                if (allUsers[currentUser.email]) {
                    allUsers[currentUser.email].dashboardLayout = dashboardLayout;
                    localStorage.setItem('users', JSON.stringify(allUsers));
                }

                let allUserData = JSON.parse(localStorage.getItem('userData') || '{}');
                if (!allUserData || typeof allUserData !== 'object') allUserData = {};

                allUserData[currentUser.email] = { transactions, savingsGoals, budgets };
                localStorage.setItem('userData', JSON.stringify(allUserData));
                localStorage.setItem(`customCategories_${currentUser.email}`, JSON.stringify(customCategories));
                localStorage.setItem(`customReminders_${currentUser.email}`, JSON.stringify(customReminders));
            } catch (error: any) {
                console.error("Failed to save data to storage", error);
            }
        }
    }, [transactions, savingsGoals, budgets, customCategories, customReminders, currentUser, dashboardLayout]);

    const handleUpdateBudget = useCallback((id: string, updatedData: Budget) => {
        setBudgets(prev => prev.map(b => b.id === id ? updatedData : b));
    }, []);

    useEffect(() => {
        if (!currentUser || budgets.length === 0 || !('Notification' in window) || Notification.permission !== 'granted') {
            return;
        }
        const today = new Date();
        // Safety check: ensure transactions is array
        const safeTransactions = Array.isArray(transactions) ? transactions : [];
        
        const spentByCategory = safeTransactions
            .filter(txn => {
                const tDate = new Date(txn.date);
                return txn.type === TransactionType.EXPENSE && !txn.isPlanned &&
                       tDate.getMonth() === today.getMonth() &&
                       tDate.getFullYear() === today.getFullYear();
            })
            .reduce((acc, txn) => {
                acc[txn.category] = (acc[txn.category] || 0) + txn.amount;
                return acc;
            }, {} as Record<string, number>);

        budgets.forEach(budget => {
            const spent = spentByCategory[budget.category] || 0;
            if (budget.amount > 0) {
                const percentage = (spent / budget.amount) * 100;

                if (percentage >= 100 && !budget.notified100) {
                    new Notification(t('notifications.budgetLimitReachedTitle'), {
                        body: t('notifications.budgetLimitReachedBody', {
                            spent: spent.toFixed(2),
                            budget: budget.amount.toFixed(2),
                            category: budget.category
                        }),
                        icon: '/vite.svg'
                    });
                    handleUpdateBudget(budget.id, { ...budget, notified100: true });
                } else if (percentage >= 80 && !budget.notified80) {
                     new Notification(t('notifications.budgetWarningTitle'), {
                        body: t('notifications.budgetWarningBody', {
                            spent: spent.toFixed(2),
                            budget: budget.amount.toFixed(2),
                            category: budget.category
                        }),
                        icon: '/vite.svg'
                    });
                    handleUpdateBudget(budget.id, { ...budget, notified80: true });
                }
            }
        });

    }, [transactions, budgets, currentUser, handleUpdateBudget, t]);
    
    const handleUpdateTransactionReminders = useCallback((id: string, remindersSent: Transaction['remindersSent']) => {
        setTransactions(prev => prev.map(txn => txn.id === id ? { ...txn, remindersSent } : txn));
    }, []);

    useEffect(() => {
        if (!currentUser || !('Notification' in window) || Notification.permission !== 'granted') return;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const checkAndSendReminder = (transaction: Transaction, daysBefore: number, flag: 'week' | 'threeDays' | 'today') => {
            if (!transaction.dueDate || (transaction.remindersSent && transaction.remindersSent[flag])) return;

            const dueDate = new Date(transaction.dueDate);
            dueDate.setHours(12, 0, 0, 0);
            
            const reminderDate = new Date(dueDate);
            reminderDate.setDate(dueDate.getDate() - daysBefore);
            reminderDate.setHours(0,0,0,0);

            if (today.getTime() === reminderDate.getTime()) {
                let reminderKey = '';
                if (daysBefore === 7) reminderKey = 'notifications.billReminderWeek';
                else if (daysBefore === 3) reminderKey = 'notifications.billReminder3Days';
                else reminderKey = 'notifications.billReminderToday';
                
                const amountFormatted = transaction.amount.toLocaleString(language, {style: 'currency', currency: 'EUR'});
                const body = `${t(reminderKey, { description: transaction.description })} ${t('notifications.billReminderAmount', { amount: amountFormatted })}`;

                new Notification(t('notifications.billReminderTitle'), {
                    body: body,
                    icon: '/vite.svg'
                });

                handleUpdateTransactionReminders(transaction.id, { ...transaction.remindersSent, [flag]: true });
            }
        };

        transactions.filter(txn => txn.isBillReminder).forEach(bill => {
            checkAndSendReminder(bill, 7, 'week');
            checkAndSendReminder(bill, 3, 'threeDays');
            checkAndSendReminder(bill, 0, 'today');
        });

    }, [transactions, currentUser, handleUpdateTransactionReminders, t, language]);

    useEffect(() => {
        if (!currentUser || customReminders.length === 0 || transactions.length === 0 || !('Notification' in window) || Notification.permission !== 'granted') return;

        const latestTransaction = transactions[0];
        if (!latestTransaction) return;
        
        const isRecent = (new Date().getTime() - new Date(latestTransaction.date).getTime()) < 5000;
        if (!isRecent || latestTransaction.isPlanned) return;

        customReminders.forEach(reminder => {
            let shouldNotify = false;
            let notificationBody = '';

            if (reminder.type === 'category' && reminder.category === latestTransaction.category) {
                shouldNotify = true;
                notificationBody = t('notifications.customAlertCategoryBody', {
                    category: reminder.category,
                    description: latestTransaction.description,
                    amount: latestTransaction.amount.toFixed(2)
                });
            } else if (reminder.type === 'amount' && latestTransaction.type === TransactionType.EXPENSE && reminder.threshold && latestTransaction.amount > reminder.threshold) {
                shouldNotify = true;
                notificationBody = t('notifications.customAlertAmountBody', {
                    description: latestTransaction.description,
                    amount: latestTransaction.amount.toFixed(2),
                    threshold: reminder.threshold.toFixed(2)
                });
            }

            if (shouldNotify) {
                new Notification(t('notifications.customAlertTitle', { name: reminder.name }), {
                    body: notificationBody,
                    icon: '/vite.svg'
                });
            }
        });

    }, [transactions, customReminders, currentUser, t]);

    const handleLogout = () => {
        setCurrentUser(null);
        setTransactions([]);
        setSavingsGoals([]);
        setBudgets([]);
        setCustomCategories([]);
        setCustomReminders([]);
        setDashboardLayout(defaultDashboardLayout);
        setIsFabVisible(false);
        setIsMobileMenuOpen(false);
        
        setActiveView('dashboard');

        localStorage.removeItem('loggedInUser');
    };
    
    useEffect(() => {
        if(activeView !== 'dashboard') {
            setShowCarryOverPrompt(false);
            return;
        };

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selectedMonthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
        
        // Safe filter
        const monthlyTransactions = (transactions || []).filter(txn => {
            if (!txn) return false;
            const tDate = new Date(txn.date);
            return tDate.getMonth() === selectedDate.getMonth() && tDate.getFullYear() === selectedDate.getFullYear();
        });

        if (monthlyTransactions.length === 0 && selectedMonthStart >= today) {
            const prevMonthDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1);
            const transactionsInPrevMonth = (transactions || []).filter(txn => {
                if (!txn) return false;
                const tDate = new Date(txn.date);
                return tDate.getMonth() === prevMonthDate.getMonth() && tDate.getFullYear() === prevMonthDate.getFullYear();
            });

            const carryOverableTransactions = transactionsInPrevMonth.filter(txn => txn.type === TransactionType.INCOME || (txn.type === TransactionType.EXPENSE && txn.isRecurring));

            if (carryOverableTransactions.length > 0) {
                setShowCarryOverPrompt(true);
                setPreviousMonthForCarryOver(prevMonthDate);
            } else {
                setShowCarryOverPrompt(false);
            }
        } else {
            setShowCarryOverPrompt(false);
        }
    }, [selectedDate, transactions, activeView]);

    const handleAddTransaction = (transaction: Omit<Transaction, 'id' | 'date'>) => {
        const newTransaction: Transaction = {
            ...transaction,
            id: `trans-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            date: new Date().toISOString(),
            isPlanned: transaction.isPlanned || false,
        };
        setTransactions(prev => [newTransaction, ...prev]);
    };
    
    const handleDeleteTransaction = (id: string) => {
        setTransactions(prev => prev.filter(t => t.id !== id));
    };

    const handleBulkDeleteTransactions = (ids: string[]) => {
        setTransactions(prev => prev.filter(t => !ids.includes(t.id)));
    };

    const handleUpdateTransaction = (id: string, updatedData: Omit<Transaction, 'id' | 'date'>) => {
        setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updatedData } : t));
    };

    const handleConfirmTransaction = (id: string) => {
        const transactionToConfirm = transactions.find(t => t.id === id);

        if (transactionToConfirm && transactionToConfirm.goalId) {
            setSavingsGoals(prevGoals => 
                prevGoals.map(goal => {
                    if (goal.id === transactionToConfirm.goalId) {
                        return { ...goal, currentAmount: goal.currentAmount + transactionToConfirm.amount };
                    }
                    return goal;
                })
            );
        }
        setTransactions(prev => prev.map(t => t.id === id ? { ...t, isPlanned: false } : t));
    };
    
    const handleAddSavingsGoal = (goal: Omit<SavingsGoal, 'id'|'currentAmount'>) => {
        const newGoal: SavingsGoal = { ...goal, id: `goal-${Date.now()}`, currentAmount: 0 }; 
        setSavingsGoals(prev => [...prev, newGoal]);

        const startDate = new Date();
        const endDate = new Date(goal.targetDate);
        let months = (endDate.getFullYear() - startDate.getFullYear()) * 12;
        months -= startDate.getMonth();
        months += endDate.getMonth();
        months = months <= 0 ? 1 : months + 1;

        const monthlyAmount = goal.targetAmount / months;

        if (monthlyAmount > 0) {
            const newTransaction: Transaction = {
                id: `trans-goal-${newGoal.id}`,
                date: new Date(selectedDate.getFullYear(), selectedDate.getMonth(), endDate.getDate() > 28 ? 28 : endDate.getDate()).toISOString(),
                description: `Épargne pour: ${goal.name}`,
                amount: parseFloat(monthlyAmount.toFixed(2)),
                type: TransactionType.EXPENSE,
                category: 'Épargne Objectif',
                isRecurring: true,
                isPlanned: true,
                goalId: newGoal.id,
            };
            setTransactions(prev => [newTransaction, ...prev]);
        }
    };
    
    const handleDeleteSavingsGoal = (id: string) => {
        setSavingsGoals(prev => prev.filter(g => g.id !== id));
        setTransactions(prev => prev.filter(t => t.goalId !== id));
    };

    const handleAddBudget = (budget: Omit<Budget, 'id'>) => {
        const newBudget: Budget = { ...budget, id: `budget-${Date.now()}` };
        setBudgets(prev => [...prev, newBudget]);
    };
    
    const handleDeleteBudget = (id: string) => {
        setBudgets(prev => prev.filter(b => b.id !== id));
    };

    const handleAddCategory = (name: string, type: TransactionType, icon?: string) => {
        const newCategory: CustomCategory = {
            id: `cat-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            name,
            type,
            icon,
        };
        setCustomCategories(prev => [...prev, newCategory]);
    };

    const handleUpdateCategory = (id: string, newName: string, newIcon?: string) => {
        setCustomCategories(prev => prev.map(c => (c.id === id ? { ...c, name: newName, icon: newIcon } : c)));
    };

    const handleDeleteCategory = (id: string) => {
        setCustomCategories(prev => prev.filter(c => c.id !== id));
    };

    const handleAddCustomReminder = (reminder: Omit<CustomReminder, 'id'>) => {
        const newReminder: CustomReminder = {
            ...reminder,
            id: `reminder-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        };
        setCustomReminders(prev => [...prev, newReminder]);
    };

    const handleDeleteCustomReminder = (id: string) => {
        setCustomReminders(prev => prev.filter(r => r.id !== id));
    };

    const handleUpdateUser = (user: User) => {
        setCurrentUser(user);
        const allUsers = JSON.parse(localStorage.getItem('users') || '{}');
        allUsers[user.email] = user;
        localStorage.setItem('users', JSON.stringify(allUsers));
    };
    
    const handleOnboardingComplete = () => {
        if (currentUser) {
            handleUpdateUser({ ...currentUser, hasCompletedOnboarding: true });
        }
    };

    const handleUpdateDashboardLayout = (newLayout: { main: DashboardWidget[], aside: DashboardWidget[] }) => {
        setDashboardLayout(newLayout);
    };
   
    const handlePrevMonth = () => setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    const handleNextMonth = () => setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));

     const handleCarryOver = () => {
        if (!previousMonthForCarryOver) return;
        const prevMonthTransactions = transactions.filter(txn => {
            const tDate = new Date(txn.date);
            return tDate.getMonth() === previousMonthForCarryOver.getMonth() && tDate.getFullYear() === previousMonthForCarryOver.getFullYear();
        });
        const transactionsToCarryOver = prevMonthTransactions.filter(txn => txn.type === TransactionType.INCOME || (txn.type === TransactionType.EXPENSE && txn.isRecurring));
        const newTransactions = transactionsToCarryOver.map(txn => {
            const originalDate = new Date(txn.date);
            const newDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), originalDate.getDate());
            return {
                ...txn,
                id: `trans-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                date: newDate.toISOString(),
                isPlanned: txn.type === TransactionType.EXPENSE,
            };
        });
        setTransactions(prev => [...prev, ...newTransactions]);
        setShowCarryOverPrompt(false);
        setPreviousMonthForCarryOver(null);
    };

    const combinedExpenseCategories = useMemo(() => getCombinedExpenseCategories(customCategories), [customCategories]);
    const combinedIncomeCategories = useMemo(() => getCombinedIncomeCategories(customCategories), [customCategories]);

    const { incomeTransactions, realExpenseTransactions, plannedExpenseTransactions, income, realExpenses, balance } = useMemo(() => {
        const safeTrans = Array.isArray(transactions) ? transactions : [];
        const monthly = safeTrans.filter(txn => {
            if (!txn) return false;
            const tDate = new Date(txn.date);
            return tDate.getMonth() === selectedDate.getMonth() && tDate.getFullYear() === selectedDate.getFullYear();
        });
        const incomeTrans = monthly.filter(txn => txn.type === TransactionType.INCOME && !txn.isPlanned);
        const realExpTrans = monthly.filter(txn => txn.type === TransactionType.EXPENSE && !txn.isPlanned);
        const plannedExpTrans = monthly.filter(txn => txn.type === TransactionType.EXPENSE && txn.isPlanned);
        const incomeTotal = incomeTrans.reduce((s, txn) => s + txn.amount, 0);
        const realExpTotal = realExpTrans.reduce((s, txn) => s + txn.amount, 0);
        return { incomeTransactions: incomeTrans, realExpenseTransactions: realExpTrans, plannedExpenseTransactions: plannedExpTrans, income: incomeTotal, realExpenses: realExpTotal, balance: incomeTotal - realExpTotal };
    }, [transactions, selectedDate]);
    
    const renderSummaryModal = () => {
        if (!activeSummary) return null;
        let titleKey = '';
        let transactionsToShow: Transaction[] = [];
        let balanceDetails: { income: number; realExpenses: number; balance: number } | undefined = undefined;
    
        switch (activeSummary) {
          case 'income':
            titleKey = 'summaryModal.incomeDetail';
            transactionsToShow = incomeTransactions;
            break;
          case 'plannedExpenses':
            titleKey = 'summaryModal.plannedExpenseDetail';
            transactionsToShow = plannedExpenseTransactions;
            break;
          case 'realExpenses':
            titleKey = 'summaryModal.realExpenseDetail';
            transactionsToShow = realExpenseTransactions;
            break;
          case 'balance':
            titleKey = 'summaryModal.balanceDetail';
            transactionsToShow = [...incomeTransactions, ...realExpenseTransactions].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            balanceDetails = { income, realExpenses, balance };
            break;
          default:
            return null;
        }
        return <SummaryModal title={t(titleKey)} transactions={transactionsToShow} balanceDetails={balanceDetails} onClose={() => setActiveSummary(null)} />;
    };

    const renderActiveView = () => {
        switch (activeView) {
            case 'transactions':
                return <TransactionsView transactions={transactions} onUpdateTransaction={handleUpdateTransaction} onDeleteTransaction={handleDeleteTransaction} onConfirmTransaction={handleConfirmTransaction} onBulkDelete={handleBulkDeleteTransactions} expenseCategories={combinedExpenseCategories} incomeCategories={combinedIncomeCategories} customCategories={customCategories} onGoBack={handleGoBack} />;
            case 'goals':
                return <SavingsGoalsView savingsGoals={savingsGoals} transactions={transactions} onAddGoal={handleAddSavingsGoal} onDeleteGoal={handleDeleteSavingsGoal} onGoBack={handleGoBack} />;
            case 'budgets':
                return <BudgetsView budgets={budgets} transactions={transactions} onAddBudget={handleAddBudget} onDeleteBudget={handleDeleteBudget} expenseCategories={combinedExpenseCategories} onGoBack={handleGoBack} />;
            case 'settings':
                return <SettingsView currentUser={currentUser} onUpdateUser={handleUpdateUser} customCategories={customCategories} onAddCategory={handleAddCategory} onUpdateCategory={handleUpdateCategory} onDeleteCategory={handleDeleteCategory} customReminders={customReminders} onAddCustomReminder={handleAddCustomReminder} onDeleteCustomReminder={handleDeleteCustomReminder} onLogout={handleLogout} onGoBack={handleGoBack} />;
            case 'dashboard':
            default:
                return <Dashboard currentUser={currentUser!} transactions={transactions} savingsGoals={savingsGoals} budgets={budgets} selectedDate={selectedDate} onAddTransaction={handleAddTransaction} onUpdateTransaction={handleUpdateTransaction} onDeleteTransaction={handleDeleteTransaction} onConfirmTransaction={handleConfirmTransaction} onAddSavingsGoal={handleAddSavingsGoal} onDeleteSavingsGoal={handleDeleteSavingsGoal} onAddCategory={handleAddCategory} onPrevMonth={handlePrevMonth} onNextMonth={handleNextMonth} onSetActiveSummary={setActiveSummary} expenseCategories={combinedExpenseCategories} incomeCategories={combinedIncomeCategories} customCategories={customCategories} layout={dashboardLayout} onUpdateLayout={handleUpdateDashboardLayout} />;
        }
    }

    useEffect(() => {
        if (currentUser) {
            const timer = setTimeout(() => setIsFabVisible(true), 500);
            return () => clearTimeout(timer);
        }
    }, [currentUser]);

    if (isLoading) return <SplashScreen />;
    if (!currentUser) return <main className="bg-slate-900 min-h-screen text-white flex items-center justify-center p-4"><Auth onAuthSuccess={handleAuthSuccess} /></main>;
    
    const nameToDisplay = currentUser.mode === 'individual' ? (currentUser.firstName || '') : (currentUser.familyName || '');
    const welcomeMessage = t(currentUser.mode === 'individual' ? 'welcome.individual' : 'welcome.family', { name: nameToDisplay });

    return (
        <div className="bg-slate-900 min-h-screen text-white font-sans">
             <header className="bg-slate-800/50 backdrop-blur-sm sticky top-0 z-20 lg:hidden">
                <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-400 to-green-500 text-transparent bg-clip-text truncate" title={welcomeMessage}>{welcomeMessage}</h1>
                    <button id="mobile-menu-button" onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-slate-300 hover:text-white transition-colors" aria-label={t('sidebar.menu')}><Bars3Icon className="w-6 h-6" /></button>
                </div>
            </header>
            
            <div className="flex">
                <Sidebar activeView={activeView} onNavigate={handleNavigate} welcomeMessage={welcomeMessage} isMobileOpen={isMobileMenuOpen} onMobileClose={() => setIsMobileMenuOpen(false)} onLogout={handleLogout} />
                <main className="flex-1 lg:ml-64 p-4 lg:p-6 pb-24">{renderActiveView()}</main>
            </div>

            {showCarryOverPrompt && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fadeIn" role="dialog" aria-modal="true" aria-labelledby="carryover-title">
                    <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-md p-6 border border-slate-700">
                        <h3 id="carryover-title" className="text-xl font-bold text-white mb-4">{t('carryOver.title')}</h3>
                        <p className="text-slate-300 mb-6">{t('carryOver.prompt', { month: previousMonthForCarryOver?.toLocaleString(language, { month: 'long' }) })}</p>
                        <p className="text-sm text-slate-400 mt-4">{t('carryOver.info')}</p>
                        <div className="flex justify-end gap-4 mt-6">
                            <button onClick={() => setShowCarryOverPrompt(false)} className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-lg transition-colors">{t('common.cancel')}</button>
                            <button onClick={handleCarryOver} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">{t('common.confirm')}</button>
                        </div>
                    </div>
                </div>
            )}

            {currentUser && (
                <div id="live-chat-fab" className={`fixed bottom-6 right-6 z-40 transition-all duration-500 ease-out transform ${isFabVisible ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}>
                    <button onClick={() => setIsLiveChatOpen(true)} className="bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-full px-5 py-3 shadow-lg flex items-center gap-3 transition-transform hover:scale-105 animate-pulse-slow" aria-label={t('liveChat.title')}><ChatIcon className="w-6 h-6"/><span className="font-bold text-lg">{t('liveChat.talkToAlice')}</span></button>
                </div>
            )}
            
            {currentUser && !currentUser.hasCompletedOnboarding && <OnboardingGuide onComplete={handleOnboardingComplete} activeView={activeView} onNavigate={handleNavigate} />}
            {isLiveChatOpen && <LiveChat onClose={() => setIsLiveChatOpen(false)} />}
            {renderSummaryModal()}
        </div>
    );
};

export default App;
