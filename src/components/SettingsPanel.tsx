import React from 'react';
import styles from './SettingsPanel.module.css';
import { Settings } from '../types';
import { Calendar, Wallet } from 'lucide-react';

interface Props {
  settings: Settings;
  onChange: (settings: Settings) => void;
}

export default function SettingsPanel({ settings, onChange }: Props) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onChange({
      ...settings,
      [name]: name === 'initialAmount' ? Number(value) : value,
    });
  };

  // 종료일은 어제로 고정
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const maxDate = yesterday.toISOString().split('T')[0];

  return (
    <div className={styles.container}>
      <div className={styles.formGroup}>
        <label className={styles.label}>
          <Wallet size={18} className={styles.icon} />
          투자 금액 (만원)
        </label>
        <div className={styles.inputWrapper}>
          <input
            type="number"
            name="initialAmount"
            value={settings.initialAmount}
            onChange={handleChange}
            min="1"
            className={styles.input}
          />
          <span className={styles.currency}>만원</span>
        </div>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>
          <Calendar size={18} className={styles.icon} />
          비교 시작일
        </label>
        <div className={styles.inputWrapper}>
          <input
            type="date"
            name="startDate"
            value={settings.startDate}
            max={maxDate}
            onChange={handleChange}
            className={styles.input}
          />
        </div>
      </div>

      <div className={styles.info}>
        <span>* 종료일: {maxDate} (어제)</span>
      </div>
    </div>
  );
}
