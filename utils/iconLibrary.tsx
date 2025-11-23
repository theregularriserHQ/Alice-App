import React from 'react';

import BuildingStorefrontIcon from '../components/icons/BuildingStorefrontIcon';
import HomeModernIcon from '../components/icons/HomeModernIcon';
import GiftIcon from '../components/icons/GiftIcon';
import ReceiptPercentIcon from '../components/icons/ReceiptPercentIcon';
import CurrencyEuroIcon from '../components/icons/CurrencyEuroIcon';
import GlobeAltIcon from '../components/icons/GlobeAltIcon';
import HeartIcon from '../components/icons/HeartIcon';
import CarIcon from '../components/icons/CarIcon';
import PuzzlePieceIcon from '../components/icons/PuzzlePieceIcon';
import ShoppingBagIcon from '../components/icons/ShoppingBagIcon';
import LifebuoyIcon from '../components/icons/LifebuoyIcon';
import ArrowTrendingUpIcon from '../components/icons/ArrowTrendingUpIcon';
import BriefcaseIcon from '../components/icons/BriefcaseIcon';
import ScaleIcon from '../components/icons/ScaleIcon';
import TrophyIcon from '../components/icons/TrophyIcon';
import UserIcon from '../components/icons/UserIcon';
import PlusIcon from '../components/icons/PlusIcon';


export const iconLibrary: { [key: string]: React.FC<React.SVGProps<SVGSVGElement>> } = {
  BuildingStorefrontIcon,
  HomeModernIcon,
  GiftIcon,
  ReceiptPercentIcon,
  CurrencyEuroIcon,
  GlobeAltIcon,
  HeartIcon,
  CarIcon,
  PuzzlePieceIcon,
  ShoppingBagIcon,
  LifebuoyIcon,
  ArrowTrendingUpIcon,
  BriefcaseIcon,
  ScaleIcon,
  TrophyIcon,
  UserIcon,
  PlusIcon,
};

export const iconNames = Object.keys(iconLibrary);
