import type { CustomCategory } from '../types';
import { TransactionType } from '../types';

export const defaultExpenseCategories = [
  "Loyer", "Courses", "Assurances", "Facture - Électricité", "Facture - Eau", "Facture - Internet/Téléphone", "Transport", "Voitures", "Loisirs", "Sports", "Santé", "Abonnements", "Vêtements", "Argent de poche", "Amendes", "Aide urgent", "Aide prévu", "Dîmes", "Dons", "Épargne Objectif"
];

export const defaultIncomeCategories = [
  "Salaire", "Allocations", "Revenus annexes", "Intérêts", "Freelance", "Dons reçus"
];

const OTHER_CATEGORY = "Autres";

const combineAndSort = (defaultCats: string[], customCats: CustomCategory[]): string[] => {
    // Filter out any entries where name is missing or not a string
    // Safety check: ensure customCats is an array
    const safeCustomCats = Array.isArray(customCats) ? customCats : [];
    
    const customNames = safeCustomCats
        .map(c => c.name)
        .filter(name => name && typeof name === 'string');
        
    const combined = [...new Set([...defaultCats, ...customNames])];
    const sorted = combined.sort((a, b) => a.localeCompare(b));
    return [...sorted, OTHER_CATEGORY];
};

export const getCombinedExpenseCategories = (customCategories: CustomCategory[]): string[] => {
    const cats = Array.isArray(customCategories) ? customCategories : [];
    const expense = cats.filter(c => c.type === TransactionType.EXPENSE);
    return combineAndSort(defaultExpenseCategories, expense);
};

export const getCombinedIncomeCategories = (customCategories: CustomCategory[]): string[] => {
    const cats = Array.isArray(customCategories) ? customCategories : [];
    const income = cats.filter(c => c.type === TransactionType.INCOME);
    return combineAndSort(defaultIncomeCategories, income);
};