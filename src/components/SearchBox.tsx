import React, { useState, useEffect, useRef } from 'react';
import styles from './SearchBox.module.css';
import { Search, Loader2 } from 'lucide-react';
import { Asset } from '../types';

interface SearchResult {
  ticker: string;
  name: string;
  exchange: string;
  type: string;
}

interface Props {
  onSelect: (asset: Omit<Asset, 'ratio'>) => void;
}

export default function SearchBox({ onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results || []);
        setIsOpen(true);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (item: SearchResult) => {
    onSelect({ ticker: item.ticker, name: item.name });
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div className={styles.container} ref={containerRef}>
      <div className={styles.inputWrapper}>
        <Search size={18} className={styles.searchIcon} />
        <input
          type="text"
          className={styles.input}
          placeholder="종목명 또는 심볼(티커) 검색..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
        />
        {isLoading && <Loader2 size={18} className={styles.spinner} />}
      </div>

      {isOpen && results.length > 0 && (
        <ul className={styles.dropdown}>
          {results.map((item) => (
            <li
              key={item.ticker}
              className={styles.dropdownItem}
              onClick={() => handleSelect(item)}
            >
              <div className={styles.itemMain}>
                <span className={styles.ticker}>{item.ticker}</span>
                <span className={styles.name}>{item.name}</span>
              </div>
              <span className={styles.exchange}>{item.exchange}</span>
            </li>
          ))}
        </ul>
      )}
      
      {isOpen && !isLoading && results.length === 0 && query.trim() !== '' && (
        <div className={styles.dropdown}>
          <div className={styles.noResult}>검색 결과가 없습니다.</div>
        </div>
      )}
    </div>
  );
}
