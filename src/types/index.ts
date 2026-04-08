export interface Asset {
  ticker: string;
  name: string;
  ratio: number;
}

export interface Portfolio {
  id: string;
  name: string;
  assets: Asset[];
}

export interface Settings {
  initialAmount: number; // in 10,000 KRW
  startDate: string; // YYYY-MM-DD
}

export interface DailyValue {
  date: string;
  [portfolioId: string]: number | string; // maps portfolio ID to value on that day
}
