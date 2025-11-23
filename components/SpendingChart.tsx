
import React, { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import type { Transaction } from '../types';
import { TransactionType } from '../types';
import { useI18n } from '../hooks/useI18n';

interface SpendingChartProps {
  transactions: Transaction[];
}

const COLORS = ['#059669', '#0891b2', '#6366f1', '#a855f7', '#d946ef', '#db2777', '#e11d48', '#f97316'];

const CustomTooltip = ({ active, payload, language, t }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-700 p-2 border border-slate-600 rounded-md shadow-lg">
        <p className="text-white font-semibold">{`${payload[0].name || payload[0].payload.name}`}</p>
        <p className="text-teal-400">{`${t('chart.tooltipAmount')} ${payload[0].value.toLocaleString(language, { style: 'currency', currency: 'EUR' })}`}</p>
      </div>
    );
  }
  return null;
};

const SpendingChart: React.FC<SpendingChartProps> = ({ transactions }) => {
  const { t, language } = useI18n();
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');

  const chartData = useMemo(() => {
    const expenseData = transactions
      .filter(txn => txn.type === TransactionType.EXPENSE && !txn.isPlanned)
      .reduce((acc, txn) => {
        // FIX: Coerce amount to a number and default to 0 to prevent NaN
        acc[txn.category] = (acc[txn.category] || 0) + (Number(txn.amount) || 0);
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(expenseData)
      .map(([name, value]) => ({ name, value: Number(value) }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  if (chartData.length === 0) {
    return (
      <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-bold text-white mb-4">{t('dashboard.spendingDistribution')}</h3>
        <div className="h-64 flex items-center justify-center">
          <p className="text-slate-400">{t('dashboard.noDataForChart')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 p-4 md:p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-white">{t('dashboard.spendingDistribution')}</h3>
        <div className="flex bg-slate-700 rounded-lg p-1">
          <button 
            onClick={() => setChartType('pie')}
            className={`px-3 py-1 text-sm rounded-md font-semibold transition-all ${chartType === 'pie' ? 'bg-teal-600 text-white' : 'text-slate-300 hover:bg-slate-600/50'}`}
          >
            {t('dashboard.chartTypePie')}
          </button>
          <button 
            onClick={() => setChartType('bar')}
            className={`px-3 py-1 text-sm rounded-md font-semibold transition-all ${chartType === 'bar' ? 'bg-teal-600 text-white' : 'text-slate-300 hover:bg-slate-600/50'}`}
          >
            {t('dashboard.chartTypeBar')}
          </button>
        </div>
      </div>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          {chartType === 'pie' ? (
            <PieChart>
              <Pie data={chartData} cx="50%" cy="50%" labelLine={false} outerRadius={80} innerRadius={60} fill="#8884d8" dataKey="value" nameKey="name" paddingAngle={5}>
                {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip content={<CustomTooltip language={language} t={t} />} />
              <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right" />
            </PieChart>
          ) : (
            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 30, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis type="number" stroke="#94a3b8" />
              <YAxis type="category" dataKey="name" stroke="#94a3b8" width={100} tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip language={language} t={t} />} />
              <Bar dataKey="value" name={t('common.amount')} barSize={20}>
                {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SpendingChart;
