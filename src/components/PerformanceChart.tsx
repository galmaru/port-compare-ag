import React from 'react';
import { DailyValue, Portfolio } from '../types';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

interface Props {
  data: DailyValue[];
  portfolios: Portfolio[];
  isLoading: boolean;
}

const COLORS = [
  '#6366f1', // Indigo
  '#ec4899', // Pink
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0
  }).format(value);
};

export default function PerformanceChart({ data, portfolios, isLoading }: Props) {
  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
        <div className="spinner"></div>
        <span style={{ marginLeft: '1rem' }}>데이터를 불러오고 계산중입니다...</span>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
        설정을 마치고 '성과 비교 시작' 버튼을 눌러주세요.
      </div>
    );
  }

  // Find min and max for YAxis to scale better
  let minVal = Infinity;
  let maxVal = -Infinity;
  data.forEach(d => {
    portfolios.forEach(p => {
      const val = d[p.id] as number;
      if (val !== undefined) {
        if (val < minVal) minVal = val;
        if (val > maxVal) maxVal = val;
      }
    });
  });
  
  // Custom Y Axis domain with padding
  const yDomain = [
    Math.max(0, minVal * 0.95), // Don't go below 0 usually unless shorting (we don't)
    maxVal * 1.05
  ];

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '400px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 20, right: 30, left: 30, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-glass)" vertical={false} />
          <XAxis 
            dataKey="date" 
            stroke="var(--text-muted)" 
            tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
            tickMargin={10}
            minTickGap={30}
          />
          <YAxis 
            domain={yDomain}
            tickFormatter={(val) => `${(val / 10000).toLocaleString('ko-KR')}만`}
            stroke="var(--text-muted)"
            tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
            width={80}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'var(--bg-glass)', 
              borderColor: 'var(--border-glass)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              backdropFilter: 'blur(12px)'
            }}
            formatter={(value: any, name: any) => {
              const pfName = portfolios.find(p => p.id === name)?.name || name;
              return [formatCurrency(value as number), pfName];
            }}
            labelStyle={{ color: 'var(--accent-primary)', marginBottom: '0.5rem', fontWeight: 'bold' }}
          />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          
          {portfolios.map((p, idx) => (
            <Line
              key={p.id}
              type="monotone"
              dataKey={p.id}
              name={p.id} // we format name in tooltip but legend needs the matching string if we don't map it.
              stroke={COLORS[idx % COLORS.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6, strokeWidth: 0, fill: COLORS[idx % COLORS.length] }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      
      <style>{`
        .spinner {
          width: 30px;
          height: 30px;
          border: 3px solid var(--border-glass);
          border-top-color: var(--accent-primary);
          border-radius: 50%;
          animation: spinner 1s linear infinite;
        }
        @keyframes spinner {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
