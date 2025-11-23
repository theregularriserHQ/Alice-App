import React, { useState, useLayoutEffect, useRef, useCallback } from 'react';
import type { AppView } from '../types';
import SparklesIcon from './icons/SparklesIcon';
import { useI18n } from '../hooks/useI18n';

interface OnboardingGuideProps {
  onComplete: () => void;
  activeView: AppView;
  onNavigate: (view: AppView) => void;
}

interface Step {
  titleKey: string;
  contentKey: string;
  elementId?: string;
  view: AppView;
  navigateTo?: AppView;
}

const steps: Step[] = [
  {
    titleKey: "onboarding.welcome.title",
    contentKey: "onboarding.welcome.content",
    view: 'dashboard',
  },
  {
    titleKey: "onboarding.addTransaction.title",
    contentKey: "onboarding.addTransaction.content",
    elementId: 'add-transaction',
    view: 'dashboard',
  },
  {
    titleKey: "onboarding.aiInsights.title",
    contentKey: "onboarding.aiInsights.content",
    elementId: 'proactive-insight',
    view: 'dashboard',
  },
  {
    titleKey: "onboarding.aiAdvisor.title",
    contentKey: "onboarding.aiAdvisor.content",
    elementId: 'ai-advisor',
    view: 'dashboard',
  },
  {
    titleKey: "onboarding.customize.title",
    contentKey: "onboarding.customize.content",
    elementId: 'dashboard-customize-button',
    view: 'dashboard',
  },
  {
    titleKey: "onboarding.talkToAlice.title",
    contentKey: "onboarding.talkToAlice.content",
    elementId: 'live-chat-fab',
    view: 'dashboard',
  },
];

const OnboardingGuide: React.FC<OnboardingGuideProps> = ({ onComplete, activeView, onNavigate }) => {
  const { t } = useI18n();
  const [currentStep, setCurrentStep] = useState(0);
  const [isFinishing, setIsFinishing] = useState(false);
  const [elementRect, setElementRect] = useState<DOMRect | null>(null);
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({
      opacity: 0,
      position: 'absolute',
      top: '-9999px',
      left: '-9999px',
      transition: 'opacity 0.3s, top 0.3s, left 0.3s',
  });
  const popoverRef = useRef<HTMLDivElement>(null);
  const step = steps[currentStep];

  const getTargetElementId = useCallback((step: Step): string | undefined => {
      if (step.elementId === 'main-nav') {
          return window.innerWidth < 1024 ? 'mobile-menu-button' : 'sidebar-nav-container';
      }
      return step.elementId;
  }, []);

  const calculatePosition = useCallback(() => {
    if (isFinishing || !step || step.view !== activeView) {
      setElementRect(null);
      setPopoverStyle(prev => ({ ...prev, opacity: 0, top: '-9999px' }));
      return;
    }

    const POPOVER_MARGIN = 16;
    const popoverElem = popoverRef.current;
    if (!popoverElem) return;

    const elementId = getTargetElementId(step);
    const targetElement = elementId ? document.getElementById(elementId) : null;

    if (targetElement) {
      const rect = targetElement.getBoundingClientRect();
      setElementRect(rect);
      const { offsetHeight: popoverHeight, offsetWidth: popoverWidth } = popoverElem;
      let top = rect.bottom + POPOVER_MARGIN;
      if (top + popoverHeight > window.innerHeight) top = rect.top - popoverHeight - POPOVER_MARGIN;
      let left = rect.left + rect.width / 2 - popoverWidth / 2;
      left = Math.max(POPOVER_MARGIN, Math.min(left, window.innerWidth - popoverWidth - POPOVER_MARGIN));
      setPopoverStyle({ ...popoverStyle, opacity: 1, top: `${top}px`, left: `${left}px`, transform: 'none' });
    } else {
      setElementRect(null);
      setPopoverStyle({ ...popoverStyle, opacity: 1, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' });
    }
  }, [activeView, step, isFinishing, getTargetElementId]);

  useLayoutEffect(() => {
    const timer = setTimeout(calculatePosition, 100);
    window.addEventListener('resize', calculatePosition);
    return () => { clearTimeout(timer); window.removeEventListener('resize', calculatePosition); };
  }, [calculatePosition]);
  
  const handleNext = () => {
    if (step.navigateTo) onNavigate(step.navigateTo);
    if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1);
    else { setIsFinishing(true); setElementRect(null); }
  };
  
  const handlePrev = () => {
      if (currentStep > 0) {
          const prevStep = steps[currentStep - 1];
          if(prevStep.view !== activeView) onNavigate(prevStep.view);
          setCurrentStep(currentStep - 1);
      }
  };

  if (isFinishing) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 animate-fadeIn">
            <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-8 w-full max-w-md text-center">
                <SparklesIcon className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <h3 className="font-bold text-2xl text-white mb-2">{t('onboarding.finish.title')}</h3>
                <p className="text-slate-300 mb-6">{t('onboarding.finish.content')}</p>
                <button onClick={onComplete} className="w-full text-lg font-semibold bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-md transition-transform hover:scale-105">
                    {t('onboarding.finish.button')}
                </button>
            </div>
        </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
        <div className="fixed inset-0 transition-all duration-300" style={{ boxShadow: elementRect ? `0 0 0 9999px rgba(0, 0, 0, 0.7)` : 'none', backgroundColor: !elementRect ? 'rgba(0, 0, 0, 0.7)' : 'transparent', pointerEvents: 'none' }}>
            {elementRect && <div className="absolute rounded-lg border-2 border-dashed border-white transition-all duration-300" style={{ top: elementRect.top - 4, left: elementRect.left - 4, width: elementRect.width + 8, height: elementRect.height + 8 }} />}
        </div>
        <div ref={popoverRef} className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-5 w-80" style={popoverStyle}>
            <div>
                <h3 id="onboarding-title" className="font-bold text-lg text-white mb-1">{t(step.titleKey)}</h3>
                <p className="text-sm text-slate-300" dangerouslySetInnerHTML={{ __html: t(step.contentKey) }}></p>
            </div>
            <div className="flex items-center justify-between mt-5">
                <span className="text-sm text-slate-400">{t('common.page')} {currentStep + 1} {t('common.of')} {steps.length}</span>
                <div className="flex items-center gap-2">
                    {currentStep > 0 && <button onClick={handlePrev} className="text-sm font-semibold text-slate-300 hover:text-white px-3 py-1.5 rounded-md hover:bg-slate-700">{t('common.previous')}</button>}
                    <button onClick={handleNext} className="text-sm font-semibold bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-md">{currentStep === steps.length - 1 ? t('common.submit') : t('common.next')}</button>
                </div>
            </div>
        </div>
    </div>
  );
};

export default OnboardingGuide;