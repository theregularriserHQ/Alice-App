

import React from 'react';
import type { CustomCategory } from '../types';
import { iconLibrary } from './iconLibrary';
import QuestionMarkCircleIcon from '../components/icons/QuestionMarkCircleIcon';

const categoryIconMap: { [key: string]: string } = {
  // Expense
  'loyer': 'HomeModernIcon',
  'courses': 'BuildingStorefrontIcon',
  'assurances': 'LifebuoyIcon',
  'facture': 'ReceiptPercentIcon',
  'transport': 'GlobeAltIcon',
  'voiture': 'CarIcon',
  'loisirs': 'PuzzlePieceIcon',
  'sports': 'TrophyIcon',
  'santé': 'HeartIcon',
  'abonnements': 'ReceiptPercentIcon',
  'vêtements': 'ShoppingBagIcon',
  'cadeaux': 'GiftIcon',
  'épargne': 'ArrowTrendingUpIcon',
  'dîmes': 'HeartIcon',
  'dons': 'HeartIcon',
  'amendes': 'ScaleIcon',
  // Income
  'salaire': 'CurrencyEuroIcon',
  'allocations': 'CurrencyEuroIcon',
  'revenus': 'BriefcaseIcon',
  'intérêts': 'ArrowTrendingUpIcon',
  'freelance': 'BriefcaseIcon',
};

const getCategoryIcon = (
    category: string,
    customCategories: CustomCategory[] = []
): React.FC<React.SVGProps<SVGSVGElement>> => {
  // Guard against undefined/null/non-string category to prevent crash
  if (!category || typeof category !== 'string') return QuestionMarkCircleIcon;

  // 1. Check for a direct match in custom categories
  const customCategory = customCategories.find(c => c.name === category);
  if (customCategory && customCategory.icon && iconLibrary[customCategory.icon]) {
    return iconLibrary[customCategory.icon];
  }

  // 2. Fallback to keyword matching for default categories
  const normalizedCategory = category.toLowerCase();
  const keyword = Object.keys(categoryIconMap).find(k => normalizedCategory.includes(k));
  if (keyword && iconLibrary[categoryIconMap[keyword]]) {
      return iconLibrary[categoryIconMap[keyword]];
  }
  
  // 3. Return a default icon if no match is found
  return QuestionMarkCircleIcon;
};

export default getCategoryIcon;