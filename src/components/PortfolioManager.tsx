import React, { useState } from 'react';
import styles from './PortfolioManager.module.css';
import { Portfolio, Asset } from '../types';
import SearchBox from './SearchBox';
import { Plus, Trash2, Edit2, Check } from 'lucide-react';

interface Props {
  portfolios: Portfolio[];
  onChange: (portfolios: Portfolio[]) => void;
  onCompare: () => void;
}

export default function PortfolioManager({ portfolios, onChange, onCompare }: Props) {
  const [activeTab, setActiveTab] = useState<string>(portfolios[0]?.id || '');
  const [editingNameId, setEditingNameId] = useState<string | null>(null);

  const activePortfolio = portfolios.find(p => p.id === activeTab);

  const updateActivePortfolio = (updatedPf: Portfolio) => {
    onChange(portfolios.map(p => p.id === updatedPf.id ? updatedPf : p));
  };

  const addPortfolio = () => {
    const newId = Date.now().toString();
    const newPf: Portfolio = { id: newId, name: `Portfolio ${portfolios.length + 1}`, assets: [] };
    onChange([...portfolios, newPf]);
    setActiveTab(newId);
  };

  const deletePortfolio = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (portfolios.length === 1) return; // 알림: 최소 1개는 있어야 함 (선택적)
    const newPortfolios = portfolios.filter(p => p.id !== id);
    onChange(newPortfolios);
    if (activeTab === id) {
      setActiveTab(newPortfolios[0].id);
    }
  };

  const handleRename = (id: string, newName: string) => {
    onChange(portfolios.map(p => p.id === id ? { ...p, name: newName } : p));
  };

  const addAsset = (assetData: Omit<Asset, 'ratio'>) => {
    if (!activePortfolio) return;
    // Check if duplicate
    if (activePortfolio.assets.some(a => a.ticker === assetData.ticker)) return;
    
    // Default ratio assignment (if 2 items exist, next might get 0 or remaining)
    // Simply assign 0 by default, let user adjust
    updateActivePortfolio({
      ...activePortfolio,
      assets: [...activePortfolio.assets, { ...assetData, ratio: 0 }]
    });
  };

  const updateAssetRatio = (ticker: string, ratioStr: string) => {
    if (!activePortfolio) return;
    const ratio = Math.max(0, Math.min(100, Number(ratioStr)));
    updateActivePortfolio({
      ...activePortfolio,
      assets: activePortfolio.assets.map(a => a.ticker === ticker ? { ...a, ratio } : a)
    });
  };

  const removeAsset = (ticker: string) => {
    if (!activePortfolio) return;
    updateActivePortfolio({
      ...activePortfolio,
      assets: activePortfolio.assets.filter(a => a.ticker !== ticker)
    });
  };

  const totalRatio = activePortfolio?.assets.reduce((sum, a) => sum + a.ratio, 0) || 0;
  const isRatioValid = totalRatio === 100;
  // 전체 포트폴리오의 유효성 검사
  const isAllValid = portfolios.every(p => p.assets.length > 0 && p.assets.reduce((s, a) => s + a.ratio, 0) === 100);

  return (
    <div className={styles.container}>
      {/* Portfolio Tabs */}
      <div className={styles.tabsWrapper}>
        <div className={styles.tabs}>
          {portfolios.map(p => (
            <div
              key={p.id}
              className={`${styles.tab} ${activeTab === p.id ? styles.activeTab : ''}`}
              onClick={() => setActiveTab(p.id)}
            >
              {editingNameId === p.id ? (
                <input
                  type="text"
                  className={styles.renameInput}
                  value={p.name}
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => handleRename(p.id, e.target.value)}
                  onBlur={() => setEditingNameId(null)}
                  onKeyDown={(e) => e.key === 'Enter' && setEditingNameId(null)}
                />
              ) : (
                <span className={styles.tabName}>{p.name}</span>
              )}
              
              <div className={styles.tabActions}>
                <button 
                  className={styles.iconBtn} 
                  onClick={(e) => { e.stopPropagation(); setEditingNameId(p.id); }}
                  title="Rename"
                >
                  <Edit2 size={12} />
                </button>
                {portfolios.length > 1 && (
                  <button 
                    className={`${styles.iconBtn} ${styles.deleteBtn}`} 
                    onClick={(e) => deletePortfolio(p.id, e)}
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </div>
          ))}
          <button className={styles.addTabBtn} onClick={addPortfolio} title="Add Portfolio">
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Active Portfolio Content */}
      {activePortfolio && (
        <div className={styles.portfolioContent}>
          <div className={styles.searchSection}>
            <SearchBox onSelect={addAsset} />
          </div>

          <div className={styles.assetsList}>
            {activePortfolio.assets.length === 0 ? (
              <div className={styles.emptyState}>
                종목을 검색하여 추가해주세요.
              </div>
            ) : (
              activePortfolio.assets.map(asset => (
                <div key={asset.ticker} className={styles.assetItem}>
                  <div className={styles.assetInfo}>
                    <span className={styles.assetName}>{asset.name}</span>
                    <span className={styles.assetTicker}>{asset.ticker}</span>
                  </div>
                  <div className={styles.assetControls}>
                    <div className={styles.ratioWrapper}>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={asset.ratio || ''}
                        onChange={(e) => updateAssetRatio(asset.ticker, e.target.value)}
                        className={styles.ratioInput}
                        placeholder="0"
                      />
                      <span className={styles.percentSymbol}>%</span>
                    </div>
                    <button className={styles.removeAssetBtn} onClick={() => removeAsset(asset.ticker)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className={styles.summary}>
            <div className={`${styles.totalRatio} ${isRatioValid ? styles.valid : styles.invalid}`}>
              총합: {totalRatio}% 
              {!isRatioValid && <span className={styles.errorMsg}> (100%를 맞춰주세요)</span>}
              {isRatioValid && <Check size={16} className={styles.checkIcon} />}
            </div>
          </div>
        </div>
      )}

      {/* Action Button */}
      <div className={styles.actionSection}>
        <button 
          className={styles.compareBtn} 
          onClick={onCompare}
          disabled={!isAllValid}
        >
          {isAllValid ? '성과 비교 시작' : '포트폴리오 설정 확인 필요'}
        </button>
      </div>
    </div>
  );
}
