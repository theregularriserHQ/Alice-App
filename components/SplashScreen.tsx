
import React, { useState, useEffect } from 'react';
import { quotes } from '../utils/quotes';

const SplashScreen: React.FC = () => {
  const [quote, setQuote] = useState('');

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * quotes.length);
    setQuote(quotes[randomIndex]);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white animate-fadeIn">
      <div className="text-center p-8 max-w-2xl">
        <p className="text-2xl md:text-3xl italic text-slate-300">
          "{quote}"
        </p>
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 1.5s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;