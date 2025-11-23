

import React from 'react';
import type { AppView } from '../types';
import HomeIcon from './icons/HomeIcon';
import ArrowsRightLeftIcon from './icons/ArrowsRightLeftIcon';
import TrophyIcon from './icons/TrophyIcon';
import BanknotesIcon from './icons/BanknotesIcon';
import AdjustmentsHorizontalIcon from './icons/AdjustmentsHorizontalIcon';
import ArrowRightOnRectangleIcon from './icons/ArrowRightOnRectangleIcon';
import XMarkIcon from './icons/XMarkIcon';
import ShareIcon from './icons/ShareIcon';
import { useI18n } from '../hooks/useI18n';

interface SidebarProps {
  activeView: AppView;
  onNavigate: (view: AppView) => void;
  welcomeMessage: string;
  isMobileOpen: boolean;
  onMobileClose: () => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, onNavigate, welcomeMessage, isMobileOpen, onMobileClose, onLogout }) => {
    const { t } = useI18n();

    const navItems = [
      { view: 'dashboard', label: t('sidebar.dashboard'), icon: HomeIcon },
      { view: 'transactions', label: t('sidebar.transactions'), icon: ArrowsRightLeftIcon },
      { view: 'goals', label: t('sidebar.goals'), icon: TrophyIcon },
      { view: 'budgets', label: t('sidebar.budgets'), icon: BanknotesIcon },
      { view: 'settings', label: t('sidebar.settings'), icon: AdjustmentsHorizontalIcon },
    ];

    const handleNavigate = (view: AppView) => {
        onNavigate(view);
        onMobileClose();
    };

    const handleShareApp = async () => {
        const shareData = {
            title: t('sidebar.shareTitle'),
            text: t('sidebar.shareText'),
            url: 'https://alice-finance.app',
        };
        if (navigator.share) {
            try { await navigator.share(shareData); } catch (err) { console.error("Share error:", err); }
        } else {
            alert(t('sidebar.shareError'));
        }
    };

  const NavButton: React.FC<{item: typeof navItems[0], idPrefix: string}> = ({item, idPrefix}) => {
    const Icon = item.icon;
    const isActive = activeView === item.view;
    return (
        <button
        id={`${idPrefix}-${item.view}-link`}
        key={item.view}
        onClick={() => handleNavigate(item.view as AppView)}
        className={`flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-200 w-full transform ${
            isActive
            ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-lg'
            : 'text-slate-300 hover:bg-slate-700/50 hover:text-white hover:scale-[1.03] hover:translate-x-1'
        }`}
        >
          <Icon className="w-6 h-6 flex-shrink-0" />
          <span className="font-semibold">{item.label}</span>
        </button>
    );
  }

  const sidebarContent = (
    <>
      <div>
        <div className="mb-8 p-2">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-teal-400 to-green-500 text-transparent bg-clip-text truncate" title={welcomeMessage}>{welcomeMessage}</h2>
        </div>
        <nav id="sidebar-nav-container" className="flex flex-col gap-2">
            {navItems.map((item) => <NavButton key={item.view} item={item} idPrefix="sidebar" />)}
        </nav>
      </div>
      <div className="mt-auto">
          <button
              onClick={handleShareApp}
              className="flex w-full items-center gap-3 p-3 rounded-lg text-left transition-all transform hover:scale-[1.03] hover:translate-x-1 text-slate-300 hover:bg-slate-700/50 hover:text-white"
          >
              <ShareIcon className="w-6 h-6" />
              <span className="font-semibold">{t('sidebar.shareApp')}</span>
          </button>
          <button
              onClick={onLogout}
              className="flex w-full items-center gap-3 p-3 rounded-lg text-left transition-all transform hover:scale-[1.03] hover:translate-x-1 text-slate-400 hover:bg-slate-700/50 hover:text-red-400"
          >
              <ArrowRightOnRectangleIcon className="w-6 h-6" />
              <span className="font-semibold">{t('sidebar.logout')}</span>
          </button>
      </div>
    </>
  );

  return (
    <>
        {/* Desktop Sidebar */}
        <aside className="w-64 bg-slate-800 p-4 flex-col hidden lg:flex h-screen sticky top-0 border-r border-slate-700/50">
          {sidebarContent}
        </aside>

        {/* Mobile Sidebar (Overlay) */}
        <div className={`fixed inset-0 z-40 lg:hidden ${isMobileOpen ? 'block' : 'hidden'}`}>
            <div className="absolute inset-0 bg-black/60 transition-opacity" onClick={onMobileClose} aria-hidden="true"></div>
            <div className={`relative h-full w-64 bg-slate-800 p-4 flex flex-col transition-transform duration-300 ease-in-out border-r border-slate-700 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <button onClick={onMobileClose} className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white" aria-label={t('liveChat.close')}><XMarkIcon className="w-6 h-6" /></button>
                {sidebarContent}
            </div>
        </div>
    </>
  );
};

export default Sidebar;