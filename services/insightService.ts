import { GoogleGenAI } from '@google/genai';
import type { Transaction, SavingsGoal, User, Budget } from '../types';

const getTransactionsForMonth = (transactions: Transaction[], date: Date) => {
    return transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate.getMonth() === date.getMonth() && tDate.getFullYear() === date.getFullYear();
    });
};

const getProactiveInsight = async (
  transactions: Transaction[],
  savingsGoals: SavingsGoal[],
  budgets: Budget[],
  user: User | null,
  currentDate: Date,
  lang: string = 'fr',
): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error('API_KEY_MISSING');
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const currentMonthTransactions = getTransactionsForMonth(transactions, currentDate);
  const prevMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
  const previousMonthTransactions = getTransactionsForMonth(transactions, prevMonthDate);
  const isFrench = lang === 'fr';

  let userName = isFrench ? "l'utilisateur" : "the user";
  if (user) {
    userName = user.mode === 'individual' 
        ? user.firstName ?? userName 
        : (isFrench ? `la famille ${user.familyName}` : `the ${user.familyName} family`) ?? userName;
  }

  const prompt = `
As Alice, an AI financial assistant for ${userName}, analyze the following financial data and provide a single, impactful, and concise observation in ${isFrench ? 'French' : 'English'} (25 words maximum).
The observation must be one of the following:
1. A comparison of an expense category this month versus last month.
2. A comment on the progress of a savings goal.
3. An alert or encouragement regarding a budget.
4. An observation about an unusual income or spending trend.

Be encouraging or slightly cautionary. Return only the observation sentence, without any headers or Markdown formatting.

**${isFrench ? 'Données du mois actuel' : 'Current Month Data'} (${currentDate.toLocaleString(lang, { month: 'long' })}):**
- ${isFrench ? 'Transactions' : 'Transactions'}: ${currentMonthTransactions.length}
- ${isFrench ? 'Dépenses totales' : 'Total Expenses'}: ${currentMonthTransactions.filter(t=>t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0).toFixed(2)}€
- ${isFrench ? 'Revenus totaux' : 'Total Income'}: ${currentMonthTransactions.filter(t=>t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0).toFixed(2)}€

**${isFrench ? 'Données du mois précédent' : 'Previous Month Data'}:**
- ${isFrench ? 'Transactions' : 'Transactions'}: ${previousMonthTransactions.length}
- ${isFrench ? 'Dépenses totales' : 'Total Expenses'}: ${previousMonthTransactions.filter(t=>t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0).toFixed(2)}€

**${isFrench ? "Objectifs d'épargne" : 'Savings Goals'}:**
${savingsGoals.map(g => `- ${g.name}: ${g.currentAmount.toFixed(2)}€ / ${g.targetAmount.toFixed(2)}€`).join('\n') || (isFrench ? 'Aucun' : 'None')}

**${isFrench ? 'Budgets' : 'Budgets'}:**
${budgets.map(b => `- ${b.category}: ${b.amount.toFixed(2)}€`).join('\n') || (isFrench ? 'Aucun' : 'None')}

${isFrench ? 'Observation concise' : 'Concise observation'}:`;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text.trim();
  } catch (error) {
    console.error('Error getting proactive insight:', error);
    throw new Error("AI_INSIGHT_ERROR");
  }
};

export default getProactiveInsight;