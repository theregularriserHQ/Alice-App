export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  isRecurring?: boolean;
  isPlanned?: boolean;
  goalId?: string;
  isBillReminder?: boolean;
  dueDate?: string;
  remindersSent?: {
    week?: boolean;
    threeDays?: boolean;
    today?: boolean;
  };
}

export interface ExtractedTransactionData {
    description: string;
    amount: number;
    type: TransactionType;
    category: string;
}

export interface TransactionExtractionResult {
    success: boolean;
    data?: ExtractedTransactionData;
    clarificationNeeded?: string;
}


export interface ExtractedGoalData {
    name: string;
    targetAmount: number;
    targetDate: string; // YYYY-MM-DD
}

export interface SavingsGoal {
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    targetDate: string;
}

// FIX: Add Budget interface to resolve import errors.
export interface Budget {
    id: string;
    category: string;
    amount: number;
    notified80?: boolean;
    notified100?: boolean;
}

export interface CustomCategory {
  id: string;
  name: string;
  type: TransactionType;
  icon?: string;
}

export interface CustomReminder {
  id: string;
  name: string;
  type: 'amount' | 'category';
  threshold?: number; // for amount type
  category?: string; // for category type
}

export interface FamilyComposition {
    adults: number;
    teens: number;
    children: number;
}

export type AppMode = 'individual' | 'family';

export type AppView = 'dashboard' | 'transactions' | 'goals' | 'budgets' | 'settings';

export interface DashboardWidget {
  id: string;
  component: string;
  column: 'main' | 'aside';
  order: number;
  visible: boolean;
}

export interface User {
    email: string;
    mode: AppMode;
    firstName?: string;
    familyName?: string;
    familyComposition?: FamilyComposition;
    hasCompletedOnboarding?: boolean;
    dashboardLayout?: {
      main: DashboardWidget[];
      aside: DashboardWidget[];
    }
}