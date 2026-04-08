import { NextRequest, NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

import { Portfolio } from '@/types';

// input format
interface HistoricalRequest {
  startDate: string;
  endDate: string;
  initialAmount: number; // in 10k KRW
  portfolios: Portfolio[];
}

export async function POST(request: NextRequest) {
  try {
    const body: HistoricalRequest = await request.json();
    const { startDate, endDate, initialAmount, portfolios } = body;
    const initialKrw = initialAmount * 10000;

    // 1. Gather all unique tickers
    const uniqueTickers = new Set<string>();
    portfolios.forEach(p => p.assets.forEach(a => uniqueTickers.add(a.ticker)));
    
    // 2. Fetch historical data for all tickers
    const historicalData: Record<string, any[]> = {};
    const dateSet = new Set<string>();
    
    // Using Promise.all to fetch concurrently
    await Promise.all(
      Array.from(uniqueTickers).map(async (ticker) => {
        try {
          const results: any[] = await yahooFinance.historical(ticker, {
            period1: startDate,
            period2: endDate,
            interval: '1d'
          }) as any[];
          
          historicalData[ticker] = results;
          results.forEach(r => {
            const dateStr = r.date.toISOString().split('T')[0];
            dateSet.add(dateStr);
          });
        } catch (err) {
          console.error(`Error fetching historical for ${ticker}:`, err);
          historicalData[ticker] = [];
        }
      })
    );

    // 3. Sort all trading dates
    const sortedDates = Array.from(dateSet).sort();
    if (sortedDates.length === 0) {
      return NextResponse.json({ result: [] });
    }

    // 4. Determine shares to buy on the first available date for each ticker in the date range
    // Since we assume fractional shares, shares = budget / price
    // portfolio state per ticker: { [portfolioId]: { [ticker]: shares } }
    const sharesMap: Record<string, Record<string, number>> = {};
    
    portfolios.forEach(p => {
      sharesMap[p.id] = {};
      p.assets.forEach(asset => {
        const data = historicalData[asset.ticker];
        if (data && data.length > 0) {
          // the first element is the earliest date we got
          const firstPrice = data[0].adjClose || data[0].close || 1;
          const budget = initialKrw * (asset.ratio / 100);
          const shares = budget / firstPrice;
          sharesMap[p.id][asset.ticker] = shares;
        } else {
          sharesMap[p.id][asset.ticker] = 0;
        }
      });
    });

    // 5. Calculate portfolio value for each date
    // To handle missing dates for specific tickers, carry forward the last seen price
    const result = [];
    const lastSeenPrices: Record<string, number> = {};
    
    for (const date of sortedDates) {
      const dailyValue: Record<string, any> = { date };
      
      // Update last seen prices for this date
      for (const ticker of uniqueTickers) {
        const item = historicalData[ticker].find(d => d.date.toISOString().split('T')[0] === date);
        if (item) {
          lastSeenPrices[ticker] = item.adjClose || item.close;
        }
      }

      // Calculate the value for each portfolio
      for (const p of portfolios) {
        let pfValue = 0;
        for (const asset of p.assets) {
          const shares = sharesMap[p.id][asset.ticker] || 0;
          const currentPrice = lastSeenPrices[asset.ticker] || 0;
          pfValue += shares * currentPrice;
        }
        // Round to integer KRW for clean display
        dailyValue[p.id] = Math.round(pfValue);
      }
      result.push(dailyValue);
    }

    return NextResponse.json({ result });
  } catch (error) {
    console.error('Historical API error:', error);
    return NextResponse.json({ error: 'Failed to compute historical values' }, { status: 500 });
  }
}
