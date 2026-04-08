'use client';

import React, { useState } from 'react';
import styles from './Dashboard.module.css';
import { Portfolio, Settings, DailyValue } from '../types';
import SettingsPanel from './SettingsPanel';
import PortfolioManager from './PortfolioManager';
import PerformanceChart from './PerformanceChart';

export default function Dashboard() {
  const [settings, setSettings] = useState<Settings>({
    initialAmount: 1000,
    startDate: new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0]
  });
  
  const [portfolios, setPortfolios] = useState<Portfolio[]>([
    { id: '1', name: '포트폴리오 1', assets: [] }
  ]);

  const [chartData, setChartData] = useState<DailyValue[]>([]);
  const [isComparing, setIsComparing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleCompare = async () => {
    setIsComparing(true);
    setErrorMsg('');
    setChartData([]);
    
    // 종료일은 어제
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const endDate = yesterday.toISOString().split('T')[0];

    try {
      const res = await fetch('/api/historical', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: settings.startDate,
          endDate,
          initialAmount: settings.initialAmount,
          portfolios
        })
      });

      if (!res.ok) {
        throw new Error('API request failed');
      }

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setChartData(data.result || []);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || '데이터를 가져오는 중 오류가 발생했습니다.');
    } finally {
      setIsComparing(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className="gradient-text">Portfolio Compare</h1>
        <p className={styles.subtitle}>한국 주식 & ETF 포트폴리오 성과를 비교해보세요</p>
      </header>

      <main className={styles.main}>
        <aside className={styles.sidebar}>
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h2 className={styles.panelTitle}>투자 설정</h2>
            <SettingsPanel settings={settings} onChange={setSettings} />
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h2 className={styles.panelTitle}>포트폴리오 구성</h2>
            <PortfolioManager 
              portfolios={portfolios} 
              onChange={setPortfolios} 
              onCompare={handleCompare}
            />
            {errorMsg && (
              <div style={{ color: 'var(--danger)', marginTop: '1rem', fontSize: '0.9rem', textAlign: 'center' }}>
                {errorMsg}
              </div>
            )}
          </div>
        </aside>

        <section className={styles.content}>
          <div className="glass-panel" style={{ flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
            <h2 className={styles.panelTitle}>성과 비교 차트</h2>
            <div style={{ flex: 1, position: 'relative' }}>
              <PerformanceChart 
                data={chartData} 
                portfolios={portfolios} 
                isLoading={isComparing} 
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
