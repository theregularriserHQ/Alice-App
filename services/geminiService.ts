import { GoogleGenAI } from '@google/genai';
import type { Transaction, SavingsGoal, User } from '../types';

const getFinancialAdvice = async (
  transactions: Transaction[],
  monthlyLimit: number | null,
  savingsGoals: SavingsGoal[],
  user: User | null,
  lang: string = 'fr',
): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API key is not configured.");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const isFrench = lang === 'fr';

  let personalizationPrompt = '';
  if (user) {
    if (user.mode === 'family' && user.familyName) {
      personalizationPrompt = isFrench ? `Analyse pour la famille ${user.familyName}.` : `Analysis for the ${user.familyName} family.`;
    } else if (user.mode === 'individual' && user.firstName) {
      personalizationPrompt = isFrench ? `Analyse pour ${user.firstName}.` : `Analysis for ${user.firstName}.`;
    }
  }

  let familyPrompt = '';
  if (user?.mode === 'family' && user.familyComposition) {
    familyPrompt = `
**${isFrench ? 'Composition du Foyer' : 'Household Composition'}:**
- ${isFrench ? 'Adultes' : 'Adults'}: ${user.familyComposition.adults}
- ${isFrench ? 'Adolescents' : 'Teens'}: ${user.familyComposition.teens}
- ${isFrench ? 'Enfants' : 'Children'}: ${user.familyComposition.children}
`;
  }
  
  const budgetPrompt = monthlyLimit
      ? `**${isFrench ? 'Limite de Dépenses Mensuelle' : 'Monthly Spending Limit'}:** ${monthlyLimit.toFixed(2)}€`
      : `**${isFrench ? 'Limite de Dépenses Mensuelle' : 'Monthly Spending Limit'}:** ${isFrench ? 'Aucune limite définie' : 'No limit set'}.`;


  const prompt = `As Alice, your personal financial assistant, analyze the following data. Provide short, relevant, and personalized advice in ${isFrench ? 'French' : 'English'}.
${personalizationPrompt}
${familyPrompt}

**${isFrench ? 'Données financières' : 'Financial Data'}:**
- **${isFrench ? 'Transactions Récentes' : 'Recent Transactions'}:**
${
  transactions.length > 0
    ? transactions
        .slice(-10)
        .map(
          (t) =>
            `  - ${t.description}: ${t.amount.toFixed(2)}€ (${
              t.type === 'EXPENSE' ? (isFrench ? 'Dépense' : 'Expense') : (isFrench ? 'Revenu' : 'Income')
            }, ${t.category})`,
        )
        .join('\n')
    : `  ${isFrench ? 'Aucune transaction récente' : 'No recent transactions'}.`
}
- ${budgetPrompt}
- **${isFrench ? "Objectifs d'Épargne" : 'Savings Goals'}:**
${
  savingsGoals.length > 0
    ? savingsGoals
        .map((g) => `  - ${g.name}: ${g.currentAmount.toFixed(2)}€ / ${g.targetAmount.toFixed(2)}€ (${isFrench ? 'Échéance' : 'Due'}: ${new Date(g.targetDate).toLocaleDateString(lang)})`)
        .join('\n')
    : `  ${isFrench ? "Aucun objectif d'épargne défini" : 'No savings goals set'}.`
}

**${isFrench ? 'Vos conseils' : 'Your Advice'}:**
1.  **${isFrench ? 'Analyse rapide (1-2 phrases)' : 'Quick Analysis (1-2 sentences)'}:** ${isFrench ? 'Résumez la situation financière de manière simple et encourageante.' : 'Summarize the financial situation in a simple and encouraging way.'}
2.  **${isFrench ? "Conseils d'Alice (2 conseils maximum)" : "Alice's Tips (2 tips max)"}:** ${isFrench ? "Donnez deux conseils très courts, percutants et faciles à mettre en œuvre. Si des informations sur la famille sont disponibles, adaptez au moins un conseil à leur situation spécifique (par exemple, des astuces pour les dépenses liées aux enfants/ados, ou des plans d'épargne familiaux)." : "Give two very short, impactful, and easy-to-implement tips. If family information is available, tailor at least one tip to their specific situation (e.g., tips for child/teen-related expenses, or family savings plans)."}

${isFrench ? 'Adoptez un ton amical et positif. La réponse doit être formatée en Markdown.' : 'Adopt a friendly and positive tone. The response must be formatted in Markdown.'}`;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error('Error getting financial advice:', error);
    if (error instanceof Error && (error.message.includes('500') || error.message.includes('Rpc failed'))) {
        throw new Error("AI_SERVICE_ERROR");
    }
    throw new Error("AI_GENERATION_ERROR");
  }
};

export default getFinancialAdvice;