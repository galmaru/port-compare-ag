import { NextRequest, NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results: any = await yahooFinance.search(query, {
      newsCount: 0,
    });

    // 필터링: 한국 주식(KS, KQ) 혹은 미국 ETF 등 사용자가 검색가능한 종목
    // 기본적으로 yahoo finance는 다양한 국가를 반환할 수 있으므로, 주식이나 ETF만 반환하도록 합니다.
    const filtered = results.quotes.filter(
      (quote: any) =>
        quote.quoteType === 'EQUITY' || quote.quoteType === 'ETF'
    ).map((quote: any) => ({
      ticker: quote.symbol,
      name: quote.shortname || quote.longname || quote.symbol,
      exchange: quote.exchDisp,
      type: quote.quoteType,
    }));

    return NextResponse.json({ results: filtered });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ error: 'Failed to search' }, { status: 500 });
  }
}
