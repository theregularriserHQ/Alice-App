

import React, { useState } from 'react';
import type { User, AppMode, FamilyComposition } from '../types';
import { useI18n } from '../hooks/useI18n';

interface AuthProps {
    onAuthSuccess: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
    const { t } = useI18n();
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    // Sign-up specific state
    const [firstName, setFirstName] = useState('');
    const [familyName, setFamilyName] = useState('');
    const [mode, setMode] = useState<AppMode | ''>('');
    const [familyComposition, setFamilyComposition] = useState<FamilyComposition>({ adults: 1, teens: 0, children: 0 });

    const handleFamilyCompChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFamilyComposition({
            ...familyComposition,
            [e.target.name]: parseInt(e.target.value, 10) || 0
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const allUsers = JSON.parse(localStorage.getItem('users') || '{}');

            if (isLoginMode) {
                const user = allUsers[email];
                if (user) {
                    onAuthSuccess(user);
                } else {
                    setError(t('auth.errorNoUser'));
                }
            } else { // Sign-up mode
                if (allUsers[email]) {
                    setError(t('auth.errorEmailExists'));
                    return;
                }
                if (!mode) {
                    setError(t('auth.errorChooseMode'));
                    return;
                }
                const newUser: User = {
                    email,
                    mode,
                    ...(mode === 'family' && { familyComposition, familyName }),
                    ...(mode === 'individual' && { firstName }),
                    hasCompletedOnboarding: false,
                };
                onAuthSuccess(newUser);
            }
        } catch (err) {
            setError(t('auth.errorGeneric'));
        }
    };

    const handleTestLogin = () => {
        try {
            const allUsers = JSON.parse(localStorage.getItem('users') || '{}');
            const testUser = allUsers['test.family@alice.com'];
            if (testUser) {
                onAuthSuccess(testUser);
            } else {
                setError(t('auth.errorTestAccountNotFound'));
            }
        } catch (e) {
            setError(t('auth.errorTestAccountLogin'));
        }
    };

    return (
        <div className="bg-slate-800 p-8 rounded-lg shadow-lg w-full max-w-md animate-fadeIn">
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-green-400 mb-1">{t('auth.title')}</h1>
                <p className="text-slate-300">{t('auth.subtitle')}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="email-auth" className="sr-only">{t('auth.emailPlaceholder')}</label>
                    <input
                        id="email-auth"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t('auth.emailPlaceholder')}
                        className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="password-auth" className="sr-only">{t('auth.passwordPlaceholder')}</label>
                    <input
                        id="password-auth"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={t('auth.passwordPlaceholder')}
                        className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                    />
                </div>

                {!isLoginMode && (
                    <div className="space-y-4 pt-2">
                        <div>
                            <label htmlFor="mode" className="block text-sm font-medium text-slate-300">{t('auth.managementMode')}</label>
                            <select
                                id="mode"
                                value={mode}
                                onChange={(e) => setMode(e.target.value as AppMode)}
                                className="mt-1 w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                                required
                            >
                                <option value="" disabled>{t('common.choose')}</option>
                                <option value="individual">{t('auth.personal')}</option>
                                <option value="family">{t('common.family')}</option>
                            </select>
                        </div>

                        {mode === 'individual' && (
                             <div className="animate-fadeIn">
                                <label htmlFor="firstName" className="block text-sm font-medium text-slate-300">{t('auth.firstName')}</label>
                                <input type="text" id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="mt-1 w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500" required />
                             </div>
                        )}

                        {mode === 'family' && (
                            <div className="space-y-4 animate-fadeIn">
                                <div>
                                    <label htmlFor="familyName" className="block text-sm font-medium text-slate-300">{t('auth.familyName')}</label>
                                    <input type="text" id="familyName" value={familyName} onChange={(e) => setFamilyName(e.target.value)} className="mt-1 w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500" required />
                                </div>
                                <fieldset className="bg-slate-700/50 p-3 rounded-md">
                                    <legend className="text-sm font-medium text-slate-300 mb-2">{t('auth.familyComposition')}</legend>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div>
                                            <label htmlFor="adults" className="block text-xs text-slate-400">{t('auth.adults')}</label>
                                            <input type="number" id="adults" name="adults" value={familyComposition.adults} onChange={handleFamilyCompChange} min="1" className="w-full bg-slate-600 border-slate-500 rounded-md py-1 px-2 text-white text-center"/>
                                        </div>
                                        <div>
                                            <label htmlFor="teens" className="block text-xs text-slate-400">{t('auth.teens')}</label>
                                            <input type="number" id="teens" name="teens" value={familyComposition.teens} onChange={handleFamilyCompChange} min="0" className="w-full bg-slate-600 border-slate-500 rounded-md py-1 px-2 text-white text-center"/>
                                        </div>
                                        <div>
                                            <label htmlFor="children" className="block text-xs text-slate-400">{t('auth.children')}</label>
                                            <input type="number" id="children" name="children" value={familyComposition.children} onChange={handleFamilyCompChange} min="0" className="w-full bg-slate-600 border-slate-500 rounded-md py-1 px-2 text-white text-center"/>
                                        </div>
                                    </div>
                                </fieldset>
                            </div>
                        )}
                    </div>
                )}

                {error && <p className="text-red-400 text-sm text-center">{error}</p>}

                <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-4 rounded-lg transition-colors">
                    {isLoginMode ? t('auth.login') : t('auth.signup')}
                </button>
            </form>

            <div className="relative flex py-4 items-center">
                <div className="flex-grow border-t border-slate-700"></div>
                <span className="flex-shrink mx-4 text-xs text-slate-400 uppercase">Ou</span>
                <div className="flex-grow border-t border-slate-700"></div>
            </div>

            <button 
                type="button" 
                onClick={handleTestLogin}
                className="w-full bg-slate-600 hover:bg-slate-500 text-white font-bold py-2.5 px-4 rounded-lg transition-colors"
            >
                {t('auth.quickAccess')}
            </button>

            <p className="text-center text-sm text-slate-400 mt-6">
                {isLoginMode ? t('auth.noAccount') : t('auth.hasAccount')}
                <button onClick={() => setIsLoginMode(!isLoginMode)} className="font-semibold text-green-400 hover:text-green-300 ml-1">
                    {isLoginMode ? t('auth.register') : t('auth.login')}
                </button>
            </p>
            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fadeIn { animation: fadeIn 0.3s ease-in-out; }
            `}</style>
        </div>
    );
};

export default Auth;